# Suprsonic MCP Server

Unified API for AI agents. One API key, dozens of capabilities.

## What This Server Does

This MCP server gives your agent access to 16+ real-world capabilities through a single connection. No provider signups, no OAuth, no credential management.

## Available Tools

| Tool | Input | Output | Credits |
|------|-------|--------|---------|
| search | query (string), mode (serp/ai/deep), num_results | Search results with titles, URLs, snippets | 1-3 |
| scrape | url (string), output (markdown/html) | Page content as clean text | 1-5 |
| profiles | linkedin_url or first_name+last_name+company | Professional profile data | 3 |
| emails | first_name, last_name, domain | Email address + confidence | 2 |
| email-verify | email (string) | deliverable/catch-all/disposable status | 1 |
| companies | domain (string) | Company info, size, industry, tech stack | 3 |
| images | prompt (string), aspect_ratio | Generated image URL | 3 |
| tts | text (string), voice_model | Audio file URL | 2 |
| stt | audio_url (string), language | Transcribed text | 2 |
| transcribe | audio_url (string), speaker_labels | Text with timestamps and speakers | 3 |
| sms | to (string), message (string), channel | Delivery confirmation | 1 |
| documents | url or content, extraction_prompt | Structured extracted data | 3 |
| screenshot | url (string), width, height, full_page | Screenshot image URL | 1 |
| file-convert | file_url, source_format, target_format | Converted file URL | 2 |
| bg-remove | image_url (string) | Image with background removed | 2 |
| invoice-parse | document_url (string) | Structured invoice data | 3 |
| subtitle | audio_url, language, format (srt/vtt) | Subtitle file content | 2 |
| site-intel | domain (string), mode | WHOIS, DNS, SSL, tech stack data | 1-2 |

## Authentication

Requires environment variable: `SUPRSONIC_API_KEY`
Get a free key at: https://suprsonic.ai/app/apis

## Installation

```bash
npx suprsonic-mcp
```

## Configuration

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

## Response Format

All tools return: `{success, data, error, metadata, credits_used}`

Errors include `is_retriable` (boolean) and `retry_after_seconds` for automatic retry logic.

## Links

- API docs: https://suprsonic.ai/docs/api
- OpenAPI spec: https://suprsonic.ai/v1/openapi.json
- npm: https://www.npmjs.com/package/suprsonic-mcp
- Python SDK: https://pypi.org/project/suprsonic/
- TypeScript SDK: https://www.npmjs.com/package/suprsonic
