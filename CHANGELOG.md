# Changelog

All notable changes to Project Starbridge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-10-18 — Milestone 2: deterministic simulation

### Added
- **Simulation engine** (`src/engine`). This is a generic, pure and deterministic core around an authoritative `WorldState` v2, which holds:
  - ships with ten systems each (health, power and derived status), positions and ranges, hull, shields, weapons, tractor, jump charge and souls aboard
  - crew and NPCs with goals, motivation, knowledge, resources, trust and memory
  - facts that start hidden and are discovered during play
  - faction tension
  - the mission clock and turn counter
  - pending events and standing helm orders
- **Seeded RNG** (mulberry32) whose state is stored in the world. The same seed and the same orders replay identically; different seeds change the passenger, the Prefect's temperament, the reactor timeline, the complication, reinforcement timing and the crew count. Choose a seed with `?seed=N`; it is shown in the header.
- **Action pipeline:**
  - zod `ProposedAction` schema → validator (accepted, partial or rejected, with in-character reasons) → pure reducer → turn advance → NPC agents → scheduled events → objectives → outcome → narration.
  - A sentence with several orders costs one turn.
  - Free actions (shields, alert, power, locks) cost no time.
- **NPC agents.** They act independently every turn:
  - **Prefect Vane:** approaches, hails, loses patience, locks on, fires or holds fire, retreats, keeps or breaks agreements, and reacts to bluffs.
  - **Captain Arden:** lies about the compartment until he trusts you, then hands over the shield codes.
  - **The hidden passenger:** wakes as the stasis pod fails, and gives intelligence that serves as leverage.
  - **Your own officers:** give one-time advisories; relief officers take over when the primary officer is injured or killed.
- **Delayed consequences and events:** reactor decay that speeds up with a coolant leak, breach and shockwave, cruiser fire, bluff checks, the reinforcement warning and their arrival.
- **Unconventional orders** go through a generic `improvise` path and are judged on plausibility:
  - tractor beam as a shield
  - venting plasma as cover (allows a covert passenger extraction)
  - projecting a sensor ghost (strengthens bluffs)
  - extending shields around the Kestrel
  - ejecting the Kestrel's core
  - interposing the Halcyon
  - bluffs and trades (passenger, cargo, medical supplies or data)
- **14 possible outcomes.** Objectives are derived from state every turn, and none stays active after the ending.
- **Offline interpreter** (`src/interpreter`) behind an async `Interpreter` interface. It handles:
  - synonyms, politeness and filler words, and addressing an officer by name
  - several orders in one sentence, with reported speech kept together
  - targets and pronouns
  - quantities such as "10,000 km", "10k" and "four thousand"
  - clarifying questions, shown as tappable options
- **Template narrator** behind a `Narrator` interface. It renders officers in character from engine reports and state diffs. The dead and those in stasis never speak.
- **Save format v2**, which stores the full world state including the seed and RNG, plus a format version. It validates on load and rejects v1 saves gracefully.
- UI: real system health and power table, jump charge, torpedoes and souls aboard. The tactical plot shows only what the crew has detected and identified. Order suggestions depend on the situation. Added **Restart** (same seed) and **New** (random seed), and viewscreen effects for beams, torpedoes, explosions and plasma.

### Changed
- The badge now reads **SIMULATION · OFFLINE INTERPRETER** instead of SCRIPTED DEMO.
- The captain's own orders are no longer read aloud when voice is on.
- `/api/command` now reports `milestone: 2`. It is still a stub with no AI calls and no secrets.
- `npm run typecheck` now also type-checks the tests.

### Fixed
- After evacuation the Kestrel shows **evacuated** instead of "distressed".

### Removed
- The M1 keyword script (`demoScript.ts`), `initialState.ts`, `crew.ts` and `gameReducer.ts`, all replaced by the engine and scenario modules.

### Verified
- Voice-to-text and text-to-speech confirmed working on a real phone by the user (v0.1.1). This resolves the 0.1.0 known limitation that voice had only been verified with stubbed APIs.

