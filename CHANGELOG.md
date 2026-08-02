# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html);
see `AGENTS.md` for the bump rules.

> **Two parallel work streams shared this file.** The redesign round and the
> accessibility/consent round each numbered their own releases, so 0.7.0 and
> 0.8.0 were each used twice, by different work. Both are kept below and
> labelled; the next release renumbers them into one line. The pearl process
> animation was written against a third number, 0.9.0, which never shipped on
> its own — it lands here as part of 0.13.0.

## [0.17.0] - 2026-08-02

### The top of the page now asks for the phone call

- Rebuilt the opening of the home page around what Pnina asked for: a big
  headline, a short answer underneath it, the video, and the form itself. On a
  phone all four are on screen the moment the page opens, with no scrolling.
- The headline names the thing a woman is actually living with, and the three
  lines under it answer the three reasons not to call: she does not have to tell
  anyone around her, she does not have to describe what happened, and she is not
  committing to anything.
- The first "לשיחת היכרות" button no longer opens a popup. The name, phone and
  Pnina's question are on the page, where they can be filled in straight away.
  It is the same form as the one at the foot of the page and it goes to the same
  place; leads from the top are simply labelled so we can see if this works.
- Removed the "ליווי אישי ודיסקרטי" line above the headline and the three small
  reassurance pills below it. The new lines say the same things in her voice.
- The video frame is horizontal now, as asked. Her current clip was filmed
  upright, so until the horizontal one arrives it plays in the middle of the
  frame with a softened copy of itself filling the sides rather than being
  cropped, which would have cut off her face and the subtitles.

### Her own colours, and her own background

- The pink that was on the buttons and the headlines is gone. It was the one
  colour on the site that was not on Pnina's list.
- The buttons and highlighted headlines are now the colour of the sea, which is
  what she asked for on seeing the first attempt: "less dark, more colours of
  sea, sea water, beach" — ivory, pearl, azure, turquoise, silver. The warm sand
  colours are still everywhere else on the page; the sea is what makes the
  button stand out from them instead of blending in.
- The background is her photograph, the sunset with the shell and the pearl, on
  every page, in full resolution on both a computer and a phone.
- A line used to appear in the background every few scrolls. That was the page
  laying the same sheet of "paper" down separately in each section, so the
  photograph flashed back to full strength at every seam. It is one continuous
  sheet now, so the background reads the same the whole way down.
- Her welcome letter ("ברוכה הבאה לתהליך הליווי האישי שלך") is now on the
  thank-you page, which is where it is true: it greets a woman who has just left
  her details.
- Her tagline, "ליווי אישי לצמיחה, ריפוי ובניית חיים חדשים", sits under her name
  in the header on wide screens.

### The fonts are hers now

- Headings are set in **Amatic SC**, which Pnina picked herself from Google
  Fonts. Body text is Heebo, a clean Hebrew sans that reads easily at small
  sizes. The font she originally named, "Comika", could not be used: it has no
  Hebrew letters at all, so nothing on this site would ever have rendered in it.
- Amatic is a light, narrow, hand-drawn face, so every heading on the site was
  made about 40% larger to compensate. It is used for headings only. Body text,
  buttons, form labels and the menu stay in the clear sans, because Amatic is
  genuinely hard to read at small sizes and this page is read by people in
  distress, sometimes on a phone.

### Under the hood

- The lead form gained a tighter layout used only in the hero, and a new "hero"
  source so leads from the top of the page can be told from leads from the foot.
  Same form, same fields, same validation; her optional question is untouched.
- Text over the photograph is measured again from scratch, in both light and
  dark. Her picture is much darker than the sand it replaced, so the paper the
  text sits on came back at 40% and the picture itself has its deepest shadows
  lifted. Every size of text clears the accessibility standard on both.
- A new test fails the build if the headline, the video or the send button ever
  stop fitting on a phone screen.

## [0.16.3] - 2026-08-01

### Returning above the completed process no longer pulls the page back

- Let a fast reverse gesture that begins on step 4 and finishes above the whole
  process leave naturally instead of correcting the page back down to step 3.
- Kept normal reverse steps unchanged when the gesture finishes inside the
  process, and kept the first forward journey limited to one step per gesture.

## [0.16.2] - 2026-08-01

### A normal held swipe changes one process step

- Made phone step changes follow the direction of a deliberate touch gesture
  instead of requiring the final scroll position to cross half of the next
  station. A slow 42-64px document movement now works like a quick flick.
- Limited one completed touch gesture, including a multi-finger gesture, to one
  adjacent step. Tiny accidental movement still returns to the current step.
- Kept ordinary page exits at both ends: an outward gesture that begins on step
  1 or step 4 leaves the process without being pulled back.
- Guarded the settling destination against stale browser completion events and
  allowed a 3px endpoint tolerance for fractional mobile scroll geometry.

## [0.16.1] - 2026-08-01

### The pearl and each step can be seen together

- Replaced the process copy's opaque paper block with one contrast-safe
  translucent warm-black panel. The film remains visible through it without
  adding backdrop blur or another expensive WebKit filter.
- Tightened only the phone overlay: step 2 has a shorter heading and one fewer
  sentence, steps 3 and 4 lose their redundant closing lines, and the complete
  approved copy remains in the desktop, static and screen-reader versions.
- Returned the desktop copy panel to the physical right, leaving the shell and
  pearl visible on the left.
- Added a gentle phone-only settle after native scrolling has completely
  stopped. It chooses the closest step, is replaced by a fresh gesture and
  never installs CSS scroll snap, locks the page or cancels touch input.
- Restored the sand photograph behind the sections beside the process with a
  local static paint surface. It keeps the finished site appearance without
  making Safari rebuild the fixed, filtered background at either boundary.

## [0.16.0] - 2026-08-01

### The process is a stable native-scroll story

- Rebuilt the pearl process around ordinary page scrolling. It no longer
  cancels touch or wheel input, locks the page, snaps stations or waits for an
  animation act before allowing the visitor to continue.
- Put the final four-chapter shell and step 1 in the first page rendering. The
  section no longer begins as a card grid and changes height several seconds
  later after remote probes, so cold loads cannot move or hide the following
  page. Phones use a fixed `400lvh` track with a 2,600px floor, so Safari's
  collapsing toolbar cannot compress the four stations into an empty jump.
- Kept step information on screen throughout the journey with one warm paper
  panel. Its four-copy rail rests at each station and follows scroll through
  the handoff, so the current words move left as the next enter from the right
  without two opaque cards piling on top of each other. A fast flick may
  advance quickly but always resolves to valid copy.
- Replaced the phone's WebP/ImageBitmap canvas runtime with one short-keyframe
  H.264 scrub file and a local first-frame poster. Mobile now uses one 3.6 MB
  video asset instead of a burst of frame files and no longer holds an
  80 MB decoded-image window while Safari is painting the surrounding page.
  Missing or late video leaves the poster, copy and native navigation usable.
- Kept the complete four-card version for the site's own reduced-motion switch
  and Save-Data, with no pearl requests in either mode.
- Made content reveals transform-only so readable copy is never transparent.
  On phones, the process neighbors now paint as opaque surfaces without
  backdrop blur, and the five filtered ambient blobs become one transform-only
  gradient field. The completed route entrance also releases its page-wide
  identity transform instead of retaining one enormous compositor layer. The
  two neighboring sections are permanently released from their one-time
  reveal.
- A browser reload now starts at the top instead of restoring a position inside
  the process. Normal back/forward restoration is unchanged.
- Replaced the forced-station tests with cold delayed-video, stable-geometry,
  single-panel rail, native-scroll distance, failed-video, single-asset,
  static-mode, opaque-boundary and reload regressions.

## [0.15.4] - 2026-08-01

### Phone process navigation has one enforceable sequence

- Replaced the phone's competing native-snap and gesture decisions with one
  explicit state machine while keeping the proven sticky stage in the normal
  document. There is still no fixed overlay, body freeze or document scroll
  lock.
- A hard wheel or touch gesture entering from above is now intercepted at step
  1 even if it would otherwise cross the complete process track between two
  animation frames. Approaching from below lands on step 4.
- Each fresh vertical gesture moves exactly one adjacent step. Every extra
  wheel event or finger gesture is discarded while that step's visible act is
  playing, never queued, so rapid double and triple scrolling cannot wake up
  later and skip a step.
- Step 4 holds until its act has completed, then a fresh outward gesture exits.
  Reverse travel follows the same one-step rule, multi-touch cannot buy a step,
  a missing touch-end event cannot poison the next gesture, and the back-to-top
  control remains the immediate explicit skip.
- Expanded the isolated phone suite to cover real entry from outside, iOS
  Simulator wheel trains, trusted touch flicks, all four steps, reverse travel,
  no queued input, missing touch lifecycle, multi-touch, missing frames,
  four-frame-per-second playback, native exit from both endpoints and the
  explicit back-to-top exit.

## [0.15.3] - 2026-07-31

### The phone process returns to its proven scroll behavior

- Restored the last phone-tested process choreography from 0.15.1. The page,
  sticky process stage and native scroll track stay together again: there is no
  fixed overlay, body freeze or document scroll lock that can leave an empty
  screen behind.
- Kept the useful playback correction from the discarded controller round.
  Pearl playback now follows real elapsed time, so an iPhone rendering four
  frames per second drops frames instead of stretching one act from roughly
  2.4 seconds to six or more.
- Once the sticky stage has engaged, rapid phone flicks and iOS Simulator
  trackpad trains are absorbed until the visible act reaches its station. This
  first recovery gate deliberately lived only on the already-sticky stage; the
  outside-entry gap it left is closed in 0.15.4.
