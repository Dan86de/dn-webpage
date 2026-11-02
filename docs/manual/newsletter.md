# Newsletter sign-up

A reader leaves a first name and an email on the homepage or under a post, and it goes to Kit tagged with where they came from.

## Entry points

- The `One email a week, from inside the work.` section of the homepage.
- The same section under every post.
- Any of them with `?ref=linkedin`, `?ref=youtube` or `?ref=x`, which changes the source tag.

## Steps

- **See the form.** Run `drive goto /`, then `drive snapshot region "One email a week"`.
  It has the fields `First name` and `Email address`, a button `Get the next one`, and `I respect your privacy. Unsubscribe at any time.`
- **Email is required.** Run `drive click button "Get the next one"`, then `drive requests`.
  No request to `app.kit.com` is listed, and `drive where` still shows the homepage.
- **Sign up.** Run `drive fill "First name" "Test"`, `drive fill "Email address" "verify@example.com"`, `drive click button "Get the next one"`, then `drive requests`.
  The blocked list has one `POST https://app.kit.com/forms/9259766/subscriptions` whose body has `fields%5Bfirst_name%5D=Test`, `email_address=verify%40example.com` and `tags%5B%5D=18401031`.
- **Tagged by source.** Run `drive goto "/?ref=youtube"`, fill both fields as above with `Second`, click `Get the next one`, then `drive requests`.
  The new request's body ends `tags%5B%5D=18400334`.
- **Under a post.** Run `drive goto /writing/my-website-did-not-sound-like-me`, then `drive snapshot region "One email a week"`.
  It has the same fields and a button. Fill both with `Third`, click it, and `drive requests` lists a third `POST` to the same URL.

## Behind it

The site stores nothing: the only trace of a sign-up is that one request.
Past the request, whether Kit accepts it, the confirmation email, and the redirect to `/confirmed` are `not driven`.

## Gotchas

- The run's browser blocks the request on purpose, so a real address is never subscribed, and the page lands on `chrome-error://chromewebdata/`. That is the block, not a failure: `drive goto` again before the next step.
- The Vercel analytics scripts are listed as blocked on every page: ignore them.
- Blocked requests are grouped, with a count in front.
