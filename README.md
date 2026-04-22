# @suprsonic/mcp

MCP server for [Suprsonic](https://suprsonic.ai). Gives any AI agent 17+ capabilities through one connection.

## Quick Start

```bash
SUPRSONIC_API_KEY=omk_your_key npx -y @suprsonic/mcp
```

Get your API key at [suprsonic.ai/app/apis](https://suprsonic.ai/app/apis).

## Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suprsonic": {
      "command": "npx",
      "args": ["-y", "@suprsonic/mcp"],
      "env": {
        "SUPRSONIC_API_KEY": "omk_your_key"
      }
    }
  }
}
```

## Cursor / VS Code

Add to `.cursor/mcp.json` or VS Code MCP config:

```json
{
  "suprsonic": {
    "command": "npx",
    "args": ["-y", "@suprsonic/mcp"],
    "env": {
      "SUPRSONIC_API_KEY": "omk_your_key"
    }
  }
}
```

## Remote HTTP (for Claude API, ChatGPT, programmatic agents)

```bash
SUPRSONIC_API_KEY=omk_your_key npx -y @suprsonic/mcp --http --port 3100
```

Then connect to `http://localhost:3100/mcp`.

## Available Tools

| Tool | What it does |
|------|-------------|
| search | Search the web (AI synthesis, SERP, or both) |
| scrape | Extract content from any URL as Markdown |
| profiles | Find professional profiles by name or LinkedIn URL |
| emails | Find professional email addresses |
| images | Generate images from text prompts |
| tts | Convert text to speech |
| stt | Transcribe audio to text |
| sms | Send SMS or WhatsApp messages |
| documents | Extract structured data from URLs |
| companies | Look up company data by domain |
| email-verify | Check if an email is deliverable |
| transcribe | Transcribe audio with speaker labels |
| invoice-parse | Extract data from invoices |
| subtitle | Generate SRT/VTT subtitles |
| file-convert | Convert files between 200+ formats |
| bg-remove | Remove image backgrounds |
| screenshot | Capture webpage screenshots |

## Response Format

Every tool returns a unified response object:

```json
{
  "success": true,
  "data": {
    "results": [
      { "title": "OpenAI raises $6.6B", "url": "https://...", "snippet": "..." }
    ]
  },
  "error": null,
  "metadata": {
    "provider_used": "serperdev",
    "providers_tried": ["serperdev"],
    "response_time_ms": 1200,
    "request_id": "req_abc123"
  },
  "credits_used": 1
}
```

On failure, `success` is `false` and `error` contains the details (see below).

## Error Handling

Error object structure (returned when `success` is `false`):

```json
{
  "type": "billing_error",
  "title": "Insufficient credits",
  "status": 402,
  "detail": "Your account has 0 credits remaining. Add credits at suprsonic.ai/app/billing.",
  "is_retriable": false,
  "retry_after_seconds": null,
  "error_category": "billing"
}
```

Error categories: `transient` (retry safe), `permanent` (bad request), `authentication` (invalid key), `billing` (out of credits).

When using MCP, the AI agent receives the error in the tool response and can decide whether to retry based on `is_retriable` and `retry_after_seconds`.

Full API reference with all parameters and example responses: [suprsonic.ai/apis](https://suprsonic.ai/apis)
