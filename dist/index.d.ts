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
export {};
