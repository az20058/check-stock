import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

let singleton: Anthropic | null = null;
function client() {
  if (singleton) return singleton;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  singleton = new Anthropic({ apiKey });
  return singleton;
}

export interface ClaudeJsonResult<T> {
  data: T;
  usage: { input: number; output: number };
}

/**
 * Calls Claude Haiku and forces a JSON response via tool use.
 * The tool's input_schema should be a JSON Schema describing T.
 */
export async function callClaudeJson<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<ClaudeJsonResult<T>> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1500,
    system: opts.system,
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.inputSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.user }],
  });

  const toolUse = res.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return tool_use block");
  }
  return {
    data: toolUse.input as T,
    usage: { input: res.usage.input_tokens, output: res.usage.output_tokens },
  };
}
