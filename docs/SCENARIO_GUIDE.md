# Scenario authoring guide

This guide explains how to add a training simulation to Project Starbridge in one sitting, consistently. Simulation #2, *Quarantine at Tallis Gate* (`src/scenarios/tallis/`), is the reference: copy its shape. The plan for #3–#30 is in [SCENARIO_ROADMAP.md](SCENARIO_ROADMAP.md).

**Ground rules:**
- Original fiction only.
- Deterministic, seeded and offline: no network, no AI, no `Math.random`, no wall clock.
- The player is the ISV Halcyon of the Intergalactic Space Agency (ISA), the fleet of the Agency. The Tessarine Directorate is a rival.
- **Do not change the shared engine's behaviour for existing simulations.** The full test suite must stay green with the Kestrel tests untouched.

## 1. How the pieces fit

```
src/scenarios/catalogue.ts   pure data: number, trainingId, scenarioId, name, blurb, launch words
src/scenarios/registry.ts    scenarioId → ScenarioModule (TRAINING_SCENARIOS)
src/scenarios/<name>/        the module (setup, agents, hooks, dialogue, outcome, templates, index)
src/universe/archive.ts      the Mission Archive lists every catalogue entry (no change needed)
src/engine/bridge.ts         "list simulations" and "begin the … simulation" read the catalogue (no change needed)
tests/simNN/                 the scenario's tests
scripts/smoke.mjs            one smoke block per new simulation
```

Adding a simulation takes four steps:
1. Write the module.
2. Add **one** catalogue entry.
3. Add **one** line to `TRAINING_SCENARIOS` in the registry.
4. Write the tests.

The bridge launch, `list simulations`, the archive, saves, "run it again" and "New scenario" then work without further changes. `tests/sim02/catalogue.test.ts` checks every catalogue entry against the registry.

### Catalogue entry

```ts
entry(3, 'TRN-lantern', 'lantern-drift', 'The Lantern Drift', 'One-line blurb for the archive.',
  ['the lantern drift', 'lantern drift', 'lantern', 'generation ship'],   // words: used after "begin the … simulation"
  ['the lantern drift', 'lantern drift']),                                 // direct: start it without the word "simulation"
```

- **Ids are permanent.** `trainingId` is stored in simulation history and `scenarioId` in saves, so they never change.
- **`direct` words must never be an ordinary order.** "begin quarantine procedures" must not start #2, which is why #2's direct words are only its distinctive names.
- **Avoid words already used by another simulation.** The longest matching phrase wins. A word shared by two simulations (e.g. "incident") resolves to whichever has the longer match, so prefer unique words. Simulations can also be started by number: "simulation three", "number 3", "003".
- **`SCENARIO_TITLE` in setup must equal** `Training Simulation NNN: <name>` (tested).

## 2. The world: setup.ts

`createScenario(seed)` returns a complete `WorldState`. Draw every seeded choice from `createRng(normaliseSeed(seed))`, in a fixed order, at the top. The same seed must give the same world (tested with `toEqual`).

**Ships.** There are three ship slots with historical ids, kept for save and schema compatibility:

| Slot id | Meaning |
|---|---|
| `halcyon` | the player's ship. Keep it as in #1/#2: ISV Halcyon, faction `concord` (the internal id of the Agency), 212 souls |
| `kestrel` | **contact A**: the ship the player mainly helps or deals with (a liner, a derelict, a station…) |
| `cruiser` | **contact B**: the second party (a picket, a pirate, a rival) |

Give each contact its own `name`, `classification`, `faction` and `aliases`. **Aliases are how the interpreter recognises your ships**: "the liner", "Sabeth", "the picket" and "the Warden" all work because they are listed there. Add every way a player might refer to a ship or its captain.

- The classification drives crew refusals. A contact whose `classification` matches `CIVILIAN_CLASS` in `engine/roe.ts` (liner, freighter, transport, …), with souls aboard and no shots fired, is refused as a target by Tactical.
- Anything else, such as "picket cutter" or "warship", can be fired on.

**Slots (`WorldState.slots`)** tell the shared engine who your people are:

