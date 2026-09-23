// BusinessOverview.tsx — Panel 2 of the Start Here handbook.
// Single source of truth for the editor: live data from Sanity (site settings)
// alongside static reference info about the business, ideal client, and voice.
// Safe to edit by hand.
//
// 2026-09-18: the services block (a "Your services and prices" live panel
// querying the `service` schema) was removed along with the `services`
// scaffold capability.
// 2026-09-19: availability, service areas and travel fees were removed along
// with the siteSettings fields the church rebuild forked away from (see
// siteSettings.ts "Church details"). This panel still does real work for the
// two things that survived: siteSettings (contact) and studioNotes (who you
// are, your ideal client, your voice).

import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Card, Container, Heading, Stack, Text } from '@sanity/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SiteSettingsData {
  email: string | null;
  phone: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

const SETTINGS_QUERY = `*[_type=="siteSettings"][0]{email,phone,socialInstagram,socialFacebook}`;

interface NotesData {
  businessSummary: string | null;
  idealClient: string | null;
  voiceSummary: string | null;
  wordsToAvoid: string[] | null;
}
const NOTES_QUERY = `*[_type=="studioNotes"][0]{businessSummary, idealClient, voiceSummary, wordsToAvoid}`;

/** Split a text field on blank lines into paragraphs. */
function paragraphs(text?: string | null): string[] {
  return (text ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Loading skeleton shown while fetch is in progress. */
function LoadingCard({ label }: { label: string }) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="transparent">
      <Text size={1} muted>
        Loading {label}...
      </Text>
    </Card>
  );
}

/** Shown when a fetch fails gracefully. */
function ErrorCard({ label }: { label: string }) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="caution">
      <Text size={1}>
        Could not load {label} right now. Open Site Settings or Content to see the current values.
      </Text>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessOverview() {
  const client = useClient({ apiVersion: '2024-01-01' });

  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    // Fetch site settings
    client
      .fetch<SiteSettingsData | null>(SETTINGS_QUERY)
      .then((data) => setSettings(data ?? null))
      .catch(() => setSettingsError(true));

    // Fetch business notes (optional — a failure does not break the live sections)
    client
      .fetch<NotesData | null>(NOTES_QUERY)
      .then((data) => setNotes(data ?? null))
      .catch(() => {
        /* notes are optional; the live sections still render */
      });
  }, [client]);

  return (
    <Container width={1} padding={4}>
      <Stack space={6}>
        {/* Header */}
        <Box>
          <Heading as="h1" size={3}>
            Your church at a glance
          </Heading>
          <Box marginTop={3}>
            <Text muted size={1}>
              The live section below is pulled directly from your Site Settings, so it is always
              current. To change anything, edit that document.
            </Text>
          </Box>
        </Box>

        {/* ── LIVE: Contact + availability + service areas ─────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={4}>
            <Heading as="h2" size={1}>
              Contact (live)
            </Heading>

            {/* Loading */}
            {settings === null && !settingsError && <LoadingCard label="site settings" />}

            {/* Error */}
            {settingsError && <ErrorCard label="site settings" />}

            {/* Data */}
            {settings !== null && (
              <Stack space={3}>
                {settings.email ? (
                  <Box>
                    <Text size={1} weight="semibold">
                      Email
                    </Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.email}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.phone ? (
                  <Box>
                    <Text size={1} weight="semibold">
                      Phone
                    </Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.phone}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.socialInstagram ? (
                  <Box>
                    <Text size={1} weight="semibold">
                      Instagram
                    </Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.socialInstagram}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.socialFacebook ? (
                  <Box>
                    <Text size={1} weight="semibold">
                      Facebook
                    </Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.socialFacebook}</Text>
                    </Box>
                  </Box>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* ── EDITABLE: Who you are ───────────────────────────────────────── */}
        {notes?.businessSummary && (
          <Card padding={4} radius={2} shadow={1} tone="default">
            <Stack space={3}>
              <Heading as="h2" size={1}>
                Who you are
              </Heading>
              {paragraphs(notes.businessSummary).map((p, i) => (
                <Text key={i} size={1}>
                  {p}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {/* ── EDITABLE: Your ideal client ─────────────────────────────────── */}
        {notes?.idealClient && (
          <Card padding={4} radius={2} shadow={1} tone="default">
            <Stack space={3}>
              <Heading as="h2" size={1}>
                Your ideal client
              </Heading>
              {paragraphs(notes.idealClient).map((p, i) => (
                <Text key={i} size={1}>
                  {p}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {/* ── EDITABLE: Your voice ────────────────────────────────────────── */}
        {(notes?.voiceSummary || (notes?.wordsToAvoid && notes.wordsToAvoid.length > 0)) && (
          <Card padding={4} radius={2} shadow={1} tone="default">
            <Stack space={3}>
              <Heading as="h2" size={1}>
                Your voice (how you sound in writing)
              </Heading>
              {paragraphs(notes?.voiceSummary).map((p, i) => (
                <Text key={i} size={1}>
                  {p}
                </Text>
              ))}
              {notes?.wordsToAvoid && notes.wordsToAvoid.length > 0 && (
                <>
                  <Text size={1} weight="semibold">
                    Words to skip:
                  </Text>
                  <Text size={1}>{notes.wordsToAvoid.join(', ')}.</Text>
                </>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
