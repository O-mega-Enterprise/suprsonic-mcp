#!/usr/bin/env node
/**
 * Suprsonic MCP Server
 *
 * Gives any MCP-compatible AI agent (Claude Desktop, Cursor, VS Code, ChatGPT, etc.)
 * access to dozens of capabilities through the Suprsonic unified agent API.
 *
 * CAPABILITIES are auto-generated from apps/shared/data/unified-apis.json
 * by scripts/generate_capability_artifacts.py. Do NOT edit generated-capabilities.ts manually.
 *
 * Usage (local stdio, for Claude Desktop / Cursor):
 *   SUPRSONIC_API_KEY=omk_... npx -y suprsonic-mcp
 *
 * Usage (remote HTTP, for Claude API / programmatic agents):
 *   SUPRSONIC_API_KEY=omk_... npx -y suprsonic-mcp --http --port 3100
 *
 * The npm package is `suprsonic-mcp`. Never write `@suprsonic/mcp`: that scope belongs to an unrelated company, so
 * the name either fails to install or runs someone else's code with the caller's key in its environment.
 */

import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CAPABILITIES } from "./generated-capabilities.js";

const API_KEY = process.env.SUPRSONIC_API_KEY || "";
const BASE_URL = process.env.SUPRSONIC_BASE_URL || "https://suprsonic.ai";
// The version the server reports is the package's own (dist/index.js sits one level below package.json).
const { version: VERSION } = createRequire(import.meta.url)("../package.json") as { version: string };

// ---------------------------------------------------------------------------
// HTTP caller: makes requests to the Suprsonic REST API
// ---------------------------------------------------------------------------

async function callSuprsonic(capability: string, params: Record<string, unknown>): Promise<CallToolResult> {
  if (!API_KEY) {
    return {
      content: [{ type: "text", text: "Error: SUPRSONIC_API_KEY environment variable is not set. Get your key at https://suprsonic.ai/app/api" }],
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

    const body = await resp.text();
    let result: any;
    try {
      result = JSON.parse(body);
    } catch {
      return toolError(`Error (HTTP ${resp.status}): ${body.slice(0, 500)}`);
    }

    // A refused call (401 key, 402 credits, 429 rate limit) answers {"detail": <error>} instead of the envelope.
    if (result.detail !== undefined && result.success === undefined) {
      return toolError(`Error (HTTP ${resp.status}):\n${describe(result.detail)}`);
    }

    if (!result.success) {
      return toolError(`Error:\n${describe(result.error ?? "Request failed")}`);
    }

    const text = JSON.stringify(result.data, null, 2);
    const meta = result.metadata
      ? `\n\n[Provider: ${(result.metadata as any).provider_used || "unknown"}, ${(result.metadata as any).response_time_ms || 0}ms, ${result.credits_used || 0} credits]`
      : "";

    return {
      content: [{ type: "text", text: text + meta }],
    };
  } catch (err) {
    return toolError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** The API's error as the agent reads it: the whole object, so it can act on every field (is_retriable,
 * retry_after_seconds, and alternative_action, which names the page that adds credits when a call is refused for
 * too few). */
function describe(error: unknown): string {
  return typeof error === "object" && error !== null ? JSON.stringify(error, null, 2) : String(error);
}

function toolError(text: string): CallToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

function createServer(): McpServer {
  const server = new McpServer(
    { name: "suprsonic", version: VERSION },
    { capabilities: { logging: {} } },
  );

  // Register each capability as an MCP tool (from generated definitions)
  for (const cap of CAPABILITIES) {
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