```ts
slots: { kestrelLead: 'sabeth', cruiserLead: 'marr', passenger: null,
         kestrelRepair: 'lifeSupport', kestrelRepairWords: ['water recycler', 'recycler', …] }
```

- **Leads** are the characters who answer for each contact. Trust changes from rescues and medical teams go to `kestrelLead`.
- **`passenger`** is an optional third comms party. Use `null` if you have none; the engine then answers "no such passenger".
- **`kestrelRepair`** is the contact-A system an engineering team works on, and **`kestrelRepairWords`** are the words that send them ("fix their water recycler"). The shared repair action sets the flag `kestrelStable`; your agents decide what that means. #2 treats it as "the recycler has been checked".
- **Do not put** a common Halcyon system phrase such as "life support" in `kestrelRepairWords`, or "repair our life support" will go to the contact.

**Characters.**
- Reuse the Halcyon officer block from #2 unchanged (`marrow`, `rask`, `varga`, `adeyemi`, `szabo`, `okafor`, `osei` and the relief officers) and `ROLE_HOLDERS`.
- Add your NPCs with `motivation`, `goals`, `knowledge` (fact ids they hold) and a `memory` map. **Memory holds numbers only.**

**Facts.**
- Facts are the scenario's hidden information. Each is `{ id, text, known: false }`. Reveal them with `revealFact(s, id)` when the player has *earned* them (a scan in range, the right question, trust).
- Objectives and the contact panel read `known`.

**Variant.**
- The Kestrel fields are required by type. Fill them with neutral values (`complication: 'none'`; `ionStorm` changes shared combat and transport range).
- Put your own seeded choices in `variant.extra` and read them back through a typed helper, as `tallis(s)` does in #2.

**Landmarks.** Always include `border` (where "flee" goes). Add your own as needed.

**Counters.** Include `torpedoes: 6`, `kestrelDead: 0` and `rescued: 0` (the shared engine updates these), plus your own counters.

## 3. Agents: agents.ts

`simulate(s, rng)` runs once per simulated minute after the orders resolve. Write one function per agent and run them in a fixed order:
1. the environment (the clock of the crisis);
2. the NPCs;
3. pending events (`schedule(s, kind, inTurns)`, then `handleEvent`).

**Every NPC acts on its own goals.**
- Each has a breaking point drawn from the seed. In #2, Sabeth runs the line at `runTurn` unless she has been given a reason to wait.
- NPCs react to what the Halcyon does: interposing, weapons locks, shots, help offered.
- They read only what their character could know.
- Keep NPC movement on `ship.nav`, as the shared motion code does.

**Shared mechanics you can rely on:**

| Mechanic | What it does |
|---|---|
| `transport` (`crew`, `medicalTeam`, `rescueTeam`, `cargo`) | moves souls from contact A to the Halcyon, or sets `medicalSent` |
| `repair` on the contact | sets `kestrelStable` |
| `tractor` + `jump` | sets `jumped`, and `kestrelTowedOut` if towing |
| `flee` | sets `leftReach` |
| combat | `resolveAttack` / `destroyShip` (slot-A losses count into `kestrelDead`) |
| interposing | the `interposing` flag (the Halcyon is between A and B) |
| improvisation | `shieldExtendUntil` and `tractorShieldUntil` counters |

**React to these in your agents. Do not edit the shared reducer for a single scenario.**

## 4. Hooks: hooks.ts

`ScenarioHooks` gives meaning to:

- **`scan(target)`**:
  - Tie detail to range (and to boosted sensors: `systems.sensors.power >= 125`). This is the main way hidden information is earned.
  - Give `area` and `halcyon` scans a sensible answer.
- **`communicate`**: a one-shot message without a channel. Route it to the same logic as the dialogue provider, as #2 does.
- **`improvise`** (the methods `tractorShield`, `plasmaVent`, `sensorGhost`, `shieldExtend`, `ejectCore`, `other`):
  - **Every method must have a sensible answer in your scenario**, even if it is "that won't help here".
  - `other` carries the captain's own words in `description`. Match them with regexes and give real effects to good ideas: an isolation ward and a screened transporter in #2.
  - Anything you can't use gets an honest "nothing changes".
- **`query`**: status, systems, contacts, objectives, options, help and why. "why" must use `explainRefusal`.