- The floating back-to-top arrow now releases root scroll snapping before its
  smooth scroll begins, so the explicit skip route cannot be pulled back into
  the process.
- Kept the development-origin allowance needed for a Mac, iOS Simulator or
  phone to receive the hydrated local preview through the Windows port proxy.

## [0.15.2] - 2026-07-31

### The process animation can no longer trap or skip on an iPhone

- **Phone scrolling is four explicit steps now.** One vertical finger gesture
  moves one adjacent step, however hard or long the flick is; a second finger
  cancels rather than skipping; and a fresh outward gesture at either end
  leaves normally. The phone no longer depends on iOS momentum and root scroll
  snapping agreeing after the gesture has already travelled.
- **A slow animation cannot hold the page.** Playback now follows real elapsed
  time, so an iPhone delivering four frames per second drops visual frames
  instead of stretching one act from roughly two seconds to six. Missing or
  failed image frames never participate in the navigation decision.
- **Safari's moving toolbar no longer moves the stations.** The track, sticky
  picture and JavaScript all share one visual-viewport measurement, frozen
  while the process is active and refreshed after leaving.
- **Every destination picture loads first, and the phone rests when the image
  rests.** Steps 2-4 now beat intermediate act-one frames into the decoder, and
  the process animation loop sleeps while it is parked instead of reading
  layout on every screen refresh.
- Added a mobile browser regression suite covering hard forward and reverse
  flicks, multi-touch, toolbar-height changes, four-frame-per-second playback,
  failed media, boundary exit and the back-to-top bypass.

## [0.15.1] - 2026-07-31

### The animation respects every kind of scroll, and moving through it feels right

- **A hard desktop scroll can no longer blow through the animation.** From
  inside the section, a fast wheel flick or heavy trackpad swipe used to
  travel from step 1 to step 4 and straight out the bottom (the burst
  outlived the rate limit, and reaching the last step handed the rest of the
  gesture back to the page). One gesture now means one step, no matter how
  hard it is thrown, on every input. Deliberate repeated scrolling still
  walks through normally, and leaving from the first or last step is still
  one ordinary gesture.
- **Moving between steps on the phone is much easier.** Advancing used to
  demand ~2.4 seconds of stillness (and a second flick could accidentally
  extend its own wait); now a step is ready for the next flick about half a
  second after it arrives. Rapid back-to-back flicks still move one step.
- Also fixed along the way: on touch, a flick into the last step could arm
  the exit early and sail out of the section — leaving now requires the
  gesture to start on the step it leaves from.
- **Step 4 is tighter on phones**: the line about the two tracks is not
  shown in the mobile card (the full text stays on desktop, where there is
  room), which took the tallest card down to mid-pack and off the pearl.

## [0.15.0] - 2026-07-31

### Text that shows on every phone, an animation that behaves, and a faster first load

- **Section text no longer vanishes on some phones.** On browsers that could
  not run the reveal animation (older Samsung Internet among them), the
  intro paragraphs of whole sections stayed invisible forever — the empty
  gaps under "למי הליווי מתאים", in the offers, and above the testimonial
  screenshots were all this one bug. The site now proves the reveal engine
  actually works before hiding anything, and a watchdog releases anything
  left hidden. Browsers with working animation see exactly what they saw
  before.
- **The mobile menu opens again.** The hamburger menu had been broken in
  production: its slide animation never ran while the sand background was
  active, leaving the panel 1 pixel tall. It now opens instantly.
- **The animation section behaves.** It stops on the first image instead of
  rolling straight to the second; one scroll gesture (wheel or finger) moves
  exactly one step and rapid flicks cannot skip ahead; leaving from the
  first or last step is one ordinary flick; the step copy appears about a
  second earlier; on phones the text box moved up off the pearl and "שלב X"
  shares a line with the step title; the header disappears entirely while
  the animation fills the screen.
- **Tapping a video now also opens fullscreen** along with the sound, on the
  home page and the about page.
- **The header got its background back.** Transparent-over-everything made
  the menu unreadable on busy sections, so the bar is solid again at every
  scroll position (except inside the animation) — without the old scroll
  detection or blur, so none of the old glitching returned.
- **Blacker where it was still grey**: the header links and the outline
  buttons ("למי הליווי מתאים" and friends) now use the same near-black as
  body text.
- **Faster first load.** The cookie banner's decorative image shrank from
  287 KB to 46 KB (measured 1.3 seconds off load time by itself); the hero
  now shows Pnina's poster photo within ~1 second while the clip buffers
  instead of a text panel; and the media CDN and site assets are now cached
  at Cloudflare's edge (set up in the dashboard the same day), so the 5 MB
  hero clip no longer crosses to storage origin for every visitor.
- **Cookie-banner button lift is phone-only** — on desktop the WhatsApp,
  accessibility and back-to-top buttons stay put while the banner shows.
- **Copy**: the lead form heading speaks as Pnina alone ("אשמח לחזור אלייך"),
  and the footer blurb no longer repeats her name directly under her name.

## [0.14.0] - 2026-07-31

### The phone release: fast loading, a smooth animation, bigger and blacker text

- **The site loads fast on phones again.** The animation's ~90-180 frames used
  to all download at once the moment the page opened, ahead of everything the
  page actually needed — that was the 15-second load, the header appearing
  late, and the WhatsApp and accessibility buttons blinking in and out. Frames
  now download a few at a time, at low priority, important ones first; the
  page always wins.
- **The animation itself is smooth.** Instead of holding every frame decoded
  in memory (which made phones silently throw frames away and stutter
  re-decoding them mid-scroll), the site keeps a small window of frames around
  where you are and lets the rest go. While the animation fills the screen,
  the sand simulation and other background effects pause — they were invisible
  behind it and fighting it for the phone's GPU.
- **Leaving the animation is easy now.** On the first or last step, a single
  ordinary flick outward exits the section — the "catch" that stops fast
  flings from skipping steps now applies only between steps. On desktop, one
  mouse-wheel gesture moves exactly one step: no more double-scroll jumping
  two steps, and no more small scrolls doing nothing at all.
- **Text is bigger everywhere and genuinely darker.** Body text is now 20px on
  phones and 23px on desktop (the size Daniel judged right at 130% zoom),
  every heading tier is up at least 4px, and the ink is near-black. The one
  place left alone is the animation overlay, as requested. The smallest grey
  text now passes the AA readability standard even directly on the sand.
- **The hero video plays with sound on a tap.** Same treatment as the about
  page: it opens silent, a centered "הפעלה עם קול" invitation sits on it, and
  tapping restarts it from the beginning with audio. Autoplay also no longer
  depends on the page's JavaScript finishing — the fix for iPhones that showed
  a frozen first frame. No video on the site offers a download menu anymore.
- **Header keeps the page's own background.** The cream bar that used to
  appear on scroll is gone; a hairline underlines the header instead.
- **Footer links sit in two columns on phones**, and the back-to-top arrow now
  shows on phones too.
- **The accessibility panel no longer zooms itself** when you raise the text
  size — the page grows, the controls stay put.

## [0.13.2] - 2026-07-30

### The animation locks properly on phones, white cards over the sand, and buttons that never hide

- **The animation section behaves on phones.** A fast flick used to sail
  straight past the first step (or, coming from below, past all of them).
  Now the section catches arriving momentum and holds the step you landed
  on; one flick still moves exactly one step, and the gentle no-yank entry
  stays.
- **The animation moved up.** It now comes right after her story, above
  "למי זה מתאים".
- **Cards are solid white over the sand.** The "מה שחשוב לי שתדעי מראש"
  cards, the thank-you steps, and the contact page's form and info cards no
  longer let the photograph bleed through the surface you read and type on.
  The inline lead form also lost its extra outer white panel: one clean card.
- **Text got darker and the footer got bolder** so everything reads
  comfortably against the photograph.
- **The WhatsApp and accessibility buttons never hide anymore.** The
  WhatsApp bubble used to step aside while the video was on screen (it
  looked like a bug, and hid the highest-converting action exactly at the
  top of the page); and the accessibility button was a cream circle
  camouflaged against the sand. Both are always visible now, and the video's
  own controls moved to the top corners of the clip so nothing overlaps them.

## [0.13.1] - 2026-07-30

### Animations for everyone, the photograph everywhere, and a gentler animation section

- **The animations now play for every visitor.** Until now a device set to
  "reduce motion" silently got the static site (which is why the process
  animation looked missing on your own computer). Your decision: the site
  decides, not the device. The one opt-out is the reduced-motion switch in the
  site's own accessibility menu, off by default, remembered per browser, and
  it still gives the complete quiet experience to whoever chooses it.
- **The sand photograph shows plainly on every part of every page**, the same
  shade as the top of the home page. The translucent cream sheet the sections
  used to lay over it is gone.
- **The animation section no longer grabs the page.** Scrolling near it, or
  one line back up into it, used to yank the screen into the animation. Now it
  only takes over once it truly fills the screen, and one scroll at either
  edge lets go.
- **The contact form on the live site reaches the real endpoint.** The
  address had a leftover "Hello World" test program answering it; the real
  one is deployed. (Sending still needs the refreshed n8n secret stored,
  which is a one-time manual step.)

## [0.13.0] - 2026-07-30

### The two work streams become one site: your sand, real pink, real bold, and the accessibility round on board

This release unifies the redesign round and the accessibility/consent round
(the doubled 0.7.0/0.8.0 numbers below both feed into this line).

- **The background is your photograph now, exactly.** The previous plates had
  a tone correction that pushed the red channel past its limit over most of
  the frame, which is why the sand looked chalky mustard instead of warm tan,
  worst on phones. The plates are now 99% byte-identical to your files, and
  the ripple under the pointer went from measurable-only to clearly visible,
  like a finger drawn through sand. It still settles when you stop, and it
  still never runs for visitors who asked their device for less motion.
