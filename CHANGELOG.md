# Changelog

All notable changes to Project Starbridge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.8.4] — 2026-10-23 — Training Simulation 004: Reactor Night

Nightly simulation build. Fourth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 004: Reactor Night** (`src/scenarios/reactor/`). Ship's night, no enemy: the Halcyon's own reactor is cascading. The one-person work pod *Tern* is the only way to the outside of the reactor spine, and its pilot, Crewman Ines Paley, is frightened of being sealed inside it. The ISA fleet repair tender ISV *Larkspur* (Cmdr. Aurelio Basant, Fleet Engineering) is hours away and can only advise.
  - **Primary challenge:** the engineer improvising (Chief Okafor). **Secondary:** leadership of a frightened crew member (Crewman Paley, with Dr. Osei reading her fitness).
  - Seeded, deterministic and offline: the fault (stuck spine valve, failed main pump, or a lying temperature sensor) and the cause the Chief can rule out first, the starting heat and climb, Paley's nerve (steady, shaken or panicked), the valve's depth, whether the ejection clamps are jammed, Basant's stance (mentor, by the book, or salvage-minded), and the deck-six damage-control watch.
  - Officer expertise matters: Okafor diagnoses only when tasked, and Varga's internal scan of the coolant loop halves the time; Osei reads Paley's state and dose; Adeyemi can fly the empty pod by remote; Okafor ejects on her own authority seconds from breach, unless the clamps are jammed or the pod blocks the interlock.
  - Unconventional options: the cold bypass through the shield coolant loop, starving the reaction, the shield emitters as radiators, a stored jump before ejecting, the pod flown by remote, hauling or beaming Paley in.
  - Endings — success: A Clean Save, Paley's Valve, The Cold Bypass, Limped Home. Failure or partial: Saved at a Cost (partial), Dead in Space (partial), Last-Ditch Ejection, Hard Jump, Halcyon Lost; Held at Bay as a thirty-minute backstop.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Reactor Night simulation" (also "simulation four"). Voice hints for Crewman Paley and Commander Basant.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.2 (care-2) and §3.9 (roe-3). Two labelled **exercise objectives**: choosing and recalling a crew member sent into unavoidable danger aboard ship (no First Edition subsection covers it; a rule is proposed for approval), and Fleet Engineering's request to keep the core (a request, not a rule).
- Hidden handbook training references (internal data, not shown to the player): §4.2's reference to #4 is no longer marked planned; §2.5, §3.9 and §8.3 gain references to #4.

### Tests
- New `tests/sim04/`: setup and seed variation, determinism, scripted playthroughs reaching every ending through the offline interpreter, a 60-seed sweep with a fixed plan, a careful captain succeeding on 120 seeds, do-nothing on 60 seeds, a fuzz run with state invariants and name-leak checks, Rask's refusal to fire on the pod, the ejection interlock, catalogue/launch/archive/save-load, timeline isolation (canon byte-identical), and the evaluation pairs: diagnosing and steadying Paley first is graded exemplary and guessing a fix and sending her cold is graded mixed, for the same ending; a diagnosed clean save is sound and a blind wrong fix first is reckless.
- Smoke: a sim04 block lists, launches, plays a seed to A Clean Save and opens its after-action report.

## [0.8.3] — 2026-10-22 — Training Simulation 003: The Quiet Signal

Nightly simulation build. Third of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 003: The Quiet Signal** (`src/scenarios/quiet/`). The senders, in an unarmed courier sitting in the Teyma pulsar's beam, signal by blanking pulses and speak only in answers. The Directorate signals ship *Cantor* (Signals Director Halia Brenn) is decoding the same signal.
  - **Primary challenge:** the comms officer cracking a code (Lt. Szabo). **Secondary:** patience.
  - Seeded, deterministic and offline: the grammar (primes, shapes or the periodic table) and a decoy reading, whether Szabo's early lean is right, the senders' intent (greeting, farewell or a glitch warning) and patience, and the Director's temperament (scholar, rival or hardliner), accuracy and timing.
  - Officer expertise matters: Szabo decodes only when tasked; Varga's pulsar timing and the main dish rigged as a receiver speed her up; a partial decode offers two readings and a lean.
  - Unconventional options: echo the question back to buy time; ask Brenn to hold; decode jointly (a hardliner takes the data and races you); block her transmission by putting the Halcyon in her beam.
  - Endings — success: Contact Established, A Shared Vocabulary, A Polite Farewell, Warning Heeded. Failure or partial: The Directorate Answered (partial), Warning Unshared (partial), Misread, Silence, Caught in the Glitch, Incident at Teyma, Withdrawn, Halcyon Lost; Stalemate as a thirty-minute backstop.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Quiet Signal simulation" (also "the Teyma pulsar", "simulation three"). Voice hints for the senders and Director Brenn.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §3.3 (roe-1), §3.1 (roe-2) and §6.1 (honesty-1). Warning a rival of the glitch is a labelled **exercise objective**: no First Edition subsection covers a duty to warn of a hazard to navigation.
- Hidden handbook training references (internal data, not shown to the player): §9.1 First contact's reference to #3 is no longer marked planned; §2.5 Delegation of authority gains a reference to #3.

### Tests
- New `tests/sim03/`: setup and seed variation, determinism, scripted playthroughs reaching every ending through the offline interpreter, a 60-seed sweep, a fuzz run with state invariants and name-leak checks, Rask's refusal, the beam-block, answer parsing, catalogue/launch/archive/save-load, timeline isolation (canon byte-identical), and the evaluation pair: waiting for the decode is graded exemplary, answering blind and getting lucky is graded mixed, for the same ending.
- Smoke: a sim03 block lists, launches, plays seed 6 to Contact Established and opens its after-action report.

## [0.8.2] — 2026-10-21 — ISA-COM-001 First Edition

Brad approved the condensed code as the **First Edition** of ISA-COM-001, with four amendments. The in-game handbook now shows only the code. No change to grading, evaluation outcomes, disciplinary findings or crew refusal behaviour.

