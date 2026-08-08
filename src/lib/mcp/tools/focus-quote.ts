import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { QUOTES } from "@/lib/mindseed-store";

export default defineTool({
  name: "get_focus_quote",
  title: "Get a focus quote",
  description:
    "Return a motivational focus quote from MindSeed. Pass an index to get a specific quote, otherwise a random one is returned.",
  inputSchema: {
    index: z
      .number()
      .int()
      .optional()
      .describe(`Optional quote index, 0 to ${QUOTES.length - 1}.`),
  },
  outputSchema: { index: z.number(), quote: z.string(), total: z.number() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: ({ index }) => {
    const i =
      typeof index === "number"
        ? ((index % QUOTES.length) + QUOTES.length) % QUOTES.length
        : Math.floor(Math.random() * QUOTES.length);
    const quote = QUOTES[i]!;
    return {
      content: [{ type: "text", text: quote }],
      structuredContent: { index: i, quote, total: QUOTES.length },
    };
  },
});
