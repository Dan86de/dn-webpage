# Writing

Daniel drafts a post, reads it in place on the dev server, and publishes it, and then readers find it at `/writing`, in the RSS feed, and with a share image of its own.

## Entry points

- `pnpm post:new "Title" [--category issue|essay]`, for a draft.
- `pnpm post <file> [--date YYYY-MM-DD] [--slug slug]`, to publish a draft or import an outside note.
- `/writing`, `/writing/issues`, `/writing/essays`, and `/writing/<slug>`.
- `/rss.xml` and `/og/<slug>.png`.
- The old `/blog` and `/blog/<slug>` links.

## Steps

The draft's path is `src/content/blog/verify-test-post/verify-test-post.md`.

- **Scaffold a draft.** Run `drive run pnpm post:new "Verify test post"`.
  It prints `Draft created: src/content/blog/verify-test-post/verify-test-post.md`, and `drive read <the draft> --grep "isDraft|category"` prints `isDraft: true` and `category: issue`.
- **Refuse an unfinished draft.** Run `drive run pnpm post <the draft>`.
  It exits 1 with `No description: add`.
- **Refuse an empty one.** Run `drive edit <the draft> 'description: ""' 'description: "A post from a verify run."'`, then `drive run pnpm post <the draft>` again.
  It exits 1 with `The post has no body`.
- **Write it.** Run `drive edit <the draft> '<!-- 3. One thing I do not know yet. Leave it unresolved. -->' 'The body of the post.'`.
- **Read the draft in place.** Run `drive restart`, `drive goto /writing`, `drive see "Verify test post"`, then `drive see "Draft"`.
  The filters read `All`, `Issues` and `Essays`, each with a count, and the post is at the top.
- **It stays out of RSS.** Run `drive fetch GET /rss.xml --grep "<title>Verify test post"`.
  It prints the status line and no item.
- **It stays out of production.** Run `drive run pnpm build`, then `drive read .vercel/output/static/writing/verify-test-post`, `drive read .vercel/output/static/og` and `drive read .vercel/output/static/rss.xml --grep "Verify test post"`.
  The build prints `Complete!`, the folder does not exist, the share images do not include `verify-test-post.png`, and the feed has no match.
- **Publish it.** Run `drive run pnpm post <the draft>`.
  It prints `Published:`, and `drive read <the draft> --grep "isDraft|<!--"` prints only `isDraft: false`: the template's comments are gone.
- **See it published.** Run `drive goto /writing`, `drive see "Verify test post"`, then `drive absent "Draft"`.
- **Read the post.** Run `drive goto /writing/verify-test-post`, then `drive snapshot main`.
  It has the label `Issue #2`, the heading `Verify test post`, the text `The body of the post.`, and a region `One email a week, from inside the work.`
  `drive shot post --full`, and look at it.
- **It is in RSS, in full.** Run `drive fetch GET /rss.xml --grep "<title>Verify test post"`.
  It has `<title>Verify test post</title>`, the description, and the body in `content:encoded`. The feed is one long line, so `--grep` prints all of it.
- **It has a share image.** Run `drive fetch GET /og/verify-test-post.png`.
  It answers `200 image/png`.
- **The old link still works.** Run `drive fetch GET /blog/verify-test-post`.
  It answers `301` to `/writing/verify-test-post`.
- **Import an outside note.** Run `drive write notes/outside.md "# An outside note<newline><newline>First paragraph of the note."`, `drive run pnpm post notes/outside.md --slug outside-note`, `drive restart`, then `drive goto /writing/outside-note`.
  The CLI prints `Published: src/content/blog/outside-note/outside-note.md` and `using the first paragraph`, and `drive snapshot heading "An outside note"` finds the heading.

## Behind it

A post is one Markdown file in `src/content/blog/<slug>/`, and publishing changes only that file: run `drive read src/content/blog/verify-test-post` to see the folder holds just it.
`drive console` prints `(no console errors)`.

## Gotchas

- The dev server does not see a new post folder until `drive restart`, and that empties the in-memory store.
- Drafts show on the dev server by design: a claim about what production hides needs the build, as above.
- `drive read` exits 1 on a missing file, which is the pass in `It stays out of production`.
- The list's links have no accessible name, so find a post by its visible text with `drive see`, not as a link.
- The issue number comes from publish order: backdating renumbers the later ones.
- Facebook and LinkedIn scrapes of the share image are out of reach.
