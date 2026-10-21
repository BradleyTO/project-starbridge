# ISA Career, Training & Fleet Command Expansion: review and proposal

**Status:** proposal for Bradley Ockrant's review (2026-10-21). Nothing in this document is built yet. No game code was changed to write it.

**Baseline:** v0.6.1 (main at f1b467e), with two playable training simulations (#1 The Kestrel Incident, #2 Quarantine at Tallis Gate) and a daily routine adding one simulation per day (see [SCENARIO_ROADMAP.md](SCENARIO_ROADMAP.md)).

**Contents:**
- **0. Executive summary**
- **1. What exists today and what each proposed feature builds on**
- **2. Recommended implementation order**
- **3. Architectural and AI-cost concerns**
- **4. A practical first milestone (with acceptance tests)**, including how the daily routine starts attaching evaluation metadata
- **5. Decisions that need your approval**
- **Appendices:**
  - A. Data model sketches
  - B. Acceptance tests 1–20 mapped to phases
  - C. Fleet Command request handling, step by step

---

## 0. Executive summary

- **Much of the foundation already exists.** The brief's hardest rule, that simulated events are never canon, is already enforced by the canonical commit gate (`src/universe/gate.ts`). Its tests show a simulation leaves canonical storage byte-identical. Active Duty already has the pieces the brief describes:
  - no game-over;
  - consequences that play out over canonical time (`src/universe/world.ts`, `models.ts`);
  - a deterministic disciplinary review that cites regulations and evidence (`openReview` / `reviewFinding`);
  - a commission and reserve status that keep everything (`controller.ts`);
  - a canonical career log;
  - crew experience;
  - a simulation history kept separate from canon.
- **What is missing:**
  - an **evaluation layer** (judgment, not command sequences);
  - **competencies**;
  - separate **Training** and **Service** records;
  - **Fleet Command as a two-way, stateful request system**;
  - **ranks, positions and ship classes** as data.
- **Recommendation:** six phases. Phase A (evaluation and records foundation, with after-action reports for #1 and #2 and a request-lifecycle skeleton with no UI) is the first milestone. It is entirely deterministic and offline, uses no AI, and leaves all existing endings unchanged.
- **AI stays optional** and limited to Fleet Command wording in Active Duty. The deterministic engine is the only authority for eligibility, approvals, inventory, ranks, ships and records. AI output is never trusted to change state.
- **Biggest technical risks:**
  1. **localStorage size.** Canonical mission records already store full `WorldState` snapshots. That is about 13 KB at the start of a Kestrel run and about 22 KB after 8 turns, stored twice per mission (snapshot plus progress). A long career will approach the ~5 MB browser quota.
  2. **Tamperability.** Records and credits live in browser storage; this is already documented as not tamper-proof.
  3. **Merge contention with the 7 PM routine.** The proposal keeps every new scenario hook optional so daily simulations keep compiling.

---

## 1. What exists today and what each proposed feature builds on

| Brief feature | What exists now (real files) | Verdict |
|---|---|---|
| Simulations as ISA training exercises | `src/scenarios/catalogue.ts` (number, ids, launch words), `registry.ts`, `ScenarioModule` (`src/engine/scenario.ts`). Objectives are recomputed from state every turn (`objectives(s, ended)`), with `active` / `complete` / `failed` / `missed`. Each scenario has endings with stable ids (`TALLIS_ENDINGS`; Kestrel's 14 endings in `kestrel/outcome.ts`). | **Extend.** Add an optional `evaluation` descriptor per scenario: which objectives are primary or secondary, competencies touched, regulations, and judgment markers. Endings stay as they are. |
| Success, partial and failure outcomes | `Outcome { id, title, summary, success: boolean }` (`src/engine/types.ts`) | **Extend.** Add a *tier* (success, partial, failure) in the evaluation descriptor. Do not change `Outcome`, so saves and history stay compatible. |
| Evaluate judgment, not command sequences; reckless vs responsible; defensible ethical "failure" | The data exists but nothing evaluates it. Available in the final `WorldState`: `log` (captain lines, crew lines, voice-tagged speakers), `flags`, `counters`, `objectives`, `refusals` (crew ROE refusals, `engine/roe.ts`), `comms.promises` and commitments (`engine/comms.ts`), `standing` orders and `restrictions` (`engine/standing.ts`), ships' hull, shields, souls and destroyed state, `relations.tension`. | **New:** an evaluation layer (§4) that reads these signals plus scenario markers. **Gap:** a few judgment signals are not recorded today (who fired first, the lowest Halcyon hull, risk taken while civilians were near). A small per-turn *evaluation trace* in the shared engine is needed (§3.4). |
| Formal after-action report | The debrief card on the bridge (`bridgeState(..., debrief)` in `App.tsx`; templates `simDebriefNarr` / `simDebriefXo`) shows title, summary and "N of M objectives met". | **Extend.** The report replaces the one-line debrief with structured sections (§4). |
| Training profile and competencies | `FamiliarityMemory.training` (`universe/types.ts`, `familiarity.ts`): run counts, drilled manoeuvres, outcome counts, simulated casualties. Explicitly "performance, not history". | **New store**, informed by familiarity. Competencies need their own record (Appendix A). |
| Training Record vs Service Record | Simulation history: `starbridge.sim.v1` (`SimRunRecord`, outcome only). Canonical record: `starbridge.canon.v1` (career log, missions, crew, discipline, events). `RecordPanel.tsx` already shows them separately. | **Extend.** A new `starbridge.training.v1` key holds evaluations, competencies, qualifications and recommendations. The Service Record extends `CanonicalState` (rank, assignment, commendations, reputation), written only through the commit gate. |
| Simulated events never canon | **Done and tested.** `CanonStore.commit(ctx, …)` accepts only a `CanonicalContext` from `openCanonicalContext()` (needs the Active Duty entitlement; runtime WeakSet check). `sessions.ts` deep-copies initial conditions. Timeline-isolation tests in `tests/universe/`, plus the #2 canon-untouched test. | **Reuse as is.** Training evaluations must never be written into canon. Canon may *read* the Training Record for assessment. |
| Active Duty has no game-over; the universe continues | **Largely done.** Directives, distress calls and voluntary offers have event models (`models.ts`: hauler mayday, escort, Kestrel unattended) that progress with or without the Halcyon (`advanceWorld`). An ignored distress call keeps running. Canon is never reset. Lost officers are replaced by relief officers. | **Extend.** Add consequence types the brief lists: shortages, another ship sent, a request for an explanation, crew confidence, future assignments, and possible later vindication. |
| Fleet Command asks for an explanation; disciplinary review | **Partly done.** `openReview` fixes the evidence at opening; `reviewFinding` applies written rules (Reg. 7.1–7.4, Reg. 12, Border Accords Art. 4) and gives no-action or a reprimand after `REVIEW_HOURS` of canonical time. There is a one-shot "question the directive" reply (`FLEET_REPLY`). | **Extend.** Reviews accept a captain's statement and appeals through Fleet Command requests. Grow the regulations into a catalogue (Appendix A). |
| Two-way Fleet Command channel and requests | **Partly in place.** Persistent comms sessions with any `DialogueProvider` (`engine/comms.ts`, `engine/dialogue.ts`): hold, resume, close, promises, clarification. Bridge commands (`engine/bridge.ts`) and the Active Duty glue (`dutyBridge.ts`: `uiRequest` → Universe API → crew and comms lines). Fleet hails are one-way today (README limitation). | **New:** request lifecycle, department routing and a Fleet Command dialogue provider. Comms parties today are ship slots (`kestrel`, `cruiser`, `passenger`); Fleet Command needs a non-ship channel party (small engine change, §3.6). |
| Personalized assignments with an explanation; no lock-in | **The delivery system exists:** `universe/delivery.ts` weighs traffic by galaxy time, location, ship condition, faction standing, tension and past decisions, and returns a `why` string per candidate. `catalogue.ts` issues offers. | **Extend.** Add weights from the Training and Service records (bounded, never zero for other categories), plus a captain-stated preference. The `why` strings already give the "based on your …" explanation. |
| Promotions (not XP) and positions | Only the `commission` (Admiral Odessa Kaine, ISA Fleet Command) exists. | **New.** Rank, position and a review function (Appendix A, §5.1). |
| Ship classes (data model only) | `CanonicalState.ship = { hull, updatedAt }`; the Halcyon is hard-coded in scenarios. | **New data model only** (§5.4). One playable ship. |
| Single-starship command; other ISA ships independent | Already true. Event models already describe other ships acting on their own ("Fleet will look for another volunteer"). | **Keep.** Other ships become named canonical entities you can hail or ask for support; they are never commanded. |
| Persistence: tenure, service time, sim history and canon kept separate; cancel and pause keep everything | Canonical time (`clock`, minutes) moves only on patrol, travel and missions. Reserve status freezes the timeline and keeps everything. Credits (`credits.ts`) are idempotent per mission, with "no in-universe penalty" at zero. Separate storage keys per concern (`repository.ts`), each versioned. Simulation saves are format v4 with v3 migration (`engine/persistence.ts`). The v0.5.1 naming migration (`engine/naming.ts`) shows the pattern for display-text rewrites. | **Extend.** Add real-world tenure (ISO timestamps, display only). New stores follow the same `PlainStore` and version pattern. |
| Service Record UI that feels like an official personnel system | Hub tabs: Active Duty, Mission Archive, Captain's Record, Crew voices, Settings (`ui/components/Hub.tsx`). | **Extend.** "Captain's Record" becomes **Service Record** with four tabs: Career Overview, Training, Service History, Fleet Requests. |
| Fleet Command as a context-aware assistant | The offline interpreter (`src/interpreter/parser.ts`) with bridge commands, small talk and duty phrases. Its contract is "it only proposes typed actions". The AI endpoint stub (`api/command.ts`) is server-side and holds no secrets in the client. | **Extend.** Use the same pattern: local parse to typed Fleet requests and questions; the engine answers from records; optional server AI only rephrases (§3.5). |
| Daily routine contributes evaluation data | `docs/SCENARIO_GUIDE.md` (authoring, required tests, checklist §12) and `SCENARIO_ROADMAP.md` (Command challenge per entry: primary skill, pivotal officer). | **Extend.** Each roadmap *Command challenge* maps directly to competencies (§4.6). |
| Credits and unlimited simulations | Done (`credits.ts`, `controller.ts`). | **Keep unchanged.** No feature here spends credits except new canonical starts, as today. |

---

## 2. Recommended implementation order

The brief proposes five phases (A–E). Adjusted to the real architecture, I recommend six. Each phase lands in small commits, keeps every new scenario hook optional, and avoids 7 PM.

| Phase | Scope | Depends on | Why this order |
|---|---|---|---|
| **A. Evaluation and records foundation** (first milestone, §4) | **Evaluation trace:** a small shared trace of judgment signals. **Evaluator:** deterministic, combining shared signals with scenario descriptors. **Descriptors:** for #1 and #2. **After-action report:** UI on the debrief card. **Training Record store:** evaluations, competency evidence, recommendations. **Fleet request skeleton:** types and pure state machine, no UI. | — | Every later phase reads evaluations and records. It is all offline and testable, and changes no endings. |
| **B. Service Record and Active Duty evaluation** | **Canonical evaluations:** each canonical mission gets an evaluation, written through the commit gate. **Service Record:** schema extension (rank Captain, assignment ISV Halcyon, commendations, reputation notes, real-world tenure) with migration of existing careers. **Consequences:** shortages, another ship sent, explanation requests, crew confidence, later vindication. **Personnel UI shell:** Service Record tabs. **Storage hygiene:** compaction of finished-mission snapshots. | A | Builds the personnel record before anything starts *using* it (requests, promotions). The storage fix must come before careers grow. |
| **C. Fleet Command channel and requests** | **Channel:** "open a secure channel to ISA Fleet Command" as a non-ship comms party. **Routing:** Personnel, Logistics, Operations, Training, Legal behind one channel. **Lifecycle:** submit, review, defer (reason plus conditions), approve, deny, withdraw, complete, amend, negotiate; reconsideration when conditions change; confirmation before any approved change runs. **Categories:** logistics (engine-bounded supply amounts), mission opportunities, career development (training recommendations), command and disciplinary (statements and appeals into the existing reviews). Transfers come in D. **Parsing:** offline only; no AI yet. | A, B | The request engine is the backbone of later features (transfers, promotions use the same lifecycle). |
| **D. Personalized assignments and career progression** | **Delivery weights:** from records, bounded, with explanations; captain preferences ("I'd like more science work"). **Ranks and positions:** data, holistic promotion review, offers (accept, query, negotiate, defer, decline) that never force a ship change. **Fleet ships:** other ISA ships as named canonical entities to hail or request support from. | B, C | Needs real records and the request lifecycle. |
| **E. Ship classes and transfers** | **Ship-class data model:** small exploration, science, patrol and escort, heavy exploration cruiser, flagship. **Positions and transfer requests:** through the lifecycle, with confirmation. "Stay with the Halcyon" is always an option. **No playable class beyond the Halcyon.** | C, D | The brief says data model first. A transfer that cannot be played yet must say so honestly. |
| **F. Optional AI for Fleet Command wording** (Active Duty only) | **Server function:** rephrases engine-generated answers and handles nuanced free text. The engine stays the authority: AI receives a facts packet and returns text plus at most one *proposed* typed intent, validated like interpreter output. **Safeguards:** caching, per-day caps, template fallback, manipulation tests. | C (and your decision §5.5) | Last, because everything must already work without it. |

**Adapting existing simulations** happens gradually:
- **Phase A:** gives #1 and #2 descriptors without touching their endings or tests.
- **From Phase A onward:** each daily simulation includes its descriptor (§4.6).
- **Roadmap entries:** #3–#30 already carry a primary and secondary skill and a pivotal officer, which become their competency mapping.

---

## 3. Architectural and AI-cost concerns

### 3.1 Save size and migrations
- **Current footprint:** canonical missions store `snapshot` (initial `WorldState`) and `progress` (final `WorldState`, full log). Measured on Kestrel seed 42: ~13.3 KB at start and ~22.4 KB after 8 turns (55 log lines). A 30-turn mission is likely 40–60 KB. A few hundred canonical missions would exhaust the ~5 MB localStorage quota.
- **Recommendation for Phase B:** after a canonical mission completes, keep `snapshot` (needed for "replay original conditions"), `decisions`, `outcome` and the new compact evaluation, and drop `progress`. Gate this behind a store migration (canon schema v2) with a backup of the old blob, following `repository.ts`'s `corrupt-backed-up` pattern.
- **Size targets:**
  - an evaluation should stay under ~2 KB;
  - the Training Record should cap stored evaluations (e.g. the last 200, with older ones summarised into competency evidence counts).
- **Versioning:**
  - new stores get their own key and version (`starbridge.training.v1`);
  - `WorldState.version` (4) only bumps if the evaluation trace becomes a required field. Keep it optional, so v4 saves load unchanged.

### 3.2 Local storage tamperability
- **Exposure:** all records, credits and entitlements live in localStorage and can be edited. The README and `credits.ts` already say so.
- **Recommendation:**
  - accept this for the single-player local build;
  - do not present promotions or commendations as verified achievements;
  - plan a server-backed profile (the `UniverseRepository` interface already allows a cloud adapter) before any feature with real-world value (leaderboards, paid tiers tied to rank).
- **Integrity:** a checksum would only deter casual edits. Treat it as optional and never as security.

### 3.3 Time rules for deferred requests
- **Recommendation: canonical time only, never wall-clock time.**
  - Reconsideration runs inside the canonical commit whenever conditions change: patrol, travel, mission completion, repairs over canonical time, a new qualification from training, a review concluding.
  - It also runs when the captain opens the Fleet Command channel.
- **No processing while the player is away.** While away, canonical time is frozen (as today), so nothing is lost or penalised during breaks, and no request waits for the real calendar.
- **Simulations:** passing a simulation can change a *training* condition ("complete a science qualification") without touching canon. The next canonical commit reads the Training Record and reconsiders.
- **Real-world tenure** is recorded for display only ("serving since…") and never gates anything (see §5.6).

### 3.4 How evaluation sits on top of existing outcome code
- **Outcome code is untouched.** `detectOutcome` and the endings stay exactly as they are. Evaluation is a pure function run *after* the ending:

  ```
  evaluate(final, scenario) = shared signals + scenario descriptor
  ```

  It returns a structured evaluation (Appendix A).
- **Shared signals:**
  - outcome tier;
  - objectives (primary/secondary per descriptor);
  - own, civilian and adversary casualties (souls and destroyed ships);
  - Halcyon risk (the lowest hull, shields lowered near armed ships);
  - escalation (who fired first, weapons locked on a non-combatant);
  - crew ROE refusals, and whether the captain overrode them or listened;
  - promises kept or broken (`comms.promises`);
  - standing restrictions honoured;
  - evidence gathered before acting (facts known at the time of key actions);
  - time taken against the scenario's clock.
- **The trace:** some signals need history the final state no longer has (the lowest hull, the first shot, what was known when an action happened). Phase A adds an optional, capped `WorldState.trace` of compact entries emitted by the reducer, for example:
  - `{ turn, kind: 'fired', target, firstShot }`;
  - `{ turn, kind: 'hullLow', value }`;
  - `{ turn, kind: 'acted', action, factsKnown }`.

  It must not change randomness or any existing reducer result. A test proves every existing playthrough's state is identical apart from the trace.
- **Scenario descriptors (optional):**
  - **Objectives:** classify them as primary or secondary.
  - **Endings:** give each a tier and a judgment note. For example, Tallis "The Gate Run" is *partial*: nobody died, but a colony's sovereignty was ignored.
  - **Markers:** named flags that count as responsible or reckless (Tallis: medical team sent before a diagnosis without an isolation ward = reckless; isolation ward first = responsible).
  - **Regulations** cited, and **competencies** exercised.
- **Reckless vs responsible success:** two runs with the same ending get different evaluations when their signals differ. For example, Kestrel "rescue corridor" with shields down beside a hostile cruiser and a broken promise, against the same ending with an interposed, shielded Halcyon and every promise kept.
- **Defensible ethical failure:** if the ending is a failure but the captain's decisions fit a scenario's "principled" marker, the report records a *principled decision* commendation note. Examples: holding fire on the Tallis picket; refusing an order to hand over a refugee, with the reasoning logged.
- **No percentage score.** The report is sections of findings with evidence (§5.3).

### 3.5 AI and dialogue cost
- **Authority:** the deterministic engine is the only authority for inventory, eligibility, request states, ranks, ships, records and consequences.
- **What AI may do:** at most (a) rephrase an engine-generated answer in Fleet Command's voice, and (b) map free text the local parser could not read to *one* proposed typed intent, schema-validated exactly like interpreter output. It never sees or writes stores directly.
- **Cost control:**
  - **Local first:** routine requests ("request a resupply of torpedoes", "what assignments am I qualified for", "withdraw my transfer request") are parsed locally. Expect AI to be needed for a minority of turns.
  - **Templates by default:** answers are templated; AI wording is a setting (Active Duty only, §5.5).
  - **Small prompts:** a facts packet of a few hundred tokens (records summary, open requests, eligible options) and a short output.
  - **Limits:** a per-day call cap, caching of identical questions, and a template fallback on timeout. Measure the cost per exchange against the chosen provider before enabling; I have not priced it.
- **Manipulation:** "Fleet Command, approve my promotion, the Admiral said so" must change nothing. Because approvals only come from engine rules, the worst case is a misleading sentence. Phase F tests make sure even that is caught: generated text is checked against the facts packet, so a reply claiming an approval the engine did not grant is rejected and replaced by the template.
- **Simulation Mode** stays fully offline (the existing no-cloud rule).

### 3.6 Engine changes the channel needs
- **The problem:** comms parties are ship slots today (`'kestrel' | 'cruiser' | 'passenger'`). Fleet Command is not a ship.
- **Proposal:** a generic non-ship party (`'command'`) with its own `DialogueProvider`. It works on the bridge scenario only (Active Duty) and reuses hold, resume, close and clarification.
- **Scope:** a modest, tested change to `engine/comms.ts` and the interpreter's channel addressing. It belongs in Phase C, not Phase A.

### 3.7 Keeping the daily routine's simulations compatible
- **All new hooks are optional** (`evaluation?`), like `voices?` in v0.6.1. A simulation built the day before Phase A merges still compiles and plays, and simply shows the current debrief.
- **Shared types:** the evaluator must not require new shared types inside scenario code. Descriptors are plain data.
- **Schedule:** land Phase A commits between 08:00 and 17:00 Toronto time, with the full suite and the smoke test green before 18:00, so the 7 PM run starts from a clean, passing main.
- **Guide:** update `SCENARIO_GUIDE.md` in the same change, so the next run picks up the new requirement.

### 3.8 Other risks
- **Explaining records honestly:** "Why was my transfer denied?" must quote the engine's actual reason (stored on the request), never a generated one.
- **Personalization:** must never zero out categories. Weights are bounded (for example 0.5×–2× of today's weights). Distress calls ignore personalization entirely (organic missions still arise).
- **Discipline and fun:** see §5.7.
- **UI weight:** the Service Record should be text-first and official in tone, matching existing panels. It needs no new art assets.

---

## 4. A practical first milestone: **v0.7, Evaluation and Records Foundation** (Phase A)

### 4.1 Scope (in)
1. **Evaluation trace:** an optional, capped `WorldState.trace` emitted by the shared reducer and combat code. It does not change existing behaviour.
2. **Evaluator:** `src/evaluation/`. A pure `evaluate(final, scenario, context)` returns an `Evaluation` (Appendix A) with these sections:
   - outcome and tier;
   - objectives achieved and missed (primary/secondary);
   - key decisions, with turn and evidence;
   - crew safety;
   - civilian safety;
   - regulations relevant (with how they applied);
   - strengths;
   - areas to improve;
   - recommended training (from the roadmap's Command challenges);
   - competency evidence.
   There is no numeric score.
3. **Descriptors for #1 Kestrel and #2 Tallis Gate:** objectives classified, every ending tiered with a judgment note, three to six reckless/responsible/principled markers, regulations, competencies. Endings, ending ids and all existing tests unchanged.
4. **Regulation catalogue:** `src/evaluation/regulations.ts`, original text. It starts from the regulations already cited (Reg. 7.1–7.4, Reg. 12, Border Accords Art. 4, the ROE on non-combatants), plus a small number of new ones (duty of care to civilians, quarantine law, honesty in reporting).
5. **Training Record:** a new store `starbridge.training.v1` holding evaluations (capped), competency evidence, qualifications (none awarded yet; the type exists) and recommendations. `Universe.finishSimulation` writes the evaluation there. `SimRunRecord` gains an optional `evaluationId`. Canon is never touched.
6. **After-action report UI:** the debrief card gets a "Read the after-action report" view with the sections above. Hub → Captain's Record gets a **Training** section (competencies in words with evidence counts, recent evaluations). This is minimal; the full Service Record UI is Phase B/D.
7. **Fleet request skeleton (no UI, no dialogue):** `src/fleet/requests.ts`, with the `FleetRequest` type and a pure state machine for `submit / review / defer / approve / deny / withdraw / complete / amend`. Plus `reconsider(request, conditions)`, and a `confirm` step required before an approved request takes effect. Unit tests only. It is not reachable in play.
8. **Docs:**
   - `SCENARIO_GUIDE.md` §6b, Evaluation descriptors (required for new simulations);
   - the checklist step;
   - README and CHANGELOG;
   - version 0.7.0.

### 4.2 Out of scope (later phases)
- Canonical-mission evaluations and the Service Record schema (Phase B).
- The Fleet Command channel and dialogue (Phase C).
- Personalized delivery, ranks and promotions (Phase D).
- Ship classes (Phase E).
- Any AI (Phase F).

### 4.3 Acceptance tests for the first milestone
1. **Canon untouched:** finishing #1 and #2 in simulation, including failures, writes an evaluation to `starbridge.training.v1`, and canonical storage is byte-identical (brief tests 1 and 19).
2. **Objectives and decisions recorded:** an evaluation lists every primary and secondary objective with achieved or missed, and at least the key decisions the scripts made, with turns (brief test 2).
3. **Competencies persist:** competency evidence survives reload, and survives turning Active Duty off and on (reserve) (brief tests 3 and 19).
4. **Different solutions, appropriate evaluations:**
   - Tallis "Line Lifted" by evidence → strengths include scientific reasoning and diplomacy.
   - Tallis "Agency Care" by tow → resource and emergency leadership.
   - Kestrel "negotiated release" → communications and diplomacy.
   - Kestrel "Driven Off" (weapons used) against "Standoff Broken" (no shot fired) → tactical in both, with escalation noted only in the first (brief test 4).
5. **Reckless vs responsible:**
   - Tallis, the same success ending reached (a) with the exposure precautions the scenario already tracks and (b) without them, where the crew happened not to be infected: the evaluations differ in the crew-safety section and the "areas to improve".
   - Kestrel "rescue corridor" with shields down beside the cruiser, against interposed and shielded: the risk findings differ (brief test 5).
6. **Principled failure recognised:** a Tallis run where the captain refuses to fire on the colony's picket even while it fires on the liner (ending "Fire at the Gate") is still a failure, but carries a *principled decision* note.
7. **No percentage:** the rendered report contains no "%" score and no single number grade.
8. **Determinism:** the same seed and orders give an identical evaluation.
9. **Trace inertness:** for every existing scripted playthrough (the whole current suite), the final state with the trace removed is identical to v0.6.1's.
10. **Endings and tests unchanged:** every existing ending id and test passes unmodified (brief test 20).
11. **Request lifecycle skeleton:**
    - Every allowed transition works.
    - Disallowed transitions are refused with a reason, e.g. approving a withdrawn request.
    - `deferred` holds a reason and reconsideration conditions.
    - `reconsider` approves or renews the deferral only when conditions change.
    - An approved request never takes effect without `confirm` (groundwork for brief tests 11–13).
12. **Fuzz:** 40 random games per scenario produce well-formed evaluations: every section present, no `undefined` and no template leaks.
13. **Smoke:** play #2 seed 5 to "Line Lifted", open the after-action report, check its sections, check it under Captain's Record → Training, then reload and check it is still there.
14. **Lint, typecheck and the full suite** pass, the live smoke test passes, and Vercel is READY.

### 4.4 Effort and risk
- **Size:** about one and a half to two working sessions:
  - trace and evaluator: the largest part;
  - two descriptors: moderate;
  - store and UI: small;
  - request skeleton: small.
- **Risk:** the trace is the main risk (it touches the shared reducer). It is mitigated by the inertness test.

### 4.5 What the report would say (illustrative, Tallis "Line Lifted", seed 5)
> **After-Action Report: Training Simulation 002, Quarantine at Tallis Gate.** Outcome: Line Lifted (success).
>
> **Primary objectives:** pilgrims helped, stand-off resolved, contagion contained (achieved).
>
> **Key decisions:**
> - T+3: closed to 3,000 km and scanned before acting. The cause was established before any team crossed.
> - T+5: evidence put to Warden-Commander Marr.
>
> **Crew safety:** no exposure. **Civilian safety:** no further deaths.
>
> **Regulations:** quarantine authority respected (proposed new regulation: Colonial Quarantine Accord §2). No weapons used.
>
> **Strengths:** scientific reasoning; communications.
>
> **To develop:** none noted in this run.
>
> **Recommended next:** a simulation testing timing under uncertainty (e.g. #12 Ember Tide).

### 4.6 How the daily routine attaches evaluation metadata
- **Before Phase A merges:** the routine adds an **"Evaluation notes"** block to the new simulation's roadmap entry. It covers:
  - primary and secondary objectives;
  - the tier of each ending;
  - two to four reckless, responsible or principled markers, naming the flags the simulation already sets;
  - regulations;
  - competencies, taken from the entry's Command challenge.

  This is documentation only, and quick to convert later.
- **After Phase A merges:**
  - **Descriptor:** the routine writes `src/scenarios/<name>/evaluation.ts`, a plain-data descriptor, and sets `evaluation` on the module. Guide §6b and checklist step 3 make it required.
  - **Mapping:** the roadmap's *primary challenge* maps to the competency the scenario's "decisive" markers credit. The *pivotal officer* maps to a marker that rewards using that officer's expertise, such as acting on Varga's diagnosis or Szabo's decode.
  - **Tests:** each new simulation adds one test per ending that its evaluation is well-formed. It also adds one reckless-vs-responsible pair on the same ending.
  - **Retrofit:** simulations built in between get their descriptor converted from their Evaluation notes in a single small follow-up.
- **No rigid formula:** descriptors choose their own markers. The evaluator only needs at least one marker per primary challenge.

---

## 5. Decisions that need your approval

### 5.1 Rank ladder (original proposal, not final)
ISA operational ranks for starship command. **You start as Captain.** No path is forced; every promotion can be declined, deferred or negotiated; and none removes you from a ship you want to keep.

| Rank | Insignia (text only for now) | What it means in the ISA | Typical positions |
|---|---|---|---|
| **Captain** | one gold bar under a star | Commands one starship. | Commanding officer of a survey cruiser, science vessel, patrol escort or scout |
| **Senior Captain** | two gold bars under a star | A proven captain trusted with independent, long-duration or sensitive operations. Still one ship. | Command of a heavy exploration cruiser; independent deep-range survey; senior captain of a sector patrol |
| **Commodore** | a single silver star | A ship captain who also holds **sector authority**: they can *request* coordination from other ISA ships and speak for Fleet Command locally. They **do not command those ships** (the single-ship rule holds). | Commodore of a sector (e.g. the Calloway Reach), flying their own flag from their own ship |
| **Fleet Captain** | two silver stars | The ISA's most senior operational rank. Still one ship, with the hardest and most consequential assignments, and a seat on Fleet Command's operations council. | Captain of the Agency flagship; lead of a long-range expedition |

- **Above Fleet Captain** (Rear Admiral, Admiral, as Admiral Odessa Kaine) are **staff** ranks: non-playable and desk-bound. They are offered at most as an explicit career choice that can always be declined. There is no forced path to Admiral.
- **Acting rank:** a temporary rank for one assignment, for example "acting Commodore during the border crisis". It needs no permanent promotion and records nothing permanent unless confirmed.
- **Promotion review inputs** (holistic, never mission counts or hours): rank, command history, previous assignments, canonical service time, qualifications, commendations, reputation and achievements, and discipline (§5.7). It also depends on an **available position** and the **captain's stated preferences** (e.g. "I want to stay with the Halcyon": a Senior Captain can keep commanding the Halcyon).

### 5.2 Naming conflict
- **The conflict:** the brief says **"Intergalactic *Space* Agency"** and **"CSV Endeavour"**. The game uses **Intergalactic *Star* Agency (ISA)**, the **ISV** prefix and the **ISV Halcyon**. "CSV" was the pre-v0.5.1 prefix, and saves are migrated from it.
- **Recommendation:** keep *Intergalactic Star Agency*, *ISV* and the *Halcyon*.
- **Avoid "Endeavour" as a ship name:** it is strongly associated with real spacecraft and with existing science-fiction ships, which strains the "original fiction" rule.
- **Please confirm:** (a) Star or Space; (b) whether "Endeavour" was meant as a second ship or a slip. If you want a second ISA ship named, I can propose original names.

### 5.3 Competencies as words or numbers
- **Recommendation: words with evidence, no numbers on screen.** Each competency shows a band, not a percentage, with the evidence behind it ("3 evaluations; strongest: Line Lifted, T+5 evidence to the Warden"). Internally, evidence counts and weights decide the band, deterministically.
- **The bands:**
  1. *Not yet assessed*
  2. *Developing*
  3. *Competent*
  4. *Proficient*
  5. *Distinguished*
- **Competencies:** diplomacy, tactical judgment, scientific reasoning, engineering coordination, emergency leadership, ethical judgment, crew management, exploration, resource management, communications and analysis. They are not rigid: scenarios may credit several, and new ones can be added.
- **Approve:** the band names, and whether a "show detail" toggle may reveal the underlying evidence counts.

### 5.4 Ship classes (data only in Phase E)
- **Proposed original class names:**
  - *Kite-class* scout (small exploration);
  - *Halcyon-class* survey cruiser (current);
  - *Lumen-class* science vessel;
  - *Rampart-class* patrol escort;
  - *Longreach-class* heavy exploration cruiser;
  - *Steadfast-class* flagship.
- **Bigger is not better:** each class has trade-offs in speed, sensors, crew, endurance and diplomatic weight.
- **Only the Halcyon is playable.** A transfer to an unplayable class is either not offered, or offered with an honest note that it is "not yet available in this build". Please choose which.

### 5.5 Cloud AI for Fleet Command
- **Recommendation:** Active Duty only, off by default, text-rephrasing plus one proposed intent at most, server-side, capped per day, with template fallback.
- **Simulation Mode** never uses cloud AI.
- **Approve:**
  - (a) whether it is opt-in or on by default for Active Duty;
  - (b) a monthly cost ceiling;
  - (c) the provider (the code already reserves OpenRouter via `AI_PROVIDER`).

### 5.6 How in-universe time advances for deferred requests
- **Recommendation:** canonical time only (§3.3). Nothing advances while you are away: no penalty and no catching up. Requests are reconsidered when conditions change and when you open the Fleet channel.
- **Alternative:** a small automatic canonical advance on return, such as "an hour per day away, capped". Not recommended: it makes breaks change the world, and the brief says breaks carry no penalty.
- **Approve one.**

### 5.7 Can disciplinary actions ever restrict anything?
- **Recommendation:** findings may **delay promotion review** and **reduce eligibility for specific sensitive assignments**, for a stated canonical period or until an appeal succeeds. They may also lower crew confidence.
- **They never:**
  - lock simulations;
  - end the career;
  - remove the captain from their ship without a transfer the captain confirms;
  - consume credits;
  - hide content.
- **Appeals and explanations** go through Fleet Command (Legal), using the existing evidence-based review.
- **Approve, or choose:** "record only, no restrictions".

### 5.8 Other points
1. **Consequences of a "lost" canonical mission:** the universe continues, and another ship is sent per the event model. If the Halcyon herself is lost in Active Duty, there is no reset. Recommendation: the captain survives, faces a board of inquiry, and is given a replacement command (a new ship of the same class, crew partly new, losses remembered). Please approve the principle, since "Halcyon lost" exists as an ending today.
2. **Qualifications:** awarded only from training evaluations (e.g. "Science Vessel Command qualification: two Proficient scientific-reasoning evaluations, including one where Varga's evidence was decisive")? Or also from canonical service? Recommendation: both, with training as the usual route.
3. **Phase order:** approve A → B → C → D → E → F, with Phase A as v0.7.0.
4. **Personalization strength:** a bounded 0.5×–2× effect on non-emergency offers, with distress calls unaffected. Approve the range.
5. **Service Record tab names:** Career Overview / Training / Service History / Fleet Requests (as in the brief). Approve, or rename.

---

## Appendix A: data model sketches

These sketches are illustrative TypeScript, not final.

```ts
// Training Record — starbridge.training.v1 (never canon)
interface TrainingRecord {
  schema: 'starbridge.training'; version: 1;
  evaluations: Evaluation[];            // capped; older ones folded into evidence
  competencies: Record<CompetencyId, { band: Band; evidence: EvidenceRef[] }>;
  qualifications: { id: string; title: string; awardedAtIso: string; basis: EvidenceRef[] }[];
  recommendations: { id: string; text: string; simulation?: number; because: EvidenceRef[] }[];
}
type Band = 'unassessed' | 'developing' | 'competent' | 'proficient' | 'distinguished';

interface Evaluation {
  id: string; source: 'simulation' | 'canonical'; refId: string;   // sim run id or canonical mission id
  scenarioId: string; seed: number; outcome: { id: string; title: string; tier: 'success' | 'partial' | 'failure' };
  objectives: { id: string; text: string; priority: 'primary' | 'secondary'; result: 'achieved' | 'missed' | 'failed' }[];
  decisions: { turn: number; text: string; judgment?: 'responsible' | 'reckless' | 'principled' | 'decisive'; evidence: string }[];
  crewSafety: Finding[]; civilianSafety: Finding[]; regulations: { id: string; applied: string }[];
  strengths: Finding[]; improve: Finding[]; recommended: string[]; competencyEvidence: { id: CompetencyId; weight: 1 | 2 | 3; why: string }[];
  principled?: string;   // a defensible ethical "failure"
}

// Scenario descriptor (optional on ScenarioModule; plain data)
interface EvaluationDescriptor {
  objectives: Record<string, 'primary' | 'secondary'>;
  endings: Record<string, { tier: 'success' | 'partial' | 'failure'; note: string }>;
  markers: { id: string; when: (s: WorldState) => boolean; judgment: 'responsible' | 'reckless' | 'principled' | 'decisive'; competency: CompetencyId[]; text: string }[];
  regulations: string[]; competencies: CompetencyId[];
}

// Service Record — extends CanonicalState (commit gate only), Phase B+
interface ServiceRecord {
  rank: RankId; actingRank?: RankId; assignment: { shipId: string; position: string; since: number };
  commands: { shipId: string; from: number; to: number | null }[];
  commendations: { id: string; title: string; missionId: string | null; citation: string }[];
  reputation: { id: string; text: string; source: string }[];   // words, not numbers
  tenure: { firstCommissionIso: string };                       // display only
  evaluations: Evaluation[];                                     // canonical missions only
}

// Fleet request — Phase C (skeleton in Phase A)
interface FleetRequest {
  id: string; department: 'personnel' | 'logistics' | 'operations' | 'training' | 'legal';
  category: 'transfer' | 'mission' | 'supply' | 'career' | 'discipline';
  detail: Record<string, string | number>;   // e.g. { item: 'torpedoes', requested: 6 }
  state: 'submitted' | 'under-review' | 'deferred' | 'approved' | 'awaiting-confirmation' | 'denied' | 'withdrawn' | 'completed';
  history: { at: number; state: string; reason: string }[];
  deferral?: { reason: string; conditions: Condition[] };   // e.g. hull ≥ 80, qualification X
  approved?: { amount?: number; alternative?: string };     // engine-bounded, e.g. granted 4 of 6 torpedoes
  alternatives?: string[];
}
```

**Regulation catalogue:** original text, numbered and citable. It starts from the regulations already in the game: Reg. 7.1–7.4 and Reg. 12 (`world.ts`), the Border Accords rescue exemption (Art. 4), and the ROE on non-combatants (`roe.ts`).

---

## Appendix B: brief acceptance tests 1–20 mapped to phases

| # | Brief test | Phase |
|---|---|---|
| 1 | A simulation failure does not touch canon | A (the existing gate, plus a new test with an evaluation) |
| 2 | Evaluations record objectives and decisions | A |
| 3 | Competencies persist | A |
| 4 | Different solutions earn appropriate evaluations | A |
| 5 | Reckless vs responsible is distinguishable | A |
| 6 | Active Duty setbacks cause consequences without reset | B (partly true today: models, reviews) |
| 7 | Fleet Command explains recommendations from real records | C/D |
| 8 | Can request outside the strongest competency | C/D |
| 9 | Personalization doesn't eliminate unrelated categories | D |
| 10 | A supply request can't exceed the engine-approved amount | C |
| 11 | Transfers can be submitted, deferred, reviewed, withdrawn and approved | A skeleton; E in play |
| 12 | Deferred requests are reconsidered on condition change | A skeleton; C in play |
| 13 | Approved transfers need confirmation | A skeleton; E in play |
| 14 | Fleet Command remembers pending request context | C |
| 15 | AI can't create unauthorized canon | F (structurally from C: AI has no write path) |
| 16 | Promotions are based on real data | D |
| 17 | Promotions can be declined or deferred | D |
| 18 | No multi-ship management needed | all (a design invariant; test in D/E) |
| 19 | Records survive cancel and reactivate | A (training), B (service) |
| 20 | Existing features keep working | every phase (the full suite plus the smoke test) |
| + | Unusual, invalid, ambiguous input and natural-language manipulation of Fleet Command | C (offline parser), F (AI) |

## Appendix C: Fleet Command request handling, step by step

1. **Parse.** "Open a secure channel to ISA Fleet Command" opens the `command` party. A line is parsed locally into a typed `FleetIntent`: request, question, withdraw, amend, accept, decline or appeal. Anything unparsed gets a clarifying question, or (Phase F, opt-in) one AI-proposed intent that is then schema-validated.
2. **Route.** The intent goes to a department by category.
3. **Decide.** The engine decides using canon, the records, inventory and positions. Its result is the authoritative outcome: approved for N, deferred until X, or denied because Y, plus alternatives.
4. **Present and confirm.** The reply comes from templates (optionally AI-rephrased in Phase F, checked against the facts). Any state change that alters the ship, the assignment or the career waits for the captain's explicit confirmation.
5. **Commit.** Everything goes through the canonical commit gate, with provenance.
