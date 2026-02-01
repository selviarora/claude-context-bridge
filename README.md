# claude context bridge

bridge your claude.ai planning sessions to claude code with one click.

## why i built this

i kept running into the same problem: i'd spend time planning something in claude.ai, then switch to claude code to actually build it. but claude code had no idea what i just discussed. i'd end up copy-pasting or re-explaining everything. annoying.

so i made this - a chrome extension + mcp server that sends conversations from claude.ai to claude code.

built for [this feature request](https://github.com/anthropics/claude-code/issues/13843).

## how it works

```
claude.ai                              your machine                         claude code
    │                                       │                                    │
    │  click "send to claude code"          │                                    │
    │ ─────────────────────────────────────►│                                    │
    │                                       │  saves to ~/.claude/contexts/      │
    │                                       │ ──────────────────────────────────►│
    │                                       │                                    │  "load context my-plan"
    │                                       │                                    │  [full conversation loaded]
```

## setup

**1. clone & install**

```bash
git clone https://github.com/selviarora/claude-context-bridge
cd claude-context-bridge
node install.js
```

**2. load the chrome extension**

1. go to `chrome://extensions`
2. enable "developer mode" (top right)
3. click "load unpacked" → select the `extension` folder
4. copy the extension ID shown under the extension name

**3. configure native messaging**

```bash
node install.js native-host <your-extension-id>
```

**4. restart claude code**

the mcp server gets configured automatically. just restart claude code to load it.

## usage

**in claude.ai:**
- have a conversation
- click the "send to claude code" button (top right)
- name it something memorable

**in claude code:**
```
> load context my-project-plan
[conversation loaded]

> list my contexts
> search contexts for "auth"
```

## files

- `extension/` - chrome extension that adds the button
- `native-host/` - saves conversations to disk
- `mcp-server/` - exposes contexts to claude code
- `install.js` - sets everything up

contexts are saved to `~/.claude/contexts/` as markdown.

## troubleshooting

**"native host not found"** - run `node install.js native-host <extension-id>` with your actual extension id

**button doesn't show up** - make sure you're on a `/chat/` page, try refreshing

**claude code doesn't see contexts** - restart claude code, check `~/.claude.json` for the mcp config

## license

mit
