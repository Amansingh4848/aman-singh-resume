# Aman Singh Suneo — Portfolio & Creator Worlds

An animated, responsive portfolio for Aman Singh Suneo, with dedicated Trading World, YouTube and Instagram pages.

**Live website:** [aman-singh-resume.vercel.app](https://aman-singh-resume.vercel.app/)

## Features

- One midnight-blue, violet and icy-blue visual theme across all four pages, plus a shared light-theme preference.
- Custom World Atlas selector: an animated orbital map, four numbered destinations, keyboard-accessible links and native dialog focus handling. A persistent route strip provides direct links on every page.
- 4K-ready generative light ribbons and a projected 3D energy core, with animation across every main section.
- Native-resolution canvas artwork up to 3840 × 2160 pixels, scalable SVG detail and large-display typography.
- Ultra / Balanced visual detail switch; phones default to the lighter mode.
- Animated skill sculptures, project schematics, timeline signals, card lighting, chapter navigation and scroll reveals.
- Pause control and support for reduced-motion preferences.
- Professional experience, skills, selected projects and education.
- Phone and email contact links, personal photos, LinkedIn, Instagram, and both YouTube channels.
- Image-led social gallery with Instagram / YouTube filters, linked original posts, animated photo frames and interactive video cards.
- No résumé download buttons or download section. Previously created résumé files are retained unchanged.
- Responsive layouts for desktop, tablet and mobile.
- Four top-level pages: `/`, `/trading`, `/youtube`, and `/instagram`, linked from every page.
- GitHub profile beside LinkedIn on the front page only: https://github.com/Amansingh4848. No separate GitHub destination or GitHub links on creator pages.
- Interactive trading learning lab: up/down candlestick anatomy, range/breakout, double-top and ascending-triangle diagrams, and an illustrative Nifty option chain with selectable strikes and field explanations.
- Option-chain examples are synthetic and fixed, not real exchange prices or model-generated valuations. Pure calculations demonstrate intrinsic value and moneyness without trading recommendations. Greeks, execution risk and failure scenarios are explained alongside the graphics.
- Trade Zuko includes 16 authored study chapters, 32 original pattern illustrations, an 11-structure options payoff lab, risk/expectancy exercises and a browser-local journal. The public library is open; the installable app requires a learner or owner password.
- Basic: 24 modules, ₹10,000, 4–5 weeks. Intermediate: 18 deeper modules, ₹20,000, 6–7 weeks. Advanced: 20 deeper modules, ₹30,000, 8–10 weeks. Earlier-level learning is included. The owner confirmed these offers and incremental ₹10,000 upgrades (₹30,000 total through Advanced). No returns, certification or unspecified bonus entitlements are promised.
- Live YouTube RSS feeds for the latest 15 uploads on each channel, plus on-demand uploads-playlist players and full-channel links.
- Trading education enquiry cards at ₹10,000, ₹20,000 and ₹30,000. WhatsApp links open a pre-filled draft to +91 90981 03580; no message or payment is sent automatically.
- Clearly visible educational-risk, non-refundable-fee and consumer-rights notices. Confirm syllabus, duration, schedule, taxes and terms with the student before accepting payment.
- Crawlable public pages, canonical URLs, Person / ProfilePage / WebSite metadata, learning-resource metadata, breadcrumbs and social previews. The sitemap includes the nested public study pages; app login is noindex.

## Run locally

The pages are static HTML, CSS and JavaScript. `api/youtube.js` is a dependency-free Vercel Node.js function. No client framework or build step is required. Deploy to Vercel (or use `vercel dev`) for clean URLs and the live API.

From the repository directory, run:

```sh
python -m http.server 8000
```

Then open [localhost:8000](http://localhost:8000). With a basic static server, open the `.html` pages directly; API feeds and extensionless routing require Vercel. Selected linked videos remain as a fallback.

## Project files

- `trading/source/lessons.cjs`, `patterns.cjs`, `courses.json`: original lesson content, pattern catalogue and owner-confirmed offers.
- `trading/source/build.cjs`: deterministic static-page builder. Run `node trading/source/build.cjs` after content changes. It also produces the app's public educational payload and sitemap.
- `trading/learning.css`, `learning.js`, `math.js`: shared study UI, local progress/journal and pure, testable calculator logic.
- `trading/app.html`, `app.js`, `manifest.webmanifest`, `sw.js`: installable Trade Zuko web app. Protected content is never cached; internet is required.
- `api/trade-access.js`, `trading/source/auth.cjs`: server-side password verification and owner controls. Password hashes, a signing key and version counters live in a **private** Vercel Blob store, not in source control. Reads bypass storage caching, writes use ETag-based concurrency protection.

## Trade Zuko access management

The app has two separate shared passwords: learner and owner. Only owner login can change them. Owner changes require the current owner password and a session-bound CSRF token. Credentials use independently salted scrypt (N=131072, r=8, p=1). Sessions use signed Secure, HttpOnly, SameSite=Strict cookies; learner sessions last at most 12 hours and owner sessions at most 1 hour. Password changes invalidate the corresponding version on the next protected request. Active apps recheck approximately once a minute and when returning to the foreground. This cannot revoke copies or screenshots already taken.

At `/trading/app`, select **Owner — Aman only**, log in, and use **Change the learner password** or **Change your owner password**. Use distinct passwords of 15–128 characters. Keep owner access and the recovery key private; share only the learner password. Recovery is available under **Owner: recover access**. The private handoff guide is outside this repository; it is never deployed or committed. Changing passwords does not update that guide automatically.

This is not individual student-account management, a payment gateway or enrollment verification. Public website lessons remain public. Durable attempt limits allow eight credential attempts per IP per 15 minutes and 80 total per 15 minutes; limits can temporarily affect shared networks. Security counters keep a keyed hash of the request IP, not the raw IP, and expired entries are removed on subsequent authentication attempts. Hosting-provider access logs have their own retention. Browser read markers and study notes are local and are not sent to the owner.

Development needs `npm ci`, a project-linked **private** Blob store and the Vercel-managed server environment variables. Never prefix storage credentials with a client-exposed prefix or place them in JavaScript/HTML. The endpoint fails closed when storage is unavailable. No database credentials, initial passwords or recovery keys belong in GitHub.

## Commercial hosting requirement

Vercel's Hobby plan is restricted to non-commercial personal use. Confirm an appropriate commercial hosting plan before operating paid course offers. No paid plan or trial was purchased by this implementation. Storage and function availability also depend on the host's usage limits; monitor them before admitting learners. See [Vercel Hobby terms](https://vercel.com/docs/plans/hobby).

## Existing portfolio files

- `index.html`: page content and profile links.
- `trading.html`, `youtube.html`, `instagram.html`: dedicated creator pages.
- `worlds.css`, `worlds.js`, `channels.css`: lightweight shared page design and motion.
- `identity.css`, `identity.js`: unified theme, shared controls and custom World Atlas navigation.
- `trading-lab.css`, `trading-lab.js`: original financial SVG illustrations, lesson interactions and independently testable teaching calculations.
- `feeds.js`, `api/youtube.js`: cached live YouTube cards and click-to-load platform embeds.
- `styles.css`, `motion.css`, `cinematic.css`, `ambient.css`, `uhd.css`, `social.css`: layout, themes and animation styles.
- `script.js`, `motion.js`, `motion-quality.js`: navigation, controls, pixel budgets and interactive motion.
- `assets/`: website imagery.
- `Aman-Singh-Resume.pdf` and `Aman-Singh-Resume.docx`: retained résumé files, no longer linked from the website interface.
- `vercel.json`, `robots.txt`, `sitemap.xml`: hosting configuration and search metadata.

## Hosting

The live website is hosted on Vercel. This repository contains the website source and public downloads; local deployment settings, credentials and environment files are excluded.

Animation uses vectors and real-time canvas, not a 4K video download. Ultra targets 60 frames per second on desktop; Balanced and phones target 30. Actual performance depends on the device. The background is capped at 8,294,400 pixels and the core at 4,194,304 pixels. Offscreen scenes and hidden tabs stop animating. The pause button and the device's reduced-motion setting disable decorative motion.

Selected Instagram photos are optimized local WebP copies at the available source resolution, not 4K photography or an automatically synchronized custom photo grid. The Instagram page offers the official profile embed on request. Its availability depends on Meta's public-profile / embedding settings and browser restrictions; a link and styled fallback remain if it cannot render. Reliable custom Instagram auto-sync requires the owner's authorized Meta integration; no Instagram credentials are configured in this project.

YouTube titles and thumbnails refresh from the two allowlisted public Atom feeds, cached for five minutes on the server and refreshed approximately every five minutes while the relevant section is visible. Platform caching can delay changes. Homepage YouTube cards also refresh. The full library is available through the official uploads playlist and channel links. Players and Instagram scripts only load on a visitor's click; there is no autoplay.

## Search visibility

The site uses the visible identity “Aman Singh Suneo,” truthful India information, connected social-profile links, unique page titles and descriptions, canonical URLs and structured data. `robots.txt` advertises `https://aman-singh-resume.vercel.app/sitemap.xml`. Search engines decide whether and where to index the site; no first-place or instant-ranking claim is made.

Owner action: verify the URL-prefix property `https://aman-singh-resume.vercel.app/` in Google Search Console, provide its HTML verification token/file for deployment if needed, then submit `sitemap.xml` and request indexing of the homepage. Do not paste passwords or account tokens into source control. Add this website to your own social-profile bios when ready. No Search Console verification or indexing request has been submitted by this implementation.

Course disclaimer wording is a disclosure, not a substitute for applicable financial-services or consumer-protection obligations. Obtain appropriate professional advice before offering regulated services.

The published website contains personal professional information. Review contact details and résumé files before repurposing or redistributing it.
