# Claude Context Bridge

Bridge your Claude.ai planning sessions to Claude Code with one click.

```
Claude.ai  ──── 📤 Send to Claude Code ────►  Claude Code
(planning)                                    (implementing)
```

## The Problem

You spend time planning in Claude.ai, then switch to Claude Code to implement. But Claude Code has no idea what you discussed. You end up copy-pasting or re-explaining everything.

## The Solution

A Chrome extension + MCP server that lets you:
1. Click "Send to Claude Code" in any Claude.ai conversation
2. The conversation is saved locally
3. Claude Code can read it via the MCP server

## Installation

### 1. Clone and install

```bash
git clone https://github.com/selviarora/claude-context-bridge
cd claude-context-bridge
node install.js
```

### 2. Load the Chrome extension

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Copy the extension ID (shown under the extension name)

### 3. Configure native messaging

```bash
node install.js native-host <your-extension-id>
```

### 4. Restart Claude Code

The MCP server is automatically configured. Just restart Claude Code to load it.

## Usage

### In Claude.ai

1. Have a conversation (planning, architecture, decisions, etc.)
2. Click the "📤 Send to Claude Code" button (top right)
3. Name your context (e.g., "auth-system-v2")
4. Done!

### In Claude Code

```
> list my contexts
Found 3 context(s):
- auth-system-v2 (2024-01-15)
- api-design (2024-01-14)
- database-schema (2024-01-10)

> load context auth-system-v2
[Full conversation loaded]

> search contexts for JWT
Found "JWT" in 2 context(s):
- auth-system-v2: L23: We decided to use JWT with 15 min expiry...
- api-design: L45: JWT tokens should be passed in Authorization header...
```

## How It Works

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Chrome Extension│ ───► │  Native Host    │ ───► │ ~/.claude/      │
│ (scrapes page)  │      │  (saves file)   │      │   contexts/     │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Claude Code    │ ◄─── │   MCP Server    │ ◄─── │  (reads files)  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Files

- `extension/` - Chrome extension (injects button, scrapes conversation)
- `native-host/` - Node script that receives messages and writes files
- `mcp-server/` - MCP server that exposes contexts to Claude Code
- `install.js` - Setup script

## Contexts Location

Contexts are saved to `~/.claude/contexts/` as markdown files.

## Troubleshooting

### "Native host not found" error

Run the native host installer with your extension ID:
```bash
node install.js native-host <extension-id>
```

### Button doesn't appear on Claude.ai

- Make sure you're on a conversation page (URL contains `/chat/`)
- Try refreshing the page
- Check Chrome's extension error log

### Claude Code doesn't see contexts

- Restart Claude Code after running the installer
- Check `~/.claude/settings.json` for the MCP server config
- Try running the MCP server manually: `node mcp-server/index.js`

## License

MIT

## Contributing

Issues and PRs welcome! This is a community tool to bridge the gap until Anthropic adds official support.

See: https://github.com/anthropics/claude-code/issues/13843
