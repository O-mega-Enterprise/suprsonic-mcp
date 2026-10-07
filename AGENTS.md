# Suprsonic MCP Server

Unified API for AI agents. One API key, dozens of capabilities.

## What This Server Does

This MCP server gives your agent real-world capabilities through a single connection: web search, scraping, profile and company enrichment, email finding and verification, images, speech, transcription, code execution, deep research and more. No provider signups, no OAuth, no credential management.

## Available Tools

Inputs listed as optional can be left out: the API applies its own default. A call costs credits only when it succeeds; where a range is shown, the mode sets the price.

<!-- BEGIN GENERATED: tools (scripts/generate_capability_artifacts.py, from apps/shared/data/unified-apis.json; edit the registry, never this table) -->
| Tool | What it does | Inputs | Credits |
|------|-------------|--------|---------|
| search | Search the web with SERP, AI synthesis, or both | query; optional: num_results, country, freshness, mode | 1-3 |
| scrape | Extract content from any URL as Markdown or HTML | url; optional: output, wait_for, timeout, mode | 1-5 |
| profiles | Find and enrich professional profiles | optional: linkedin_url, first_name, last_name, company, include_image | 3 |
| emails | Find professional email addresses | first_name, last_name, domain; optional: company | 2 |
| images | Generate images from text prompts | prompt; optional: aspect_ratio | 3 |
| tts | Convert text to speech audio | text; optional: voice_model, provider | 2 |
| stt | Transcribe audio to text with timestamps | optional: audio_url, audio_base64, language | 2 |
| sound-generate | Generate sound effects and short music tracks from text prompts (NOT speech: use tts for spoken voice) | prompt; optional: duration_seconds, prompt_influence, output_format | 4 |
| sms | Send SMS or WhatsApp messages. Default channel is SMS (reliable delivery). WhatsApp requires recipient opt-in: they must have messaged your Business number within 24 hours. | to, message; optional: channel | 1 |
| documents | Extract structured data from URLs or content | extraction_prompt; optional: url, content, schema | 3 |
| companies | Enrich company data by domain | domain; optional: company_name | 3 |
| email-verify | Check if an email is deliverable, catch-all, or disposable | email | 1 |
| transcribe | Transcribe audio with speaker diarization and timestamps | audio_url; optional: language, speaker_labels | 3 |
| invoice-parse | Extract structured data from invoices and receipts | document_url | 3 |
| subtitle | Generate SRT/VTT subtitles from audio or video | audio_url; optional: language, format | 2 |
| file-convert | Convert documents, web pages, spreadsheets and images between formats | file_url, source_format; optional: target_format | 2 |
| bg-remove | Remove background from any image. Returns transparent PNG. | image_url; optional: size | 2 |
| screenshot | Capture a rendered screenshot of any webpage | url; optional: width, height, format, full_page | 1 |
| code-execute | Execute code in a secure sandbox with pre-configured environments | code; optional: language, timeout, template | 2 |
| site-intel | Get comprehensive domain intelligence: WHOIS, DNS, SSL, tech stack, email security, hosting | domain; optional: mode | 1-2 |
| research | Multi-step deep research: search, scrape, enrich entities, and synthesize into a cited report | query; optional: depth, enrich_entities, include_analysis, synthesis, source_types, max_sources, freshness | 10-35 |
| video-info | Extract video metadata, available formats, and thumbnail from any URL | url | 1 |
| video-download | Download video from any URL and return a temporary download link | url; optional: quality, format | 2-3 |
| domains | Find domain names and the extensions that fit a business | optional: mode, company_name, description, company_id, purpose, search_options, query, domains, tlds, exact_extension, offset | 1-5 |
<!-- END GENERATED: tools -->

## Authentication

One Suprsonic API key (`omk_...`). Get a free key at: https://suprsonic.ai/app/api
- Hosted server: send it as the header `Authorization: Bearer omk_...` (or `x-api-key: omk_...`)
- Local server: set the environment variable `SUPRSONIC_API_KEY`

## Connecting

Hosted (Streamable HTTP, nothing to install): `https://suprsonic.ai/v1/mcp`

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

Local (stdio):

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

The package is `suprsonic-mcp`. Do not install `@suprsonic/mcp`: that npm scope belongs to an unrelated company.

Both servers offer the same tools at the same prices. Listing them needs no key; a call without a valid key answers with the API's own error, which says where to get one.

## Response Format

All tools return: `{success, data, error, metadata, credits_used}`

Errors include `is_retriable` (boolean) and `retry_after_seconds` for automatic retry logic, and `alternative_action` says what to do instead (for a call refused for too few credits, where to add them).

## Links

- API docs: https://suprsonic.ai/docs/api
- OpenAPI spec: https://suprsonic.ai/v1/openapi.json
- npm: https://www.npmjs.com/package/suprsonic-mcp
- Python SDK: https://pypi.org/project/suprsonic/
- TypeScript SDK: https://www.npmjs.com/package/suprsonic
