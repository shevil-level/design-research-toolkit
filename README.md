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

## Setup (~10 minutes)

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed
- [Cursor](https://cursor.com) installed and signed in

### Step 1 — Open this folder in Cursor

Open Cursor, then: **File → Open Folder → select this `level-ai-cursor-toolkit` folder**.

The MCP servers and skills are already configured. Cursor will detect them automatically.

### Step 2 — Add your Gong credentials

Open the `.env` file in this folder and fill in your Gong API key and secret:

```
GONG_ACCESS_KEY=your_key_here
GONG_ACCESS_SECRET=your_secret_here
```

**How to get Gong API credentials:**
1. Go to [Gong Settings](https://app.gong.io) → Company Settings → API
2. Click "Generate API credentials"
3. Copy the Access Key and Access Secret

If you don't have API access, ask Shevil for temporary credentials.

### Step 3 — Add your Metabase credentials

Open `.cursor/mcp.json` and replace the two placeholder values:

```json
"METABASE_USERNAME": "your-email@thelevel.ai",
"METABASE_PASSWORD": "your-metabase-password"
```

Use the same email and password you use to log into Metabase.

### Step 4 — Restart Cursor

Close and reopen Cursor (or press Cmd+Shift+P → "Reload Window"). This loads the MCP servers.

You'll see green dots next to "gong", "metabase", and "mixpanel" in Settings → MCP when they're connected.

### Mixpanel — No setup needed

Mixpanel connects automatically with no credentials required.

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
├── .env                          ← Your Gong credentials (edit this)
├── .cursor/
│   ├── mcp.json                  ← MCP server config (edit Metabase creds here)
│   ├── rules/                    ← Cursor behavior rules
│   └── skills/                   ← Knowledge files that teach Cursor your tools
│       ├── gong-research/        ← How to search and analyze Gong transcripts
│       ├── metabase-dictionary/  ← Level AI database schema reference
│       └── mixpanel-dictionary/  ← Mixpanel event and property reference
├── gong-mcp-server/              ← Custom Gong MCP server (pre-built)
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
