# Cheer button

A visitor to `/habits` smashes a big button to root for Daniel, sees the shared total go up, and can add at most 16 of their own.

## Entry points

- The button in the `Cheer me on` section of `/habits`, by mouse.
- The same button from the keyboard, once it has focus.
- Leaving the page right after a smash, which still counts it.

## Steps

- **See it untouched.** Run `drive goto /habits`, then `drive snapshot region "Cheer me on"`.
  It has a button named `Smash the cheer button. 0 smashes so far`, the text `Go on, it counts`, and a `Sound on` button.
- **Smash it.** Run `drive click button "Smash the cheer button" --times 3`, then `drive see "You gave 3 of 16"`.
  The count moves at once, before the server has heard.
- **The total catches up.** Run `drive snapshot region "Cheer me on"`.
  The button is named `Smash the cheer button. 3 smashes so far` within a second, and `drive requests` lists `POST /api/smash -> 200 body: {"delta":3}`.
- **Read it back.** Run `drive fetch GET /api/smash`.
  It prints `{"total":3,"cap":16}`.
- **Smash from the keyboard.** Run `drive press Enter`, with the button still focused from the click, then `drive see "You gave 4 of 16"`.
- **Survive a reload.** Run `drive await-api POST /api/smash`, then `drive reload`, then `drive see "You gave 4 of 16"`.
  `drive fetch GET /api/smash` prints `"total":4`.
- **Reach the cap.** Run `drive click button "Smash the cheer button" --times 12`, then `drive see "You gave all 16. Respect."`.
  `drive snapshot region "Cheer me on"` has a button named `You have maxed out this button`, and `drive fetch GET /api/smash` prints `"total":16` within a second.
- **The server holds the cap.** Run `drive fetch POST /api/smash '{"delta":16}'`.
  It answers 200 with `{"total":16,"mine":16,"cap":16}`: dropped, not rejected.
- **Refuse nonsense.** Run `drive fetch POST /api/smash '{"delta":0}'`.
  It answers 400 with `delta must be an integer 1-16`.
- **Someone else adds to the same total.** Run `drive visitor second`, `drive goto /habits`, then `drive snapshot region "Cheer me on"`.
  The button is named `Smash the cheer button. 16 smashes so far` and the text is `Go on, it counts`.
- **Leave right after a smash.** Run `drive click button "Smash the cheer button"`, then `drive goto /about` straight after.
  `drive fetch GET /api/smash` prints `"total":17`.

## Behind it

The total and each visitor's count are all the feature stores, and only `GET` and `POST /api/smash` touch them.
`drive console` prints `(no console errors)`.

## Gotchas

- Chromium drops the run's per-visitor user agent on a request sent while leaving a page, so the server counts that one smash as a different visitor. The total is right, but do not check the cap after this step: the visitor's own count on the server is one short.
- A new `drive run` that writes content does not reset the count, but `drive restart` does.
- The sound cannot be heard in a headless browser: `Sound on` only proves the toggle.
