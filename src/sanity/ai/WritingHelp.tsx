// Safe to edit by hand
// =============================================================================
// The suggestion card, for the kit bench only
// =============================================================================
// The starter's writing-help feature (src/sanity/ai/WritingHelp.tsx, PORTS.md card
// 123) is not installed in this site: there is no ANTHROPIC_API_KEY, no
// /api/studio/ai route and no lib/studio-ai.ts. The kit bench
// (src/sanity/kit/harness/Surfaces.tsx, PORTABLE) draws the suggestion card for
// the "helpers" part, so this file holds just that component, copied from the
// starter, and nothing else. It is deliberately NOT marked PORTABLE: install the
// real feature and delete this file. Nothing in the Studio itself imports it.
// =============================================================================

import { useEffect, useState } from 'react';
import { Button, Flex, Stack, Text, TextArea } from '@sanity/ui';
import { KitNotice, KitScope } from '../kit/ui';

export function SuggestionCard({
  text,
  onUse,
  useLabel = 'Use this',
  onAgain,
  onClose,
  note,
}: {
  text: string;
  /** Null when the words cannot go straight in (the editor copies them). */
  onUse: ((text: string) => void) | null;
  useLabel?: string;
  onAgain: () => void;
  onClose: () => void;
  note?: string;
}) {
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);
  const [copied, setCopied] = useState(false);
  return (
    <KitScope>
      <KitNotice tone="note" title="A suggestion">
        <Stack gap={3}>
          <Text size={1} muted>
            Change any of it before you use it, and check the facts.
          </Text>
          <TextArea
            value={draft}
            rows={Math.min(8, Math.max(2, Math.ceil(draft.length / 70)))}
            onChange={(e) => setDraft(e.currentTarget.value)}
            aria-label="Suggested words"
          />
          {note && (
            <Text size={1} muted>
              {note}
            </Text>
          )}
          <Flex gap={2} wrap="wrap">
            {onUse ? (
              <Button
                text={useLabel}
                tone="primary"
                fontSize={1}
                padding={2}
                disabled={!draft.trim()}
                onClick={() => onUse(draft.trim())}
              />
            ) : (
              <Button
                text={copied ? 'Copied' : 'Copy the words'}
                tone="primary"
                fontSize={1}
                padding={2}
                onClick={() => {
                  void navigator.clipboard?.writeText(draft).then(() => setCopied(true));
                }}
              />
            )}
            <Button text="Try again" mode="ghost" fontSize={1} padding={2} onClick={onAgain} />
            <Button text="No thanks" mode="bleed" fontSize={1} padding={2} onClick={onClose} />
          </Flex>
        </Stack>
      </KitNotice>
    </KitScope>
  );
}
