-- The Studio's Messages inbox (PORTS.md card 117): one status per form message.
-- Copied from MESSAGE_STATUS_DDL in src/lib/studio-messages.ts;
-- studio-messages.test.ts fails if the two differ, so edit the DDL there first.
--
-- FBCM (2026-10-18): NOT APPLIED, and nothing to apply it to yet. The site keeps
-- no form inbox of its own (the church's forms are Church Trac's), so there is
-- no CONTACT_DB binding in wrangler.jsonc and the Messages tool is left off the
-- Studio's tool list. The file is here so the kit's unit test holds, and so a
-- future form of the site's own starts with the table ready:
--   npx wrangler d1 migrations apply <DB_NAME> --remote

CREATE TABLE IF NOT EXISTS message_status (
  source TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- The Sanity user id of whoever set it. Never a name or an email.
  updated_by TEXT,
  PRIMARY KEY (source, message_id)
);
