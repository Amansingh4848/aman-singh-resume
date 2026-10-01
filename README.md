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
- `trading/app.html`, `app.js`, `manifest.webmanifest`, `sw.js`: installable Trade Zuko web app. The service worker caches only the opening screen and public presentation assets, never API responses.
- `trading/offline.js`, `offline.css`, `source/offline-ui.cjs`: opt-in password-encrypted study downloads, offline unlock and download status. The encrypted snapshot is saved in IndexedDB separately from the service-worker cache.
- `trading/install.html`, `install.css`, `install.js`, `source/install.cjs`: dedicated Android/iPhone installation page, prominent pre-login install buttons, accessible platform guides and progressive native-install prompts. The source template is rebuilt by `build.cjs`.
- `api/trade-access.js`, `trading/source/auth.cjs`: server-side password verification and owner controls. Password hashes, a signing key and version counters live in a **private** Vercel Blob store, not in source control. Reads bypass storage caching, writes use ETag-based concurrency protection.

## Install Trade Zuko on a phone

Open `/trading/install` on the deployed website. On Android, use Chrome and select **Install on Android**; when the browser does not offer a prompt, follow the Chrome menu instructions. On iPhone or iPad, use Safari → Share → **Add to Home Screen**, turn on **Open as Web App** if shown, then **Add**. Both buttons are also visible before login at `/trading/app`, and the trading hub links to both platform guides.

This is a browser-installed web app, not an APK/IPA or a published store app. Installation is free and does not enroll a learner in a paid class. The homepage prominently links to **Get the Trading App**, and the install page explains both installation and downloading lessons. Local progress/journals do not automatically sync across browser and installed-app storage or devices. Export important notes before removing the app.

After an online login, choose **Download all lessons for offline use**, confirm the current app password, approve saving to the device and wait for **Download complete**. The pack contains all 23 learning sections: 16 lessons plus the library, pattern atlas, candle/option-chain lab, payoff lab, practice tools, course outlines and connected-profile text. All 32 pattern diagrams and 11 payoff structures are included. To reopen without internet, choose **Open downloaded lessons offline** and enter the password used for the download. Videos, live social feeds, WhatsApp and owner controls still need internet. Browser storage can be evicted, so check the saved status before travelling. Each browser, installed app and deployment origin may have separate storage.

Downloads require a valid server session and CSRF protection. Password sessions also re-enter the current app password. Google sessions instead choose a new device-only password, entered twice; that device password is never sent to the server. Before reporting success, the client verifies the cached app files, encrypts the full snapshot with AES-256-GCM using a password-derived PBKDF2-SHA-256 key (600,000 iterations), fresh salt and IV, then commits it to IndexedDB. Passwords and encryption keys are not saved. Offline unlock grants learning access only, even for an owner-created download. Removing a downloaded pack leaves journal notes and read markers intact.

The owner explicitly approved password-protected offline study on 1 October 2026, including the fact that offline copies cannot be instantly revoked. A purpose-bound signed permit is checked when the device reconnects; a password-version change invalidates that role’s saved download. The permit cannot authenticate an online session, download fresh content or operate owner controls. A device that remains offline can keep its existing downloaded snapshot; the app cannot prevent copying, screenshots, backups or intentional avoidance of a revalidation check. No offline expiry or remote-erasure guarantee is claimed.

Browser installation support and menu wording vary. The native install prompt is used only after a user click and only when offered by the browser. Otherwise, manual instructions remain available. An explicit update button activates a waiting service-worker update, avoiding unexpected reloads while editing notes. The installation page can copy its hosted link; local-only addresses are not offered for phone sharing. Preview deployments show a notice because Vercel sign-in may still be required on the phone. A public learner launch needs an approved commercial host and a public production deployment.

Run `npm test` for study/auth checks, install-state checks, encryption round trips, tampering/wrong-password rejection, permit separation and offline-shell verification. Actual installation on physical Android and iOS devices must still be verified before a learner rollout.

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

The existing live website is hosted on Vercel. Netlify migration support is prepared, but is not evidence of a completed public migration. This repository contains source and public assets; local deployment settings, credentials and environment files are excluded.

