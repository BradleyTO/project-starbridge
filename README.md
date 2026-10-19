# Project Starbridge

A browser-based, AI-assisted **starship command simulator**. You command the exploration ship **CSV Halcyon** (Concord Exploration Service) and complete dynamic training missions by giving natural-language orders. The long-term goal is integration with a physical starship bridge, so the UI is built to scale from tablets to dedicated bridge consoles.

> **Status: v0.4.0 (Milestone 3: Simulation Mode, Living Universe foundation and Mission Archive).** The page opens in **Simulation**, where training runs can be replayed without limit and never change anything. The **Living Universe** (Hub → Living Universe) is a persistent **canonical** timeline. Missions there are permanent history: they are archived, carry consequences forward (hull, crew deaths and injuries, trust, faction standings, world events) and can be replayed as simulations without altering the original. Orders are read by a rule-based **offline interpreter**. No AI is used yet (see [Roadmap](#roadmap)).

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

**Standing orders, restrictions and safety (v0.4):**

- `Bring us in, activate shields, do not power up weapons, and hail the ship.`: approach the Kestrel, raise shields and hail her, while a **hold** keeps weapons powered down. Even a later red alert will not arm them.
- `No matter what, keep us between the Kestrel and the cruiser. If the Kestrel arms its weapons, raise our shields, but not until then.`: a persistent interpose, a held-down shields restriction and a **standing order** that raises shields only when the Kestrel arms.
- `Don't fire unless fired upon` · `Approach the Kestrel, then beam the crew aboard` (the transport waits for the helm to arrive) · `Under no circumstances arm the weapons`
- Ambiguous or contradictory orders ask instead of acting. A bare `Fire` with no lock and both ships in view asks which contact. `Lower shields and raise them again` asks which you mean.

**Spatial and compound orders (v0.3):**

- `Get us inbetween the two ships. Keep the weapons down and shields down. We don't want to appear hostile. And hail them on screen.`: one turn produces five tracked orders. Helm interposes between the Kestrel and the cruiser, tactical keeps weapons safe and shields down, the posture becomes non-hostile, and comms hails both ships on screen. Helm then reports underway and in position, and the Prefect notices.
- `Escort the Kestrel` · `Circle the freighter` · `Slip in behind the cruiser` · `Put us in the cruiser's path`
- `Shadow the warship at fifty thousand kilometres` · `Stay out of their weapons range` · `Close to transporter range of the Kestrel`
- `Plot an intercept course for the Tessarine ship` · `Swing around so our bow faces the freighter` · `Run for Concord space`
- `Back us away from that warship slowly` · `Evasive pattern delta, then return fire`
- `Lock torpedos on the crusier` (misspellings are corrected against the game's vocabulary)
- `Get between them` (resolved to the Kestrel and the cruiser) · `interpose in front of the cruiser`: helm asks "between the cruiser and the Kestrel, or between the cruiser and the border?" and offers buttons

## Architecture

### Timelines (v0.4)

```
src/universe/
  types.ts         CanonicalState (profile, ship, crew, factions, clock, offers, events, news, reviews),
                   SimulationRun, Familiarity, CreditLedger, MissionOffer, ModelParams
  repository.ts    Separate localStorage stores: starbridge.canon.v1 · sim.v1 · familiarity.v1 ·
                   credits.v1 · entitlements.v1 (the engine save slot is starbridge.save.v4)
  canon.ts gate.ts CanonStore.commit is the ONLY write path to canon; it requires a branded
                   CanonicalContext that only a CanonicalSession holds. Reads are deep-frozen.
  sessions.ts      SimulationSession (cannot commit) vs CanonicalSession
  controller.ts    Mode selection, start/finish/replay, simulated event replays
  archive.ts       Canonical missions + original outcome; replays listed separately
  familiarity.ts   Taught terminology, aliases, drills (shared across modes, never canon)
  credits.ts       Daily canonical-start allowance (charged once per mission, after commit)
  catalogue.ts     Offers: mandatory directive · distress call · voluntary assignment
  models.ts        Seeded event models (ore hauler, escort, Kestrel unattended)
  world.ts         Offer responses, discipline reviews, time advance, consequences, bulletins,
                   bridge preparation from canon and carry-over after a mission
```

Simulation is the default and is never written to canon. A canonical mission writes its outcome once, through the commit gate, and the archive keeps it unchanged however many times it is replayed.

**Credits:** 10 new canonical starts per local day. Only starting a *new* canonical mission costs one. Viewing, declining or ignoring offers, saving, resuming, finishing and every simulation are free. At zero, canonical starts are disabled and canonical time pauses, so nothing happens in your absence, but simulations, the archive and your record stay available. **The ledger lives in the browser's localStorage, so it is not tamper-proof.** Real enforcement needs a server-side account, which is future work. There are no payments; the entitlement switches in Settings (dev) are for development only.

### Engine

```
src/
  engine/              Generic, framework-free deterministic core (no scenario knowledge)
    types.ts           WorldState v3: ships + systems (health/power/status), 2D kinematics
                       (position, velocity, heading, performance limits, nav goal), crew & NPCs
                       (goals, knowledge, resources, trust, memory), facts (hidden vs discovered),
                       faction tension, clock, pending events, tracked orders, posture, RNG state
    kinematics.ts      Vector maths, reference resolution (ships/border), interpose geometry,
                       guidance for 14 intents (approach, standoff, retreat, interpose, intercept,
                       escort, follow, block, orbit, holdStation, face, flee, evasive, allStop),
                       steering + limited acceleration / turn rate, ETA estimates
    motion.ts          Sub-tick physics (12 × 5 s per turn): order lifecycle (underway, completed,
                       maintaining, failed), predicted course line, betweenness flag
    orders.ts          TrackedOrder list (ack → underway → completed/maintaining/failed/superseded)
    standing.ts        v0.4 standing orders (trigger → actions), restrictions (holds lifted only by
                       an explicit order or an `until` trigger), plan-conflict check, persistence
    helmTemplates.ts   In-character helm / posture / comms lifecycle reports
    rng.ts             Seeded RNG (mulberry32); state lives in WorldState.rng
    schema.ts          zod schemas: ProposedAction (discriminated union) and Interpretation
    validate.ts        Validator → accepted / partial (adjusted) / rejected, with in-character reasons
    reduce.ts          Pure reducer applying validated actions (+ ScenarioHooks for scenario meaning)
    combat.ts          Hit chance, shields, damage, collateral system damage, casualties
    turn.ts            Command pipeline + advanceTurn (helm orders, jump charge, shields, NPCs)
    diff.ts            State-diff → narration reports (damage, detections, objectives)
    narrator.ts        Narrator interface + TemplateNarrator (role holders, relief officers,
                       the dead and those in stasis never speak)
    invariants.ts      Consistency checker used by tests (bounds, speed/turn limits, no teleporting,
                       one active helm order, destroyed ships, dead speakers…)
    persistence.ts     Save format v3: full WorldState incl. seed + RNG, versioned & validated
    scenario.ts        ScenarioModule interface
  interpreter/
    types.ts           Interpreter interface + InterpreterContext (what the crew knows)
    spell.ts           Spelling correction against the game vocabulary + run-together splitting
    parser.ts          OfflineInterpreter: spelling → normalisation → addressee/department tags →
                       sentence & clause splitting → per-clause intents (incl. spatial maneuvers,
                       posture, rationale clauses) → reference resolution (pronouns, "the two
                       ships", "them") → clarifying questions; leftovers returned as `unparsed`
                       (the hook for a future AI interpreter); output validated by zod
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
tests/universe/        Timeline isolation, archive, credits, world events / consequences
tests/v04/             The M3 critical interpreter regressions (before and after triggers)
tests/eval/            Held-out order sets (v0.3, v0.4, v0.4b) + report-only evaluators
scripts/smoke.mjs      Headless Playwright smoke test: v0.2–v0.4 incl. canonical → archive → sim replay,
                       credits, ignored-distress consequence, zero credits, phone layout
```

**Core rule:** an interpreter (offline today, AI later) only *proposes* typed actions. Everything goes through one pipeline:

1. **Interpret.** Natural language becomes `ProposedAction[]`, or a clarifying question. The `Interpreter` interface is async, so an AI implementation can be added in M3 without changing the engine.
2. **Schema check.** Every action is parsed with zod; anything malformed is dropped.
3. **Validate.** Each action is checked against systems, power, range, shields and what the crew actually knows. The result is accepted, partially applied (adjusted), or rejected with a reason.
4. **Apply.** A pure reducer updates `WorldState`.
5. **Advance time.** This runs only if the order costs time; one sentence costs at most one minute. Ships move in twelve 5-second sub-steps under their acceleration, speed and turn-rate limits, steered by their current maneuver goal. Tracked orders report underway, completed, maintaining or failed. Then the NPC agents act (cruiser, Kestrel captain, passenger, own officers) and scheduled events fire. The Prefect perceives your posture each turn: shields, weapons, locks, closing speed, what you have told him, and whether you are interposing.

Maneuvers are typed `maneuver` actions (`{intent, target, second?, rangeKm?, speed}`). Posture is a separate `posture` action (`nonHostile`, `neutral` or `assertive`). The interpreter only proposes them, and the validator checks engines, references, range limits and conflicts (for example, intercepting the cruiser while claiming a non-hostile posture). A non-hostile posture caps closing speed on the cruiser and turns a plain hail into a reassuring one. Each order becomes a `TrackedOrder`, shown in the orders strip above the command bar. The active helm goal is drawn as a course line on the tactical plot.
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

None are needed for v0.4 (the interpreter and simulation run offline in the browser). Reserved for Milestone 3 (set them in the Vercel project settings, **never** in client code and **never** with a `VITE_` prefix, which would expose them to the browser):

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
- **The offline interpreter is rule-based.** It covers a wide vocabulary (the parser test table, 20+ paraphrases of the v0.3 order, spatial-intent tests and fuzzing), but unusual wording can be misread or not recognised. On a held-out set of 42 orders written before tuning, the v0.3 held-out set now passes **40/42** (it was 33/42 at v0.3, when it was first run). On the fresh v0.4b set the first result was **12/20, 3 unsafe**; after the safety fixes it is **15/20, 0 unsafe**. Those fixes were made after seeing the set, so this is no longer a clean held-out measure. See `tests/eval/RESULTS*.md`. Parts of an order it cannot read are reported and left as `unparsed`, and the rest still executes. It handles one clarifying question at a time.
- **Living Universe is local and single-player.** Canon, credits and the archive live in this browser's localStorage. Clearing site data resets them, and the credits are not tamper-proof.
- **Event missions resolve instantly** from seeded models. They are not played on the bridge.
- **The Kestrel's arming is a simple point-defence rule** (locks or the cruiser coming too close).
- **Kinematics are simplified 2D.** There are no collisions or gravity, a single border line, and one helm goal at a time.
- **Balance is first-pass.** Coolant-leak seeds leave little time for long negotiations. Combat takes several turns. Reinforcements end long stand-offs.
- **The Prefect will not fire on the ship he believes carries his quarry** unless you start a fight. If the Kestrel is lost with crew aboard, the run ends, unless the Halcyon has already opened fire; in that case the battle continues.
- **Old v0.1 and v0.2 saves cannot be loaded.** The save format changed to v3 (ship kinematics and tracked orders), and the app reports this instead of loading them.
- **Small UI issues:** tactical labels can still crowd when several ships sit close together at "Fit all" zoom (use "Local"), and on phones the toast briefly covers the bottom of the command area.
- Not yet tested in desktop Safari or Firefox, or on dedicated tablets/bridge consoles.

## Roadmap

- [x] **Milestone 1** — Complete interface and scripted demonstration, deployed preview.
- [x] **Milestone 2** — Ship systems model, persistent world state, NPC agents, seeded RNG, offline command interpretation and validation.
- [x] **Milestone 3 (v0.4)** — Simulation Mode, Living Universe foundation, Mission Archive, daily credits, world events and consequences, crew memory, standing orders and restrictions.
- [ ] **Next** — Server-side AI narration and character responses with schema validation, timeouts, usage limits and template fallback; server-side accounts and credits.
- [ ] **Milestone 4** — Branching outcomes, mission evaluation, full save/resume, voice controls.
- [ ] **Milestone 5** — Multi-playthrough testing, state-consistency fixes, stable release.

See [CHANGELOG.md](CHANGELOG.md) for development history.
