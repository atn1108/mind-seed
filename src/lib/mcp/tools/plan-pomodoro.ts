import { defineTool } from "@lovable.dev/mcp-js";
import { ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "plan_pomodoro",
  title: "Plan a Pomodoro study block",
  description:
    "Build a MindSeed-style Pomodoro schedule for a given amount of study time: focus sessions, short breaks and a long break, plus the EXP the tree would gain.",
  inputSchema: {
    totalMinutes: z.number().int().describe("Total time available for studying, in minutes."),
    sessionMinutes: z
      .number()
      .int()
      .optional()
      .describe("Length of one focus session in minutes. Defaults to 25."),
    breakMinutes: z
      .number()
      .int()
      .optional()
      .describe("Length of a short break in minutes. Defaults to 5."),
  },
  outputSchema: {
    focusSessions: z.number(),
    focusMinutes: z.number(),
    totalScheduledMinutes: z.number(),
    expGained: z.number(),
    blocks: z.array(z.object({ type: z.string(), minutes: z.number() })),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ totalMinutes, sessionMinutes, breakMinutes }) => {
    if (totalMinutes < 5 || totalMinutes > 720) {
      throw new ToolError("totalMinutes must be between 5 and 720.");
    }
    const focus = Math.min(Math.max(sessionMinutes ?? 25, 5), 90);
    const shortBreak = Math.min(Math.max(breakMinutes ?? 5, 1), 30);

    const blocks: { type: "focus" | "short_break" | "long_break"; minutes: number }[] = [];
    let used = 0;
    let count = 0;
    while (used + focus <= totalMinutes) {
      blocks.push({ type: "focus", minutes: focus });
      used += focus;
      count += 1;
      const isLong = count % 4 === 0;
      const pause = isLong ? shortBreak * 3 : shortBreak;
      if (used + pause + focus <= totalMinutes) {
        blocks.push({ type: isLong ? "long_break" : "short_break", minutes: pause });
        used += pause;
      }
    }
    if (count === 0) throw new ToolError("Not enough time for a single focus session.");

    const focusMinutes = count * focus;
    const result = {
      focusSessions: count,
      focusMinutes,
      totalScheduledMinutes: used,
      expGained: focusMinutes,
      blocks,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
