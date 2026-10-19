# The Studio plan: who edits, what they do, and where

Written 2026-10-19 for the "Studio complete" pass. This is the map from the church's real jobs to the Studio surface
that serves each one. When a job changes, change this page, then the Quick update form, guide, tour or shot that
serves it. Settings live in `src/sanity/kit.config.ts`; guides in `src/sanity/guides/content.ts`; pictures in
`src/sanity/guides/shots.ts`; tours (data until starter card 137) in `src/sanity/guides/tours.ts`; video scripts in
`docs/agent/studio-videos.md`.

## Who edits

| Who                                 | Skill                                                              | Device                                      | What they do                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The church office (the main editor) | Comfortable with email and a word processor; did not ask for a CMS | Desk computer at the church, phone when out | Banners, the blog, The Visitor, staff and ministry changes, Site settings                                                      |
| The pastor                          | Writes well; little time; often on a phone                         | Phone first, laptop sometimes               | The weekly sermon preview, an occasional news post                                                                             |
| Ministry leaders                    | Occasional                                                         | Phone                                       | Send photos and news to the office (they do not sign in today); Kids Corner and The Moose's Message are written in Church Trac |
| Nathan (the developer)              | Admin                                                              | Desk                                        | Schema, menus on request, the Checkup's harder items, restores                                                                 |

The staff view (`kitConfig.staff`) is what the office and the pastor see: Home, Quick update, Content, Live preview,
Site Guide, Checkup. Their Sanity user ids go into `staff` once they have accepted the invitation (`docs/PENDING.md` 1f).

## Weekly jobs

| Job                                                                  | Who              | Surface                                                                          | Guide                           | Shot                                | Video               |
| -------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------- | ------------------- |
| Post Sunday's sermon preview (title, passage, preacher, a few lines) | Pastor or office | Quick update: "Post Sunday's sermon preview"; Sunday checklist item ticks itself | `sermon-preview`                | `quick-sermon-form`                 | yes                 |
| Put up a banner for an event or news                                 | Office           | Quick update: "Put up a banner"; Home big button                                 | `announcement`, `quick-update`  | `banner-form`, `quick-update-tiles` | yes (with snow day) |
| Snow day, cancellation or a change this week                         | Office           | Quick update: "Cancel or change something this week" (red, down after Sunday)    | `this-week-change`              | `quick-update-tiles`                | in the banner video |
| Take down banners that have ended                                    | Office           | Sunday checklist (ticks itself); Checkup rule `expired-notices`                  | `announcement`                  |                                     |                     |
| A short news post (event, ministry word)                             | Office           | Quick update: "Write a short news post"                                          | `blog-post`                     | `new-post-form`                     |                     |
| Post a photo from Sunday or an event                                 | Office           | Quick update: "Post a photo" (draft, then Publish)                               | `post-a-photo`                  |                                     | yes                 |
| Schedule Sunday's livestream                                         | Office           | YouTube (outside); Sunday checklist hand tick                                    | `livestream`                    |                                     |                     |
| Check this week's events                                             | Office           | Church Trac (outside); Sunday checklist hand tick                                | `church-trac-content`           |                                     |                     |
| Is my change live yet?                                               | Everyone         | Home's "Is it live?" card and the status line                                    | `website-status`, `studio-home` | `home-checklist`                    |                     |

## Monthly jobs

| Job                                         | Surface                                                                                | Guide                | Shot             | Video |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------- | ---------------- | ----- |
| Add this month's Visitor (month, year, PDF) | Home big button "Add this month's Visitor" (opens the issues list on The Visitor page) | `visitor-newsletter` | `visitor-issues` | yes   |
| Look over the Checkup                       | Checkup tool                                                                           | `studio-home`        |                  |       |
| A longer blog post with a picture           | Content > Blog > Posts                                                                 | `blog-post`          | `new-post-form`  | yes   |

## Seasonal and occasional jobs

