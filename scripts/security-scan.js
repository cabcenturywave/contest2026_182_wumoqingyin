#!/usr/bin/env node
'use strict';

var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var root = path.join(__dirname, '..');
var includeHistory = process.argv.indexOf('--history') >= 0;
var findings = [];
var scannedFiles = 0;
var scannedArchiveEntries = 0;

var patterns = [
  {
    category: 'private-key-material',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g
  },
  {
    category: 'openai-style-token',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g
  },
  {
    category: 'github-token',
    regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g
  },
  {
    category: 'aws-access-key',
    regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g
  },
  {
    category: 'bearer-token',
    regex: /\bBearer\s+[A-Za-z0-9._~+\/-]{24,}={0,2}\b/gi
  },
  {
    category: 'credential-assignment',
    regex: /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|password|passwd)\b\s*[:=]\s*["']?[A-Za-z0-9._~+\/-]{20,}={0,2}/gi
  },
  {
    category: 'china-mobile-number',
    regex: /(^|\D)1[3-9][0-9]{9}(?![0-9])/g
  }
];

var privateNamePatterns = [
  /(^|\/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)$/i,
  /\.(?:pem|key|p12|pfx)$/i,
  /(^|\/)sign(?:ing)?\/.*private/i
];

function addFinding(category, location) {
  findings.push({category: category, location: location});
}

function scanText(location, text) {
  patterns.forEach(function (pattern) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) {
      addFinding(pattern.category, location);
    }
  });
}

function findEocd(buffer) {
  var minimum = Math.max(0, buffer.length - 65557);
  for (var index = buffer.length - 22; index >= minimum; index--) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }
  return -1;
}

function zipEntries(buffer) {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
    return null;
  }
  var eocd = findEocd(buffer);
  if (eocd < 0) {
    return null;
  }
  var count = buffer.readUInt16LE(eocd + 10);
  var offset = buffer.readUInt32LE(eocd + 16);
  var entries = [];

  for (var index = 0; index < count; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('invalid ZIP central directory');
    }
    var flags = buffer.readUInt16LE(offset + 8);
    var method = buffer.readUInt16LE(offset + 10);
    var compressedSize = buffer.readUInt32LE(offset + 20);
    var nameLength = buffer.readUInt16LE(offset + 28);
    var extraLength = buffer.readUInt16LE(offset + 30);
    var commentLength = buffer.readUInt16LE(offset + 32);
    var localOffset = buffer.readUInt32LE(offset + 42);
    var nameBuffer = buffer.slice(offset + 46, offset + 46 + nameLength);
    var name = nameBuffer.toString((flags & 0x0800) ? 'utf8' : 'latin1');

    if (flags & 0x0001) {
      throw new Error('encrypted ZIP entry: ' + name);
    }
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error('invalid ZIP local header: ' + name);
    }
    var localNameLength = buffer.readUInt16LE(localOffset + 26);
    var localExtraLength = buffer.readUInt16LE(localOffset + 28);
    var dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    var compressed = buffer.slice(dataOffset, dataOffset + compressedSize);
    var payload;
    if (method === 0) {
      payload = compressed;
    } else if (method === 8) {
      payload = zlib.inflateRawSync(compressed);
    } else {
      payload = Buffer.alloc(0);
    }
    entries.push({name: name, payload: payload});
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function scanBuffer(location, buffer, depth) {
  scanText(location, buffer.toString('utf8'));
  scanText(location, buffer.toString('latin1'));
  if (depth >= 2) {
    return;
  }
  var entries;
  try {
    entries = zipEntries(buffer);
  } catch (error) {
    addFinding('unreadable-archive', location);
    return;
  }
  if (!entries) {
    return;
  }
  entries.forEach(function (entry) {
    scannedArchiveEntries++;
    var nestedLocation = location + '!' + entry.name;
    privateNamePatterns.forEach(function (pattern) {
      if (pattern.test(entry.name)) {
        addFinding('private-key-filename', nestedLocation);
      }
    });
    scanBuffer(nestedLocation, entry.payload, depth + 1);
  });
}

function trackedAndUntrackedFiles() {
  var result = cp.spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: null,
    maxBuffer: 128 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error('git ls-files failed');
  }
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

trackedAndUntrackedFiles().forEach(function (relative) {
  privateNamePatterns.forEach(function (pattern) {
    if (pattern.test(relative)) {
      addFinding('private-key-filename', relative);
    }
  });
  var absolute = path.join(root, relative);
  if (!fs.statSync(absolute).isFile()) {
    return;
  }
  scannedFiles++;
  scanBuffer(relative, fs.readFileSync(absolute), 0);
});

if (includeHistory) {
  var history = cp.spawnSync(
    'git',
    ['log', '--all', '-p', '--no-ext-diff', '--no-textconv', '--no-color', '--', '.'],
    {cwd: root, encoding: null, maxBuffer: 256 * 1024 * 1024}
  );
  if (history.status !== 0) {
    throw new Error('git history export failed');
  }
  scanBuffer('git-history', history.stdout, 2);
}

var unique = {};
findings.forEach(function (finding) {
  unique[finding.category + '\0' + finding.location] = finding;
});
findings = Object.keys(unique).sort().map(function (key) { return unique[key]; });

console.log('security scan: files=' + scannedFiles +
  ' archive_entries=' + scannedArchiveEntries +
  ' history=' + (includeHistory ? 'yes' : 'no'));

if (findings.length) {
  console.error('security scan FAILED: ' + findings.length + ' finding(s)');
  findings.forEach(function (finding) {
    console.error('  - ' + finding.category + ': ' + finding.location);
  });
  process.exit(1);
}

console.log('security scan passed: no configured sensitive pattern found');
