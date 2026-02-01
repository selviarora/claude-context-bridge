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

// Read message from stdin (Chrome native messaging protocol)
function readMessage() {
  return new Promise((resolve, reject) => {
    let chunks = [];

    // First 4 bytes are message length (little-endian)
    process.stdin.once('readable', () => {
      const lengthBuffer = process.stdin.read(4);
      if (!lengthBuffer) {
        reject(new Error('No input'));
        return;
      }

      const messageLength = lengthBuffer.readUInt32LE(0);
      let remaining = messageLength;

      const readChunk = () => {
        const chunk = process.stdin.read(remaining);
        if (chunk) {
          chunks.push(chunk);
          remaining -= chunk.length;
        }

        if (remaining > 0) {
          process.stdin.once('readable', readChunk);
        } else {
          const fullMessage = Buffer.concat(chunks).toString('utf8');
          try {
            resolve(JSON.parse(fullMessage));
          } catch (e) {
            reject(new Error('Invalid JSON: ' + e.message));
          }
        }
      };

      readChunk();
    });
  });
}

// Write message to stdout (Chrome native messaging protocol)
function sendMessage(msg) {
  const json = JSON.stringify(msg);
  const buffer = Buffer.alloc(4 + json.length);
  buffer.writeUInt32LE(json.length, 0);
  buffer.write(json, 4);
  process.stdout.write(buffer);
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
