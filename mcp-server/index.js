#!/usr/bin/env node

// Claude Context Bridge - MCP Server
// Exposes saved Claude.ai contexts to Claude Code

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONTEXTS_DIR = path.join(os.homedir(), '.claude', 'contexts');

// Ensure directory exists
if (!fs.existsSync(CONTEXTS_DIR)) {
  fs.mkdirSync(CONTEXTS_DIR, { recursive: true });
}

const server = new McpServer({
  name: 'claude-context-bridge',
  version: '1.0.0',
});

// Tool: List all available contexts
server.tool(
  'list_contexts',
  'List all saved conversation contexts from Claude.ai',
  {},
  async () => {
    try {
      const files = fs.readdirSync(CONTEXTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const filepath = path.join(CONTEXTS_DIR, f);
          const stat = fs.statSync(filepath);
          const content = fs.readFileSync(filepath, 'utf8');
          const firstLine = content.split('\n')[0] || '';
          return {
            name: f.replace('.md', ''),
            file: f,
            modified: stat.mtime.toISOString(),
            preview: firstLine.slice(0, 100)
          };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));

      if (files.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No contexts found. Export a conversation from Claude.ai using the "Send to Claude Code" button.'
          }]
        };
      }

      const list = files.map(f =>
        `- **${f.name}** (${f.modified.split('T')[0]})\n  ${f.preview}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${files.length} context(s):\n\n${list}`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error listing contexts: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Get a specific context
server.tool(
  'get_context',
  'Load a saved conversation context from Claude.ai',
  { name: z.string().describe('Name of the context to load (without .md extension)') },
  async ({ name }) => {
    try {
      // Try exact match first
      let filename = name.endsWith('.md') ? name : `${name}.md`;
      let filepath = path.join(CONTEXTS_DIR, filename);

      // If not found, try fuzzy match
      if (!fs.existsSync(filepath)) {
        const files = fs.readdirSync(CONTEXTS_DIR).filter(f => f.endsWith('.md'));
        const match = files.find(f =>
          f.toLowerCase().includes(name.toLowerCase())
        );
        if (match) {
          filepath = path.join(CONTEXTS_DIR, match);
          filename = match;
        } else {
          return {
            content: [{
              type: 'text',
              text: `Context "${name}" not found. Use list_contexts to see available contexts.`
            }],
            isError: true
          };
        }
      }

      const content = fs.readFileSync(filepath, 'utf8');

      return {
        content: [{
          type: 'text',
          text: `# Context: ${filename.replace('.md', '')}\n\n${content}`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error loading context: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Search across all contexts
server.tool(
  'search_contexts',
  'Search for a keyword across all saved contexts',
  { query: z.string().describe('Search query') },
  async ({ query }) => {
    try {
      const files = fs.readdirSync(CONTEXTS_DIR).filter(f => f.endsWith('.md'));
      const results = [];

      for (const file of files) {
        const filepath = path.join(CONTEXTS_DIR, file);
        const content = fs.readFileSync(filepath, 'utf8');

        if (content.toLowerCase().includes(query.toLowerCase())) {
          // Find matching lines
          const lines = content.split('\n');
          const matches = lines
            .map((line, i) => ({ line, num: i + 1 }))
            .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);

          results.push({
            file: file.replace('.md', ''),
            matches: matches.map(m => `  L${m.num}: ${m.line.slice(0, 100)}`)
          });
        }
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No results found for "${query}"`
          }]
        };
      }

      const output = results.map(r =>
        `**${r.file}**\n${r.matches.join('\n')}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found "${query}" in ${results.length} context(s):\n\n${output}`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error searching: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Delete a context
server.tool(
  'delete_context',
  'Delete a saved context',
  { name: z.string().describe('Name of the context to delete') },
  async ({ name }) => {
    try {
      const filename = name.endsWith('.md') ? name : `${name}.md`;
      const filepath = path.join(CONTEXTS_DIR, filename);

      if (!fs.existsSync(filepath)) {
        return {
          content: [{ type: 'text', text: `Context "${name}" not found.` }],
          isError: true
        };
      }

      fs.unlinkSync(filepath);

      return {
        content: [{
          type: 'text',
          text: `Deleted context "${name}"`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error deleting: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Claude Context Bridge MCP server running');
}

main().catch(console.error);