- **The pink is actually pink.** The accent family was shipped at a
  saturation that reads brownish; buttons, the hot free-call CTA and the
  hero's highlighted second line now share one unmistakably pink family, with
  every contrast ratio re-measured and passing.
- **Headlines are genuinely bold.** The display face is now Bona Nova at a
  real 700 weight, everywhere a heading appears. It was chosen by rendering
  your actual headline in five candidate Hebrew faces side by side.
- **The header carries the call button on phones too**, the Instagram and
  WhatsApp icons moved beside the name, and the bar's backdrop appears
  instantly when you scroll (it used to stay transparent, leaving the menu
  floating over the video).
- **The free call is a gift, in her words:** "שיחת היכרות במתנה", with
  "שווי השיחה ₪490" as the supporting line. Shekel formatting is now
  identical everywhere.
- **The accessibility and cookie work is merged in:** the accessibility
  options panel and skip link, and Google Analytics loading only after an
  explicit yes on the cookie notice, all restyled to sit correctly on the
  redesigned pages. The site addresses its readers in the feminine there too.
- **"איך זה עובד" now plays as an animation.** On a device that allows motion,
  the four steps are told by a scallop shell opening on a sunset beach and a
  pearl rising: one scene per step, each step's words arriving only once its
  scene has settled, one flick of the thumb moving exactly one step, and a
  "שלב 2 מתוך 4" marker so nobody loses their place. Phones and wide screens
  each get their own filmed version, streamed from the media bucket rather than
  bundled into the site.
  A woman who has asked her device (or this site) for less motion, or who is
  saving data, keeps the four cards she sees today, permanently, and downloads
  no part of the animation at all. The site also checks that a sequence is
  fully uploaded before it plays anything, so a half-finished upload shows the
  cards rather than an animation that stops in the middle.
- **The sand runs through the whole site now.** The translucent paper each
  content band lays over the photograph was heavy enough to read as a flat
  single-color background past the hero; it is lighter now, so the sand is
  clearly visible behind every section on every page, and the text inks were
  deepened to keep every measured contrast pair passing (all of them now pass
  with more room than before).
- **The pink is the live site's pink.** You preferred the orchid-magenta of
  the current production site over the newer warm rose, so buttons, the hot
  CTA and the highlighted headline moved to that family (and button contrast
  improved to 8.3:1 in the process).
- **The sand ripple is on hold.** The mouse-follow sand movement is disabled
  for this release at your request; the machinery stays in the code for the
  planned rework.
- **A batch of review findings fixed before going live:** the offer panel can
  no longer appear empty after a jump to the middle of the page; the
  accessibility statement shows the real phone number instead of a broken
  placeholder; dark-mode cards have visible borders; the floating WhatsApp
  button steps aside while video controls are on screen and no longer pulses
  forever; footer links are comfortably tappable; the process line only
  draws on phones, where it actually connects the steps; the browser tab now
  carries her name on the home page.

## [0.12.1] - 2026-07-30

### Your sand, your order, and a site that speaks to women

- **The sand photograph is now truly the background.** The previous release
  reduced your photo to a near-invisible texture (a processing step threw away
  the image before it ever reached the screen). Now the actual photograph sits
  under every page at full strength, content bands lay a soft translucent
  "paper" over it so every line of text stays readable (the tightest contrast
  pair on the site measured before and after: unchanged), and the ripple still
  moves the sand around the pointer. Dark mode uses the dark plates the same
  way.
