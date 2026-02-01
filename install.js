#!/usr/bin/env node

// Claude Context Bridge - Installer
// Sets up native messaging host and MCP server configuration

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOME = os.homedir();
const PLATFORM = process.platform;

// Colors for terminal output
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function log(msg) { console.log(msg); }
function success(msg) { console.log(colors.green('✓ ') + msg); }
function warn(msg) { console.log(colors.yellow('⚠ ') + msg); }
function error(msg) { console.log(colors.red('✗ ') + msg); }
function heading(msg) { console.log('\n' + colors.bold(colors.cyan(msg))); }

function getNativeHostDir() {
  if (PLATFORM === 'darwin') {
    return path.join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  } else if (PLATFORM === 'linux') {
    return path.join(HOME, '.config', 'google-chrome', 'NativeMessagingHosts');
  } else if (PLATFORM === 'win32') {
    // Windows uses registry, we'll handle differently
    return path.join(HOME, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts');
  }
  throw new Error(`Unsupported platform: ${PLATFORM}`);
}

function installNativeHost(extensionId) {
  heading('Installing Native Messaging Host');

  const hostDir = getNativeHostDir();
  const hostScriptPath = path.join(__dirname, 'native-host', 'host.js');
  const manifestPath = path.join(hostDir, 'com.claude.contextbridge.json');

  // Create directory if needed
  if (!fs.existsSync(hostDir)) {
    fs.mkdirSync(hostDir, { recursive: true });
    success(`Created directory: ${hostDir}`);
  }

  // Make host script executable
  fs.chmodSync(hostScriptPath, '755');

  // Create manifest
  const manifest = {
    name: 'com.claude.contextbridge',
    description: 'Claude Context Bridge Native Host',
    path: hostScriptPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${extensionId}/`]
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  success(`Installed native host manifest: ${manifestPath}`);

  // Create contexts directory
  const contextsDir = path.join(HOME, '.claude', 'contexts');
  if (!fs.existsSync(contextsDir)) {
    fs.mkdirSync(contextsDir, { recursive: true });
    success(`Created contexts directory: ${contextsDir}`);
  }

  return manifestPath;
}

function installMcpServer() {
  heading('Installing MCP Server');

  const mcpDir = path.join(__dirname, 'mcp-server');
  // Claude Code reads MCP configs from ~/.claude.json (NOT ~/.claude/settings.json)
  const claudeConfigPath = path.join(HOME, '.claude.json');

  // Install dependencies
  log('Installing MCP server dependencies...');
  try {
    execSync('npm install', { cwd: mcpDir, stdio: 'inherit' });
    success('Installed dependencies');
  } catch (e) {
    error('Failed to install dependencies. Run manually: cd mcp-server && npm install');
  }

  // Update Claude Code config
  let config = {};
  if (fs.existsSync(claudeConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    } catch (e) {
      warn('Could not parse existing .claude.json, creating new one');
    }
  }

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers['context-bridge'] = {
    command: 'node',
    args: [path.join(mcpDir, 'index.js')]
  };

  fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
  success(`Updated Claude Code config: ${claudeConfigPath}`);

  return claudeConfigPath;
}

function printInstructions(extensionId) {
  heading('Setup Complete!');

  log(`
${colors.bold('Next steps:')}

1. ${colors.cyan('Load the Chrome extension:')}
   - Open Chrome and go to ${colors.yellow('chrome://extensions')}
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select: ${colors.yellow(path.join(__dirname, 'extension'))}
   - Copy the extension ID shown under the extension name

2. ${colors.cyan('Update the native host with your extension ID:')}
   Run: ${colors.yellow(`node install.js native-host <your-extension-id>`)}

3. ${colors.cyan('Restart Claude Code')} to load the MCP server

4. ${colors.cyan('Test it out:')}
   - Go to Claude.ai and open a conversation
   - Click the "📤 Send to Claude Code" button
   - In Claude Code, say: "load context <name>"

${colors.bold('Usage in Claude Code:')}
   - "list my contexts" - see all saved contexts
   - "load context auth-system" - load a specific context
   - "search contexts for JWT" - find contexts mentioning a term
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  log(colors.bold('\n🌉 Claude Context Bridge Installer\n'));

  if (command === 'native-host') {
    const extensionId = args[1];
    if (!extensionId) {
      error('Please provide your Chrome extension ID');
      log('Usage: node install.js native-host <extension-id>');
      log('\nTo find your extension ID:');
      log('1. Go to chrome://extensions');
      log('2. Load the extension from the "extension" folder');
      log('3. Copy the ID shown under the extension name');
      process.exit(1);
    }
    installNativeHost(extensionId);
    success('Native host installed!');
  } else if (command === 'mcp') {
    installMcpServer();
    success('MCP server configured!');
  } else {
    // Full install
    log('This will set up Claude Context Bridge on your system.\n');

    // Install MCP server first (doesn't need extension ID)
    installMcpServer();

    // For native host, we need the extension ID
    heading('Native Host Setup');
    log('To complete setup, you need to:');
    log('1. Load the Chrome extension first');
    log('2. Run: node install.js native-host <extension-id>');

    printInstructions();
  }
}

main();