### Tests
- 162 Vitest tests:
  - an 88-phrasing interpreter table plus normalisation, pronoun and clarification tests
  - validator and reducer
  - NPC behaviour
  - determinism (same seed replays exactly; different seeds vary)
  - persistence
  - 19 natural-language playthroughs (withdrawal, diplomacy, science, combat, unconventional)
  - a fuzz test of 120 random runs that checks invariants after every order: bounds, destroyed-ship consistency, no acting with destroyed systems, no dead speakers, no missing templates, no active objectives after an ending
- The smoke test was rewritten for the M2 UI (55 checks, including multi-order sentences, clarification, save/load with the seed, and the evacuated status).

## [0.1.1] — 2026-10-18 — Milestone 1 fixes

### Fixed
- Every objective is now resolved when the simulation ends; none stays "active". Informational objectives (assess the Kestrel, the warship's intentions, the shielded compartment) end as **complete** or **missed**. "Protect the crew" ends as **complete** (crew evacuated or Kestrel towed out) or **failed**.
- "Avoid escalating the border dispute" follows one deterministic rule. It **fails immediately and permanently** when any of these happens: the Halcyon locks weapons on the cruiser, the Halcyon fires, or the cruiser locks weapons on the Kestrel. (A cruiser lock on the Halcyon, or the cruiser firing, would also count, but neither can happen in the M1 script.) If none of them happen, it completes at the ending. Previously a rescue could count as "complete" even after the cruiser had locked onto the Kestrel.
- When the cruiser locks weapons on the Kestrel, it is now shown as hostile.
- Toast notifications moved to the bottom-right (full-width bottom on phones), so they can no longer cover the SCRIPTED DEMO badge or header controls. A newer toast no longer gets dismissed early by an older one's timer.
- Standing down now clears weapon posture, so diplomacy works again after weapons were locked (the escalation failure stays).
- Placating the cruiser after it closed inside 60,000 km no longer moves it backwards.
- Red alert no longer costs a turn, matching the other alert and shield orders.
- After the Kestrel's reactor breaches (crew already evacuated), orders aimed at the Kestrel are politely refused instead of acting on a destroyed ship. The status report and rescue summary now mention her loss.
- Voice-input notes ("Heard: …") now clear on Restart, Load and Run again. "Run again" also stops any speech in progress.

### Tests
- New `objectives.test.ts` covering end states for all four endings, the escalation rule, late placation and the destroyed-Kestrel guard (44 unit tests in total).
- The smoke test now checks toast placement at desktop, tablet and phone widths, that no objective stays active after an ending, and that the voice note resets.

## [0.1.0] — 2026-10-18 — Milestone 1

### Added
- Vite + React + TypeScript project with folders for the engine, scenarios, UI and serverless API.
- Original setting: CSV Halcyon (Concord Exploration Service), freighter Kestrel, Tessarine Directorate cruiser Ashen Covenant, the Calloway Reach.
- LCARS-inspired command interface: forward viewscreen, ship status, mission narrative, captain's command input, tactical/sensor plot with contact details, communications log, mission objectives, save/load/restart.
- Animated canvas viewscreen with original freighter and cruiser artwork that scales with range; shield, tractor-beam and red-alert effects; reduced-motion support.
- Scripted demonstration of *The Kestrel Incident*: timed opening (skippable), deterministic keyword command handler with range and shield validation, independent cruiser movement and reactor countdown, hidden information (shielded compartment), and four endings.
- localStorage save/load with versioned, validated save files.
- Optional speech synthesis of crew and comms lines; voice input via the Web Speech API where supported, with typed fallback.
- `api/command` serverless stub (deterministic, no AI provider, no secrets).
- Unit tests (vitest) for the demo script and persistence; Playwright smoke test covering panels, commands, save/load, voice stubs, an ending, restart and responsive layouts.

### Known limitations
- Command understanding is keyword-based (demo only); unrecognised phrasing is rejected politely.
- Voice features were verified in headless Chromium with stubbed speech APIs only, not with real audio or a microphone.
- `/api/command` is not called by the client yet.