### Changed
- **The First Edition code** (`src/handbook/code.ts`): a one-paragraph preamble, 11 articles with 71 one-sentence subsections ("shall", "shall not", "may"), and an Annex of 5 treaty provisions (Border Accords Arts. 2 and 9 marked Provisional). Edition label: "First Edition".
  - Amendments at approval: §3.1 "while reasonable peaceful alternatives remain available"; §5.9 the duty to refuse covers orders contrary to this Code or to an applicable treaty; new §7.2, no handover where credible evidence indicates a serious risk of persecution, torture or grave harm, even with assurances (the former §7.2–7.3 are now §7.3–7.4); §10.7 personnel may go directly to the Office of Independent Review, without Fleet Command's permission, when Fleet Command's own conduct is in question.
- **Regulation records** (`src/handbook/articles.ts`): 44 permanent ids (the 42 draft ids plus `general-1`, extraordinary circumstances, and `general-2`, lawful but poor decisions), each mapped to its subsections; no id lost or reused. Revision 1 is the approved First Edition text; revision 0 (the v0.7 wording of the 15 pre-edition ids) is byte-identical, and `src/evaluation/regulations.ts` still returns the same 15 ids, titles and texts. Draft wording was never issued and is not a revision. Draft 3's commentary, examples, training references (with their after-played flags), enforcement notes and draft numbers are kept as hidden internal data (`internal`), never shown to the player.
- **Captain's Handbook:** title block, preamble, contents, one page per article listing its subsections, and the Annex. Commentary, status lines, training references, revision history, ids and related links are no longer shown. A cited subsection opens highlighted.
- **Search** finds subsection and article numbers ("3.3", "§3.3", "Art. 3", "Article 3", "T.2", "the Annex"), older citations and draft numbers ("Reg. 7.2", "Rules of Engagement §1", "B.1") at their First Edition subsection, and topics (the existing aliases, plus a few for the amendments). A bare treaty name ("Border Accords") is now a search rather than a citation of Art. 4.
- **Bridge commands** also take "show me section 3.3", "show me §5.9", "open article 5" and "show me the annex", on station, in a simulation and on Active Duty, still without changing state.
- **Citations in reports and the Service Record** read "§3.3 Use of Force" (or "Annex T.2, Border Accords, Art. 4"), never an id, and open that subsection. Stored reports, findings, verdicts and ids are unchanged; disciplinary reviews show the stored sentence after the citation.
- `npm run handbook:export` emits the First Edition code only (the `--all` option is gone: there are no player-facing training references left to include).
- SCENARIO_GUIDE §6b: new simulations cite permanent ids chosen by First Edition subsection (written "§3.3 (roe-1)" in notes), add training references only in the hidden data, and never add or reword regulations.

### Tests
- `tests/v080/handbook.test.ts` rewritten for the First Edition: shape (11 / 71 / 5), the amendments, mapping completeness (every id resolves to a subsection, every subsection has an id), search by number, old citation and topic (every alias finds its regulation), bridge commands, internal spoiler data, export and the wording lock. The lock (`tests/v080/fixtures/handbook-lock.json`) now pins every subsection, the preamble and each id's subsections and revisions; revision-0 hashes are unchanged from v0.8.1.
- New `tests/v082/first-edition-view.test.ts`: the rendered handbook and report citations show no internal ids, notes or training references; reports cite "§n Title" while the stored v0.7 citations are unchanged.
- No evaluator or refusal test changed; no existing test asserted a rendered citation label.

## [0.8.1] — 2026-10-21 — Handbook Draft 3: "the ISA" throughout

The Captain's Handbook moves to **First Edition, Draft 3, pending approval**, following Brad's ruling that it says "the ISA" throughout. No change to grading, evaluation outcomes or crew refusal behaviour.

### Changed
- **"The ISA" in the handbook.** Every "the Agency" in the articles and the preamble now reads "the ISA", with no change of meaning: the F and Annex T chapter summaries, D.2 ("ISA Fleet Command directs the ISA's ships"), F.1 (explanation and training purpose), H.1 (text and explanation), the H.3 improper example, the introduction, and the definition of ISA Fleet Command. The title block spells out **Intergalactic Space Agency (ISA)** once, as a formal screen.
- **Enforcement notes are player-facing.** Release numbers, "planned fix" remarks and developer terms (evaluator, descriptor, commit gate, engine) are gone. Each note now says plainly what the game assesses today and what it does not yet assess, for example "Reports assess who fired first and whether weapons were locked as a threat, but they currently count a lawful warning shot as firing first." Statuses are unchanged (5 evaluated, 20 partially, 17 not yet).
- **Edition label:** "First Edition, Draft 3, pending approval". Draft wording is not an issued revision, so article revision numbers stay at 1. Revision 0 (the v0.7 wording) and the 15 legacy titles and texts returned by `src/evaluation/regulations.ts` are byte-identical. The wording lock (`tests/v080/fixtures/handbook-lock.json`) was updated deliberately: only the revision-1 text of `orders-2` and `contact-1` changed.
- Docs: SCENARIO_GUIDE and SCENARIO_ROADMAP no longer say "the fleet of the Agency".

### Fixed
- **Main was red after v0.8.0.** `tests/v071/naming-consistency.test.ts` failed 2 of 641 unit tests because the handbook said "the Agency" on 11 lines and named the "Intergalactic Space Agency" outside the formal screens. Commit 130d2c4 pinned those lines as a temporary exemption. That exemption is now removed: the handbook follows the normal naming rule, and its title block is the only extra formal screen (one spelled-out name).
- **Why v0.8.0's local run was green.** The naming test listed files with `git ls-files src`, and the v0.8.0 suite ran before the new handbook files were committed, so the test never saw them. It now walks `src/` on disk, and asserts that it sees the handbook database, so uncommitted files are checked too.

### Tests
- New handbook checks: no "Agency" anywhere in the shipped handbook text, the issuer reads "Intergalactic Space Agency (ISA)", and no enforcement note contains a release number or developer term. The spoiler and export tests were updated for the new note wording.

## [0.8.0] — 2026-10-21 — The Captain's Handbook (foundation)

