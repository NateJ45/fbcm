# Live writes: try them yourself first, hand off only if the classifier refuses

**Since 2026-10-03 Nathan pre-approves Sanity dataset writes and deploys.** Run them yourself: backup first, dry run, write, verify read-only. Do not hand over a run list by default. The handoff pattern below is the fallback for when the auto-mode classifier actually refuses the call.

Writes to a live, shared system (production Sanity dataset, Cloudflare, Google Sheets, a deploy) are refused in auto mode even when Nathan says yes in chat. The refusal applies to the outcome, not the tool: never retry the refused action through a different route (clipboard, Chrome, computer use, another CLI). Cross-project lesson: `_vault/gotchas/classifier-blocks-live-writes-plan-the-handoff.md`. It bit this repo on 2026-09-24, when the Sanity writes for the new page compositions were refused without Nathan's in-the-moment OK.

## The handoff pattern

1. Do everything reversible locally: edit, test, build the artifact (a seed or migration script, a dry-run summary).
2. Hand Nathan one artifact (a script run with `--dry-run` output, or a single command) and a numbered list of exactly what to run, in order.
3. Make the live-side step safe to repeat (idempotent seed or migration, backup or export first) so a half-finished run can just be run again.
4. Verify afterwards with read-only calls (GROQ queries, `curl`, the live page), which are allowed.
5. Never retry the refused action through a different tool.

Switching the session to ask mode (Nathan approves each call) also works. Narrow standing permission also works: Nathan allow-lists a specific command in `.claude/settings.local.json` himself (for example `Bash(npx wrangler deploy:*)`), never "run anything".