### Google sign-in and Netlify launch

Google login is disabled unless the server has a valid `GOOGLE_CLIENT_ID`. The official Google Identity Services button is loaded only when configured. The server verifies Google's token signature, issuer, audience, expiration, verified-email claim and a signed browser-bound nonce. Successful challenges cannot be reused. Google always grants learner access, never owner access; it is not paid-course enrollment. Only a one-way subject identifier is carried in the signed session, not a stored email/profile or Google access/refresh token. Changing the shared learner password invalidates current learner sessions and saved-pack permits, but Google users can sign in again without that password.

Use `npm run build:netlify` to build the `dist` publication allowlist. `netlify.toml` configures the public routes and Node functions. `netlify/lib/adapter.cjs` preserves private access state with strong reads and atomic conditional writes in the `trade-zuko-access` Netlify Blobs store. Do not deploy the project root as a static directory: it contains server source and local environment files. `dist` excludes all of those. Set the canonical origin using the host's `URL` or an explicit HTTPS `SITE_ORIGIN`; the build rewrites the old Vercel canonical origin in public text assets.

Before launch: authorize the Netlify account, create/link a Free-plan project, securely migrate the existing `trade-zuko/access-v1.json` access state to its private store without changing password hashes, and set `GOOGLE_CLIENT_ID` in server environment variables. Register the actual public HTTPS origin in the Google Web application client. Configure Google's external audience for production, its homepage and `/trading/privacy` notice as applicable. Keep Google permissions limited to sign-in (openid, email, profile). No client secret is required by this ID-token flow; never add one to browser code.

Publish the Netlify project explicitly as public; new projects may start private. Verify anonymous access to all four worlds and `/trading/install`, real Google sign-in, owner separation, password login, and a downloaded pack after reconnect/offline transitions. A changed origin requires a fresh app installation/download; browser storage does not transfer from the Vercel address. Keep the old website intact until the new launch is verified. Netlify Free has hard usage limits and can pause when they are reached; no paid plan or auto-recharge is authorized.

Tests use generated fixture tokens and local fixture credentials only. A passing test is not a claim that the user's live Google client or new hosting account is configured.

Animation uses vectors and real-time canvas, not a 4K video download. Ultra targets 60 frames per second on desktop; Balanced and phones target 30. Actual performance depends on the device. The background is capped at 8,294,400 pixels and the core at 4,194,304 pixels. Offscreen scenes and hidden tabs stop animating. The pause button and the device's reduced-motion setting disable decorative motion.

Selected Instagram photos are optimized local WebP copies at the available source resolution, not 4K photography or an automatically synchronized custom photo grid. The Instagram page offers the official profile embed on request. Its availability depends on Meta's public-profile / embedding settings and browser restrictions; a link and styled fallback remain if it cannot render. Reliable custom Instagram auto-sync requires the owner's authorized Meta integration; no Instagram credentials are configured in this project.

YouTube titles and thumbnails refresh from the two allowlisted public Atom feeds, cached for five minutes on the server and refreshed approximately every five minutes while the relevant section is visible. Platform caching can delay changes. Homepage YouTube cards also refresh. The full library is available through the official uploads playlist and channel links. Players and Instagram scripts only load on a visitor's click; there is no autoplay.

## Search visibility

The site uses the visible identity “Aman Singh Suneo,” truthful India information, connected social-profile links, unique page titles and descriptions, canonical URLs and structured data. `robots.txt` advertises `https://aman-singh-resume.vercel.app/sitemap.xml`. Search engines decide whether and where to index the site; no first-place or instant-ranking claim is made.

Owner action: verify the URL-prefix property `https://aman-singh-resume.vercel.app/` in Google Search Console, provide its HTML verification token/file for deployment if needed, then submit `sitemap.xml` and request indexing of the homepage. Do not paste passwords or account tokens into source control. Add this website to your own social-profile bios when ready. No Search Console verification or indexing request has been submitted by this implementation.

Course disclaimer wording is a disclosure, not a substitute for applicable financial-services or consumer-protection obligations. Obtain appropriate professional advice before offering regulated services.

The published website contains personal professional information. Review contact details and résumé files before repurposing or redistributing it.
