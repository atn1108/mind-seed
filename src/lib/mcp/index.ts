import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSpeciesTool from "./tools/list-species";
import focusQuoteTool from "./tools/focus-quote";
import planPomodoroTool from "./tools/plan-pomodoro";
import focusScoreTool from "./tools/focus-score";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  name: "mindseed-grow-your-focus",
  title: "MindSeed: Grow Your Focus",
  version: "0.1.0",
  instructions:
    "Tools for MindSeed, a focus-training app for students. Use `plan_pomodoro` to build a study block, `estimate_focus_score` to score a week of focus habits, `list_species_and_stages` for the garden's tree species and EXP stages, and `get_focus_quote` for motivation. No personal user data is available: MindSeed stores each user's sessions locally in their browser.",
  tools: [listSpeciesTool, focusQuoteTool, planPomodoroTool, focusScoreTool],
});
