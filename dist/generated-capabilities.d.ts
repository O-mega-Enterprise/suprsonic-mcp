import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";
export interface CapabilityDef {
    name: string;
    title: string;
    description: string;
    inputSchema: Record<string, z.ZodType>;
    annotations: ToolAnnotations;
}
export declare const CAPABILITIES: CapabilityDef[];