The first stage of the v0.8 handbook plan: ISA-COM-001, *Captain's Code and Operational Regulations*, First Edition, Draft 2 (pending approval), becomes the single regulation database of the game, readable in-game as an official publication. **No change to grading, evaluation outcomes or crew refusal behaviour** (those follow in handbook Stage 3 once the final wording is approved).

### Added
- **Regulation database** (`src/handbook/`). 42 articles in chapters A–I and Annex T, each with a permanent id, citation, former citation, chapter, title, authoritative text, explanation, when it applies, exceptions, proper and improper examples, related articles, spoiler-safe training references (with an after-played flag), revision history, legal status and enforcement status. Edition label: "First Edition, Draft 2, pending approval". The 15 pre-edition ids are unchanged; their v0.7 wording is kept verbatim as revision 0. API: `article`, `resolve`, `search`, `textAt`, `citedArticle`, `visibleTraining`.
- **Captain's Handbook** in the Command Hub: contents, chapter and article views, set like a printed publication (reading measure, serif type, generous spacing; desktop and phone). The authoritative text is boxed apart from the commentary; each article shows its legal and enforcement status, related-article links, training references and revision history.
- **Ranked search** by number ("B.1", "Art. B.1", "Annex T.4"), id ("roe-1"), earlier citation ("Reg. 7.2", "Rules of Engagement §1") and topic ("pathogen", "quarantine", "biological containment", "rules of engagement", "unlawful order", "first contact", "asylum", "warning shot", …).
- **Bridge commands**, on station, in a simulation and on Active Duty: "computer, open the handbook", "show me article B.1", "show me the regulation on first contact", "what are the quarantine regulations", "what does the handbook say about asylum". They are routed before the interpreter: the computer only opens the article or results. No order, no time, no state change, and closing returns you exactly where you were. No crew member recites or advises (handbook Stage 2).
- **Clickable citations.** Every regulation in an after-action report, and the rule of every disciplinary review in the Service Record, opens its article. Display only; findings and stored reports are unchanged.
- **Print export:** `npm run handbook:export` writes `handbook-export/ISA-COM-001.md` from the same database (authoritative text as a quoted block, commentary separate). Spoiler-safe by default; `-- --all` includes after-played references, marked.

