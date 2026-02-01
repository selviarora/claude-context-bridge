# claude context bridge 🪄

bridge your claude.ai conversations to claude code with one click.

this is a chrome extension + mcp server that sends conversations from claude.ai to claude code so no context is lost when you go from browser to terminal. 

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