`suggestions(s)` (in index.ts) offers 2–4 context-sensitive next orders. They must be orders the interpreter actually understands (test them).

## 5. Dialogue: dialogue.ts

Implement a `DialogueProvider`: `speakerName`, `vesselName`, `greet`, `respond`, `onPromiseBroken` and optionally `tick`. The party ids are `'kestrel'` and `'cruiser'` (plus `'passenger'` if you have one).

**`respond(s, line)`:**
- `line.intents` holds the classified intents (`ask`, `humanitarian`, `warn`, `demand`, `promise`, `agree`, `end`, …). `line.text` is what the captain actually said.
- Use **both**: intents for tone, text regexes for substance (evidence, the cure, family).
- Check in a fixed priority order. Specific substance comes before generic tone.

**Gate revelations and persuasion on what the crew actually knows.** In #2:
- "it isn't contagious" persuades the Warden only after the crew has diagnosed it;
- it never works for a fever that *is* contagious.

**The NPC's own temperament decides how they are persuaded.** Draw it from the seed (strict, fearful or humane in #2) and give each temperament different rules, not just different words.

**Record lines.**
- Record every NPC line with `recordLine`.
- Vary repeated answers with `bumpRepeat`.
- Handle `end` by closing the channel.

**`onPromiseBroken`:** trust falls, and the character says so.

## 6. Templates: templates.ts

Every `Report` key must have a template. A missing key renders as `[key] {...}`, which is a visible bug.

Start from the shared set and override it:

```ts
import { templates as base } from '../kestrel/templates';
export const templates = { ...base, ...T };
```

The shared set includes the generic engine keys: helm, comms, bridge, validation and posture. **Override every key whose wording names #1's ships or people** that the shared engine can emit in your scenario. #2's overrides (`transportRange`, `teamRange`, `helm_interpose`, `tractorKestrel`, `jumpWithKestrel`, `evacPartial`, `medicalTeam`, `kestrelStabilised`, `promiseBroken`, `incomingHail`, `contactHostile`, `help`, `intro0`–`intro4`, …) are the checklist.

The leak test (`LEAK` in `tests/sim02/helpers.ts`) fuzzes your scenario and fails on any "Kestrel / Vane / Arden / Prefect / Directorate / freighter / [key]" in the log. Adjust the word list if the Directorate legitimately appears in your story.

Characters speak through `comms(characterId, key, vars)` and crew through `say(role, key, vars)`. Templates receive `(vars, state)`.

## 6a. Voices (optional, recommended): `voices` in index.ts

Since v0.6.1 every line in the log carries a voice key, so the speech queue knows who is speaking. Crew roles resolve to whoever holds the post, and your characters get `npc:<scenarioId>:<characterId>`. The bridge crew and the ship's computer are cast first, so their voices are the same in every simulation. Your characters are cast next, onto voices the crew is not using where the device has enough.

Declare how your people should sound in the scenario module:

```ts
voices: (s) => ({
  sabeth: { gender: 'female', locales: ['en-AU', 'en-NZ', 'en-ZA'], pitch: 1.04, rate: 1.06, candidates: ['Karen', 'Catherine'] },
  marr:   { gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 0.86, rate: 0.93, candidates: ['Martha', 'Serena', 'Microsoft Hazel'] },
}),
```

| Field | Meaning |
|---|---|
| `gender` | `'female'`, `'male'` or `'neutral'` |
| `locales` | English BCP-47 locales, best first. On Android, which usually exposes one voice per locale, this is what tells characters apart |
| `candidates` | voice names, best first, matched as whole words. Apple: Samantha, Daniel, Karen, Moira, Tessa, Rishi, Martha, Arthur… Windows: Microsoft Zira, David, Mark, Hazel, George, Catherine… Android codes such as `en-gb-x-gbd` |
| `pitch` | 0.5–1.6, where 1 is normal |
| `rate` | 0.7–1.4, where 1 is normal |
| `label` | optional name for the Crew voices panel |

