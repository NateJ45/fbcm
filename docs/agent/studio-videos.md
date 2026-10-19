# Studio tutorial videos: scripts

Status (2026-10-19, phase B): recorded and registered in `src/sanity/guides/videos.ts`: 1 `sermon-preview`, 2
`announcement`, 3 `visitor-newsletter` (now the Quick update form, not the page list) and 5 `service-times` (now the Quick
update form). The recorded scripts are the JSON files in `tools/tutorial-videos/scripts/` (390 wide, rings instead of
clicks on the last button, which the recorder never presses). Still to record: 4, 6, 7, and a Quick update overview whose
rings must scroll each tile into view first. Rerun with `node tools/tutorial-videos/record.mjs <script> --serve --music <mp3>`.

Written 2026-10-19 (`docs/agent/studio-plan.md`), to be recorded with the starter's tutorial-video pipeline once card
137 lands (Playwright against the local Studio with sample data, burned-in captions, mp4 and webm, every caption frame
checked). Each finished clip goes on its guide as `video: '/guides/<slug>.mp4'` and shows under "Watch how it is done"
on Home.

Rules for every clip: 1280 wide for desk jobs and 390 wide for phone jobs; under two minutes; light appearance; the
staff view; the account avatar and any real name covered; **sample data only** (the names, titles and files below are
made up); nothing is published to the live dataset (the pipeline draws the Publish click and the "Published" toast).
Captions are one short line each, in the guides' voice, no em-dashes.

Sample data used across the clips: preacher "Sam Example"; sermon "Bread for the journey", John 6:35-40; banner
"Trunk or Treat this Saturday at 5 pm."; news post "Fall clean-up day"; a sample PDF `visitor-sample.pdf` (two pages,
"Sample newsletter" on page one); a sample photo of pumpkins on a table (no people).

## 1. `sermon-preview`: Post Sunday's sermon preview (phone, about 60 s)

| #   | Shot                                                                          | Caption                                               |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Home at 390, Sunday checklist in view, ring on "Post Sunday's sermon preview" | The sermon preview is on the Sunday checklist.        |
| 2   | Tap "Post the preview"; Quick update opens with the tiles                     | It opens Quick update.                                |
| 3   | Tap "Post Sunday's sermon preview"; the form fills the screen                 | One form, nothing else on the screen.                 |
| 4   | Type "Bread for the journey"                                                  | The sermon's title.                                   |
| 5   | Type "John 6:35-40"                                                           | The passage: book, chapter and verses.                |
| 6   | Type "Sam Example"                                                            | Who is preaching. Leave it empty for no name.         |
| 7   | Type the summary "What does it mean to be fed? Come and find out on Sunday."  | A sentence or two for the Blog page.                  |
| 8   | Tap "Post the preview"; the done message                                      | It is on the Blog and the home page in a few minutes. |
| 9   | Home: the checklist item now ticked (drawn)                                   | And the checklist ticks itself.                       |

## 2. `announcement`: A banner, and a snow day (phone, about 70 s)

| #   | Shot                                                                                         | Caption                                   |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Quick update tiles at 390                                                                    | Banners are on Quick update.              |
| 2   | Tap "Put up a banner"                                                                        | Put up a banner: until a day you pick.    |
| 3   | Type "Trunk or Treat this Saturday at 5 pm."                                                 | One short sentence.                       |
| 4   | The date box shows the coming Sunday; change it to Saturday                                  | It comes down by itself after this day.   |
| 5   | Tap the button; done message                                                                 | Up in a few minutes.                      |
| 6   | Back to the tiles; tap "Cancel or change something this week"                                | For one week only, there is a red one.    |
| 7   | Type "No Wednesday Night Live this week because of the snow."                                | Say what is changing.                     |
| 8   | Tap the button; the site's red banner (a still of the website with the sample banner, drawn) | Red across every page, gone after Sunday. |

## 3. `visitor-newsletter`: Add this month's Visitor (desk, about 60 s)

| #   | Shot                                                     | Caption                                    |
| --- | -------------------------------------------------------- | ------------------------------------------ |
| 1   | Home at 1280, ring on "Add this month's Visitor"         | Start on Home.                             |
| 2   | The Visitor page opens at the issues list                | It opens the list of issues.               |
| 3   | Click "+ Add item"                                       | Add an issue.                              |
| 4   | Type "November", then "2026"                             | The month as a word, then the year.        |
| 5   | Upload `visitor-sample.pdf` (drawn progress)             | Upload the PDF.                            |
| 6   | Close the item; ring on Publish; drawn "Published" toast | Publish. The cover is drawn from page one. |

## 4. `blog-post`: A blog post with a picture (desk, about 100 s)

| #   | Shot                                                       | Caption                                       |
| --- | ---------------------------------------------------------- | --------------------------------------------- |
| 1   | Content > Blog > Posts; ring on the pencil button          | Blog, then Posts, then the pencil.            |
| 2   | Type "Fall clean-up day"; click Generate                   | The title, then Generate for its web address. |
| 3   | Type the summary                                           | One or two sentences for the Blog page.       |
| 4   | Cover picture: pick the sample photo; type its description | Every picture needs a description.            |
| 5   | Categories: add "FBCM Events"                              | Pick a category.                              |
| 6   | Write two short paragraphs in The post                     | Write the post.                               |
| 7   | Live preview shows the draft post                          | See it before anyone else does.               |
| 8   | Ring on Publish; drawn toast                               | Publish.                                      |

## 5. `service-times`: Change the service time (desk, about 45 s)

| #   | Shot                                                         | Caption                               |
| --- | ------------------------------------------------------------ | ------------------------------------- |
| 1   | Home; ring on "Change the service time"                      | One button on Home.                   |
| 2   | Site settings opens on Church details                        | Church details, in Site settings.     |
| 3   | Change "Sundays at 10:45 am" to "Sundays at 10:00 am"        | Type it the way it should read.       |
| 4   | Live preview: the home page and Visit page with the new time | Every page follows.                   |
| 5   | Ring on Publish; drawn toast                                 | Publish. Change it back the same way. |

## 6. `post-a-photo`: Post a photo from your phone (phone, about 50 s)

| #   | Shot                                         | Caption                                    |
| --- | -------------------------------------------- | ------------------------------------------ |
| 1   | Quick update tiles; tap "Post a photo"       | Post a photo is first on Quick update.     |
| 2   | The note about children's photos, in view    | Children need a parent's permission first. |
| 3   | Pick the sample pumpkin photo (drawn picker) | Take one or pick one.                      |
| 4   | Type "Pumpkins ready for the fall festival"  | Describe it in a sentence.                 |
| 5   | Choose "A new blog post"                     | A gallery on a page, or a new post.        |
| 6   | Saved as a draft; open it; ring on Publish   | It is a draft until you publish it.        |

## 7. `staff`: Someone joins or leaves the staff (desk, about 60 s)

| #   | Shot                                                                                                           | Caption                            |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Content > People > Staff members (a SAMPLE list: the pipeline must mock the list rows, real names never shown) | The Staff page reads from here.    |
| 2   | Pencil; type "Sam Example", Generate, role "Children's Coordinator"                                            | Name, web address, role.           |
| 3   | Group "Church Coordination Team"                                                                               | The group decides where they sit.  |
| 4   | Publish (drawn)                                                                                                | Publish.                           |
| 5   | Open the sample person; switch off "Show on the Staff page"                                                    | Away for a while? Switch this off. |
