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

## The production second factor (2026-10-13)

Every Sanity write script is dry by default, and a write to `production` also needs `NCS_PRODUCTION_WRITE=yes` in the same command, read from the process environment only (`.claude/rules/schema-and-data.md`, "Data-script safety"; starter PORTS.md card 86). A delegated agent may set the variable, but only under the write protocol, in this order: back up first, do a dry run and read it, run the write with `--apply` plus the variable in the same command, then verify. This is consistent with the 2026-10-03 pre-approval above (decided by Nathan 2026-10-13; resolved in `docs/PENDING.md`, "Who sets NCS_PRODUCTION_WRITE"). The variable never goes in `.env`, a shell profile or a scheduled CI job. Never put text containing backticks or `$(...)` inside a shell string: write it with the file-writing tool, then run a script file.