Rules:
- **If you declare `voices`, declare every character who speaks on comms.** Characters you leave out are not listed and speak in the generic "Other speakers" voice. If you declare nothing, all non-crew characters are cast with neutral defaults.
- Hints may depend on the seed (#1 picks the passenger's voice from who the passenger is).
- Pick traits that make your two contacts sound unlike each other: a different gender, locale or pitch.
- **Do not use these voices:** `Ship computer`, `Narrator` and crew voices belong to the Halcyon.
- `{ label: '…' }` speakers (beacons, open broadcasts) use the generic voice.
- **Test:** add a speaker-tagging case like the ones in `tests/v061/voices.test.ts`. Every spoken line must have a voice key, and your characters must appear in `castMembers(s, scenario)`.

## 6b. Evaluation data (required since v0.7): `evaluation` in index.ts

Every training simulation is an official ISA exercise, and ISA Training Command files an **after-action report** when it ends. The report judges outcomes and judgment, not command sequences, and never shows a score, number or percentage. Your scenario provides the facts it needs in an `EvaluationDescriptor` (`src/evaluation/types.ts`), kept in `src/scenarios/<name>/evaluation.ts` and attached as `evaluation:` on the module. See `src/scenarios/tallis/evaluation.ts` for a complete example.

```ts
export const myEvaluation: EvaluationDescriptor = {
  version: 'myscenario-eval-1',             // bump when the descriptor's meaning changes
  objectives: { diagnose: 'secondary', pilgrims: 'primary' },   // every objective id
  endings: {                                // every ending id in X_ENDINGS, unchanged
    'quarantine-lifted': { tier: 'success', note: 'Evidence persuaded the Warden to lift the quarantine.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left the pilgrims behind.' },
  },
  markers: [                                // scenario-specific judgment signals
    { id: 'diagnosed-first', judgment: 'responsible', competencies: ['scientific', 'analysis'],
      text: 'Established the cause before sending anyone across.',
      when: (s) => before(factTurn(s, 'cause_known'), flagTurn(s, 'medicalSent')) },
  ],
  regulations: ['care-1', 'quarantine-1'],  // handbook article ids (ISA-COM-001, src/handbook) only
  competencies: ['scientific', 'diplomacy'],// what this exercise mainly tests (the roadmap's Command challenge)
  recommend: { scientific: 'Simulator drill: evidence before action.' },
};
```

Rules:
- **Do not change your endings to fit the evaluation.** Tiers (`success`, `partial`, `failure`) describe endings that already exist.
- **Markers describe judgment, not keystrokes.** Use `when(s)` on the final state: flags, facts, counters, the outcome, and `flagTurn` / `factTurn` for "did A happen before B" (they read the turn trace `s.trace`, which the engine keeps for every simulation; it never changes play). Judgments: `responsible`, `decisive`, `principled` (rules upheld at a cost), `reckless`.
- **Different strategies must read differently.** Two runs that reach the same ending by force and by negotiation must produce different conduct, strengths and improvements. A failure reached by upholding the rules must be recognised (a `principled` marker). Test both (see `tests/v07/evaluation.test.ts`).
- **Shared signals come free:** firing first, returning fire, holding fire, weapons locks, ordered fire on non-combatants, shields down under a lock, kept and broken promises, crew and civilian safety. Do not duplicate them.
- **Words only.** Marker text is a full sentence ending with a period. No numbers, scores or percentages.
- **Regulations come from the Captain's Handbook (ISA-COM-001) and nowhere else (since v0.8.0).** The handbook database in `src/handbook/articles.ts` is the single source of every regulation in the game. A simulation:
  - **cites handbook article ids only** (`roe-1`, `care-4`, `quarantine-1` …) in `regulations` and in a marker's `regulation`. Never cite by article number ("B.1") or by prose: numbers can change between editions, ids never do. `tests/v080/handbook.test.ts` fails if any cited id is missing from the database.
  - **adds spoiler-safe training references** to the articles it exercises (the `training` list of each article in `src/handbook/articles.ts`): a training reference names the simulation by catalogue number and title and gives a *training purpose* in one sentence ("Evidence before action: working with the science officer on an unknown illness."). Never describe what happens, who is involved or how it ends. If even the purpose would give something away, mark it after-played: the handbook then shows it only once the Training Record shows the simulation was run. Enforcement notes that name your simulation are likewise withheld until it has been run.
  - **never adds, rewords or renumbers a regulation.** The handbook's wording is approved by the project owner; a scenario author does not change it, even to fit a scene. Keep scenario behaviour consistent with the rules of engagement in `engine/roe.ts` (crew refusals) and with the disciplinary rules in `universe/world.ts` (reviews).
  - **when a scene genuinely needs a rule the handbook does not have**, make it a labelled **exercise objective** (an objective in your scenario, described as a training goal, never as a regulation; exercise objectives are not regulations, Article I.1), and send the project owner a proposal for a new article (suggested chapter, wording, rationale, and which simulations would exercise it). It enters the game only in a later handbook revision.
- **Canon:** evaluations of simulations go only to the Training Record (`starbridge.training.v1`), never to canon.
- **Names:** reports render the captain's chosen name from the profile. Never store or template the captain's name inside the descriptor; never offer a way to rename your ships, characters, worlds or factions.
- **Test:** `tests/v07/evaluation.test.ts` checks every catalogue simulation has a well-formed descriptor. Add to your `tests/simNN/` one test that two strategies reaching the same (or a similar) ending get different conduct, and one that every ending id has a tier.

## 7. Outcomes: outcome.ts

- Export the list of endings with stable ids:

  ```ts
  export const X_ENDINGS = { success: [...], failure: [...] } as const;
  ```

  You need **at least 3 success endings** and **at least 3 failure or partial endings**, each reachable.
- `detectOutcome(s)` checks in a fixed priority order:
  1. the Halcyon lost;
  2. catastrophes;
  3. leaving (`jumped` / `leftReach`);
  4. destruction;
  5. the specific endings;
  6. the `MAX_TURNS` stalemate last.
- **Say what happened and what it cost.** #2 adds the death toll to every summary.
- `computeObjectives(s, ended)` derives 3–5 objectives from state every turn (never set them imperatively). Use `active` / `complete` / `failed` / `missed`.
- Endings may depend on the seed as well as on the player's choices. In #2, towing an *untreated fever* ship becomes "The Long Road", not "Agency Care". That is good: the same orders on different seeds should not always end the same way.

## 8. Seed variation

Seed variation must change **what the right answer is**, not just numbers. #2 varies:
- the cause (which changes the correct medical action and whether persuasion is honest);
- the Warden's temperament (which changes what persuades her and whether she fires through the Halcyon);
- whether her brother is aboard (which opens or closes an appeal);
- Sabeth's patience;
- the souls aboard, the sick count and positions.

Aim for 3–4 independent dimensions, each with 2–3 values.

## 9. Unconventional solutions

Plan at least two routes that are not on the suggestion list, and make them work through:
- the `improvise` `other` description (wards, filters, using a system for something else);
- dialogue substance (asking the *other* side for help, as with the colony antiviral in #2);
- shared mechanics in new combinations (interpose, extend shields, tow and jump).

A good idea should also be able to **recover** a mistake. In #2, an isolation ward set up after an exposure contains it.

## 10. Crew autonomy, refusals and timeline isolation

**Crew autonomy and refusals:**
- These come from the shared engine (`roe.ts`, validation) and work if your classifications and souls are right.
- Test at least one refusal.

**Timeline isolation:**
- A scenario never touches `src/universe/`. Sessions, provenance and canon are handled by the Universe API.
- Test that playing your scenario to an ending through `Universe.startTraining` leaves canonical storage byte-identical.

## 11. Required tests (tests/simNN/)

Copy `tests/sim02/` and adapt it. The minimum is:

1. **Setup:**
   - same seed gives an identical world;
   - invariants hold;
   - the cast and slots are right;
   - hidden facts start hidden;
   - the intro plays to yellow alert with objectives;
   - no leaks in the intro.
2. **Every ending by scripted playthrough:**
   - use plain-English orders through `submit` (the offline interpreter), with `checkInvariants` after every order;
   - a final test asserts every id in `X_ENDINGS` was reached;
   - an ending that can only arise from shared rules (e.g. the Halcyon destroyed) may be forced through state. Say so in the test name.
3. **Seed sweep:**
   - the same plan on 60 seeds gives at least 3 distinct endings, including a success;
   - doing nothing gives more than one failure ending.
4. **Characters and hidden information:**
   - revelations need the right question or scan;
   - persuasion needs evidence;
   - an NPC acts on its own clock;
   - one unconventional route;
   - one crew refusal.
5. **Fuzz:**
   - about 40 random games from an order pool (including gibberish);
   - every invariant after every order;
   - no name leaks.
6. **Catalogue, launch and archive** (`catalogue.test.ts` covers every entry automatically):
   - add your names to the name-resolution cases;
   - add a `begin the <name> simulation` launch case.
7. **Saves:** save, load and resume as the same scenario.
8. **Canon untouched:** see §10.
9. **Evaluation (§6b):** every ending has a tier; two strategies are told apart; a principled failure is recognised.

Then:
- **Smoke:** add a block to `scripts/smoke.mjs` that does three things: list simulations, launch yours by name and play a known seed to an ending. It saves screenshots named `simNN-*.png`.
- **Run:** `npm run -s typecheck`, `npm run -s lint` (check `echo $?`), `npx vitest run`, `npm run -s build`, then the smoke test against `vite preview`.

## 12. Daily-run checklist

1. Pick the lowest-numbered **planned** entry in the roadmap and mark it **in progress**.
2. **No-overlap check (before any code).** Re-read the roadmap's Overview and Overlap review, and every **done** entry. Stop and revise the premise if the new simulation repeats another's:
   - **core situation:** e.g. a vulnerable ship and an armed one with the Halcyon in the middle (#1 and #2 already use it; no further simulation may), contagion (#2 owns it), a derelict to explore (#8 owns it), a pirate attack (#15 owns it), a hostage-taker (#19 owns it), first contact (#3 owns it);
   - **central dilemma:** the hard choice the captain faces;
   - **solution shape:** if the same plan of orders would win both, they are the same event.

   Seed variants count too: a variant must not turn this simulation into another one.
3. **Challenge-variety check.** The entry's *Command challenge* must actually decide the outcome:
   - The **primary** skill (deduction, a gut call, relying on the science officer, the comms officer cracking a code, the engineer improvising, reading people, restraint, crew leadership, triage, timing, bluffing, ethics under orders, mediation, and so on) must be **necessary**. At least one success ending must be out of reach without it.
   - The **pivotal officer's** expertise must be **necessary** for at least one success ending: their report, decode, repair or judgement unlocks it, and the captain chooses whether to trust it.
   - **Variety:** it must not share its primary skill or its pivotal officer with the previous simulation, and no primary skill may be used more than three times across the library.
   - **Writing the tests:** add one scripted playthrough that wins *through* the primary skill. Add one that fails *for lack of* it (for example, acting before the science is in, or trusting the lie).
   - **Changes:** if the challenge or premise changes while building, update the roadmap's Overview, Variety check and Overlap review in the same commit.
4. Write `src/scenarios/<name>/`: setup, agents, hooks, dialogue, outcome, templates, evaluation (§6b, required), index (including `voices` hints, §6a, and `evaluation`). Copy #2 and replace its content.
5. Add the catalogue entry and the registry line.
6. Write `tests/simNN/` (§11) and play each ending yourself first (a scratch `_explore.test.ts` that prints the log is the fastest way; delete it afterwards).
7. Add the smoke block.
8. Update the README scenario list and the CHANGELOG, and bump the patch version (e.g. 0.7.0 to 0.7.1); minor versions are reserved for milestones.
9. Run all checks, commit in small chunks, push (no force), confirm Vercel READY, and run the live smoke test. Mark the entry **done** in the roadmap once it is live and verified.

## 13. Known limits of the shared engine (v0.6)

- **Three ship slots only** (Halcyon, contact A, contact B), plus one optional passenger character. A scenario with more vessels must represent them through state (counters, facts), not ships.
- **The viewscreen draws contact A with the freighter silhouette and contact B with the warship silhouette.**
- **The interpreter's built-in ship words** ("freighter", "cruiser", "warship") still map to slots A and B in every scenario. Your aliases are added on top of them.
- **Shared combat damage to contact A also lowers `containment`** (a Kestrel reactor mechanic). Ignore `containment` in your scenario.
- **Generic shared template keys are written for #1.** Override what your scenario can emit (§6).
