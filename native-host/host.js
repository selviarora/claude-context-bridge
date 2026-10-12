#!/usr/bin/env node

// Claude Context Bridge - Native Messaging Host
// Receives messages from Chrome extension and saves to filesystem

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONTEXTS_DIR = path.join(os.homedir(), '.claude', 'contexts');

// Ensure contexts directory exists
if (!fs.existsSync(CONTEXTS_DIR)) {
  fs.mkdirSync(CONTEXTS_DIR, { recursive: true });
}

// Read message from stdin (Chrome native messaging protocol):
// 4-byte little-endian length, then that many bytes of UTF-8 JSON
function readMessage() {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);

    process.stdin.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length < 4) return;
      const messageLength = buf.readUInt32LE(0);
      if (buf.length < 4 + messageLength) return;
      process.stdin.pause();
      try {
        resolve(JSON.parse(buf.subarray(4, 4 + messageLength).toString('utf8')));
      } catch (e) {
        reject(new Error('Invalid JSON: ' + e.message));
      }
    });
    process.stdin.on('end', () => reject(new Error('No input')));
  });
}

// Write message to stdout (Chrome native messaging protocol)
function sendMessage(msg) {
  const json = Buffer.from(JSON.stringify(msg), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(json.length, 0);
  process.stdout.write(Buffer.concat([header, json]));
}

async function main() {
  try {
    const message = await readMessage();

    if (!message.filename || !message.content) {
      sendMessage({ success: false, error: 'Missing filename or content' });
      process.exit(1);
    }

    // Sanitize filename
    const safeFilename = message.filename
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/^-+|-+$/g, '');

    const filepath = path.join(CONTEXTS_DIR, safeFilename);

    // Write file
    fs.writeFileSync(filepath, message.content, 'utf8');

    sendMessage({
      success: true,
      path: filepath,
      message: `Saved to ${filepath}`
    });
  } catch (err) {
    sendMessage({
      success: false,
      error: err.message
    });
    process.exit(1);
  }
}

main();
