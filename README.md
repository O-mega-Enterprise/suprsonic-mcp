# suprsonic-mcp

MCP server for [Suprsonic](https://suprsonic.ai). Gives any AI agent dozens of capabilities through one connection.

## Quick Start

Connect to the hosted server, nothing to install:

- URL: `https://suprsonic.ai/v1/mcp` (Streamable HTTP)
- Header: `Authorization: Bearer omk_your_key` (or `x-api-key: omk_your_key`, for a client or gateway that keeps `Authorization` for its own sign-in)

Or run the server on your own machine:

```bash
SUPRSONIC_API_KEY=omk_your_key npx -y suprsonic-mcp
```

Get your API key at [suprsonic.ai/app/api](https://suprsonic.ai/app/api). Both offer the same tools at the same prices. Listing the tools needs no key; a call without a valid key answers with the API's own error, which says where to get one.

The package is `suprsonic-mcp`. Earlier copies of this README named `@suprsonic/mcp`: that npm scope belongs to an unrelated company, so never install it.

## Hosted server

### Claude Code

```bash
claude mcp add --transport http suprsonic https://suprsonic.ai/v1/mcp --header "Authorization: Bearer omk_your_key"
```

### Cursor

Add to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "suprsonic": {
      "url": "https://suprsonic.ai/v1/mcp",
      "headers": {
        "Authorization": "Bearer omk_your_key"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` (VS Code asks for the key once and stores it as a secret):

```json
{
  "inputs": [
    { "type": "promptString", "id": "suprsonic-key", "description": "Suprsonic API key (omk_...)", "password": true }
  ],
  "servers": {
    "suprsonic": {
      "type": "http",
      "url": "https://suprsonic.ai/v1/mcp",
      "headers": {
        "Authorization": "Bearer ${input:suprsonic-key}"
      }
    }
  }
}
```

### Claude API (MCP connector)

Send the beta header `anthropic-beta: mcp-client-2025-11-20` and add to your Messages request:

```json
{
  "mcp_servers": [
    { "type": "url", "url": "https://suprsonic.ai/v1/mcp", "name": "suprsonic", "authorization_token": "omk_your_key" }
  ],
  "tools": [
    { "type": "mcp_toolset", "mcp_server_name": "suprsonic" }
  ]
}
```

### OpenAI Responses API

Add to the request's `tools`:

```json
{
  "type": "mcp",
  "server_label": "suprsonic",
  "server_url": "https://suprsonic.ai/v1/mcp",
  "authorization": "omk_your_key",
  "require_approval": "never"
}
```

## Local server (npx)

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suprsonic": {
      "command": "npx",
      "args": ["-y", "suprsonic-mcp"],
      "env": {
        "SUPRSONIC_API_KEY": "omk_your_key"
      }
    }
  }
}
```

The same entry works in Cursor's `mcp.json`.

### Your own HTTP endpoint

To serve the HTTP transport from your own machine instead of using the hosted server:

```bash
SUPRSONIC_API_KEY=omk_your_key npx -y suprsonic-mcp --http --port 3100
```

Then connect to `http://localhost:3100/mcp`.

## Available Tools

A call costs credits only when it succeeds. Where a range is shown, the mode you pick sets the price.

<!-- BEGIN GENERATED: tools (scripts/generate_capability_artifacts.py, from apps/shared/data/unified-apis.json; edit the registry, never this table) -->
| Tool | What it does | Credits |
|------|-------------|---------|
| search | Search the web with SERP, AI synthesis, or both | 1-3 |
| scrape | Extract content from any URL as Markdown or HTML | 1-5 |
| profiles | Find and enrich professional profiles | 3 |
| emails | Find professional email addresses | 2 |
| images | Generate images from text prompts | 3 |
| tts | Convert text to speech audio | 2 |
| stt | Transcribe audio to text with timestamps | 2 |
| sound-generate | Generate sound effects and short music tracks from text prompts (NOT speech: use tts for spoken voice) | 4 |
| sms | Send SMS or WhatsApp messages. Default channel is SMS (reliable delivery). WhatsApp requires recipient opt-in: they must have messaged your Business number within 24 hours. | 1 |
| documents | Extract structured data from URLs or content | 3 |
| companies | Enrich company data by domain | 3 |
| email-verify | Check if an email is deliverable, catch-all, or disposable | 1 |
| transcribe | Transcribe audio with speaker diarization and timestamps | 3 |
| invoice-parse | Extract structured data from invoices and receipts | 3 |
| subtitle | Generate SRT/VTT subtitles from audio or video | 2 |
| file-convert | Convert documents, web pages, spreadsheets and images between formats | 2 |
| bg-remove | Remove background from any image. Returns transparent PNG. | 2 |
| screenshot | Capture a rendered screenshot of any webpage | 1 |
| code-execute | Execute code in a secure sandbox with pre-configured environments | 2 |
| site-intel | Get comprehensive domain intelligence: WHOIS, DNS, SSL, tech stack, email security, hosting | 1-2 |
| research | Multi-step deep research: search, scrape, enrich entities, and synthesize into a cited report | 10-35 |
| video-info | Extract video metadata, available formats, and thumbnail from any URL | 1 |
| video-download | Download video from any URL and return a temporary download link | 2-3 |
| domains | Find domain names and the extensions that fit a business | 1-5 |
<!-- END GENERATED: tools -->

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

Every error is the same object. A capability that fails returns it as `error` in the response above, with `success` set to `false` and no credits charged. A refused call (an invalid key, too few credits, a rate limit) answers HTTP 401, 402 or 429 with the object under `detail`:

```json
{
  "detail": {
    "type": "https://api.o-mega.ai/errors/insufficient-credits",
    "title": "Insufficient Suprsonic API credits",
    "status": 402,
    "detail": "This call requires 2 Suprsonic API credits but you have 0. This is your Suprsonic subscription balance, not a provider balance.",
    "is_retriable": false,
    "error_category": "billing",
    "alternative_action": "Upgrade your plan or enable credit overage at https://suprsonic.ai/app/subscription"
  }
}
```

Error categories: `transient` (retry safe), `permanent` (bad request), `authentication` (invalid key), `billing` (out of credits), `content_access` (that URL cannot be served: blocked, region-locked or private).

When using MCP, the AI agent receives the whole error object in the tool response, so it can decide whether to retry from `is_retriable` and `retry_after_seconds`, and tell you what `alternative_action` says to do.

Full API reference with all parameters and example responses: [suprsonic.ai/apis](https://suprsonic.ai/apis)
