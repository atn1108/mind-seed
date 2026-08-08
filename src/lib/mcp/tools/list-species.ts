import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SPECIES, STAGES } from "@/lib/mindseed-store";

export default defineTool({
  name: "list_species_and_stages",
  title: "List tree species and growth stages",
  description:
    "List MindSeed's unlockable tree species (with the number of grown trees required) and the EXP growth stages of the current tree.",
  inputSchema: {},
  outputSchema: {
    species: z.array(
      z.object({ name: z.string(), emoji: z.string(), unlockAtTrees: z.number() }),
    ),
    stages: z.array(z.object({ name: z.string(), emoji: z.string(), expNeeded: z.number() })),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const species = SPECIES.map((s) => ({
      name: s.name,
      emoji: s.emoji,
      unlockAtTrees: s.unlockAt,
    }));
    const stages = STAGES.map((s) => ({ name: s.name, emoji: s.emoji, expNeeded: s.need }));
    return {
      content: [{ type: "text", text: JSON.stringify({ species, stages }, null, 2) }],
      structuredContent: { species, stages },
    };
  },
});