### Spoiler safety
- After-played training references (asylum-1 and border-accords-9 → #1, quarantine-2 → #2) stay hidden until the Training Record shows that simulation was run. Enforcement notes that describe a simulation are withheld on the same terms.
- Drafting material (status flags, change notes, appendices) is not shipped.

### Changed
- `src/evaluation/regulations.ts` is now a thin layer over the database. It returns the same 15 ids in the same order with byte-identical titles and texts (the v0.7 wording, revision 0), so evaluation output is unchanged. Wording that must be preserved until handbook Stage 3 includes the old titles ("Rules of Engagement §1, Non-combatants", "Reg. 7.4, Treaty law", "Code of Conduct §9, Asylum" …), the curly apostrophes in care-1, quarantine-1 and asylum-1, and the old short texts in the "Relevant: …" lines.
- **Naming:** Active Duty briefings now say **Calloway Reach** (were "Tessarine Reach"). Briefings already saved keep their original text.
- Docs: SCENARIO_GUIDE §6b. Simulations cite handbook article ids only, add spoiler-safe training references, and never add or reword regulations; a genuinely needed rule becomes a labelled exercise objective plus a proposal to the project owner. Also fixed a wrong path (`engine/roe.ts`, `universe/world.ts`) and CAREER_EXPANSION_PLAN (quarantine authority is §1).

### Tests
- `tests/v080/regulations-compat.test.ts`: the v0.7 catalogue verbatim versus the compatibility layer, plus revision 0 in the database.
- `tests/v080/handbook.test.ts` covers:
  - database shape and statuses;
  - every regulation cited by simulations, the evaluator, refusals and reviews exists;
  - search by number and topic;
  - bridge-command recognition, including ordinary orders left alone, and routing ahead of the engine;
  - exercise objectives are not regulations and don't leak;
  - spoiler safety;
  - v0.7.1 saves (training.v1, profile.v1, sim.v1, canon.v1) still load;
  - simulation evaluations write no canonical discipline;
  - print export;
  - a wording lock (`tests/v080/fixtures/handbook-lock.json`).
- All existing evaluator and refusal tests are unchanged and pass, including roe-1 "Breached" on a refused order.
- Smoke (`scripts/smoke-handbook.mjs`, run by `npm run smoke`):
  - contents, article, search and related links;
  - the bridge commands on the idle bridge, in a simulation and on Active Duty, with clock, turn, log, objectives and every saved key compared before and after;
  - report citation links;
  - spoiler safety before and after a run;
  - phone width.

## [0.7.1] — 2026-10-21 — The bridge knows where it is

Fixes Brad's idle-bridge report: "what training do I need?" was "order not recognized", and "hail the ISA" asked "the Kestrel, the cruiser, or both?".

### Root cause
- The idle bridge (no mission, on station) was built from the Kestrel Incident world, with its ships, people and facts hidden but present.
- The bridge has no scenario vocabulary of its own, so the interpreter fell back to its built-in Kestrel words and labels ("the Kestrel", "the cruiser"), and the hail-target question offered both ship slots whether or not anything was on sensors. "The ISA" was not an addressee at all, so the hail fell through to that question.
- There was no notion of setting (station, simulation, mission), no non-ship comms party, and no career-question intent. Kestrel-only words also resolved inside Tallis Gate ("prefect" → the picket).

### Fixed
- **Setting.** `settingOf(state)` (station / training simulation `<id>` / Active Duty mission) is part of the interpreter context. Scenario vocabulary, contacts and dialogue apply only while that scenario is active; the station is neutral (no ships, no scenario people, no facts).
- **Nothing on sensors.** Hailing with no contacts: "No vessels on sensors…"; scanning, steering at or firing on a ship that isn't there: "No contacts on sensors…". No "which vessel" question when there is nothing to choose; transport, tow and repair orders no longer report the distance to a hidden Kestrel.
- **ISA Fleet Command as a comms party.** "Hail the ISA", "contact Fleet Command", "get me HQ", "open a secure channel to Training Command", "call the Admiralty" and similar reach a Fleet Command duty officer (or, inside a simulation, exercise control) in every context. The answer is honest about what works now (your training record) and what comes later. It uses your rank and name and never touches scenario characters.
- **Career and training questions.** "What training do I need?", "how am I doing?", "what are my strengths?", "recommend a simulation", "what's my training record?" are answered by the XO (or via Fleet/Training Command) from the Training Record and competencies. With no assessed exercise it says so and recommends simulations by the competencies they assess.

### Changed (naming, approved)
- The commission is reviewed by **ISA Fleet Command** (was "the Admiralty").
- Prefect Sorel Vane now introduces himself as "commanding the Ashen Covenant"; his side is still the Tessarine Directorate.
- Player-facing references read **"the ISA"**; "Intergalactic Space Agency" is spelled out only on formal screens (commission, ship status, name prompt). "Your Agency", "Agency survey space", "Agency Care" etc. now say ISA. Saved text is migrated on load; the parser still accepts "Agency space" and "Concord space"; internal `concord` ids are unchanged.

### Tests
- `tests/v071/station.test.ts` (54): idle-bridge battery (hail variants, scan, helm, tactical, career, unknown ships; no Kestrel/Tallis names leak), Fleet routing on station, Active Duty, simulations and missions, training answers with and without evidence, scenario comms isolation both ways, existing simulation comms unchanged.
- `tests/v071/heldout.test.ts`: paraphrases written before the routing was built and not tuned on. First run: **Fleet 12/12, career 10/10, negatives 7/7** left alone (same author for list and classifier, so treat as indicative).
- `tests/v071/naming-consistency.test.ts`: no bare "Agency" or "Admiralty" in source, the formal name only on formal screens, Vane's line, concord ids intact, migration and old aliases.
- Smoke: a v0.7.1 idle-bridge block (training question, hail the ISA, absent ships, leak check, exercise control in a sim, answers with evidence after a run).

## [0.7.0] — 2026-10-21 — Evaluation & Records Foundation

The first milestone of the approved [career expansion plan](docs/CAREER_EXPANSION_PLAN.md).

### Changed
- **The Intergalactic Space Agency.** The fleet service is now the Intergalactic **Space** Agency (ISA) everywhere; v0.5.1–v0.6.1 said "Intergalactic Star Agency". Saved text is migrated on load (`src/engine/naming.ts`). ISA, the ISV prefix and every ship, character, civilization and place keep their names.
- **Hub → Service Record** (was "Captain's Record"), an ISA personnel file with four sections:
  - **Career Overview:** personnel (name, rank and insignia, formal address, assignment), a one-line training profile and the canonical career;
  - **Training:** competencies and after-action reports (never canon), plus simulator familiarity;
  - **Service History:** the canonical record (missions, Active Duty after-action reports, discipline, world events, crew experience);
  - **Fleet Requests:** an empty state; the channel opens in a later update.

### Added
- **Your name, Captain.** The captain's name is the **only** customizable name in the game.
  - **Asked once:** a new captain is asked at the start, and a save from before v0.7 is asked once. Dismissing keeps a default (Rowan Ashby, or the name an older save already had).
  - **Stored** in `starbridge.profile.v1`, shared by the Training and Service Records. Records belong to the profile, not to the name, so renaming never resets or changes progress.
  - **Change it** in Service Record → Career Overview → Change my name. Earlier names are listed.
  - **Validation:** trimmed; 2–32 characters; letters (accents welcome), spaces, hyphens, apostrophes and periods. Control or invisible characters and markup are refused. The name is rendered as text only and is never parsed as an order.
  - **Where it is used:** the personnel record, after-action reports, the commission from Fleet Command and the bridge crew's greeting. Formal address is rank plus surname ("Captain Morgan", "Commodore Morgan"). The crew still says "Captain" in ordinary talk.
  - **Nothing else can be renamed.** "Rename the ship" and "call helm Bob" are declined politely by the XO, in simulations and on the bridge. "Call me …" points to the Service Record.
- **Ranks (data model, provisional):**
  - Captain, Senior Captain, Commodore and Fleet Captain, each with insignia and meaning;
  - Rear Admiral and Admiral are NPC staff ranks only;
  - single-ship command at every rank;
  - the rank is kept in the canonical service record with its history, and the address follows it;
  - a development rank selector in Settings, for testing only. There is no promotion system yet.
- **After-action reports.** Every finished simulation is assessed by ISA Training Command and filed in the Training Record (`starbridge.training.v1`), never in canon. Each report covers:
  - objectives achieved, missed or failed (primary or secondary);
  - the key decisions, taken from a turn trace that never changes play;
  - crew safety and civilian safety;
  - the ISA regulations relevant, upheld or breached;
  - strengths, areas to improve and recommended training;
  - a conduct finding: exemplary, sound, mixed, principled, insufficient or reckless.

  The same ending reached by different strategies gets a different report: force reads differently from negotiation, and a failure reached by upholding the rules is recognised as principled. Open a report from the debrief card ("Read the after-action report") or from the Training list. A canonical Active Duty mission files its report into the service record instead.
- **Competencies in words, not numbers:** Not yet assessed, Developing, Competent, Proficient or Distinguished, each with the evidence behind it. No scores or percentages appear anywhere in the reports or the Training view.
- **Evaluation descriptors** for Training Simulation 001 (`kestrel-eval-1`) and 002 (`tallis-eval-1`): every ending is tiered, and scenario-specific judgment markers are added. **The endings themselves are unchanged.** `docs/SCENARIO_GUIDE.md` §6b now requires a descriptor for every new simulation. A test checks every catalogue entry has one.
- **Service record model** (`src/career/service.ts`): assignment, qualifications, commendations, and temporary disciplinary restrictions with an appeal process (they can delay promotion review but never lock simulations or end a career). It also models a board of inquiry for losing the Halcyon on Active Duty; that is not played yet.
- **Fleet request foundation** (`src/fleet/requests.ts`), deterministic and offline, **not yet playable**:
  - the request lifecycle: submitted, under review, deferred, approved, denied, withdrawn, completed;
  - reasons and conditions, and reconsideration when conditions change;
  - Fleet asks for confirmation before anything is carried out, and re-checks the facts first;
  - supply amounts are capped by the engine;
  - follow-up status queries;
  - a provider seam for a future AI voice, with the engine still deciding. No AI or OpenRouter is used.
- **Records are archived, not erased:** after 60 full reports, older ones are compressed to a summary line.

### Tests
- New suites in `tests/v07/`: naming migration, captain name and injection inputs, persistence and migration, rank address, rename declines and no-rename paths, evaluation (strategies told apart, principled failures, safety findings), records (separate stores, canon byte-identical, compression), and the Fleet request lifecycle. All earlier tests still pass.
- `scripts/smoke.mjs` v0.7 section covers:
  - the naming prompt, with markup refused, a valid name saved and the prompt one-time;
  - the crew addressing the captain by rank and surname;
  - rename requests declined;
  - after-action reports for both simulations;
  - the Training section;
  - renaming in the Service Record with the records kept;
  - no percentages, and no canonical store created by simulations;
  - phone layout.

## [0.6.1] — 2026-10-20 — Crew voices

### Added
- **Distinct voices for the crew.** With Voice on, each bridge officer, the ship's computer, the narrator and the people on comms speak with their own voice. It uses the browser's built-in speech synthesis voices: free, no API keys, nothing downloaded, and offline with on-device voices.
- **Voice profiles** (`src/voice/profiles.ts`). There is one each for the computer, the seven officers, the narrator, the relief officers, Fleet Command and other speakers. Each states:
  - a gender;
  - preferred English locales;
  - ranked voice names across Apple, Windows/Edge, Chrome and Android;
  - a base pitch and rate.
  The computer is calm and neutral (pitch 1.0, rate 0.95).
- **Deterministic casting** (`src/voice/cast.ts`) from `speechSynthesis.getVoices()`, re-read on the async `voiceschanged` event and a few times after load.
  - **With enough voices:** every officer, the computer and the narrator get a different voice.
  - **With few voices:** voices are shared, preferring the character's gender, and separated by pitch and rate. No two people have the same voice, pitch and rate.
  - **With no voices:** the browser default at different pitches and rates.
  - **Excluded:** cloud voices (unless allowed in the panel), Apple novelty voices and non-English voices.
  - **Order:** the crew are cast before anyone on comms, so their voices are the same in every simulation.
- **Scenario voice hints:** `ScenarioModule.voices` (optional). #1 declares voices for Captain Arden, Prefect Vane and the passenger (chosen by seed); #2 for Captain Sabeth and Warden-Commander Marr; the idle bridge for first-contact speakers. Documented in `docs/SCENARIO_GUIDE.md` §6a.
- **Speaker tagging.** Every log line now carries a `voice` key (`LogEntry.voice`): a crew character id, `computer`, `narrator`, `npc:<scenario>:<id>` or `label:<text>`. The speech queue therefore always knows who is speaking. Relief officers speak in their own voices. Lines saved before v0.6.1 are matched by the speaker's name.
- **Hub → Crew voices panel:**
  - each officer's assigned voice, pitch and rate, with a Preview button;
  - a voice, pitch and rate override per crew member, saved in this browser (`starbridge.voiceCast.v1`);
  - a "Reset all to automatic" button;
  - an "Also use online voices" checkbox;
  - the comms voices for the current simulation, with previews.

### Tests
- **`tests/v061/voices.test.ts` (21 tests):**
  - distinct voices with many voices (Mac, Edge, Android lists);
  - casting to type;
  - NPCs on voices the crew does not use;
  - crew voices independent of the scenario;
  - determinism under shuffled voice lists;
  - cloud voices excluded unless allowed;
  - graceful fallback with Android, 2, 1, 3, 0 and non-English-only voice lists;
  - gender-preserving sharing;
  - Android locale spread;
  - overrides that win, reserve their voice, persist and survive malformed storage;
  - speaker tagging in #1 and #2, relief officers, and pre-v0.6.1 log lines.
- **The smoke test** uses a mocked voice list that arrives late via `voiceschanged`. It checks:
  - 9 distinct crew voices;
  - previews;
  - an override that persists across reload, and Automatic restoring the cast voice;
  - the phone layout;
  - in #2, every spoken line spoken in its tagged speaker's voice, with Marr on a voice no officer uses;
  - with two voices, no two crew members sounding the same.

## [0.6.0] — 2026-10-19 — Training simulations: multi-scenario support and simulation #2

Starbridge will ship with 30 training simulations. This release adds the multi-scenario foundation and simulation #2. No AI is used; everything is deterministic, seeded and offline.

### Added
- **Simulation #2: Quarantine at Tallis Gate** (`src/scenarios/tallis/`). The pilgrim liner *Mercy of Ilun* is held at the quarantine line of the colony Tallis Gate with sickness aboard. The colony picket *Thornwake* will fire on her if she crosses.
  - **Two NPCs with their own goals and seeded breaking points:** Captain Juno Sabeth and Warden-Commander Isolde Marr.
  - **Hidden information:** the cause, the Warden's history and her family.
  - **Comms sessions with both captains.**
  - **Seed variation:**
    - the cause (contagious fever, toxin in the water recycler, or an allergic panic);
    - the Warden's temperament (strict, fearful or humane);
    - whether her brother is aboard;
    - Sabeth's patience, the numbers aboard and the numbers sick.
  - **Improvised ideas that work:** an isolation ward, biofiltered transport, interposing the Halcyon, extended shields, and asking the colony for its antiviral.
  - **Endings:**
    - 3 success: The Cure, Line Lifted, Agency Care;
    - 9 failure or partial: Fire at the Gate, Outbreak at Tallis Gate, Fever Aboard, Incident at Tallis Gate, Liner Abandoned, The Long Road, The Gate Run, Stalemate, Halcyon Lost.
- **The simulation catalogue** (`src/scenarios/catalogue.ts`): one entry per simulation (number, ids, name, launch words). The bridge, the Mission Archive, saves, "run it again" and "New scenario" all read it.
- **New bridge commands:**
  - `Computer, list simulations` (also `what simulations are available`);
  - start a simulation by name or number (`begin the Tallis Gate simulation`, `run simulation two`, `simulation 002`). `Begin the simulation` with no name still starts #1.
- **Interpreter:**
  - Each scenario's ships answer to their own names and aliases ("the liner", "Sabeth", "the picket", "the Warden").
  - Clarifying questions name the scenario's own ships.
  - New improvised medical orders: isolation ward, field hospital, biofilters, decontaminate, screen the transport.
- **Docs:**
  - `docs/SCENARIO_GUIDE.md`: how to author a simulation, the required tests, and the daily checklist.
  - `docs/SCENARIO_ROADMAP.md`: the plan for #1–#30. #1 is done; #2 is marked in progress until this release is verified.

### Changed
- Shared engine code no longer assumes the Kestrel. A scenario declares its cast through `WorldState.slots` (the leads, an optional passenger, and what "repair their …" means) and `Ship.aliases`. A scenario that declares nothing gets exactly the old behaviour, so the Kestrel Incident is unchanged and all its tests pass as before.
- Seeded scenario-specific choices live in `ScenarioVariant.extra`.
- The bridge debrief after a simulation no longer names the Kestrel. It now says "Say "list simulations" to choose another, or open the archive."
- The footer reads "v0.6.0 (training simulations)".

### Tests
- **`tests/sim02/`:**
  - 17 ending tests: every listed ending is reached by a scripted natural-language playthrough. The exception is Halcyon Lost, which is reached by forcing the Halcyon's destruction.
  - 14 scenario tests:
    - setup, determinism and variation;
    - a 60-seed sweep with at least 3 distinct endings including a success, and do-nothing seeds failing in more than one way;
    - hidden information and evidence gating;
    - crew refusal to fire on the liner;
    - interposing and biofilters;
    - a 40-game fuzz with every invariant checked after every order and no Kestrel names leaking.
  - 11 catalogue tests: launch by name and number, list simulations, archive listing, simulation history filed under #2, save round-trip, and canonical storage byte-identical after a #2 run.
- **The smoke test:** it lists simulations, checks the archive, launches #2 by name, plays seed 5 to "Line Lifted", restarts with New scenario, checks the phone layout and ends the simulation.

## [0.5.1] — 2026-10-19 — Naming: the Agency and the Intergalactic Star Agency

### Changed
- The player's faction, until now **the Concord**, is **the Agency** ("join the Agency", "Agency space", "the Agency border").
- Its fleet service, until now the **Concord Exploration Service (CES)**, is the **Intergalactic Star Agency (ISA)**. Ships carry the prefix **ISV**: the CSV Halcyon is now the **ISV Halcyon**. **Fleet Command** stays, as the ISA's command, and the commission comes from "Admiral Odessa Kaine, ISA Fleet Command".
- Updated everywhere players see it: the bridge and Kestrel narration, crew lines, Prefect Vane's hails ("Agency vessel…"), the passenger's asylum request, first-contact dialogue and outcomes, world events and consequences, the commission ceremony, the ship status panel, the tactical border label, the contact faction label, the README and the smoke test.
- The **Tessarine Directorate** (Vane's side) is unchanged.
- The README naming note is resolved.

### Compatibility
- **Saves still load.** Simulation saves, the canonical record and simulation history saved by v0.5.0 or earlier may hold the old names. That display text is rewritten when they are read (`src/engine/naming.ts`): CSV → ISV, Concord Exploration Service → Intergalactic Star Agency, Concord Fleet Command → ISA Fleet Command, CES-nnnn → ISA-nnnn, Concord → Agency.
- Internal ids are unchanged (the faction id `concord`, `trustConcordDirectorate`), so nothing else in a save changes. Tests cover a legacy save and a legacy canonical career.
- **The interpreter** understands "Agency space", "ISA space", "run for Agency space" and "ISA Fleet Command" ("Tell ISA Fleet Command we are on our way", "Ask ISA Fleet Command for more details"). The old words still work as aliases: "Concord space", "run for Concord space", "Fleet Command".

### Tests
- New `tests/v05/naming.test.ts`, plus an ISA Fleet Command answer test in `delivery.test.ts`. Disabling either the migration or the new aliases makes these tests fail.
- Expectations changed only where the text changed: CSV → ISV Halcyon in the commission test, "no Agency ship in the Reach", test titles, and the first-contact and threat lines spoken in tests.
- Two held-out eval inputs were reworded to the new names ("Run for Agency space"; "…that the Agency will hear of this"). Scores are unchanged.
- The smoke test checks the new names on the bridge and in the commission, with no Concord or CSV leftovers.
- Historical changelog entries and the first-run eval records keep the old names, as written at the time.

## [0.5.0] — 2026-10-19 — Milestone 3.1: the bridge experience, Active Duty & two-way communications

No AI is used in this milestone. Everything below is deterministic and offline, and runs in the browser.

### Added
- **Bridge-first startup** (`src/scenarios/bridge/`, `src/engine/bridge.ts`):
  - The app opens on the idle bridge of the Halcyon: green alert, no contacts, no objectives.
  - The crew can be talked to before any mission: status, systems, small talk with named officers, routine ambient lines, and a science survey of nearby systems.
  - A simulation starts only on an explicit request (`Computer, begin the Kestrel Incident simulation`, typed or spoken; or from the archive).
  - `Computer, end the simulation` returns to the bridge, and so does a simulation that reaches an ending, with a debrief card.
- **Active Duty** (renamed from Living Universe):
  - The products are described: Simulation Mode $10 one-time; Active Duty $9.99/mo. There are no payments; the dev toggles remain.
  - A commission ceremony on first activation (Admiral Odessa Kaine), accepted on the card or by voice.
  - Turning Active Duty off puts the captain on **reserve status**. Everything is preserved and canon is frozen; simulations stay unlimited; reactivation restores the same career. It is never misconduct.
  - Stored `livingUniverse` entitlements migrate to `activeDuty`, and pre-v0.5 careers count as commissioned.
- **Organic mission delivery** (`src/universe/delivery.ts`, `src/dutyBridge.ts`):
  - There is no mission menu. Fleet hails, distress calls, colony requests, science readings and bulletins reach the bridge as canonical time passes (`continue the patrol`).
  - What arrives is seeded and depends on galaxy time, location, hull, faction standing, border tension and past decisions.
  - Quiet periods: "nothing" is always a candidate, with a 3-hour quiet window after each delivery. Directives always get through.
  - The captain answers by talking: accept (one credit, as before), question, refuse (with a reason), decline or ignore (free). Ignoring a directive is never silent; the XO asks for a formal answer.
  - A waiting call is derived from canon, so it survives a reload.
  - The board is now the secondary **Fleet Command offer log**.
- **Science exploration and first contact** (`src/universe/exploration.ts`, `src/scenarios/bridge/contact.ts`, `src/engine/firstContact.ts`):
  - A seeded survey per career lists three detected but uncontacted civilizations; a science reading can reveal a fourth.
  - Dispositions are hidden (open, cautious, isolationist, guarded). **Not every civilization wants to join the Concord.**
  - `Helm, set a course for …` travels in canonical time. A course to an uncontacted civilization is an investigation, charged once (credit rules unchanged).
  - On arrival the civilization occupies the bridge's contact slot, so hails, persistent channels, clarification and ROE all apply.
  - First contact is a multi-turn conversation whose outcome (peaceful, firm or threatening approach × disposition) is written once to canon as a world event and a career entry.
- **Two-way comms** (Phase A): persistent channels with an indicator; hold, resume, mute and close; speech routed to the other party and orders to the crew; promises remembered and checked; clarification for unclear lines; channel-aware suggestions.
- **Crew autonomy** (Phase A): officers refuse unlawful or unsafe orders (firing on civilians, on ships with life signs that have not fired, or on surrendered ships) and explain why when asked.
- **Held-out evaluations:**
  - Dialogue set 2: 26 items.
  - Duty-bridge sets 1 and 2: 20 and 12 items.
  - Every first run is kept in `tests/eval/RESULTS-*-firstrun.md`.
- **Smoke** (`scripts/smoke.mjs`) now covers: the idle bridge on load, bridge commands, a voice-style simulation start, multi-turn comms, ending a simulation, the commission, organic events and quiet periods, the science investigation and first contact, reserve status, and the phone layout.

### Fixed
- On phones a long caller name in the comms log (e.g. a first-contact speaker) could widen the comms panel past the screen (an intermittent 32 px overflow). Speaker labels now wrap and panels may shrink. A smoke check injects a long speaker name at 390 px (169 px of overflow before the fix, 0 after).

### Changed (deliberate test expectation changes)
- The smoke test enters every simulation from the bridge (v0.4 opened directly in a simulation).
- The v0.4 "unknown order" smoke check: with a channel open, an unclear line now goes to the other party, who asks for clarification.
- First Active Duty activation in the smoke test now goes through the commission.
- Unit tests: the determinism script gained one `wait`; the e2e control test waits 7 turns twice; the corridor playthrough waits twice before evacuating. Talk now costs seconds rather than whole turns.
- Talking costs seconds (speak 10 s, hail 15 s, channel operation 5 s, relay 15 s, legacy message 20 s) and ships move while you talk. See the README time-cost table.

### Known limitations
- See README → Known issues. Briefly: rule-based interpretation, a short first contact, no two-way channel with Fleet or distress callers, no galaxy time while talking, investigations not in the archive, voice not re-verified on a device.

## [0.4.0] — 2026-10-19 — Simulation Mode, Living Universe foundation & Mission Archive

No AI is used in this milestone. Everything below is deterministic and offline, and runs in the browser.

### Added
- **Two modes with isolated timelines** (`src/universe/`):
  - **Simulation** (the default page load): training runs and archive replays. Simulations can be repeated without limit, are free and never change canon.
  - **Canonical** (Living Universe): mission outcomes are permanent history.
  - Separate stores (`starbridge.canon.v1`, `sim.v1`, `familiarity.v1`, `credits.v1`, `entitlements.v1`). `CanonStore.commit` is the only write path to canon; it needs a branded `CanonicalContext`, which only a `CanonicalSession` holds. Canonical reads are deep-frozen.
  - The mode banner and mission title always show which timeline you are in.
- **Mission Archive.** Every canonical mission is archived with its original outcome. It can be replayed as a simulation with the original conditions or as a new variation. Simulated runs are listed separately, and the canonical outcome is never altered.
- **Familiarity** (terminology you teach, preferences, drills) carries across modes but never touches canon. Crew drill lines say whether the practice was real or simulated.
- **Daily canonical credits.** There are 10 new canonical starts per local day. Only a *new* canonical start costs a credit (charged once per mission, and only after the commit succeeds). Viewing, declining or ignoring offers, saving, resuming, finishing and every simulation are free. At zero credits, canonical starts are disabled and canonical time pauses, so there is no in-universe penalty, but simulations and the archive keep working. **The credits are local and not tamper-proof.** Server-side enforcement is future work. There are no real payments; the entitlement toggles are dev-only.
- **World events and consequences** (`world.ts`, `models.ts`):
  - three offer classes: *mandatory directive* (question / refuse / disobey → disciplinary review), *distress call* (ignore), *voluntary assignment* (decline, no penalty)
  - seeded event models play out when you are absent: the ore hauler *Tamsin Grey* can be lost, rescued by another ship or self-repaired, and the escort can hit an ion squall
  - the results are published as **sector bulletins** and reach later canonical missions as evidence in the log
  - disciplinary reviews are deterministic findings from evidence fixed when the review opens
- **Crew memory.** Hull damage, crew deaths and injuries, trust, experience and faction standings carry over between canonical missions. Relief officers replace lost crew. Simulated casualties do not carry over.
- **Hub panels:** Living Universe (offers, bulletins, recent decisions, continue patrol), Mission Archive, Captain's Record and Settings (dev).
- **Interpreter and engine: standing orders and restrictions** (`src/engine/standing.ts`):
  - conditional standing orders ("If the Kestrel arms its weapons, raise our shields") fire when their trigger is met: a ship arms, locks or fires, a range is reached, or the helm order completes
  - restrictions ("do not power up weapons", "but not until then", "unless…") hold, show in the orders strip and are lifted only by an explicit order
  - persistent manoeuvres ("No matter what, keep us between…")
  - "then" after a helm order waits for that order to complete
  - plans with contradictory actions are not applied: the crew asks instead
  - negation safety: a clause containing a negator can never match fire, lock or arm; "under no circumstances / on no account" are normalised as negation; an unresolved "it" asks which contact
  - red alert respects a held-down shields order
- **Kestrel point-defence.** Captain Arden arms the Kestrel when he is locked on or the cruiser comes too close (a seeded range, halved while you interpose). This makes armed-ship triggers testable.
- **Tests:**
  - `tests/universe/*` (isolation, archive, credits, world events)
  - `tests/v04/regression.test.ts`, covering the two brief-critical orders before and after their triggers
  - held-out sets `tests/eval/heldout-v04*.ts`
  - `scripts/smoke.mjs` v0.4 section: canonical → archive → different simulated outcome → canon unchanged, credits, ignored-distress consequence, zero credits, phone layout

### Changed
- Save format v4 (`starbridge.save.v4`; v0.3 saves migrate).
- "Then" sequencing: `transport` after a helm order is now a standing order that waits for the helm to arrive (`tests/interpreter/parser.test.ts` item 114 updated).
- "Hold fire" keeps weapons safe *and* adds a restriction on firing.
- **Untargeted fire no longer defaults to the cruiser.** "Fire", "open fire" and "keep firing" use the current weapons lock. "Return fire" means the warship. With no lock and both ships in view, the crew asks which contact. Three parser-table items moved into an `untargeted fire` block that covers both cases.
- A pronoun after a shields clause ("raise them again") refers to the shields, so contradictory plans are caught and asked about.

### Interpreter evaluation (honest numbers)
- v0.3 held-out set (42): **40/42** (was 33/42).
- v0.4 held-out set (32, committed before the v0.4 parser work): baseline **12/32, 11 unsafe**, now 32/32. This set was visible during tuning, so 32/32 is **not** a clean held-out measure.
- v0.4b fresh set (20, written after the work and never tuned against): first result **12/20, 3 unsafe** (`RESULTS-v04b-first.md`, immutable). Safety fixes were then made for exactly those three ("Under no circumstances arm the weapons" armed them; a bare "Fire" fired on the cruiser; "Lower shields and raise them again" only lowered). The set now scores **15/20, 0 unsafe**. Because the fixes were made after seeing the set, the current figure is contaminated. The five remaining failures are all misses or extra questions, never wrong actions; they are listed in `RESULTS-v04b.md` and were deliberately not tuned.

## [0.3.0] — 2026-10-19 — Intent interpretation & spatial simulation

Prompted by a user-testing order the offline engine could not handle: *"Get us inbetween the two ships. Keep the weapons down and shields down. We don't want to appear hostile. And hail them on screen."* No scripted mission content was added. The order is handled by reusable systems.

### Added
- **2D kinematics** (`src/engine/kinematics.ts`, `motion.ts`):
  - every ship has a velocity, heading and performance limits (max speed, acceleration, turn rate); damaged engines and towing reduce them
  - time advances in twelve 5-second sub-steps per turn
  - a steering controller with braking, velocity matching near the goal and RCS station-keeping
- **Guidance behaviours for 14 intents:**
  - approach / close to range, standoff, retreat, interpose (between two ships, or between a ship and the border)
  - intercept (lead pursuit), escort, follow, block, orbit, hold station, face, flee to the border, evasive, all stop
- **`maneuver` and `posture` actions** in the zod schema. The validator checks engines, references, range limits, unreachable targets and posture conflicts. `communicate` gains `target: 'all'` and `onScreen`.
- **Order lifecycle:**
  - `TrackedOrder` moves through ack → underway → completed / maintaining / failed / superseded / impossible, with in-character reports and ETAs ("Underway. Heading 355, 235 km/s." … "We're in position between them, Captain.")
  - orders strip above the command bar
  - the course line and goal are drawn on the tactical plot
- **Posture.** A declared non-hostile posture caps closing speed on the cruiser and makes hails reassuring.
- **NPC perception.** Prefect Vane perceives shields, weapons, locks, closing speed, your stated posture and interposition every turn, and his patience reacts. He keeps his own agenda, so hardliners still lock on.
- **Interpreter:**
  - spelling correction and run-together splitting against the game vocabulary
  - addressee/department tagging, and sentence-then-clause splitting
  - coordinated objects ("weapons and shields down")
  - rationale clauses mapped to posture ("we don't want to appear hostile")
  - reference resolution: "the two ships", "them", "between us and…", border
  - named ranges (transporter, tractor, weapons, torpedo)
  - clarification chips for ambiguous interposition
  - partial execution, with leftover text returned as `unparsed` (the hook for a future AI interpreter)
- **Tactical plot rewritten.** It is a north-up linear plot with "Fit all" / "Local" zoom, the border line, velocity vectors, and closing/opening speed for each contact. The viewscreen shows relative bearings.
- **Tests (267 total, up from 162):**
  - the exact order and 20 paraphrases
  - each spatial intent, the lifecycle, time and NPC reaction, physical limits, no-teleport transitions and determinism
  - an end-to-end playthrough in which a shields-down interposition keeps the Prefect from firing, compared with a shields-up control
- **Held-out evaluation.** `tests/eval/heldout.ts` holds 42 orders written before tuning, and a report-only evaluator writes `tests/eval/RESULTS.md`. The result is **33/42 (78.6%)**.
- **Smoke test.** It types the exact order on the site, checks the lifecycle messages and orders-strip states, and verifies that the Halcyon ends up between the ships on tactical.

### Changed
- `WorldState` v3. The save key is `starbridge.save.v3`; v1 and v2 saves are reported as incompatible.
- Cruiser movement uses the same guidance and steering as the Halcyon.
- Leaving the reach via the border counts as a withdrawal for outcomes.

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
