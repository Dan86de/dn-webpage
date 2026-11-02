# Weekly bet

Friends back Daniel or bet against him on one habit target a week, with play coins, and see the slip they placed get paid or busted once his log decides it.

## Entry points

- The `Bet on me` section of `/habits`, which has a form while betting is open.
- `pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM> [--from YYYY-MM-DD] [--closes YYYY-MM-DDTHH:MM]`, how Daniel sets one.
- `pnpm habit <id> [YYYY-MM-DD]`, how a logged day settles one.
- `GET` and `POST /api/bets`, behind the page.

## Steps

Every step fakes the clock with `?now=` in January 2030, so nothing here depends on today's real bet.

- **A week with no bet.** Run `drive goto "/habits?now=2030-01-07T12:00"`, `drive wait heading "Bet on me"`, then `drive see "No bet this week yet"`.
- **Refuse a bet that cannot be hit.** Run `drive run pnpm bet crossfit 9 "Nine?" 2030-01-13T20:00`.
  It exits 1 with `A target of 9 cannot be hit`.
- **Set this week's bet.** Run `drive run pnpm bet crossfit 2 "Two sessions in the test week?" 2030-01-13T20:00 --closes 2030-01-09T20:00`.
  It prints `Bet for the week of 2030-01-07`, and `drive read src/content/bets/2030-01-07.yaml` has `target: 2` and `closes: "2030-01-09T20:00"`.
- **Set next week's bet.** Run `drive run pnpm bet crossfit 1 "One session next week?" 2030-01-20T20:00`.
  It prints `Bet for the week of 2030-01-14`, and `drive read src/content/bets/2030-01-14.yaml` has `target: 1`.
- **See it open.** Run `drive goto "/habits?now=2030-01-07T12:00"`, `drive wait heading "Bet on me"`, then `drive see "Two sessions in the test week?"`.
  `drive see "Closes"` prints `CLOSES WED 20:00 · DEADLINE SUN 20:00 · 0 OF 2 LOGGED`, and `drive see "No bets yet"` passes.
- **See the teaser.** Run `drive see "One session next week?"`, then `drive see "Betting opens Monday"`.
- **See the form.** Run `drive snapshot group "Pick a side"` and `drive snapshot group "Stake"`.
  The sides are `He'll make it No takers yet` and `He'll fold No takers yet`; the stakes are `10`, `25` (pressed), `50`, `All in`.
- **A nickname is required.** Run `drive click button "He'll make it"`, then `drive click button "Bet 25 on him"`.
  `drive requests` lists no `POST /api/bets`: the browser stops an empty field.
- **Place a slip.** Run `drive fill "Your nickname" "Ann"`, `drive click button "Bet 25 on him"`, `drive see "Your slip"`, then `drive snapshot article "Slip"`.
  The slip is named `Slip 0001: 25 coins on "he'll make it"`, its punter is `Ann`, and `TO WIN` reads `25`.
  `drive shot slip`, and look at it.
- **Read it back.** Run `drive fetch GET "/api/bets?now=2030-01-07T12:00"`.
  It has `"me":{"nick":"Ann","balance":75` and `"pools":{"believe":25,"doubt":0`.
- **Top the table.** Run `drive wait heading "The friends table"`, then `drive text table`.
  It has one row: `Ann (you)`, `Believer · 1 open`, `75`.
- **A taken nickname.** Run `drive visitor bob`, `drive goto "/habits?now=2030-01-07T12:00"`, `drive wait heading "Bet on me"`, `drive click button "He'll fold"`, `drive fill "Your nickname" "ann"`, `drive click button "All in"`, `drive click button "on the couch"`, then `drive see "is taken"`.
  It reads `"ann" is taken. Try another nickname.`
- **The odds move.** Run `drive fill "Your nickname" "Bob"`, `drive click button "on the couch"`, `drive see "Your slip"`, then `drive snapshot img "of the pot"`.
  It reads `20% of the pot backs him, 80% bets he folds`.
- **Betting closes.** Run `drive visitor carol`, `drive goto "/habits?now=2030-01-10T12:00"`, `drive wait heading "Bet on me"`, then `drive see "Betting closed"`.
  It reads `BETTING CLOSED · HE HAS UNTIL SUN 20:00 · 0 OF 2 LOGGED`, and `drive absent "Pick a side"` passes: someone new gets no form.
- **A late bet is refused.** Run `drive fetch POST "/api/bets?now=2030-01-10T12:00" '{"side":"believe","stake":5}'`.
  It answers 409 with `Betting on this one is closed.`
- **The log settles it, a loser's view.** Run `drive visitor bob`, `drive run pnpm habit crossfit 2030-01-08`, `drive run pnpm habit crossfit 2030-01-09`, `drive read src/content/habits/crossfit.yaml --grep 2030`, `drive goto "/habits?now=2030-01-10T12:00"`, `drive wait heading "Bet on me"`, `drive see "Settled"`, then `drive snapshot article "Slip"`.
  The file has both days, the status reads `SETTLED · HE DID IT`; the slip is named `Slip 0002: 100 coins on "he'll fold", busted`, and `PAID OUT` reads `0`.
- **A winner's view.** Run `drive visitor default`, `drive goto "/habits?now=2030-01-10T12:00"`, `drive wait heading "Bet on me"`, then `drive snapshot article "Slip"`.
  The slip is named `Slip 0001: 25 coins on "he'll make it", paid`, and `PAID OUT` reads `125`.
  `drive see "PAID!"`, `drive shot paid`, and look at the stamp.
- **The table agrees.** Run `drive wait heading "The friends table"`, then `drive text table`.
  The rows are `Ann (you)`, `Believer · 1 of 1 won`, `200` and `Bob`, `Doubter · 0 of 1 won`, `0`.
- **The next week opens, and nobody logs it.** Run `drive goto "/habits?now=2030-01-14T12:00"`, `drive wait heading "Bet on me"`, `drive see "Betting as Ann"`, then `drive absent "Your nickname"`: Ann keeps her player and is not asked again.
  Run `drive click button "He'll fold"`, `drive click button "10" --exact`, `drive click button "on the couch"`, then `drive see "Your slip"`.
- **The deadline settles it the other way.** Run `drive goto "/habits?now=2030-01-21T12:00"`, `drive wait heading "Bet on me"`, then `drive see "Last week's slip"`.
  `drive snapshot article "Slip"` is named `Slip 0003: 10 coins on "he'll fold", paid`, and `PAID OUT` reads `10`: the only stake on the winning side takes the pot.

## Behind it

Coins move only when a slip goes in and when a market settles: Ann started with 100, staked 25, and won the 125 pot, so `drive fetch GET "/api/bets?now=2030-01-21T12:00"` has `"me":{"nick":"Ann","balance":200,"bets":2,"settled":2,"wins":2`.
`drive console` lists only the one `409 (Conflict)` from the taken nickname.
The production payout path, the Redis store and its atomic scripts, is `not driven`.

## Gotchas

- This drives the in-memory store, which follows the same rules as Redis but is not it.
- `?now=` works on the dev server only, and the page passes it on to the API.
- `Bet on me` and the friends table hydrate when scrolled to: `drive wait heading` first, or the form never appears.
- Use `--exact` to click a stake: `25` also matches `Bet 25 on him`.
- `drive restart` empties the book.
- A recorded outcome is final: logging or unlogging a day after settling changes nothing.
