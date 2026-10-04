# Brand Voice

This file defines the client-specific voice for this project. It layers on top
of the baseline in `.claude/rules/copy-and-prose.md` ("Writing copy and prose", loaded when you touch copy files): that
section's rules (warm conversational tone, no AI-tells, no filler openers, stop
when done) apply to everything. The tone sentence, the five pairs and the client-specific banned words below
are proposed by Claude from the church's existing copy (`scripts/pages/*.mjs`)
and are not yet confirmed by Nathan; edit them if wrong.

Any AI agent writing or editing site copy for this project reads this file
alongside `CLAUDE.md`.

---

## Tone statement

_One sentence. What does this brand sound like? Who is the reader and what do
they feel after reading a page?_

> Plain, warm and specific, a church talking to a neighbour who might walk in on Sunday: the reader should finish a page knowing when, where and what it will be like, and feeling expected.
>
> _Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong._

---

## Do this, not that

_Five pairs. Each pair is a specific, actionable contrast, not a vague
preference._

1. **Do:** State the fact a visitor needs: "Worship is Sundays at 10:45 am at 309 East Adams Street." (the service line and street, derived from Site settings). / **Not:** Open with a slogan or mood: "Experience a place where everyone belongs."
2. **Do:** Invite plainly, in the church's own register: "Anyone is welcome to attend our time of Worship." and "Casual dress is welcome." (Visit FAQ). / **Not:** Use marketing welcome language: "We can't wait to meet you!" or "Join our vibrant community."
3. **Do:** Make promises the church can keep, in short sentences: "A greeter will look out for you." (Visit). / **Not:** Over-promise or hedge: "Our friendly team will go above and beyond to make your visit seamless."
4. **Do:** Keep the church's own headings and words: "Praise and proclaim.", "Our Watchword", "Where the children go". Anything new is flagged for approval. / **Not:** Reword the church's approved sentences, or coin brand-speak headings such as "Our Faith Journey".
5. **Do:** Ask for giving the way the church does, concretely and without pressure: "Your gift keeps this church running and reaching Muncie." (Give). / **Not:** Guilt or hype: "Your generosity changes lives. Give today and be part of something bigger!"

---

## Banned vocabulary

These words are banned from site copy. When writing or editing, flag any of
these and replace them with plain language.

### Generic AI-tells (banned by default across all projects)

- delve
- leverage
- robust
- seamless
- elevate
- tapestry
- realm
- landscape
- testament to
- ever-evolving
- crucial
- pivotal
- meticulous
- navigate (as a verb for non-navigation contexts)
- transformative
- curated experience
- investment in your space
- elevated living
- tailored solutions

### Client-specific banned words

_Add words or phrases that are specific to this client or industry and should
never appear in their copy:_

- Church-specific additions, same tag and unconfirmed: "journey" as a heading word, "vibrant community", "doing life together", "unlock", and "experience" as a pitch ("experience worship"). The church says "worship", "gathering" and "join", so use those.

---

## Punctuation rule

No em-dashes in site copy: the text visitors read on the live site, including
page copy, component text, and Sanity-authored content. If a sentence needs an
em-dash to work, restructure it, split it into two sentences, or use a colon.

This rule is scoped to site copy only. Code comments, commit messages, plans,
specs, and internal docs may use em-dashes.

---

## Stop when you are done

End the paragraph. Do not add a closing sentence that restates the point. Do
not end with "Feel free to reach out" or any variation of it. The last word of
a section should be the last word that earns its place.
