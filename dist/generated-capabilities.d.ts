import * as z from "zod";
export interface CapabilityDef {
    name: string;
    description: string;
    inputSchema: Record<string, z.ZodType>;
}
export declare const CAPABILITIES: CapabilityDef[];
