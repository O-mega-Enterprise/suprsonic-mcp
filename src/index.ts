#!/usr/bin/env node
/**
 * Suprsonic MCP Server
 *
 * Gives any MCP-compatible AI agent (Claude Desktop, Cursor, VS Code, ChatGPT, etc.)
 * access to 17+ capabilities through the Suprsonic unified agent API.
 *
 * Usage (local stdio, for Claude Desktop / Cursor):
 *   SUPRSONIC_API_KEY=omk_... npx @suprsonic/mcp
 *
 * Usage (remote HTTP, for Claude API / programmatic agents):
 *   SUPRSONIC_API_KEY=omk_... npx @suprsonic/mcp --http --port 3100
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";

const API_KEY = process.env.SUPRSONIC_API_KEY || "";
const BASE_URL = process.env.SUPRSONIC_BASE_URL || "https://suprsonic.ai";

// ---------------------------------------------------------------------------
// Capability definitions.
// Credit costs here MUST match apps/shared/data/unified-apis.json (the single
// source of truth). When changing a credit cost, update the JSON file first,
// then update the description string here to match.
// ---------------------------------------------------------------------------

interface CapabilityDef {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
}

const CAPABILITIES: CapabilityDef[] = [
  {
    name: "search",
    description: "Search the web. Returns AI-synthesized answers, raw SERP results, or both. Cost: serp 1 credit, ai 2 credits, deep 3 credits.",
    inputSchema: {
      query: z.string().describe("Search query"),
      mode: z.string().optional().default("ai").describe("ai (2 credits, synthesized answer), serp (1 credit, raw links), or deep (3 credits, both)"),
      num_results: z.number().optional().default(10).describe("Max results for serp/deep mode"),
    },
  },
  {
    name: "scrape",
    description: "Extract content from any URL as Markdown. Auto-escalates from fast HTTP to JS rendering to stealth browser. Cost: fast 1 credit, standard 2 credits, thorough 5 credits.",
    inputSchema: {
      url: z.string().describe("URL to scrape"),
      mode: z.string().optional().default("standard").describe("fast (1 credit, static HTML), standard (2 credits, JS rendering), thorough (5 credits, stealth + CAPTCHA)"),
      output: z.string().optional().default("markdown").describe("markdown, html, or raw_html"),
    },
  },
  {
    name: "profiles",
    description: "Find and enrich a professional profile by LinkedIn URL or name + company. Cost: 3 credits.",
    inputSchema: {
      linkedin_url: z.string().optional().describe("LinkedIn profile URL (fastest path)"),
      first_name: z.string().optional().describe("Person's first name"),
      last_name: z.string().optional().describe("Person's last name"),
      company: z.string().optional().describe("Company name to narrow search"),
    },
  },
  {
    name: "emails",
    description: "Find a professional email address by name and company domain. Cost: 2 credits.",
    inputSchema: {
      first_name: z.string().describe("Person's first name"),
      last_name: z.string().describe("Person's last name"),
      domain: z.string().describe("Company domain (e.g. stripe.com)"),
    },
  },
  {
    name: "images",
    description: "Generate an image from a text prompt. Cost: 3 credits.",
    inputSchema: {
      prompt: z.string().describe("Text description of the image to generate"),
      aspect_ratio: z.string().optional().default("1:1").describe("1:1, 16:9, 9:16, or 4:3"),
    },
  },
  {
    name: "tts",
    description: "Convert text to speech audio. Cost: 2 credits.",
    inputSchema: {
      text: z.string().describe("Text to convert to speech"),
      voice_description: z.string().optional().describe("Describe the voice, e.g. 'calm professional female'"),
    },
  },
  {
    name: "stt",
    description: "Transcribe audio to text with timestamps. Cost: 2 credits.",
    inputSchema: {
      audio_url: z.string().optional().describe("URL to audio file"),
      language: z.string().optional().default("en").describe("Language code"),
    },
  },
  {
    name: "sms",
    description: "Send an SMS or WhatsApp message. Cost: 1 credit.",
    inputSchema: {
      to: z.string().describe("Phone number in E.164 format (e.g. +1234567890)"),
      message: z.string().describe("Message text"),
      channel: z.string().optional().default("auto").describe("auto, sms, or whatsapp"),
    },
  },
  {
    name: "documents",
    description: "Extract structured data from a URL or text content using LLM analysis. Cost: 3 credits.",
    inputSchema: {
      url: z.string().optional().describe("URL to scrape and extract from"),
      content: z.string().optional().describe("Pre-scraped text to extract from"),
      extraction_prompt: z.string().optional().describe("What to extract, in plain language"),
    },
  },
  {
    name: "companies",
    description: "Look up company data by domain. Returns industry, size, description, logo, brand colors. Cost: 3 credits.",
    inputSchema: {
      domain: z.string().describe("Company domain (e.g. stripe.com)"),
    },
  },
  {
    name: "email-verify",
    description: "Check if an email address is deliverable. Cost: 1 credit.",
    inputSchema: {
      email: z.string().describe("Email address to verify"),
    },
  },
  {
    name: "transcribe",
    description: "Transcribe audio or video with speaker labels and timestamps. Cost: 3 credits.",
    inputSchema: {
      audio_url: z.string().describe("URL to audio or video file"),
      speaker_labels: z.boolean().optional().default(true).describe("Enable speaker diarization"),
    },
  },
  {
    name: "invoice-parse",
    description: "Extract structured line items, totals, and dates from an invoice or receipt. Cost: 3 credits.",
    inputSchema: {
      document_url: z.string().describe("URL to invoice PDF or image"),
    },
  },
  {
    name: "subtitle",
    description: "Generate SRT or VTT subtitles from audio or video. Cost: 2 credits.",
    inputSchema: {
      audio_url: z.string().describe("URL to audio or video file"),
      format: z.string().optional().default("srt").describe("srt or vtt"),
    },
  },
  {
    name: "file-convert",
    description: "Convert a file between 200+ formats (PDF, DOCX, XLSX, images, etc.). Cost: 2 credits.",
    inputSchema: {
      file_url: z.string().describe("URL to source file"),
      source_format: z.string().describe("Source format (e.g. docx, xlsx, html)"),
      target_format: z.string().optional().default("pdf").describe("Target format"),
    },
  },
  {
    name: "bg-remove",
    description: "Remove the background from an image. Cost: 2 credits.",
    inputSchema: {
      image_url: z.string().describe("URL to the image"),
    },
  },
  {
    name: "screenshot",
    description: "Capture a rendered screenshot of a webpage. Cost: 1 credit.",
    inputSchema: {
      url: z.string().describe("URL to capture"),
      full_page: z.boolean().optional().default(false).describe("Capture full scrollable page"),
    },
  },
];

// ---------------------------------------------------------------------------
// HTTP caller: makes requests to the Suprsonic REST API
// ---------------------------------------------------------------------------

async function callSuprsonic(capability: string, params: Record<string, unknown>): Promise<CallToolResult> {
  if (!API_KEY) {
    return {
      content: [{ type: "text", text: "Error: SUPRSONIC_API_KEY environment variable is not set. Get your key at https://suprsonic.ai/app/apis" }],
      isError: true,
    };
  }

  try {
    const resp = await fetch(`${BASE_URL}/v1/agent`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ capability, params }),
    });

    const result = await resp.json() as any;

    // Handle non-envelope responses (401, 429, etc. return {"detail": ...})
    if (result.detail && result.success === undefined) {
      const msg = typeof result.detail === "object" ? (result.detail.title || result.detail.detail || JSON.stringify(result.detail)) : String(result.detail);
      return {
        content: [{ type: "text", text: `Error (HTTP ${resp.status}): ${msg}` }],
        isError: true,
      };
    }

    if (!result.success) {
      const errMsg = result.error?.detail || result.error?.title || "Request failed";
      return {
        content: [{ type: "text", text: `Error: ${errMsg}` }],
        isError: true,
      };
    }

    const text = JSON.stringify(result.data, null, 2);
    const meta = result.metadata
      ? `\n\n[Provider: ${(result.metadata as any).provider_used || "unknown"}, ${(result.metadata as any).response_time_ms || 0}ms, ${result.credits_used || 0} credits]`
      : "";

    return {
      content: [{ type: "text", text: text + meta }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Network error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

function createServer(): McpServer {
  const server = new McpServer(
    { name: "suprsonic", version: "0.1.0" },
    { capabilities: { logging: {} } },
  );

  // Register each capability as an MCP tool
  for (const cap of CAPABILITIES) {
    // Cast inputSchema to avoid TS2589 (excessively deep type instantiation from Zod chains)
    server.registerTool(
      cap.name,
      {
        description: cap.description,
        inputSchema: cap.inputSchema as any,
      },
      async (args: any): Promise<CallToolResult> => {
        return callSuprsonic(cap.name, args as Record<string, unknown>);
      },
    );
  }

  return server;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--http")) {
    // Remote HTTP transport
    const { default: express } = await import("express");
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const { randomUUID } = await import("node:crypto");

    const app = express();
    app.use(express.json());

    const transports = new Map<string, InstanceType<typeof StreamableHTTPServerTransport>>();

    app.post("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (!sessionId || !transports.has(sessionId)) {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId);
        };
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        // Session ID is set by transport during handleRequest
        if (transport.sessionId) transports.set(transport.sessionId, transport);
        return;
      }

      await transports.get(sessionId)!.handleRequest(req, res, req.body);
    });

    app.get("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).json({ error: "Invalid session" });
        return;
      }
      await transports.get(sessionId)!.handleRequest(req, res);
    });

    app.delete("/mcp", async (req, res) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).json({ error: "Invalid session" });
        return;
      }
      await transports.get(sessionId)!.handleRequest(req, res);
      transports.delete(sessionId);
    });

    const port = parseInt(args[args.indexOf("--port") + 1] || "3100", 10);
    app.listen(port, () => {
      console.log(`Suprsonic MCP server (HTTP) running at http://localhost:${port}/mcp`);
    });
  } else {
    // Local stdio transport (default)
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch(console.error);
