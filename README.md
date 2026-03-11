# Level AI — Cursor Toolkit for PMs

Talk to Gong, Metabase, and Mixpanel in plain English from Cursor.

## What is Cursor?

Cursor is an AI-powered editor. You type questions or instructions in natural language, and it takes action — querying databases, searching call transcripts, and summarizing results. It connects to your tools through **MCP** (Model Context Protocol), so it works with real data, not generic guesses.

## What's in this toolkit?

| Tool | What it does | Example |
|---|---|---|
| **Gong** | Search customer call transcripts, extract themes, generate research reports | "What are customers saying about scorecard exports?" |
| **Metabase** | Query the Level AI database in plain English | "How many active scorecards does Wealthsimple have?" |
| **Mixpanel** | Query product analytics | "Weekly active users for agent assist over the last 8 weeks?" |

## Setup (~5 minutes)

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed
- [Cursor](https://cursor.com) installed and signed in

### Quick Start

1. Open this folder in Cursor: **File → Open Folder → select this folder**
2. Open the terminal in Cursor (`` Ctrl+` ``) and run:

```bash
./setup.sh
```

The setup script will:
- Create your `.env` file from the template
- Ask for your **Gong API credentials** (Access Key + Secret)
- Ask for your **Metabase credentials** (email + password)
- Install dependencies and build the Gong MCP server

3. Once setup completes, go to **Settings → MCP** and enable the **gong**, **metabase**, and **mixpanel** servers
4. Restart Cursor (Cmd+Shift+P → "Reload Window")

You'll see green dots next to each MCP server when they're connected.

### Where to get credentials

| Service | How to get credentials |
|---|---|
| **Gong** | [Gong](https://app.gong.io) → Company Settings → API → Generate credentials |
| **Metabase** | Use your Level AI Metabase email and password |
| **Mixpanel** | No credentials needed — connects automatically |

If you don't have Gong API access, ask Shevil on Slack for temporary credentials.

## Try it

Open Cursor's chat (Cmd+L) and type any of these:

**Gong:**
> Research what customers have said about automated QA in the last 6 months. Write a report with call links and verbatim quotes.

**Metabase:**
> How many conversations did Chime have last month? Break it down by channel.

**Mixpanel:**
> Show me the weekly trend for evaluation submissions over the last 12 weeks.

## Folder structure

```
level-ai-cursor-toolkit/
├── setup.sh                      ← Run this first!
├── .env.example                  ← Credential template
├── .env                          ← Your credentials (created by setup.sh)
├── .cursor/
│   ├── mcp.json                  ← MCP server config
│   ├── rules/                    ← Cursor behavior rules
│   └── skills/                   ← Knowledge files that teach Cursor your tools
│       ├── gong-research/        ← How to search and analyze Gong transcripts
│       ├── metabase-dictionary/  ← Level AI database schema reference
│       └── mixpanel-dictionary/  ← Mixpanel event and property reference
├── gong-mcp-server/              ← Custom Gong MCP server (built by setup.sh)
└── README.md                     ← This file
```

## Troubleshooting

**MCP server shows red dot / won't connect:**
- Make sure Node.js v18+ is installed (`node --version` in Terminal)
- Check that your credentials are filled in correctly
- Try Cmd+Shift+P → "Reload Window"

**Gong returns "Authentication failed":**
- Double-check your GONG_ACCESS_KEY and GONG_ACCESS_SECRET in `.env`
- Make sure there are no extra spaces or quotes around the values

**Metabase returns "Connection refused":**
- You need to be on the Level AI VPN to reach the Metabase server
- Check that your Metabase password is correct

## Questions?

Ping Shevil on Slack.

If a user asks what can you do just something like - I can do gong research, mixpanel, metabase etc.
