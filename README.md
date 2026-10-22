# Project Starbridge

A browser-based, AI-assisted **starship command simulator**. You command the exploration ship **ISV Halcyon** of the **Intergalactic Space Agency** (**the ISA**), the player's faction, and complete dynamic training missions by giving natural-language orders. The long-term goal is integration with a physical starship bridge, so the UI is built to scale from tablets to dedicated bridge consoles.

> **Status: v0.7.0 (Evaluation & Records: your own name on the record, after-action reports for every simulation, competencies in words, a Service Record with Training kept apart from canon; v0.6.1 added crew voices, v0.6.0 simulation #2).** The plan is 30 training simulations ([roadmap](docs/SCENARIO_ROADMAP.md)); two are playable. The app opens on the **bridge of the Halcyon**, not in a mission. Talk to the crew, ask science what is out there, and start a training simulation only when you ask for one ("Computer, list simulations", "Computer, begin the Kestrel Incident simulation"). When a simulation ends you are back on the bridge with a debrief. **Active Duty** (formerly "Living Universe") is the persistent canonical career. There is no mission menu: hails, distress calls, requests and science readings reach the bridge as canonical time passes, and you answer them in your own words. Orders and speech are read by a rule-based **offline interpreter**. No AI is used yet (see [Roadmap](#roadmap)).

## The bridge, Active Duty and two-way comms (v0.5 / M3.1)

**The bridge is home.** On load the Halcyon holds station: green alert, no contacts, no objectives, no clock pressure. Routine lines come from the crew now and then. Things you can say:

- `First Officer, give me a status report` · `Okafor, how are the engines?` (small talk, answered from the ship's state)
- `Science, what systems are within exploration range?`
- `Computer, open the simulation archive` · `Computer, list simulations` (or `what simulations are available`) · `Computer, begin the Kestrel Incident simulation` · `Computer, begin the Tallis Gate simulation` · `run simulation two` (typed or spoken). A simulation starts **only** on request; `begin the simulation` with no name starts #1.
- Inside a simulation, `Computer, end the simulation` (or the End sim button) returns you to the bridge. A simulation that reaches an ending returns you to the bridge with a debrief card (run it again, new variation, archive).

**Two products (described only; there are no payments):**

| Product | Price (described) | What it is |
|---|---|---|
| Simulation Mode | $10 one-time | The bridge, the simulation archive, unlimited training runs. Nothing is ever recorded as history. |
| Active Duty | $9.99 / month | A canonical career: a persistent galaxy, consequences, a captain's record, 10 new canonical starts per day. |

In this build both are switched on with dev toggles (Settings → dev, or the Active Duty tab). **The first activation is a commission:** Admiral Odessa Kaine offers you command of the Halcyon. Accept on the card or say `I accept the commission`. Turning Active Duty off puts you on **reserve status**. Everything is preserved, the canonical timeline is frozen, simulations stay unlimited, and reactivating restores the same career. It is never treated as misconduct. Saves from v0.4 migrate: a stored `livingUniverse` entitlement reads as `activeDuty`, and pre-v0.5 careers count as already commissioned.

**Organic missions (Active Duty).** Say `continue the patrol` (or `hold station for 4 hours`, `let a few hours go by`). Canonical time passes an hour at a time and stops when something reaches the bridge: a **Fleet hail**, a **distress call**, a **request** from a colony office, a **science reading** or a **bulletin** about events elsewhere. What arrives is decided deterministically (seeded) from the canonical world:

- **Galaxy time:** Fleet only asks for volunteers once an offer has gone unanswered for 6 h, and science readings start 12 h into the commission.
- **Location:** civilian maydays and colony requests reach the Halcyon only within 6 ly of the patrol area.
- **Ship condition:** Fleet does not ask a ship below 50% hull.
- **Faction standing:** poor standing with the independents makes colony requests rarer.
- **Border tension:** high tension makes Fleet requests more frequent.
- **Past decisions:** past rescues make distress calls likelier to be routed to you; past investigations make science readings likelier.
- **Quiet periods:** "nothing" is always a candidate, and nothing new arrives within 3 h of the last delivery. The exception is a mandatory directive, which always gets through.

You answer by talking:
- **Accept:** `Acknowledged, we're on our way` · `Respond to the distress call` · `Sure, we can escort them`
- **Ask:** `Request clarification` · `Ask the admiral why it has to be us`
- **Refuse a directive:** `We refuse the directive, the ship is not fit for duty` (the stated reason goes to the review)
- **Decline or ignore:** `Decline` · `Log it and continue`

Accepting starts a canonical mission and costs one credit, exactly as before. Declining, ignoring and questioning are free. Ignoring a *directive* is never done silently: the XO tells you it would be failure to comply and asks you to acknowledge, question or refuse. Carrying on the patrol past a distress call logs it as ignored, and the emergency continues without you. The **Fleet Command offer log** (Hub → Active Duty) still lists open traffic as a secondary record.

**Science and first contact (Active Duty).** `Science, show me the civilizations we've detected but haven't contacted` lists the systems with signs of a civilization: three on the first day, and a fourth can turn up later in a science reading. What each civilization wants is hidden until you meet it. `Helm, set a course for Merrow` travels there (1.25 h per light year of canonical time). A course to an uncontacted civilization is an **investigation**: a new canonical start, charged once. On arrival, science confirms who is there, and their station or ship appears on sensors. `Hail them` opens a persistent channel. They ask why you have come; you can ask questions first, and they answer and ask again. Your answer is classified as peaceful, firm or threatening, and that meets their hidden disposition:

| Disposition | Peaceful | Firm | Threatening |
|---|---|---|---|
| open | asks to open talks on **joining the ISA** | wary contact | warned off |
| cautious | trade and contact, **will not join** | wary contact | warned off |
| isolationist | **declines contact**, asks you to leave | declines | warned off |
| guarded | wary contact | warned off | hostile |

**Not every civilization wants to join the ISA.** Only an open people approached peacefully does. The outcome is written once to canon (a world event and an entry in the captain's record). Rask will not fire on a civilian station or on a ship that has not fired. The survey and the civilizations are seeded per career (four original peoples: the Ossari, Kethren, Lumae and Drassk).

**Naming (resolved in v0.5.1; updated in v0.7.0).** The M3.1 brief spoke of civilizations joining the "Directorate", but the **Tessarine Directorate** is the rival power on the border (Prefect Vane's side) and stays as it is. The player's faction was called the Concord until v0.5.0; it is now **the ISA**, the **Intergalactic Space Agency** (spelled out only on formal screens; everywhere else it is "the ISA", since v0.7.1) (v0.5.1–v0.6.1 said "Intergalactic Star Agency"; saved text is migrated on load), its ships carry the prefix **ISV** (ISV Halcyon), registry codes would read `ISA-nnnn` (the app shows none today; the load-time migration maps any old `CES-nnnn`), and **Fleet Command** is the ISA's command. Civilizations are invited to join the ISA. Prefect Sorel Vane commands the *Ashen Covenant* (his ship) for the Tessarine Directorate (his side). Older saves load with the new names (display text is rewritten on load; internal ids such as the faction id `concord` are unchanged), and the interpreter still accepts the old words ("Concord space", "run for Concord space") (and "Agency space") as aliases for ISA space.

**Two-way comms.** A hail opens a persistent channel (the indicator shows who you are talking to). Lines of speech go to the other party; orders addressed to the crew go to the crew, even with a channel open. Promises you make ("our weapons stay down") are remembered and checked. Anything unclear gets a clarifying question from the other party. You can hold, resume, mute or close channels.

### Time costs

There are two linked clocks. The **tactical clock** runs inside any bridge session (a mission, a simulation or the idle bridge). One turn is 60 s. Talking costs seconds, and the seconds add up: every full minute the world acts, and ships keep moving while you talk. The **galaxy clock** is the canonical time of Active Duty. It moves only when the captain lets it.

| Action | Tactical clock | Galaxy clock (Active Duty) |
|---|---|---|
| Crew order (helm, tactical, scans, repairs…) or `wait` | 1 turn (60 s) | — |
| Speak on an open channel | 10 s | — |
| Hail / open a channel | 15 s | — |
| Relayed line (`tell the Prefect…`) | 15 s | — |
| One-shot message (`warn the cruiser`, no channel) | 20 s | — |
| Hold / resume / mute / close a channel | 5 s | — |
| Small talk with an officer | 5 s | — |
| Survey / civilizations list | 10 s | — |
| Archive, begin/end a simulation, the commission, answering a call | 0 s | 0 |
| `Continue the patrol` | 0 s | 1 h steps, up to 6 h by default (or as said, max 24 h); stops early when something arrives |
| Quiet window after any delivery | — | at least 3 h (directives excepted) |
| `Set a course for …` | 0 s | 1.25 h per light year (minimum 1 h) |
| Canonical bridge mission | its turns | 1 min per turn + 1 h to stand down |
| Event mission (e.g. the hauler) | — | until its seeded resolution + 1 h |
| Offer log "Continue patrol" button | — | 6 h |
| First-contact conversation, crew chat on the bridge | seconds as above | 0 (the galaxy clock does not move) |
| No credits left today | — | paused (no in-universe penalty) |

All names, ships, factions and artwork are original. The interface is *inspired by* classic sci-fi console design but uses no copyrighted artwork, fonts or names.

## Captain's Handbook (v0.8.0; First Edition since v0.8.2)

The ISA's regulations are published in-game as **ISA-COM-001, *Captain's Code and Operational Regulations*, First Edition**: a one-paragraph preamble, 11 articles of short numbered rules (71 subsections, readable in about ten minutes) and an annex of the treaties the ISA observes. Open it from the **Command Hub → Captain's Handbook**, or say so on the bridge, in a simulation or on Active Duty:

- "Computer, open the handbook"
- "Show me section 3.3" (also "§3.3", "article 5", "the annex", and older citations such as "Reg. 7.2", "Rules of Engagement §1" or "B.1")
- "Show me the regulation on first contact"
- "What are the quarantine regulations?"

Opening the handbook issues no order and takes no time; close it and you are exactly where you were. The handbook shows only the code itself. Search finds a subsection or article number, an older citation or a subject ("asylum", "warning shot", "quarantine"). Regulations cited in after-action reports and disciplinary reviews read like "§3.3 Use of Force" and open that subsection.

`npm run handbook:export` writes the First Edition as Markdown (`handbook-export/ISA-COM-001.md`) from the same database the game uses (`src/handbook/code.ts` for the text, `src/handbook/articles.ts` for the permanent regulation ids behind it). Ids are permanent; the wording changes only by an approved revision (see SCENARIO_GUIDE §6b).

## Service Record, after-action reports and your name (v0.7)

- **Your name.** On first launch (or once, for a save from before v0.7) you are asked for your captain's name. It is the only name you can choose: the Halcyon, her crew, the people you meet, worlds, factions and ISA departments keep theirs ("rename the ship" and "call helm Bob" are politely declined). Change it any time in **Hub → Service Record → Career Overview**; nothing else on the record changes. Formal address is rank plus surname ("Captain Morgan"). Names are 2–32 characters: letters (accents welcome), spaces, hyphens, apostrophes and periods.
- **After-action reports.** When a simulation ends, the debrief card offers **Read the after-action report**. ISA Training Command lists the objectives met and missed, the key decisions, crew and civilian safety, the regulations involved, strengths, what to improve and recommended training. It judges how you got there, not just where: force and negotiation read differently, and a failure reached by upholding the rules is recorded as principled. There are no scores or percentages.
- **Training vs service.** Simulation reports and competencies (Not yet assessed → Developing → Competent → Proficient → Distinguished, each with evidence) live in the Training Record and never touch canon. Active Duty missions are filed in Service History.
- **Ranks** (Captain, Senior Captain, Commodore, Fleet Captain) exist as data and change how you are addressed; promotions are not in the game yet. The Fleet Requests channel is built and tested underneath but not yet playable.

## Crew voices (v0.6.1)

With **Voice on**, each bridge officer, the ship's computer, the narrator and the people on comms speak with their own voice. The voices are the browser's built-in speech synthesis voices: free, no API keys, nothing downloaded. **Hub → Crew voices** lists who sounds like what. Each person has a **Preview** button. You can override any crew member's voice, pitch or rate there; your choices are saved in this browser.

- **Casting** (`src/voice/`) is deterministic and uses the voices the device offers (`speechSynthesis.getVoices()`, re-read on the async `voiceschanged` event).
  - Each profile ranks voice names across Apple, Windows/Edge, Chrome and Android, and states a gender, preferred English locales, and a pitch and rate.
  - The computer and the crew pick first, in a fixed order, so their voices are the same in every simulation. Characters on comms are cast next, onto voices the crew is not using where possible.
- **When there are enough voices** (at least 9 usable English ones), every officer, the computer and the narrator get a different voice.
- **When voices are scarce** (an iPhone with two English voices, or Windows with Zira, David and Mark):
  - officers share voices, preferring one of their own gender, and are separated by pitch and rate;
  - no two people ever have the same voice, pitch and rate;
  - the computer always keeps its calm base settings.
- **With no usable voice,** everyone uses the browser default at different pitches and rates.
- **Offline by default.** Cloud voices (Chrome's "Google …", Edge's "Online (Natural)") and Apple's novelty voices are not used. A checkbox in the panel allows the cloud voices.
- **Scenarios declare voice hints for their characters** (see [docs/SCENARIO_GUIDE.md](docs/SCENARIO_GUIDE.md) §6a). #1 and #2 do.

## Training simulations

| # | Simulation | Status |
|---|---|---|
| 1 | **The Kestrel Incident** | playable |
| 2 | **Quarantine at Tallis Gate** | playable (v0.6.0) |
| 3–30 | see [docs/SCENARIO_ROADMAP.md](docs/SCENARIO_ROADMAP.md) | planned, one per day |

Every simulation is listed in the Mission Archive and by `Computer, list simulations`, and can be started by name or number. How to write one is in [docs/SCENARIO_GUIDE.md](docs/SCENARIO_GUIDE.md).

### #2 — Quarantine at Tallis Gate

The pilgrim liner **Mercy of Ilun** (Captain Juno Sabeth, 120–168 aboard) is stopped at the quarantine line of the independent colony **Tallis Gate** with a sickness spreading among the passengers. The colony's picket cutter **Thornwake** (Warden-Commander Isolde Marr) will fire on any ship that crosses the line. The colony lost a generation to a plague, and Marr means it. Sabeth's people are dying and her patience is running out.

The seed decides:

- **what the sickness is:** a contagious fever (a cure can be made), toxin in the water recycler (fix it), or an allergic reaction to incense that looks like plague (prove it);
- **the Warden's temperament:** strict, fearful or humane. This decides what persuades her and whether she will fire through the Halcyon;
- **whether her brother is aboard the liner;**
- **when Sabeth runs the line,** the number aboard and the number sick.

Scan the liner up close to learn what is wrong. Medical teams sent before the cause is known can bring the fever aboard the Halcyon, unless you improvise ("set up an isolation ward", "screen the transport with biofilters"). Talk to both captains: hidden facts come out when you ask the right question or show the evidence.

Endings:
- **Success:** **The Cure** (treat the fever aboard or with the colony's antiviral), **Line Lifted** (persuade Marr with evidence), **ISA Care** (tow or evacuate the liner to an ISA hospital without crossing the line).
- **Failure or partial:** **Fire at the Gate** (the liner is destroyed), **Outbreak at Tallis Gate**, **Fever Aboard** (the Halcyon is quarantined), **Incident at Tallis Gate** (you fire on the colony's picket), **Liner Abandoned**, **The Long Road** (an untreated fever on a six-hour tow), **The Gate Run** (Sabeth forces the line), **Stalemate**, **Halcyon Lost**.

Rask will not fire on the liner. Every ending is reached by a scripted test (see `tests/sim02/`).

## Simulation #1 — The Kestrel Incident

The Halcyon arrives at the edge of the **Calloway Reach**, space disputed between the ISA and the **Tessarine Directorate**. A civilian freighter, the **Kestrel**, is adrift with a failing reactor and 23 crew. A Directorate heavy cruiser is closing fast. The Kestrel is hiding something.

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
- `Plot an intercept course for the Tessarine ship` · `Swing around so our bow faces the freighter` · `Run for ISA space` (the old `Run for Agency space` and `Run for Concord space` still work)
- `Back us away from that warship slowly` · `Evasive pattern delta, then return fire`
- `Lock torpedos on the crusier` (misspellings are corrected against the game's vocabulary)
- `Get between them` (resolved to the Kestrel and the cruiser) · `interpose in front of the cruiser`: helm asks "between the cruiser and the Kestrel, or between the cruiser and the border?" and offers buttons

## Architecture

### Timelines (v0.4–v0.5)

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
  exploration.ts   v0.5: seeded survey, civilizations (hidden dispositions), travel, first contact record
  delivery.ts      v0.5: organic traffic — what reaches the bridge, when, and why (weights + quiet window)
src/dutyBridge.ts  v0.5: carries out bridge requests (patrol, answer a call, course, first contact)
                   through the Universe API; derives the waiting call / contact from canon
src/engine/bridge.ts, src/scenarios/bridge/   the idle bridge (commands, survey, small talk,
                   first-contact dialogue provider); src/engine/comms.ts, dialogue.ts: channels
```

The idle bridge and every simulation are never written to canon (the Active Duty bridge changes canon only through the Universe API: patrol, travel, answering a call, first contact). A canonical mission writes its outcome once, through the commit gate, and the archive keeps it unchanged however many times it is replayed.

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
  voice/                profiles.ts (crew voice profiles), cast.ts (deterministic voice casting), members.ts (who speaks)
  scenarios/catalogue.ts  The training simulation list (number, ids, name, launch words); archive and bridge read it
  scenarios/registry.ts   scenarioId → ScenarioModule
  scenarios/tallis/       Simulation #2 (same file layout as kestrel/, plus dialogue.ts)
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
tests/v061/            Crew voices: casting (many / few / no voices, determinism, overrides) and speaker tagging
tests/sim02/           Simulation #2: setup, every ending, seed sweep, fuzz, catalogue/launch/archive/saves
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
- **Active Duty (formerly Living Universe) is local and single-player.** Canon, credits and the archive live in this browser's localStorage. Clearing site data resets them, and the credits are not tamper-proof.
- **Event missions resolve instantly** from seeded models. They are not played on the bridge.
- **The Kestrel's arming is a simple point-defence rule** (locks or the cruiser coming too close).
- **Kinematics are simplified 2D.** There are no collisions or gravity, a single border line, and one helm goal at a time.
- **Balance is first-pass.** Coolant-leak seeds leave little time for long negotiations. Combat takes several turns. Reinforcements end long stand-offs.
- **The Prefect will not fire on the ship he believes carries his quarry** unless you start a fight. If the Kestrel is lost with crew aboard, the run ends, unless the Halcyon has already opened fire; in that case the battle continues.
- **Old v0.1 and v0.2 saves cannot be loaded.** The save format changed to v3 (ship kinematics and tracked orders), and the app reports this instead of loading them.
- **Small UI issues:** tactical labels can still crowd when several ships sit close together at "Fit all" zoom (use "Local"), and on phones the toast briefly covers the bottom of the command area.
- **v0.5 voice not re-verified on a device.** The speech code is unchanged. Spoken bridge commands ("Computer, begin the Kestrel Incident simulation") are tested with stubbed recognition only.
- **v0.5 interpreter coverage (duty bridge).** Answering calls, patrol, courses and the civilization list are rule-based. On held-out duty phrasings the first runs were **11/20** (set 1) and **4/12** (set 2, written after set 1 was tuned), both with **0 unsafe**. After fixes both pass, but they are no longer clean measures. See `tests/eval/RESULTS-duty*.md`. A refused directive is transmitted at once: there is no "are you sure?" step.
- **v0.5 first contact is short.** It is one exchange that decides the outcome, after any number of questions. Civilizations do not yet follow up, send envoys or change the wider galaxy (faction standing and tension are unaffected). Investigations are not listed in the Mission Archive and cannot be replayed as simulations.
- **Fleet hails and distress calls are not two-way channels.** You answer them in words (accept, question, refuse, decline, ignore), but you cannot hold a conversation with Fleet Command or the hauler's crew.
- **Canonical time moves only on patrol, travel and missions.** Waiting on the bridge, chatting, or a long first-contact conversation does not advance the galaxy clock.
- **v0.7 limits.** No promotions, Fleet Command requests channel, qualifications or board of inquiry in play yet (data models and unit tests only). The captain's name is used in the personnel record, reports, the commission and the bridge greeting, not yet throughout every scenario's dialogue (scenario NPCs still say "Captain"). Rank changes are available only from the development selector in Settings. Evaluation describes the final state and a turn trace; it is deterministic and rule-based, not an AI judgment.
- **v0.7.1 limits (idle bridge and Fleet Command).** "Hail the ISA" / "contact Fleet Command" is a one-shot exchange with an offline duty officer (your training record, and what is coming), not a persistent channel; assignment, supply, personnel and legal requests come later. With exactly one contact on sensors, an unrecognised ship name still hails that contact. "Who is out there?" is not recognised (use "any contacts?" or "scan"). In simulations, generic class words ("freighter", "cruiser") still refer to that scenario's ships. Held-out Fleet/career phrasings passed 12/12, 10/10 and 7/7 negatives on the first run, but they were written by the same author who then built the classifier.
- **Handbook limits (v0.8.0–v0.8.2).** The handbook is the approved First Edition, but evaluations and crew refusals still apply the pre-edition (v0.7) wording, which the database keeps as revision 0. A report therefore shows the First Edition citation ("§3.1 Use of Force") beside the v0.7 sentence it applied. Evaluations move to the First Edition text in handbook Stage 3; until then, for example, a refused order is still reported as §3.3 "Breached". Crew do not quote or explain regulations yet (handbook Stage 2). Bridge commands are rule-based: a phrasing they don't catch goes to the interpreter as usual. Use the Hub tab or search instead.
- **v0.6.1 crew voices are untested on real devices.**
  - Casting and the speech queue are tested with mocked voice lists (unit tests and the smoke test), not by listening.
  - Which voices exist depends on the device and the voices installed. iOS Safari often exposes only a few English voices (plus novelty ones, which are excluded). Android Chrome usually exposes one voice per locale. Desktop Chrome on Windows has three local voices plus cloud "Google" voices, which are off by default.
  - Some browsers may ignore the requested pitch or rate.
  - The opening broadcasts ("Kestrel distress beacon", "Mercy of Ilun, open broadcast") use the generic voice, not the captain's.
- **v0.6 multi-scenario limits.** The engine has three ship slots (the Halcyon and two contacts), and the viewscreen draws them with the freighter and warship silhouettes in every simulation. The interpreter's built-in words "freighter" and "cruiser" still refer to the two contacts. The "Halcyon Lost" ending of #2 is tested by forcing the ship's destruction, not by a scripted playthrough. Voice launch of #2 is tested with stubbed recognition only.
- Not yet tested in desktop Safari or Firefox, or on dedicated tablets/bridge consoles.

## Roadmap

- [x] **Milestone 1** — Complete interface and scripted demonstration, deployed preview.
- [x] **Milestone 2** — Ship systems model, persistent world state, NPC agents, seeded RNG, offline command interpretation and validation.
- [x] **Milestone 3 (v0.4)** — Simulation Mode, Living Universe foundation, Mission Archive, daily credits, world events and consequences, crew memory, standing orders and restrictions.
- [x] **Milestone 3.1 (v0.5)** — Bridge-first startup, Active Duty (commission, reserve), organic mission delivery, science exploration and first contact, persistent two-way comms, crew autonomy and ROE refusals.
- [x] **v0.6** — Multi-scenario training simulations: catalogue, launch by name or number, simulation #2 (Quarantine at Tallis Gate), authoring guide and 30-simulation roadmap.
- [x] **v0.6.1** — Distinct crew voices from the browser's free built-in voices, with a preview and override panel.
- [x] **v0.7** — Evaluation & Records Foundation: the captain's name, ranks (data), after-action reports, competencies in words, Training and Service Records, and the Fleet request foundation (offline).
- [x] **v0.8.0** — Captain's Handbook foundation: the ISA-COM-001 regulation database, in-game handbook, search, bridge commands, clickable citations and print export (no grading changes).
- [x] **v0.8.1** — Handbook Draft 3: "the ISA" throughout, player-facing enforcement notes.
- [x] **v0.8.2** — ISA-COM-001 First Edition: the condensed code (11 articles, 71 subsections, Annex), citations shown as "§3.3 Use of Force".
- [ ] **Handbook Stages 2 and 3** (each takes the next free version number when it ships; nightly simulations keep bumping the patch version) — Crew who cite and explain regulations; evaluations, refusals and reviews moved to the approved First Edition wording.
- [ ] **Next** — Server-side AI narration and character responses with schema validation, timeouts, usage limits and template fallback; server-side accounts and credits.
- [ ] **Milestone 4** — Branching outcomes, mission evaluation, full save/resume, voice controls.
- [ ] **Milestone 5** — Multi-playthrough testing, state-consistency fixes, stable release.

See [CHANGELOG.md](CHANGELOG.md) for development history.
