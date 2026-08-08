import { defineTool } from "@lovable.dev/mcp-js";
import { ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "estimate_focus_score",
  title: "Estimate a MindSeed Focus Score",
  description:
    "Compute a MindSeed Focus Score (0-100) from weekly focus minutes, session completion rate and number of distractions, with a short interpretation.",
  inputSchema: {
    weeklyFocusMinutes: z.number().describe("Total focused minutes over the last 7 days."),
    completedSessions: z.number().int().describe("Number of finished focus sessions."),
    abandonedSessions: z.number().int().describe("Number of focus sessions given up early."),
    distractions: z
      .number()
      .int()
      .optional()
      .describe("Number of recorded distractions in the week. Defaults to 0."),
  },
  outputSchema: {
    score: z.number(),
    completionRate: z.number(),
    volumeRatio: z.number(),
    distractionPenalty: z.number(),
    interpretation: z.string(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ weeklyFocusMinutes, completedSessions, abandonedSessions, distractions }) => {
    if (weeklyFocusMinutes < 0 || completedSessions < 0 || abandonedSessions < 0) {
      throw new ToolError("Values must not be negative.");
    }
    const total = completedSessions + abandonedSessions;
    const completion = total > 0 ? completedSessions / total : 0;
    const volume = Math.min(weeklyFocusMinutes / 600, 1); // 10h/week = full marks
    const penalty = Math.min((distractions ?? 0) * 2, 20);
    const score = Math.max(0, Math.round(volume * 55 + completion * 45 - penalty));

    const level =
      score >= 80
        ? "Rừng xanh tốt — bạn đang giữ nhịp tập trung rất ổn định."
        : score >= 60
          ? "Đang lớn — duy trì đều đặn và giảm bớt xao nhãng."
          : score >= 40
            ? "Cần chăm sóc — hãy thử phiên ngắn 25 phút và tắt thông báo."
            : "Hạt giống mới — bắt đầu với 1 phiên 25 phút mỗi ngày.";

    const result = {
      score,
      completionRate: Math.round(completion * 100),
      volumeRatio: Math.round(volume * 100),
      distractionPenalty: penalty,
      interpretation: level,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
