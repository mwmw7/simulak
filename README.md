# ◈ SIMULACRA ENTERTAINMENT

> Perfection beyond the human — synthetic actors, virtual advertising models, and AI music.
> An AI entertainment landing page that transcends reality.

A single-page website built with **AngularJS 1.8 (frontend) and Express (server)**.
All visual assets—including synthetic actors ARIA, KAI, and NOVA, virtual singers ECHO and LUMEN, and the hero image—were generated with **Higgsfield GPT Image 2**.

## Getting Started

```bash
npm install
npm start            # Default: http://localhost:3000
PORT=4173 npm start  # Use a custom port
```

## Project Structure

```
server.js                 Express server: static files, /api/content, and /api/health
data/content.js           Site content served through the API
public/
  index.html              AngularJS application markup
  css/styles.css          Premium dark theme in violet, amber, and blue
  js/app.js               Controller, reveal/smooth-scroll directives, and Web Audio sound engine
  assets/generated/       Higgsfield-generated images, optimized as WebP
assets-src/               Original high-resolution PNG files, retained as source assets and not served
```

## Features

- **Content API:** Express serves data through `/api/content`, consumed by AngularJS `$http`.
- **Synthetic actor portfolios:** Reveal information and tags on hover.
- **A.I. Anthems player:** Pressing play uses the **Web Audio API** to synthesize and play a distinct ambient soundscape for each track. No audio files are required, and the waveform responds to playback state.
- Motion details including **scroll reveals, Ken Burns effects, glowing orbs, and film grain**.
- Fully responsive layouts for desktop and mobile.

### QA

Append `?reveal=all` to the URL to reveal every section immediately without scroll animations, making screenshots and visual inspection easier.

## Regenerating Assets

```bash
bash .gen/run.sh   # Regenerate six images with the Higgsfield CLI; authentication required
```
