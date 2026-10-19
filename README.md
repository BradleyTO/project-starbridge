# Project Starbridge

A browser-based, AI-assisted **starship command simulator**. You command the exploration ship **CSV Halcyon** (Concord Exploration Service) and complete dynamic training missions by giving natural-language orders. The long-term goal is integration with a physical starship bridge, so the UI is built to scale from tablets to dedicated bridge consoles.

> **Status: Milestone 2 (v0.2.0): deterministic simulation with an offline interpreter.** *Training Simulation 001: The Kestrel Incident* now runs on a real simulation engine. It keeps a persistent world state, models ship systems, runs independent NPC agents and has seeded randomness. Orders are typed (or spoken) in plain English and read by a rule-based **offline interpreter**. The UI badge reads **SIMULATION · OFFLINE INTERPRETER**. AI interpretation and narration are planned for Milestone 3 and are **not** included yet (see [Roadmap](#roadmap)).

All names, ships, factions and artwork are original. The interface is *inspired by* classic sci-fi console design but uses no copyrighted artwork, fonts or names.

## The scenario — The Kestrel Incident

The Halcyon arrives at the edge of the **Calloway Reach**, space disputed between the Concord and the **Tessarine Directorate**. A civilian freighter, the **Kestrel**, is adrift with a failing reactor and 23 crew. A Directorate heavy cruiser is closing fast. The Kestrel is hiding something.

Every run is generated from a **seed**, which is shown in the header. You can choose one with `?seed=42`. The seed decides:

- who is hidden in the Kestrel's shielded compartment: a defector, an escaped political prisoner, or the Prefect's own sibling
- the Prefect's temperament: hardliner, pragmatic or cautious
- how long the reactor lasts
- a complication: an ion storm, a coolant leak, trapped crew, or none
- when Directorate reinforcements arrive
- crew numbers and the cruiser's approach

The same seed with the same orders always replays identically.

You can do almost anything a captain would try. Each order is checked against the actual state of your ship:

- **Basics:** scan, hail, negotiate, bluff, trade or threaten; move the ship, set ranges and interpose; route power between systems; raise or lower shields.
- **Weapons:** arm, lock and fire beams or torpedoes, including at a weakness once you have found it.
- **Ship operations:** tow with the tractor beam, transport crew, the hidden passenger, cargo or rescue teams, repair systems, stabilise the Kestrel, and charge and engage the jump drive.
- **Unconventional orders:** use the tractor beam as a shield, vent plasma as cover, project a sensor ghost, extend your shields around the Kestrel, or eject her core.

The other characters act on their own every minute of simulated time:

- the cruiser's commander, Prefect Vane
- Captain Arden of the Kestrel, who lies about the compartment until he trusts you
- the passenger in stasis
- your own officers

Delays matter, and actions have consequences that show up later. A run can end in one of 14 ways:

- rescue and withdrawal
- partial rescue
- abandonment
- rescue corridor
- negotiated release
- handover of the passenger
- driven off
- standoff broken
- pyrrhic victory
- hollow victory
- Kestrel lost
- Halcyon lost
- overwhelmed by reinforcements
- stalemate

Type `help` or `options` in the command bar, or tap a suggestion chip.

### Example orders (all covered by automated tests)

- `Could you scan the Kestrel and hail the cruiser, please` (two orders in one sentence, one turn)
- `Take us to 10,000 km from the kestrel` · `bring us within four thousand kilometres of the kestrel`
- `Lower shields, then beam the crew aboard`
- `divert 50% power from tractor to sensors` then `scan the cruiser`
- `tell the prefect this is a humanitarian rescue` · `remind them the border accords forbid this`
- `tell the cruiser our battle group is right behind us` (a bluff, judged against the Prefect's temperament)
- `offer the prefect the passenger in exchange for safe passage`
- `vent plasma to cover us` then `beam the passenger aboard` (a covert extraction)
- `tractor beam the kestrel and use it as a shield`
- `fire torpedoes at their weak point`
- `approach` (the interpreter asks "which contact?" and offers buttons)

## Architecture

```
src/
  engine/              Generic, framework-free deterministic core (no scenario knowledge)
    types.ts           WorldState v2: ships + systems (health/power/status), positions, crew & NPCs
                       (goals, knowledge, resources, trust, memory), facts (hidden vs discovered),
                       faction tension, clock, pending events, standing orders, RNG state
    rng.ts             Seeded RNG (mulberry32); state lives in WorldState.rng
    schema.ts          zod schemas: ProposedAction (discriminated union) and Interpretation
    validate.ts        Validator → accepted / partial (adjusted) / rejected, with in-character reasons
    reduce.ts          Pure reducer applying validated actions (+ ScenarioHooks for scenario meaning)
    combat.ts          Hit chance, shields, damage, collateral system damage, casualties
    turn.ts            Command pipeline + advanceTurn (helm orders, jump charge, shields, NPCs)
    diff.ts            State-diff → narration reports (damage, detections, objectives)
    narrator.ts        Narrator interface + TemplateNarrator (role holders, relief officers,
                       the dead and those in stasis never speak)
    invariants.ts      Consistency checker used by tests (bounds, destroyed ships, dead speakers…)
    persistence.ts     Save format v2: full WorldState incl. seed + RNG, versioned & validated
    scenario.ts        ScenarioModule interface
  interpreter/
    types.ts           Interpreter interface + InterpreterContext (what the crew knows)
    parser.ts          OfflineInterpreter: normalisation, synonyms, clause splitting, targets,
                       pronouns, quantities, clarifying questions; output validated by zod
    numbers.ts         "ten thousand", "10,000", "10k" → numbers
  scenarios/kestrel/
    setup.ts           Seeded scenario generation (variants, crew, NPCs, facts)
    hooks.ts           Scan / communicate / improvise / query semantics
    agents.ts          Independent NPC agents + environment + scheduled events
    outcome.ts         Objectives derived from state; outcome detection
    templates.ts       In-character narration templates
  ui/                  React components (Viewscreen canvas, ShipStatus, Tactical, logs,
                       CommandInput with voice + clarification chips), view.ts projections
api/command.ts         Serverless stub (no AI calls, no secrets); reserved for M3
tests/                 Vitest: parser table, validator, reducer, NPCs, determinism, playthroughs, fuzz
scripts/smoke.mjs      Headless Playwright smoke test
```

**Core rule:** an interpreter (offline today, AI later) only *proposes* typed actions. Everything goes through one pipeline:

1. **Interpret.** Natural language becomes `ProposedAction[]`, or a clarifying question. The `Interpreter` interface is async, so an AI implementation can be added in M3 without changing the engine.
2. **Schema check.** Every action is parsed with zod; anything malformed is dropped.
3. **Validate.** Each action is checked against systems, power, range, shields and what the crew actually knows. The result is accepted, partially applied (adjusted), or rejected with a reason.
4. **Apply.** A pure reducer updates `WorldState`.
5. **Advance time.** This runs only if the order costs time; one sentence costs at most one minute. Standing helm orders continue, then the NPC agents act (cruiser, Kestrel captain, passenger, own officers), then scheduled events fire.
6. **Derive objectives and detect any outcome.**
7. **Narrate.** Reports and the state diff are rendered by a `Narrator`. M2 uses deterministic templates; M3 can plug in an AI narrator that receives the same reports.

All of this is pure `(state, input) => newState`, which makes it replayable, serialisable and unit-testable.

## Getting started

Requires Node.js ≥ 20.19.

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint         # oxlint
npm run typecheck    # tsc -b (app, node config, api) + tests
npm test             # vitest (parser table, engine, NPCs, determinism, playthroughs, fuzz)
npm run build        # production build to dist/
```

Headless smoke test (needs a Playwright browser: `npx playwright install chromium`):

```bash
npm run build && npx vite preview --port 4173 &
SHOTS_DIR=./smoke-shots npm run smoke
```

## Environment variables

None are needed for Milestone 2. Reserved for Milestone 3 (set them in the Vercel project settings, **never** in client code and **never** with a `VITE_` prefix, which would expose them to the browser):

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `openrouter` (default) or another configured provider |
| `OPENROUTER_API_KEY` | Server-side API key for OpenRouter |
| `AI_MODEL` | Model identifier to request |
| `AI_TIMEOUT_MS` | Request timeout before falling back to templates |

See `.env.example`. All `.env*` files except the example are git-ignored.

## Deployment

The app deploys to Vercel as a Vite static site plus serverless functions in `api/`. `GET /api/command` returns a health payload; `POST /api/command` validates the order and returns a deterministic fallback. In M2 the browser does all interpretation locally.

## Known issues & device testing

- **Voice (confirmed on a real device):** as of v0.1.1, Bradley Ockrant confirmed on his own phone that voice-to-text (speech recognition) and text-to-speech (spoken crew/comms responses) both work. Automated tests still use stubbed speech APIs, because headless browsers have no microphone or audio output.
- **v0.2.0 voice not re-verified on a device yet.** The speech code is unchanged except that the captain's own orders are no longer read back aloud. Automated checks use stubs.
- **The offline interpreter is rule-based.** It covers a wide vocabulary (88 phrasings in the test table, plus fuzzing), but unusual wording can be misread or not recognised. When that happens the XO says so, and nothing changes. It handles one clarifying question at a time.
- **Balance is first-pass.** Coolant-leak seeds leave little time for long negotiations. Combat takes several turns. Reinforcements end long stand-offs.
- **The Prefect will not fire on the ship he believes carries his quarry** unless you start a fight. If the Kestrel is lost with crew aboard, the run ends, unless the Halcyon has already opened fire; in that case the battle continues.
- **Old v0.1 saves cannot be loaded.** The save format changed to v2, and the app reports this instead of loading them.
- **Small UI issues:** radar labels can overlap when two contacts share a bearing, and on phones the toast briefly covers the bottom of the command area.
- Not yet tested in desktop Safari or Firefox, or on dedicated tablets/bridge consoles.

## Roadmap

- [x] **Milestone 1** — Complete interface and scripted demonstration, deployed preview.
- [x] **Milestone 2** — Ship systems model, persistent world state, NPC agents, seeded RNG, offline command interpretation and validation.
- [ ] **Milestone 3** — Server-side AI narration and character responses with schema validation, timeouts, usage limits and template fallback.
- [ ] **Milestone 4** — Branching outcomes, mission evaluation, full save/resume, voice controls.
- [ ] **Milestone 5** — Multi-playthrough testing, state-consistency fixes, stable release.

See [CHANGELOG.md](CHANGELOG.md) for development history.