- **The whole site speaks in the feminine.** Every place that addressed
  readers in the masculine plural, mainly the lectures page, now uses the
  feminine plural (שלכן, נוח לכן, אליכן, "רוצות לשמוע עוד?", "מי מזמינה
  אותי"), and the legal pages address המשתמשת. The intimate feminine singular
  of the main funnel is untouched. Real testimonial quotes stay verbatim.
- **The lectures page answers questions in the right order.** What the talk
  is about now comes after who invites her and how it works in practice; and
  the booking dialog no longer shows the personal question field, which
  belongs to the accompaniment funnel, not to an organisation booking a talk.
- **Headlines are a touch bolder** without faking a bold weight the typeface
  does not have (a hairline stroke thickens every display headline evenly),
  and the top-bar name is properly bold.
- **The loud button lost its gold ring.** The last gold remnant on any button
  is now rose, so every button agrees with the site's pink accent.
- **Half-faded text is gone.** A subtle bug froze scroll-in animations partway
  on eight different spots, including two of the review cards, the row of
  checkmarks under the hero, and the closing line of every inner page. All of
  them now arrive fully.

## [0.12.0] - 2026-07-30

### A new headline face, bigger type everywhere, and colours that stop arguing

- **The headlines wear a new typeface, and it is a real one.** You said the
  headlines looked ugly, and it turned out the problem was not "a Hebrew serif" —
  it was that the site was setting a BOOK typeface at bold. A book face has thin
  strokes on purpose; when a browser bolds one it just fattens the strokes without
  redrawing them, and everything goes blunt and slightly muddy. So the headlines
  now use **Bellefair**, which is a display face, at its one natural weight. It is
  lighter, more open and more distinctly chosen than what it replaced. Because its
  letters sit smaller inside the line, every headline on the site also grew by
  about 12% so they land where they used to.
  The site also got faster while doing this: the old face's two weights are no
  longer downloaded by anyone (about 100KB off every first visit). They are still
  one keystroke away — add `?font=frank` to any address to see the previous
  headlines, or `?font=bonanova` for the runner-up. `?font=bellefair` puts it back.
  "ללא עלות" on the free-call panel is the one deliberate exception: it stays on
  the body typeface, because that word needs real weight and the new face does not
  have one. Photographed all three ways before choosing.

- **Everything is bigger. This was the biggest complaint and it was justified.**
  You said the text on most pages was too small to read comfortably. Measuring the
  actual rendered page agreed, loudly: on a phone the site was showing 278
  separate pieces of text at 14 pixels, and more than two hundred of those were
  inside a link or a button. That had happened quietly — the "small" size had
  drifted into being the site's normal reading size.
  It is fixed at the source, so it is fixed everywhere at once rather than
  page-by-page: card copy, answers in the FAQ, form labels, the menu, footer links
  and every button label went from 14 to 16 pixels on a phone and 17 on a laptop.
  Paragraphs went from 16 to 17.5 and 18.5. The small print — the copyright line,
  the "(לא חובה)" on the form, the footer headings — went from 12 to 14. **Nothing
  anywhere on the site is now smaller than 14 pixels, and nothing you can tap or
  click is smaller than 14 pixels.** Checked on every page at phone and laptop
  width, and checked that nothing broke, overflowed or fell off the screen at nine
  different widths from 320 pixels up.

- **The "₪490 → ללא עלות" moment plays again every time you come back to it.** It
  used to run once and then sit still for the rest of the visit. Now: scroll the
  panel off the screen and back, and it performs again from the top. It will not
  stutter if you stop with the panel half on screen — it only re-arms once the
  panel has left entirely, so a sequence that has started always finishes. And it
  is still not a loop: it never repeats on a timer and it never repeats while you
  are looking at it, which is the line this site does not cross. If your device
  asks for reduced motion, nothing has changed at all — you get the finished
  panel, still, exactly as before.

- **The two track cards are rebuilt: picture on the right, words on the left.**
  You said the old ones were ugly, and they were — a small square photo parked
  above the text with a lot of nothing beside it. Now the shell and the pearl fill
  the whole right-hand side of each card, edge to edge and full height, with the
  track's name, its price, who it suits and what it includes laid out to the left
  of the picture. The two cards stack one above the other instead of standing
  side-by-side, because half of a laptop screen is not enough room for a picture
  and a paragraph; you can still see both without scrolling. On a phone the
  picture is a wide band across the top. The prices stayed small and quiet on
  purpose — they are facts being disclosed, not a price list being sold.

- **The lectures page now says how much you have actually done.** Three lines
  under the introduction, in your own words: כ-5 הרצאות שהעברתי · קהל של 15-150
  משתתפות בכל הרצאה · כ-10 שנות מסע אישי של צמיחה, למידה והעמקה, שממנו נולד הליווי
  שלי. They are set at reading size next to a small gold dot, with no big numbers
  and nothing counting up — because "5" printed huge would be selling the smallest
  of the three, and because these are real figures and they should read like
  facts, "כ-" and all.

- **The colours around the text stop arguing with it.** You said the text and the
  backgrounds behind it did not look complementary. Three places were genuinely
  fighting, and all three were side-effects of the rose becoming the main accent
  in the last release:
  the small gold labels above each offer ("הצעד הראשון", "חודש") were an amber
  orange sitting on rose-pink light, which is the classic muddy pair — they are now
  a soft rose that belongs to the same family as the button beside them;
  the third step of "ארבעה שלבים" was a pale blue-grey card in a row of three warm
  cream ones, and it read grey and dead next to them — it is warm rose now, so the
  four steps walk one temperature instead of three;
  and the big faint "03" behind the third step had drifted into a yellow-green
  lemon — it is a warm antique sand now.
  The silver-blue is still on the site where it belongs, on the small reassurance
  chips with the ticks. And the gold has not been diluted anywhere it matters: it
  still draws every hairline, the arrow, the rings and the marks. Every colour pair
  that changed was measured again in both light and dark; nothing on the site is
  less readable than it was, and the tightest pair on the whole site is exactly
  where it was before.

## [0.11.4] - 2026-07-30

### Dusty rose, real sand, and sand you can push around

- **The site's accent colour is now a dusty rose, and the buttons are the first
  thing you will notice.** Every "leave your details" button on the site — in the
  header, in the hero, in the footer, on the offers panel and under the form — is
  a soft, muted rose instead of brown, and the warm light behind the free-call
  panel is rose light. It is deliberately a DUSTY rose and not a pink: quiet,
  grown-up, in the same warm family as the cream page. The bright gold has not
  gone anywhere — it still draws every hairline, the arrow that points at "ללא
  עלות", the ring around each step and the little marks beside the small
  headings — so what you see is rose and gold together, which is a pairing rather
  than a competition.
  Two other accents are still one keystroke away for comparison: add
  `?accent=amber` to any address for the brown-button version exactly as it was,
  or `?accent=gold` to see bright gold buttons instead. The choice sticks for that
  browser until you type `?accent=reset`.
  **Pnina still has to bless the rose.** The palette she gave us is cream, peach,
  gold, natural brown and silver-blue; rose sits next to her "אפרסק עדין" but it
  is a new colour and it is hers to approve. If the answer is no, `?accent=amber`
  is exactly what the site goes back to.

- **The sand behind the site is now Pnina's real photographs of sand.** Two of
  them: a wide frame for laptops and a tall one for phones, so the ripples run the
  right way on both. They replace the drawn-by-code sand from the last release.
  They are graded so that they are texture and almost nothing else — the sand
  darkens the page by about two and a half percent at the bottom of a ripple and
  by nothing on a crest, which is what keeps every word on the site as readable as
  it was before the sand existed. That is not a guess: the page was measured again
  the same way as last time, pixel by pixel behind 2,294 lines of text across
  eight pages, in both light and dark, on a laptop and on a phone. The tightest
  pair on the whole site measures exactly what it measured with no sand at all.
  Both plates together are under 200KB, and a phone only ever downloads the one it
  needs.

- **The sand moves when you touch it.** Run the mouse across the page and the sand
  under it is pushed aside — a soft groove that follows your hand, piles a little
  sand at its edge, and then slumps back and disappears the way real sand does. It
  is not a ripple effect on a loop; it is a small simulation of a surface, which is
  why a slow drag leaves a deeper mark than a quick flick. On a phone it follows
  your finger, including while you are scrolling.
  It moves only while you are moving. The moment your hand stops, the sand settles
  and the animation stops completely — nothing on this site animates forever behind
  someone who is trying to read. Anyone whose device asks for reduced motion, or
  whose browser cannot run the effect, simply gets the still photograph, which is
  the same picture.

- **The pearl that followed the mouse is gone.** Daniel asked for it removed. The
  pearl on the offers panel — the one that belongs to "מסלול פנינה" — is untouched.

### Notes

- The `?accent=`, `?hover=`, `?motion=` and `?font=` switches are review knobs for
  this redesign round and get deleted at the end of it. They change nothing for a
  visitor who has never typed one.

## [0.11.3] - 2026-07-29

### The gold is gold now

- **The gold was reading as olive, and it is fixed at the root.** Daniel looked
  at the site and said "I think it's gold but what I see is green". He was
  right. A dark, low-saturation yellow simply IS olive, and every gold on the
  site was the same yellow at whatever darkness its job happened to need. So the
  gold is now two things instead of one: the gold you SEE is bright, properly
  metallic gold (the colour most people picture when they hear the word), and
  the gold that words are SET in is a warm honey-amber, because a bright gold on
  a cream page is unreadable at any size. Nothing on the page is a dull yellow
  any more.

- **Where the gold is big, it is now actual metal.** The arrow that runs from
  "שווי השיחה ₪490" down to "ללא עלות" is painted with a real gold gradient that
  runs pale to deep to pale along its length, the way light moves along a
  polished edge, and "ללא עלות" itself is brushed rather than flat. The free-call
  panel has a fine bright edge along its top, like a gilded frame. After dark
  the metal is brighter still, because a dark page can carry it.

- **More peach.** Peach is one of her own colours, and it is what makes the
  page feel warm rather than beige. The background field, the hero and the
  free-call panel all carry more of it now.

### A floor of sand, and a pearl that follows you

- **The site now has a sand floor, and a pearl resting on it that follows the
  mouse.** Very fine wind-ripples across the whole page — barely there, the way
  paper texture is barely there — with one small pearl that trails the cursor
  and casts a soft shadow on the sand. The pearl sits just below and behind the
  pointer, never on top of it, so it can never cover a word being read or a
  button about to be pressed. It is the same pearl that marks מסלול פנינה in the
  offers section, so the site has one pearl, drawn once.
- Phones and tablets get none of this, and neither does anyone whose device is
  set to reduce motion. Nothing about it changes what a page says or where
  anything sits.

### The two track pictures are in

- **מסלול צדפה and מסלול פנינה now have their photographs**: a closed scallop
  shell for the first, the same shell opened around a pearl for the second, shot
  as a pair on the same warm backdrop. They replace the drawn placeholders that
  were holding those two slots.

### Reading it

- **Two lines of small print were not quite legible enough, and now are.** The
  sentence under the form that says who sees your details, and the note on the
  thank-you page that says the same thing, both sat on a lightly tinted card and
  fell just under the standard. The lightest grey on the site was darkened a
  step so it clears the bar on every background it can land on, not just on the
  plain page. Every page was re-checked, in both light and dark, on a phone and
  on a desktop.
- **The video no longer shows a magnifying-glass cursor.** Hovering the clip in
  the hero used to turn the pointer into a magnifier with a plus in it, which is
  what a photo gallery does. It is a plain pointer now.

## [0.11.2] - 2026-07-29

### The free call is now the loudest thing on the page, once

- **"שווי השיחה ₪490 → ללא עלות" is a designed moment now.** The value of the
  introductory call used to be one quiet grey line under the words "ללא עלות".
  It now reads as the small gift it is: the ₪490 lands first, a gold arrow draws
  across toward the inline end, and "ללא עלות" arrives underneath it in the
  display serif, large and warm, with a single pass of light across it. The
  whole thing takes about three seconds, plays ONCE the first time the panel
  comes into view, and then holds still for the rest of the visit. Scrolling
  back up does not replay it.

- **That panel is allowed to be warm, and nothing else is.** The free call now
  sits on a gold wash with a warm halo, and its button is bigger, on a
  brown-to-bronze gradient with a gold edge and a glow, rising in as the last
  beat of the sequence. This is the one place on the site that raises its voice,
  because what it is announcing is a gift. It is still not a sales panel: no
  countdown, no "only N left", no struck-through price, and above all nothing
  that pulses, throbs or repeats while a woman is reading. Loud once, then calm.

- **A reader who has switched off animations sees the same design, finished.**
  Warm panel, arrow already drawn, "ללא עלות" at full size, button already hot.
  She simply does not get the show. That is not a fallback, it is the same page
  with the motion taken out, and it is what a browser with JavaScript disabled
  shows too.

- **Her pearl line moved to after the reviews.** "פנינה לא נוצרת למרות השכבות
  שלה" used to introduce the messages other women sent; it now closes them.
  Read after the reviews it says what those messages meant, instead of being a
  claim the reader is then handed the evidence for.

- **Long dashes are gone from the Hebrew.** Seven sentences carried an em-dash
  (`—`), a piece of English typesetting that makes a Hebrew line read as though
  a machine set it. They are commas, full stops and colons now, including in the
  descriptions read aloud to a screen reader. Ordinary hyphens inside a range,
  like "40-60 דקות", are untouched.

### Behind the scenes

- The `?motion=force` review switch is remembered. It exists so Daniel can see
  the motion work on a machine that has "reduce motion" switched on at the OS
  level, and it had to be re-typed into the URL on every single page load. Typing
  it once is now enough; `?motion=reset` forgets it again. It is still something
  a person can only turn on by typing it, it still changes nothing for anyone who
  has not, and it still gets deleted at the end of this redesign round.

## [0.11.1] - 2026-07-29

### The offer reads as one invitation, and the page stops twitching

- **The offer section was rebuilt around the free call.** It used to be one
  vertical list: the free שיחת היכרות, then מסלול צדפה, then מסלול פנינה, three
  full-width bands stacked down the page — which quietly said "here are three
  things you can buy, and the first one happens to be free". That is backwards.
  The free call is the thing being given away and the only thing this page asks
  for, so it now stands on its own as a single panel with the one button, and
  the two tracks sit beneath it side by side, under the line "המסלולים שנדבר
  עליהם בשיחה". On a wide screen you see both tracks at once and can compare
  them; on a phone they stack, צדפה first. Prices are still small, quiet facts.
  Nothing was made louder: no badge, no "recommended", no strikethrough.

- **Each track has a picture coming.** A square image slot now sits at the head
  of each column — a closed shell for מסלול צדפה, a pearl for מסלול פנינה, which
  is the section's own title made visible. Until those images arrive, each slot
  draws a calm panel carrying that track's own emblem, so the page is finished
  as it stands rather than waiting on a file.

- **Copy that asked for permission now says what happens.** The free call used
  to read "נדבר, נכיר, ורק אחר כך תחליטי אם יש המשך. ואם לא, גם זה בסדר גמור."
  It now says what a woman actually gets: "נדבר על מה שאת רוצה שישתנה, ותצאי
  מהשיחה עם תמונה ברורה ועם צעד ראשון שאפשר לעשות כבר היום." The two "מתאים לך
  אם…" lines say what each track is for rather than how long it is, and the line
  closing the four steps changed from "ובכל שלב, גם באמצע, את יכולה לעצור."
  to "בקצב שלך, ותמיד קדימה." — the reassurance that you can stop at any time is
  still on the site, once, in the FAQ, where a woman looking for it will find it.

- **One section came off the home page.** "הליווי נבנה סביבך, לא סביב תבנית" sat
  directly under "למי הליווי מתאים" and made the same point in weaker words. The
  header link that pointed at it now points at "למי זה מתאים" instead.

- **Opening the callback popup no longer makes the page jump.** On most desktop
  browsers the whole layout slid sideways when the popup opened and slid back
  when it closed, because locking the page behind it removed the scrollbar. The
  space is now permanently reserved, so nothing moves — not the text, not the
  header, not the WhatsApp button.

- **Smaller things.** The hairline running down the four steps was refined: its
  dots were sitting beside the line rather than on it, the line now fades out at
  both ends instead of stopping dead, and it is fainter. The sentence closing
  the steps is no longer a green-ticked pill that looked like a "confirm
  purchase" button. Hebrew micro-labels lost letter-spacing that was pulling
  their two-letter words apart. The cursor light on the background is a little
  more visible.

- **For review only, and temporary:** `?motion=force` turns the animations back
  on for one browser tab on a machine where the operating system asks for
  reduced motion (so the motion work can actually be looked at), and
  `?font=frank|noto|david|sans` swaps the headline typeface while a face is
  chosen. Neither affects a visitor who does not type them, and both are removed
  when the review round ends.

## [0.11.0] - 2026-07-29

### Faster on a phone, and content she can update herself

- **Every page got lighter.** The full text of the site — including the whole
  terms-of-use page and the whole accessibility statement — was being sent to
  the browser with *every* page, whether or not it was going to be shown. The
  homepage now arrives 14 KB smaller, and the pages that carried the most dead
  weight are 16-20% smaller: the privacy page dropped from 100 KB to 81 KB, the
  thank-you page from 113 KB to 94 KB. Nothing about what is on screen changed.

- **Photos are now sent at the size they are actually shown.** The site had no
  way to shrink an image, so a phone downloaded the full-size original of
  everything — a portrait meant for a small frame arrived at nearly ten times
  the size it was drawn at. Every image is now prepared at several widths in a
  smaller modern format, and the browser picks the one that fits its screen.
  The pictures a visitor downloads are about **half the bytes** they were: her
  portrait 148 KB → 58 KB, the logo 24 KB → 4 KB, the still frame behind the
  hero video 33 KB → 20 KB, each testimonial screenshot around 40% smaller. The
  screenshots are converted from the already-redacted published copies and at a
  higher quality setting than the photographs, so the messages in them stay
  perfectly legible.

- **The /about video is queued for a much smaller re-encode.** 21.5 MB → 11.6 MB,
  and — more importantly — its sound was mastered too loud and was clipping,
  which is audible distortion on a phone speaker. That is fixed. The file is
  ready in `private-media/cdn-upload/`; **Daniel has to upload it**, as with the
  hero clip.

- **Groundwork for captions on that video.** It is two minutes of Pnina
  speaking with nothing written on screen, so today it says nothing at all to a
  Deaf or hard-of-hearing visitor. The player now supports a Hebrew caption
  track; what is missing is the transcript itself, which only Pnina can supply
  (tracked in `docs/12` §C). Nobody is going to guess her words for her.

### Added — she can add content without a developer

- **New: photos and screenshots can be added straight from the Cloudflare
  dashboard.** Pnina drops a file into a `published/` folder in the media
  bucket and it appears on the site within minutes — no rebuild, no deploy, no
  developer. The testimonial screenshots are the first section wired up this
  way; the same mechanism is built to be reused for the gallery and for video.

  Two things worth understanding about it:

  **The `published/` folder is the review step.** Only files in it are ever
  shown. Everything else in the bucket is invisible. For a screenshot of a
  private message that folder is the *consent* gate — a person deliberately
  moving a file into it is the act of clearing it — and the rules in
  `docs/04-testimonials-policy.md` apply to it exactly as they apply to files in
  the repo.

  **If anything at all goes wrong, the site shows what it shows today.** A
  missing connection, an undeployed endpoint, an empty folder — all of them fall
  back to the content built into the site. It can never blank a section.

  **This is not switched on yet.** Daniel has to name the real storage bucket in
  `worker/wrangler.toml` and redeploy the Worker. Until then the site behaves
  exactly as before.

- **A cache runbook for the Cloudflare dashboard** (`docs/07-deployment-target.md`),
  covering the one-year cache the site's build files should have and are not
  getting, how to upload media so it caches properly, and two settings that
  silently break video playback if anyone ever turns them on.

### Changed

- The Worker that serves the contact form now also serves the media listing;
  both are dispatched from `worker/src/index.js`. **It needs a redeploy** — and
  a real bucket name — before the media half does anything.
- `pnpm optimize:images` rebuilds the image sizes and runs automatically on
  build.

### Fixed

- **The share card says "שיחת היכרות".** The picture that appears when someone
  sends the link in WhatsApp still called the introductory call "שיחה ראשונה",
  which is the old name the rest of the site stopped using. It was the last
  place the two terms disagreed. The card was regenerated in her colours while
  it was open.

## [0.10.0] - 2026-07-29

### Added — the site moves the way a calm room moves

- **The page now answers to scrolling instead of blinking at it.** Sections used
  to fade in when they crossed an invisible line; now they rise with the scroll
  itself, a little slower and a little further, and each group of items arrives
  in order rather than all at once. Where the browser is new enough it does this
  itself, with no JavaScript at all — which also means the page animates for
  someone who has scripts switched off. Older browsers keep the previous method,
  tuned to the same feel.

- **A gold line now draws itself down the four steps of "איך זה עובד",** with a
  small dot marking each step as it reaches it. It follows the Hebrew reading
  direction on its own (right-hand side), and on a phone it simply runs down the
  stack. If a browser cannot animate it — or the visitor has asked her device to
  reduce motion — the line is just already drawn. Nothing is ever missing.

- **Three "the page notices your cursor" backgrounds, to choose between.** Add
  `?hover=glow`, `?hover=grid`, `?hover=pearl` or `?hover=off` to any address to
  try one: a warm light that follows the cursor, a sand-like dot field that
  brightens around it, or a pearl in the top of the page that leans toward it.
  These are for Daniel to pick from; the two that lose get deleted. None of them
  appear on a phone or tablet, or for anyone who has asked for reduced motion,
  and none of them remember anything about the visitor.

- **The two scroll-told picture sequences are built and waiting for their
  frames** — the pearl opening on the home page, the hall lighting up on the
  lectures page. Until the images exist, both are completely invisible: the page
  looks exactly as it does today, and no failed downloads happen. When the
  images are uploaded to the media bucket they appear on their own, with no code
  change and no new deploy. For a visitor who has asked for reduced motion, or
  whose phone is in data-saver mode, they show a single finished picture instead
  of an animation.

### Changed

- The paper grain over the page is a touch more present, and now disappears
  entirely for a visitor whose device asks for higher contrast.

## [0.9.0] - 2026-07-29

### Changed — the price section is now one path, not a funnel

- **"מהצדפה אל הפנינה" replaces the offer funnel.** Where there were two boxed
  cards, arrows pointing down and a glowing "free" card at the bottom, there is
  now a single quiet line running down the page with three stops on it: **שיחת
  היכרות** first, then **מסלול צדפה · חודש** and **מסלול פנינה · שלושה חודשים**.
  Same information, told as one path instead of as a countdown to a prize.

- **Nothing is crossed out any more, and nothing blinks.** The struck-through
  price, the little `?` bubbles that explained it, the pulsing number and the
  halo around the free card are all gone. What the introductory call is worth
  (₪490) is now said once, in a normal sentence, under the words **ללא עלות**.

- **The prices are deliberately small.** The section title is the biggest thing
  on it, then the name of each track, then "ללא עלות" — the numbers themselves
  are quiet facts at the size of ordinary text. A price set large is a price
  being sold at someone.

- **One button in the whole section**, and it is on the free call. The two paid
  tracks carry no button and no "recommended" badge: they are described, priced
  and left alone, because deciding on a three-month process before speaking to
  anyone is not something this page should ask for. The closing line still says
  it out loud — "אפשר להתחיל בשיחה, ולהחליט על מסלול רק אחריה."

- **The two tracks look equal, because they are.** Her own framing is that they
  are the same accompaniment at two lengths, so neither is styled as the better
  one. The only thing that differs is the small mark beside each: an open shell
  for the first, and a single pearl — the one filled shape on the page — for the
  three-month track.

- Each track now carries a one-line **"מתאים לך אם…"**. Those two sentences say
  nothing beyond the length of each track, but they are the only words in the
  section that are not Pnina's — **they need her yes** (`docs/01-client-intake.md`).

### Removed

- **The empty statistics strip is gone.** "נשים שליוויתי", "שנות ניסיון" and
  "הרצאות" were all placeholder zeros; the strip hid itself and had been
  rendering nothing for months. It is deleted rather than left waiting. If real
  numbers ever arrive, they get a section built for them — the site still never
  invents one.

## [0.8.1] - 2026-07-30 — accessibility round

### Fixed
- **The accessibility and WhatsApp buttons now form one balanced row.** They
  use the same 56px size and bottom baseline on opposite sides of the screen,
  including while the cookie choice is visible.
- **The accessibility panel now fits phones more comfortably.** Its cards,
  controls, labels, and footer use a compact mobile layout while retaining
  aligned rows and full-size touch targets. At very narrow widths or 130% text,
  paired cards reflow instead of overlapping.
- Saved accessibility choices and the device's reduced-motion preference are
  now applied before the first paint, avoiding a visible layout or motion flash
  while the page loads.

## [0.8.0] - 2026-07-29 — redesign round

### Changed — the site now looks like her brand

- **New palette: cream, gold and natural brown.** The site was wearing the
  plum-and-teal colours it inherited from the template it was built out of.
  It now wears hers — the warm cream, beige, peach, gold, brown and soft
  silver-blue from the golden-hour shell photographs she sent — and it reads as
  one warm room rather than as two colours arguing. Every text colour was
  measured against its background before it shipped, so the site can still
  honestly claim it meets the accessibility standard; the numbers are written
  into the stylesheet next to the colours themselves.

- **New Hebrew typefaces.** Headlines are now set in **Frank Ruhl Libre**, the
  Hebrew book serif Israeli newspapers and novels have used for a century, and
  the body text in **Assistant**, a Hebrew-first sans. The previous pair was
  perfectly good and completely anonymous; this one reads like a person chose
  it. Prices and phone numbers still line up in a column.

- **A brand mark: an open shell with a pearl.** Drawn for her from the
  references she sent — geometric and quiet, not a trace of the photographs. It
  lives at `public/brand/pearl-mark.svg`.

- **A real favicon.** The site had none, so every browser tab showed a blank
  page icon. It now shows the pearl mark on her cream. The share card that
  appears when someone sends the link was rebuilt to match — new colours, new
  headline face, and the mark beside her name.

- **Dark mode is warm now too.** It was a deep purple; it is now a dimmed
  version of the same warm room. The one thing that changed for real reasons
  rather than aesthetic ones: the contact form's fields had almost no visible
  edge in the dark, and now they have a clear one everywhere.

### Removed

- **The four illustrations in the "how it works" section.** They were
  machine-generated, and it showed — the "handwriting" and the "road map" in
  them were garbled nonsense letters. Each step now shows its number in the new
  headline face on a tinted panel, which is a finished design rather than a gap.
  Real photographs can replace them whenever she has some.

### Changed — the opening video

- **It now plays on its own for everyone.** It used to hold still for visitors
  whose phone or computer is set to reduce animation. Daniel's call: the clip is
  her introducing herself, it is silent, it carries its own subtitles, and the
  pause button next to it is always there. If a phone refuses to autoplay (Low
  Power Mode does), the still frame and the play button take over as before.

## [0.8.0] - 2026-07-29 — accessibility round

### Added
- **Native accessibility options on every page.** Visitors can enlarge text,
  switch to a designed high-contrast palette, increase reading spacing,
  underline links, or reduce motion. Choices stay only in that browser and can
  be reset at any time.
- **A keyboard skip link and an accessible options dialog.** The dialog fits
  narrow screens, keeps keyboard focus inside while open, closes with Escape,
  and returns focus to its launcher.
- **Repeatable accessibility checks.** Automated WCAG A/AA checks now cover the
  home page, contact flow, accessibility statement, preferences, mobile menu,
  dialogs, form errors, persistence, reduced motion, and 320px reflow.

### Changed
- The lead form now focuses the first invalid field and connects each error to
  the field it describes. The lead popup, image viewer, and mobile menu now
  contain or restore keyboard focus correctly.
- Reduced motion now stops decorative timers, counters, scroll effects, muted
  video autoplay, and carousel progression whether it is requested through the
  device or the new site option.
- The accessibility statement now describes the real implementation and tests,
  names the real contact routes, and clearly avoids certification or unverified
  physical-access claims.

## [0.7.0] - 2026-07-29 — redesign round

### Added — Pnina's own words, on the page

- **A new section: "למי הליווי מתאים".** Eight tiles, one for each of the
  subjects she named — ביטחון עצמי, אשמה ובושה, גבולות, חרדות, ריצוי, ערך עצמי,
  תקיעות, ובחירה בעצמה. It sits high on the page, right after her story, so a
  woman can find her own sentence before anyone explains anything to her. It
  closes by widening rather than narrowing: המסרים מתאימים לכל אישה, כולל נשים
  מהקהל הדתי והחרדי.

- **A new section: "מה הופך לאפשרי בתהליך הליווי".** The five moments she
  described, written as things she has watched happen rather than as things the
  accompaniment promises, and closing with "כל תהליך הוא אחר". **Every one of
  them is written so that it cannot point to a particular woman** — no names, no
  ages, no dates, no numbers. Two of the five, as they were told, identified
  someone. Nobody on this site has agreed to have her recovery published, and
  that is not a detail to get wrong. It occupies the slot where an empty
  statistics strip used to render nothing at all.

- **An optional question on the form.** Under the name and phone there is now
  one open box asking **"מה הכי היית רוצה שיקרה בעקבות השיחה שלנו?"**, marked
  "(לא חובה)". Nothing is pre-filled and nothing nags. It asks what a woman
  wants to *happen next*, never what happened to her, and it stays the only free
  text on the site. Most people will skip it, and a form sent without it looks
  exactly as it did before. Everywhere the site promised "שם וטלפון בלבד" now
  says the truth instead, including the privacy page, which also states plainly
  that anything written there is kept with the rest of the enquiry and handled
  discreetly.

- **The form itself is now at the bottom of the page.** The last block used to
  be two buttons; it is the name, phone and question boxes, ready to fill in.
  Every other button on the site still opens the popup.

- **A WhatsApp button on the thank-you page.** "אפשר גם לכתוב לי עכשיו
  בוואטסאפ", under the line promising a callback — because waiting is hard, and
  writing is easier than talking for a lot of people.

### Changed — one name for the first conversation, and honest prices

- **It is called "שיחת היכרות" everywhere now.** The site was calling the same
  thing three different names — "שיחה ראשונה", "פגישה ראשונה", "פגישה אישית" —
  which reads as three different products. It is one thing, it is **40 to 60
  minutes, by phone or by Zoom**, and it is free; that is now said wherever it
  comes up, from the header button to the thank-you page.

- **The invented prices are gone.** The page used to show ₪1,000 crossed out,
  then ₪500 crossed out, then "free". Neither number came from Pnina. In their
  place is what she actually says: **שווי השיחה ₪490, ואצלה היא ללא עלות** —
  written as a plain fact, with nothing crossed out and nothing pulsing. The
  "כולל מע״מ" badge was removed too; her VAT status has never been confirmed and
  the site should not assert it.

- **Her two tracks are on the page.** מסלול צדפה (חודש · ₪990) and מסלול פנינה
  (שלושה חודשים · ₪2,880), shown as two equal cards listing only what she has
  told us they include — מפגשים אישיים and ליווי בוואטסאפ בין המפגשים. Neither
  card has a button and neither is marked as the better one, because in her own
  words the two are the same thing at two lengths. The free introductory call
  remains the only thing the page asks for.

- **The FAQ answers the money questions properly**, plus four new ones: how long
  the introductory call is, the difference between the two tracks, what happens
  between sessions, and whether the accompaniment suits a religious or חרדי
  woman (it does).

- **Her story moved up the page**, from eighth to second — she asked for it, and
  she was right. The first thing that matters here is not an argument about a
  method; it is that the woman on the other side has been where the reader is.

- **The opening headline no longer breaks in the wrong place.** "אפשר לאהוב את
  החיים שלך שוב." and "דווקא בזכות מה שעברת" are now two deliberate lines, so
  the full stop can no longer end up alone at the start of the second one.

- **The quote in the middle of the page is now hers:** "פנינה לא נוצרת למרות
  השכבות שלה. היא נוצרת בזכותן." The line it replaced — "אף אחת לא צריכה להוכיח
  שמה שקרה לה מספיק חמור" — was too good to lose and now sits beside her story
  on the "עליי" page, which also gained "אי אפשר לבחור מה עברנו, אבל תמיד אפשר
  לבחור איך ייראה ההמשך."

- **The lectures page is real, and back in Google.** It is now built around her
  talk, **"שכבות של פנינה"**, with the seven kinds of audience she named, "פרונטלי
  או בזום", and "מקבוצות של 15 ועד 150 משתתפות". It has no price row — whoever
  wants a number will ask. The page had been hidden from search and unlinked
  from the menu while it still carried invented copy; both are undone, and the
  booking button is no longer smaller than every other button on the site.

- **"עליי" tells the truth about what she does.** Two claims nobody had
  confirmed — that she accompanies women "בכל העולם" / "בישראל ובחו״ל", and that
  she runs סדנאות — are gone, replaced by facts she gave us: שיחות בטלפון או
  בזום, שיחת היכרות של 40-60 דקות ללא עלות, ומתאים גם לנשים מהקהל הדתי והחרדי.
  Where the site used to offer a group workshop it now offers what she really
  gives: ליווי בוואטסאפ בין המפגשים.

- The four steps of "איך זה עובד" now say what happens *after* the introductory
  call: the meetings, the WhatsApp support between them, and the two lengths.

- The thank-you page's step numbers used to float off in the corner of each
  card, away from the step they numbered. They sit with it now.

## [0.7.0] - 2026-07-29 — accessibility round

### Added
- **Google Analytics now waits for permission.** A small Hebrew, right-to-left
  cookie notice gives every visitor an immediate "כן, תודה" or "לא תודה"
  choice. Before she accepts, the site sends nothing to Google and creates no
  Google cookie.
- **The choice can always be changed.** A permanent "עוגיות" control in the
  footer reopens the notice. Withdrawing permission removes the known Google
  cookies and reloads the page without Google.

### Changed
- The privacy page now explains the consent choice, the necessary choice cookie,
  the Google Consent Mode signals, the 182-day choice period, and the withdrawal
  route accurately.
- Invalid or missing GA4 measurement ids now fail closed: no notice, consent
  cookie, Google script, browser global, or network request is created.

## [0.6.0] - 2026-07-29

### Fixed — the site was invisible to Google, and to anyone sharing a link

- **Every address the site gave search engines was wrong.** Google was being
  told this site lives at `pnina.trickticmedia.com`, a host that answers with a
  "page not found". That was in the page headers, the sitemap and the
  robots file — so the pages Google was asked to index did not exist. The site
  now says **peninaphaff.com** everywhere, and the address is stored in exactly
  one place in the code so it can never fall out of step again. The file that
  tells GitHub which address to answer on is now written automatically from that
  same place on every build.

- **Sharing a link showed a blank grey box.** WhatsApp, Facebook and every
  other preview had no picture to show, because the page never pointed at one.
  There is now a proper share card — her name, "את לא צריכה לעבור את זה לבד",
  and the address, on the site's own cream and plum — and every page points at
  it. (The old automatic card was worse than nothing: it printed Hebrew
  backwards, letter by letter.)

- **The site was describing the wrong business to Google.** The hidden
  machine-readable summary still said the template's original trade — "תכנון
  אדריכלי", "עיצוב פנים", "וילות ובתי יוקרה" — and pointed at a photograph of a
  swimming pool that does not exist here. It now lists what Pnina actually
  accompanies women through, and points at her own photograph.

- **Two buttons went to the wrong place.** "איך הליווי עובד" at the top of the
  page jumped to the reviews instead of to the four steps. "שליחת הודעה
  בוואטסאפ" at the bottom of the page did not open WhatsApp at all — it
  scrolled back up the page. Both now do what they say.

- **The contact page promised WhatsApp and did not offer it.** Its own opening
  line says "ואפשר לפנות ישירות בוואטסאפ", but the only thing on the page was an
  email address. There is now a WhatsApp button there, with the same
  ready-written opening message as every other one on the site.

- **A page with a slow or broken connection could come up blank.** Sections
  were hidden by default and only made visible once the page's code had run and
  finished. If anything went wrong on the way — no JavaScript, a failed load, an
  older phone — a visitor got an empty page instead of an unanimated one. That
  is now the other way round: the words are visible first, and the gentle
  fade-in is added on top. Text that is already on screen when the page opens no
  longer fades in at all, so it appears sooner.

- **Dark mode.** Headlines set in the rose-to-ink gradient could disappear
  entirely for anyone using a "dark mode" browser extension. They now always
  have a solid readable colour underneath. The site also now tells such
  extensions that it already has its own dark version, so they stop working over
  the top of it — and the heavy purple haze across the top of every page has
  been toned down to a soft glow.

- **Small things that were wrong.** The footer's copyright line printed "כל
  הזכויות שמורות" with no year and no name. The "back to top" button sat on top
  of the WhatsApp button on desktop (it was pinned to the wrong side for a
  right-to-left page) and announced itself in English to screen readers. `/about`
  showed a spanner and a stack of boxes beside "ליווי אישי, פנים אל פנים או
  מקוון", and reserved a picture of a server rack for her first qualification.
  `/contact` showed the same clock twice for three different reassurances.

### Changed

- **The lecture page is temporarily out of search and off the menu.** Every word
  on `/lectures` is still placeholder text written before Pnina confirmed what
  she speaks about, so an HR manager searching for a speaker could have found
  invented claims about her work. The page is untouched and still reachable by
  its link; it simply is not advertised until her real content lands. It comes
  back in the next phase.

- **The video at the top of the page can now be stopped.** There is a small
  pause button in its corner, and on a device set to "reduce motion" it no
  longer starts by itself at all — it waits on its opening frame until she
  presses play.

- **The dot beside every section label stopped pulsing.** It was a small
  blinking "live" signal attached to nothing that was live.

### Removed

- **Identifying details in the review screenshots.** One of the three
  screenshots was published with another woman's Instagram name legible in it;
  she never agreed to appear here. It is now permanently blurred out at the
  source. Two more identifying details found in the other screenshots — the
  sender's profile photograph, and a third party's account name along the top
  edge — were blurred as well. The messages themselves are untouched and fully
  readable.

### Waiting on Daniel (not done automatically, on purpose)

- **The new address needs its infrastructure.** The built site now says
  peninaphaff.com, but the custom domain, its certificate and the small service
  that receives the contact form all still answer on the old address. Until the
  Cloudflare Worker is redeployed and the domain is pointed over, the site
  should not be published. See `docs/07-deployment-target.md`.
- **A lighter copy of the opening video is ready to upload.** It is 1.9 MB
  instead of 5.3 MB — the same clip, the same length, sound intact — waiting in
  `private-media/cdn-upload/` with instructions. Uploading it changes the live
  site, so it is a deliberate step rather than an automatic one.

## [0.5.0] - 2026-07-27

### Added
- **Google Analytics is on.** The measurement id `G-8WH5H49LVN` is now set in the
  deploy workflow, so from the next publish there is a dashboard showing how many
  people reach the site, which pages they read, where they came from, and how far
  down the funnel they get. The five events the site already fires — the lead
  dialog opening, a lead being submitted, and each of the three videos being
  played — arrive there too.

  What it never sends: a name, a phone number, or anything typed into the form.

### Changed
- **The privacy page now says that cookies are set, because they are.** It used
  to say the site's measurement tools store no identifying cookies. That was true
  while nothing was running; Google Analytics stores a cookie on the visitor's
  device for up to two years, so the section was rewritten to say so plainly,
  explain that the data is statistical and not linked to anything she wrote, and
  give her a way to switch it off. It also states outright that nothing on this
  site records her browsing, her mouse or her typing.

### Known issues
- **Nobody is asked before the cookie is set.** The privacy page discloses it,
  but there is no consent banner yet; Daniel is building one to drop in. Until
  then this is the site's weakest privacy position, and it is a deliberate
  interim state rather than an oversight. See `docs/03-open-decisions.md` §7 for
  the shape it should take.

## [0.4.0] - 2026-07-26

### Added
- **A dark version of the site, for visitors whose device is set to dark.**
  The site is still the light, cream-and-plum site it has always been — that has
  not changed, and it is what almost everyone will see. But a phone set to dark
  mode used to be handed a page that insisted it was light-only, and either the
  browser or a dark-mode extension would then try to darken it on its own and
  make parts of it hard to read. Now the site has a proper dark version of its
  own to hand over: a deep aubergine background instead of cream, with the same
  plum, teal and gold on top. Same layout, same words, same funnel.

  Every text colour was re-picked and re-measured against the dark background,
  so the site can still claim AA (ת"י 5568) either way. It switches by itself
  and there is no button to press.

  Nothing about the light site changed — same colours, same buttons, same hover
  behaviour, to the pixel.

## [0.3.4] - 2026-07-26

### Changed
- The price zoom runs at **2s** instead of 3.4s, and the two struck prices and
  the free headline now pulse **in sync**. They were offset by 1.1s to avoid a
  metronome effect; reading down the funnel that offset just looked like a
  glitch. Depth is unchanged at 7%, and it still stops dead under
  `prefers-reduced-motion`.

## [0.3.3] - 2026-07-26

### Fixed
- **Four of the six WhatsApp buttons opened an empty chat.** Only the floating
  button and the footer link pre-filled the opening message; the header tile, the
  mobile menu row, the button beside her photo on the home page and the one on
  /about all linked at the bare `wa.me` number. Whether a woman arrived in
  WhatsApp with "היי, הגעתי דרך האתר..." already typed depended on which button
  she happened to press — and on this site that line is what saves her from
  having to compose an opening sentence about why she is writing.

### Changed
- All six now go through one `<WhatsAppLink>` (`src/components/ui/`), which
  builds the href via `whatsappHref()` in `src/lib/whatsapp.ts`. The text is a
  single key, `whatsapp.message` in `messages/he.json`: change it there and every
  button follows. A per-button override exists if one ever needs its own line.
- The message namespace was `floatingWhatsapp`, which read as if it belonged to
  that one button. It is `whatsapp` now.
- Two e2e tests assert that every `wa.me` link on every page — including the
  mobile menu row, which only renders below `lg` — carries `?text=`.

## [0.3.2] - 2026-07-26

The videos move to the CDN, and the site goes public.

### Changed
- `NEXT_PUBLIC_MEDIA_BASE_URL` is set to **https://media.trickticmedia.com**, the
  custom domain on the R2 bucket. Verified against a real CI-shaped export: every
  `<source>` in the emitted HTML points at R2, and both objects answer with
  `206 Partial Content` and `accept-ranges: bytes`, so seeking works.
- The publish mirror now excludes `public/video/`. Production never serves those
  files — they are the dev fallback — and 11 MB of MP4 in a public repo's
  permanent history is not worth carrying. It also cuts the deployed artifact
  from 17 MB to 6 MB.

### Deployment
- **The site is live at https://pnina.trickticmedia.com.** First publish of the
  public mirror; Pages enabled with GitHub Actions as its source, custom domain
  set, certificate issued, HTTPS enforced. The hero video plays from R2 on the
  live page (`readyState: 4`, 720×1280) and no request on the page 4xxs.
- The Worker was redeployed so production validates phone numbers the same way
  the site does. It had been running the pre-0.3.0 length check.
- **Outstanding: the DNS record is still DNS-only (grey cloud), so the lead form
  does not work yet.** A Worker route only fires on proxied traffic, so
  `POST /api/contact` is answered by Pages with a 405. Grey was required for
  GitHub to issue the certificate; that is done, so the record can be flipped to
  proxied now. See the runbook in `docs/07-deployment-target.md`.

## [0.3.1] - 2026-07-25

The site can now honestly claim WCAG 2.1 AA, which its accessibility statement
has to state under ת"י 5568. Audited with axe-core against the real production
export — 8 pages × 2 viewports — and it comes back with **zero** violations,
WCAG and best-practice alike. It was 86 contrast failures per viewport before.

### Fixed
- **`--subtle-foreground` was `#9a8290`: 3.25:1 on the cream canvas**, used at
  12px for the footer's section labels, the copyright line and the legal pages'
  meta. A straight AA failure on the smallest type on the site. Darkened to
  `#7a6671` (4.9:1), still visibly lighter than `--muted-foreground` so the ink
  ladder is intact.
- **The footer's WhatsApp link was WhatsApp green on cream — 1.8:1.** Effectively
  invisible to anyone with low vision. The tile behind the glyph keeps the brand
  colour; the type is now a darkened green at 5:1.
- The logo in the header and footer carried `alt="פנינה פאף"` while her name sat
  in text right beside it, so a screen reader announced it twice on every page.
  The mark is decorative in that lockup and is now `alt=""`.
- The floating WhatsApp button sat outside every landmark, so anyone navigating
  by landmark skipped it entirely. Wrapped in a labelled `complementary`.

## [0.3.0] - 2026-07-25

Real phone validation, a real terms page, and a process section that fits on a
screen.

### Added
- **`NEXT_PUBLIC_MEDIA_BASE_URL`** — the public base URL of the R2 media bucket.
  One value now covers every video: each clip's filename lives beside its slot in
  `src/content/media.ts`, and `videoSrc()` resolves override → bucket → bundled
  file → poster panel. `NEXT_PUBLIC_ABOUT_VIDEO_URL` joins the two per-clip
  overrides for the /about video, which previously could only be served locally.
- Her photo now appears beside her name in the header and the footer.
- A reviews link in the header.

### Changed
- **The phone field is validated against the Israeli numbering plan.** It used to
  accept anything with 7 to 15 digits, so `123456789` sailed through and nobody
  found out until she dialled it. Mobile (`05X`), virtual/VoIP (`07[2-9]`) and
  landline (`0[23489]`) prefixes are checked, `+972`/`00972` forms are accepted,
  and everything else is rejected. Non-Israeli numbers are now rejected too — see
  the note in `src/lib/contact-schema.ts` for why, and for the one line to change
  if that ever needs widening.
- **Leads reach n8n with a normalised phone** (`054-754-7452`, `+972 54 754 7452`
  and `00972547547452` all arrive as `0547547452`), so the workflow can dial or
  build a `wa.me` link without parsing anything.
- **The process section is four cards in a row on desktop instead of four
  full-width rows.** The rows could not collide, but they made the section four
  screens tall, which defeats the point of "four steps, no surprises". Below
  `lg` they fall to two columns and then one.
- **Terms of use rewritten** as a standard Israeli site's terms: scope,
  what the service is and is not, enquiries, permitted use, IP, privacy,
  liability, third-party services, accessibility, changes, governing law and
  contact. The "this site is not an emergency service" section is gone, at
  Daniel's request.
- The header's fifth slot is the reviews; the FAQ keeps its anchor and its
  footer link.

### Fixed
- **The header nav overlapped the Instagram button at 768px.** The centred nav
  is absolutely positioned, so it slides under the logo and the buttons instead
  of pushing them. It now appears at `lg`; tablets get the mobile menu.
- **The lead form's labels were not attached to their inputs.** "שם" and "טלפון"
  sat beside their boxes with no `htmlFor`/`id` pair and no wrapping `<label>`,
  so they were decoration: a screen reader announced two unlabelled text fields,
  and tapping the word did not focus the box. The label wraps the control now,
  and the error line is a live `role="alert"`.
- **The lead dialog announced two identical "סגירה" buttons.** Its backdrop was
  a labelled button sharing a name with the real close button in the corner —
  and, being first in the DOM, it was what "the close button" resolved to for
  anything scripted. The backdrop is presentational now; Escape and the corner
  button cover every keyboard and screen-reader path. Six e2e tests that had
  been failing on this pass again.
- **Two sources of horizontal scroll on a phone.** The testimonials section's
  46rem halo was unclipped, giving a 390px viewport 173px of sideways scroll —
  which is why the page appeared shifted and cut off. The video frame's halo did
  the same on /about. Every page now measures `scrollWidth === clientWidth` at
  390px.
- `e2e/navigation.spec.ts` read `page.url()` immediately after a click, racing a
  client-side navigation. It uses `toHaveURL` now, which retries.

**The e2e suite is green for the first time: 34/34.** It had been 24/33, and
every one of those failures was the suite correctly reporting a real defect in
the form and the dialog rather than a harness problem.

## [0.2.0] - 2026-07-25

The site gets an address. Everything that referenced a placeholder domain now
points at **pnina.trickticmedia.com** — a subdomain of an existing Cloudflare
zone, chosen so launch does not wait on buying a `.co.il`.

### Added
- `public/CNAME` — the Pages custom domain, deployed with the export so the
  domain survives every redeploy.

### Changed
- `siteConfig.domain`/`url`, the Pages workflow's `NEXT_PUBLIC_SITE_URL`, the
  Worker's route/`zone_name`/`SITE_ORIGIN`, and both `.env` examples now carry
  the real host. Canonical tags, `sitemap.xml`, `robots.txt` and the OG/schema
  URLs come out of the build pointing at it.
- `public/llms.txt` — real name, description and contact address instead of
  placeholders, plus an explicit line that this is accompaniment and not
  regulated psychotherapy.
- `docs/07-deployment-target.md` — a step-by-step go-live runbook, and a warning
  about the DNS-only/proxied ordering (see below).

### Fixed
- The Worker's failure message told visitors to email `PLACEHOLDER@example.com`.
  If the n8n webhook were ever down, every lead would have been sent to a dead
  address. It now uses her real one.
- **A testimonial screenshot showed the sender's Instagram handle.**
  `review-3.jpg` had `@adiavrahami1` legible in the corner — a real, findable
  person, published permanently, next to a message about recovering from sexual
  assault. The handle is now blurred out; the unedited original is in the
  git-ignored `private-media/`.
- The publish leak gate's Israeli-phone-number check had never run. `tr -d '+- '`
  reads as a reversed character range, so `tr` errored, the result came back
  empty, and every number passed. Fixed, and confirmed to catch an injected one.
- `.env.example` had picked up the real dev n8n webhook URL. That file is
  committed *and* mirrored publicly; the URL is back to a placeholder.

### Added (publishing safety)
- The leak gate now stops and lists every testimonial screenshot before it can
  publish, and requires `PUBLISH_SHOTS_REVIEWED=1` to continue. Text greps
  cannot see a handle burned into a JPEG — only a person can.

### Deployment notes
- The Cloudflare record must be **DNS-only** until GitHub issues the TLS
  certificate, then **proxied** before launch: a Worker route only fires on
  proxied traffic, so `/api/contact` — the lead form — returns Pages' 404 while
  the record is grey.

## [0.1.0] - 2026-07-25

First scaffold. The site runs, looks finished, and is safe to show — but almost
all of its content is placeholder until the client sends her material
(`docs/01-client-intake.md`).

### Added
- Single-page lead funnel at `/` — hero + video frame, the accompaniment, the
  price funnel ending at a free first conversation, the four-step process,
  reassurance band, testimonials, about teaser, FAQ, and the lead form.
- `/lectures` — a separate page for organisations booking a talk, with its own
  CTA. Leads from it are tagged `source: "lectures"` so they can be answered
  differently.
- `/about`, `/contact`, `/thank-you`, `/privacy`, `/terms`.
- `/accessibility` — an accessibility statement, required of an Israeli business
  website (תקנות שוויון זכויות; ת"י 5568).
- A discreet link to the 1202 sexual-assault crisis line in the footer, since
  this site is a private practice with a callback delay, not a 24/7 service.
- `src/content/media.ts` — one registry of every image and video the client
  still owes. Missing media renders a designed placeholder instead of a broken
  image, so the site is presentable at every stage.
- Cloudflare R2 media CDN support for both videos
  (`NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_THANK_YOU_VIDEO_URL`).
- Public-mirror publish script with a leak gate that blocks private keys, real
  webhook secrets, unrecognised Israeli phone numbers, and unregistered
  testimonial screenshots.

### Changed (from the `yarin-landingpage` template it was scaffolded from)
- New warm, light design system (sand · rose · sage) replacing the template's
  dark black/gold one, tuned for a calm rather than premium register.
- Body type moved to **Assistant**, a Hebrew-native face. The template loaded
  Inter with the Latin subset only, so every Hebrew character — i.e. the entire
  page — silently fell back to the device default.
- The lead schema was cut down to name + phone + source. The template's
  qualification fields (business name, goals, tools, free text) were removed;
  this site deliberately never asks a visitor to type anything about herself.
- Removed the always-on pulsing price animation. It read as sales pressure and
  it forced itself through `prefers-reduced-motion` with `!important`.
- Removed the per-letter animated hero headline in favour of a still one.
- Testimonials ship flagged as samples with a visible notice.

### Fixed (bugs inherited from the template)
- `rgba(…)` values written with spaces inside Tailwind arbitrary values parsed
  as several class tokens and emitted no CSS, so a number of background glows
  never rendered at all.
- Duplicate React keys where list items were keyed by their (repeating) text.
- The template author's own portrait was shipping as this site's favicon and
  apple-touch icon.

### Known issues
- `pnpm test:e2e` cannot start its web server. The specs are written; the
  harness is blocked by a Next 16 + next-intl interaction. Does not affect the
  site itself. See `docs/11-testing.md`.
