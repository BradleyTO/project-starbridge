# Project Starbridge

A browser-based, AI-assisted **starship command simulator**. You command the exploration ship **CSV Halcyon** (Concord Exploration Service) and complete dynamic training missions by giving natural-language orders. The long-term goal is integration with a physical starship bridge, so the UI is built to scale from tablets to dedicated bridge consoles.

> **Status: Milestone 1 — UI + scripted demonstration.** The first scenario, *Training Simulation 001: The Kestrel Incident*, plays a scripted opening and responds to a small, deterministic keyword vocabulary. It is clearly labelled **SCRIPTED DEMO** in the UI. Full natural-language interpretation, AI narration and branching simulation arrive in later milestones (see [Roadmap](#roadmap)).

All names, ships, factions and artwork are original. The interface is *inspired by* classic sci-fi console design but uses no copyrighted artwork, fonts or names.

## The scenario — The Kestrel Incident

The Halcyon arrives at the edge of the **Calloway Reach**, space disputed between the Concord and the **Tessarine Directorate**. A civilian freighter, the **Kestrel**, is adrift with a failing reactor and 23 crew. A Directorate heavy cruiser is closing fast. The Kestrel is hiding something.

In the M1 demo you can already: scan both ships, hail them, attempt diplomacy, manage alert level and shields, close range, transport the crew (validated against range and shield state), stabilise the reactor, tow the freighter, arm or fire weapons, withdraw, and reach one of several endings (rescue, abandonment, loss of the Kestrel, shots fired). The cruiser and the Kestrel's reactor act on their own clock each turn.

Type `help` in the command bar for the demo vocabulary, or click a suggestion chip.

## Architecture

```
src/
  engine/             Deterministic, framework-free simulation core
    types.ts          WorldState: the single authoritative game state
    state.ts          Pure state helpers (log, contacts, objectives, flags)
    persistence.ts    Versioned localStorage save/load with validation
  scenarios/
    kestrel/          Training Simulation 001
      initialState.ts Opening world state
      crew.ts         Original characters
      demoScript.ts   M1 scripted opening + keyword command handler + NPC turn
  ui/
    components/       Viewscreen (canvas), ShipStatus, Objectives, Tactical (SVG plot),
                      Narrative & Comms logs, CommandInput (typed + voice)
    gameReducer.ts    Bridges React to the pure engine
    speech.ts         Web Speech API wrappers (synthesis + recognition)
api/
  command.ts          Vercel serverless function (M1 stub, no AI calls, no secrets)
scripts/
  smoke.mjs           Headless Playwright smoke test
```

**Core rule:** the AI will never write game state directly. The planned command pipeline is:

1. Accept a natural-language order.
2. Interpret it (AI proposes structured intents; M1 uses keyword matching).
3. Validate against ship systems and known information (deterministic engine).
4. Apply validated changes to `WorldState` (pure functions).
5. Run independent NPC turns (other vessels, characters, timers).
6. Narrate (AI text, with deterministic templates as fallback).
7. Present updated information and await orders.

All engine and scenario functions are pure `(state, input) => newState`, which makes them unit-testable and replayable.

## Getting started

Requires Node.js ≥ 20.19.

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint         # oxlint
npm run typecheck    # tsc -b (app, node config, api)
npm test             # vitest unit tests (engine + demo script)
npm run build        # production build to dist/
```

Headless smoke test (needs a Playwright browser: `npx playwright install chromium`):

```bash
npm run build && npx vite preview --port 4173 &
SHOTS_DIR=./smoke-shots npm run smoke
```

## Environment variables

None are needed for Milestone 1. Reserved for Milestone 3 (set them in the Vercel project settings, **never** in client code and **never** with a `VITE_` prefix, which would expose them to the browser):

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `openrouter` (default) or another configured provider |
| `OPENROUTER_API_KEY` | Server-side API key for OpenRouter |
| `AI_MODEL` | Model identifier to request |
| `AI_TIMEOUT_MS` | Request timeout before falling back to templates |

See `.env.example`. All `.env*` files except the example are git-ignored.

## Deployment

The app deploys to Vercel as a Vite static site plus serverless functions in `api/`. `GET /api/command` returns a health payload; `POST /api/command` returns a deterministic fallback in M1.

## Known issues & device testing

- **Voice (confirmed on a real device):** as of v0.1.1, Bradley Ockrant confirmed on his own phone that voice-to-text (speech recognition) and text-to-speech (spoken crew/comms responses) both work. Automated tests still use stubbed speech APIs, because headless browsers have no microphone or audio output.
- Not yet tested in desktop Safari or Firefox, or on dedicated tablets/bridge consoles.

## Roadmap

- [x] **Milestone 1** — Complete interface and scripted demonstration, deployed preview.
- [ ] **Milestone 2** — Ship systems model, persistent world state, command interpretation and validation.
- [ ] **Milestone 3** — Server-side AI narration and character responses with schema validation, timeouts, usage limits and template fallback.
- [ ] **Milestone 4** — Branching outcomes, mission evaluation, full save/resume, voice controls.
- [ ] **Milestone 5** — Multi-playthrough testing, state-consistency fixes, stable release.

See [CHANGELOG.md](CHANGELOG.md) for development history.
