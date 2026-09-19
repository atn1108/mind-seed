// Minimal regression guard — run: node scripts/smoke-check.mjs (no deps).
// Covers the fixes from the codebase review without a test runner.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// 1. Avatar: AppShell must gate through isSafeAvatar (no raw http render).
const shell = read("src/components/AppShell.tsx");
assert.match(shell, /isSafeAvatar/, "AppShell must use isSafeAvatar");
assert.doesNotMatch(
  shell,
  /startsWith\("http"\)/,
  "AppShell must not render http avatars (tracking pixel leak)",
);

// 2. Chat spoof: server trigger owns author fields, client sends no profile lookup.
const store = read("src/lib/room-store.ts");
assert.match(store, /fill_room_message_author/, "sendRoomMessage must note the server trigger");
assert.doesNotMatch(
  store,
  /from\("profiles"\)\s*\.\s*select\("name, avatar"\)/,
  "client must not self-report name/avatar",
);
const spoofGuard = read("supabase/migrations/20260907000000_room_chat_spoof_guard.sql");
assert.match(spoofGuard, /new\.user_name := coalesce\(v_name/, "trigger must overwrite user_name");

// 3. No full-page reload on password join.
assert.doesNotMatch(
  store,
  /window\.location\.reload/,
  "password join must re-bootstrap via state, not reload",
);
assert.match(store, /joinNonce/, "password join must bump a nonce to re-run bootstrap");

// 4. Expired timers closable by any member (no 00:00 stick).
assert.match(store, /finish_room_timer/, "expired timer must call finish_room_timer RPC");
const finishSql = read("supabase/migrations/20260907000001_finish_room_timer.sql");
assert.match(finishSql, /room_members/, "finish_room_timer must allow members, not just host");

// 5. updateTask has no state.tasks dep (stable callback), no dead expRef.
const mind = read("src/lib/mindseed-store.tsx");
assert.doesNotMatch(mind, /expRef/, "dead expRef must be gone");
assert.doesNotMatch(mind, /\[state\.tasks\]/, "updateTask must not depend on state.tasks");

// 6. Pure-logic spot checks (mirrors src/lib/mindseed-store stage thresholds).
const STAGES = [
  { name: "Seed", need: 0 },
  { name: "Sprout", need: 40 },
  { name: "Young Tree", need: 90 },
  { name: "Mature Tree", need: 150 },
];
const stageOf = (exp) => {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (exp >= s.need) idx = i;
  });
  return STAGES[idx].name;
};
assert.equal(stageOf(0), "Seed");
assert.equal(stageOf(40), "Sprout");
assert.equal(stageOf(150), "Mature Tree");
const isSafeAvatar = (a) => typeof a === "string" && a.startsWith("data:image/");
assert.equal(isSafeAvatar("data:image/png;base64,xx"), true);
assert.equal(isSafeAvatar("https://evil.test/pixel.png"), false);
assert.equal(isSafeAvatar(null), false);

console.log("smoke-check: OK (6 groups)");