| Job                                     | Surface                                                                   | Guide                              | Shot             | Video |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- | ---------------- | ----- |
| Change the service time (summer hours)  | Home big button "Change the service time" (Site settings, Church details) | `service-times`                    | `church-details` | yes   |
| Christmas, Easter and the church year   | A page from a template; the church-year saved sections                    | `page-templates`, `reuse-sections` |                  |       |
| A staff member joins, leaves or is away | Content > People                                                          | `staff`                            |                  | yes   |
| A ministry's leader or words change     | Content > Ministries                                                      | `ministries`                       |                  |       |
| A new Church Trac form on a page        | Content > Church Trac forms                                               | `church-trac-forms`                |                  |       |
| A new page, or a page in the menu       | Templates; Site settings > Menus                                          | `page-templates`, `menus`          |                  |       |
| A page moved                            | Old web addresses (mostly automatic)                                      | `old-web-addresses`                |                  |       |
| Undo something from earlier in the week | Ask Nathan (restore script)                                               | `undo-earlier`, `who-to-ask`       |                  |       |

## What changed in this pass

- **Quick update** covers every weekly Studio job: Post a photo (now on), the sermon preview (new, publishes with the
  Sermon Preview category so the home page names the sermon), a banner, a change this week, a short news post (new,
  filed under FBCM Events). Builders and tests: `src/lib/quick-updates.ts`, `quick-updates.test.ts`. A taken web
  address gets the date added (looked up with the client in `build`).
- **Sunday checklist** gains "Post Sunday's sermon preview", ticked by a sermon preview published this week, with its
  button opening Quick update.
- **Home's big buttons**: "Update the staff list" made way for "Add this month's Visitor" (staff changes are rarer and
  stay on Your pages).
- **Site Guide**: seven new guides (`sermon-preview`, `visitor-newsletter`, `this-week-change`, `post-a-photo`,
  `livestream`, `church-trac-content`, `menus`), a new "Once in a while" category, shot blocks in eight guides, a "The
  web address" section in `blog-post`, and the breadcrumb links that pointed at `siteSettings;...` panes fixed to the
  desk's `settings;...` ids.
- **How to chips** (card 134) on 15 fields the office gets wrong: categories, author, publishedAt, excerpt, slug,
  endDate, serviceTime, givingUrl, churchTracUrl, youtubeUrl, navItems, showOnSite, contacts, alt, docs.
- **Tours** as data for card 137: a seven-stop welcome, four on-demand tours (sermon preview, snow day, The Visitor, a
  page), the welcome modal and the first What's new.

## Asks for starter card 137 (generic, not built here)

- **A `file` field kind for Quick update** (a PDF or image picked on the phone, uploaded as an asset). Then "Add this
  month's Visitor" becomes a phone form: month (a `select` kind), year, the PDF, appended to a named array on a named
  document (`page-visitor`, `pageBuilder[_key=="visitor-issues"].docs`). Today it is a Home button to that list.
- **A `select` field kind** (fixed choices) for the month and for a banner's style.
- **A "patch" form type**: Quick update that changes one field of an existing document (the service time, a staff
  member's "Show on the Staff page") rather than creating one.
- **A checklist item that runs a Quick update form** directly (the sermon item opens the tool, not the form).
- **Tour anchors** for a Home quick action by index or id, an array field's "+ Add item" button, and a Quick update
  tile and its fields (the anchors `tours.ts` names).

## Bigger ideas, not built

- A **Sunday at a glance** card on Home: this Sunday's sermon (from the preview), whether the livestream is scheduled
  (the YouTube feed the site already reads), and the banner that is up.
- A **ministry leader role** with Quick update only (photo and short news as drafts the office publishes), once the
  staff view can tell roles apart.
- **The church-year saved sections** are waiting on their seed (`docs/PENDING.md` 1f); after that, a seasonal guide
  ("Advent and Christmas on the website") with a shot of Insert a saved section.
- **Empty-state teaching** for The Visitor's list when a year has no issues yet, if the documents list ever gets its own
  pane.
