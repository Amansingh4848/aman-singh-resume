# Aman Singh — Personal Portfolio

An animated, responsive portfolio and résumé website for Aman Singh, Business Development Executive.

**Live website:** [aman-singh-resume.vercel.app](https://aman-singh-resume.vercel.app/)

## Features

- Midnight, silver, violet and icy-blue visual theme, plus a light theme.
- 4K-ready generative light ribbons and a projected 3D energy core, with animation across every main section.
- Native-resolution canvas artwork up to 3840 × 2160 pixels, scalable SVG detail and large-display typography.
- Ultra / Balanced visual detail switch; phones default to the lighter mode.
- Animated skill sculptures, project schematics, timeline signals, card lighting, chapter navigation and scroll reveals.
- Pause control and support for reduced-motion preferences.
- Professional experience, skills, selected projects and education.
- Phone and email contact links, profile photo, and LinkedIn, YouTube and Instagram links.
- Downloadable PDF and editable Word résumé, containing the live website and LinkedIn links.
- Responsive layouts for desktop, tablet and mobile.

## Run locally

This is a static HTML, CSS and JavaScript website. No package installation or build step is required.

From the repository directory, run:

```sh
python -m http.server 8000
```

Then open [localhost:8000](http://localhost:8000).

## Project files

- `index.html`: page content and profile links.
- `styles.css`, `motion.css`, `cinematic.css`, `ambient.css`, `uhd.css`: layout, themes and animation styles.
- `script.js`, `motion.js`, `motion-quality.js`: navigation, controls, pixel budgets and interactive motion.
- `assets/`: website imagery.
- `Aman-Singh-Resume.pdf` and `Aman-Singh-Resume.docx`: downloadable résumé files.
- `vercel.json`, `robots.txt`, `sitemap.xml`: hosting configuration and search metadata.

## Hosting

The live website is hosted on Vercel. This repository contains the website source and public downloads; local deployment settings, credentials and environment files are excluded.

Animation uses vectors and real-time canvas, not a 4K video download. Ultra targets 60 frames per second on desktop; Balanced and phones target 30. Actual performance depends on the device. The background is capped at 8,294,400 pixels and the core at 4,194,304 pixels. Offscreen scenes and hidden tabs stop animating. The pause button and the device's reduced-motion setting disable decorative motion.

The published website contains personal professional information. Review contact details and résumé files before repurposing or redistributing it.
