# Scenario roadmap: 30 training simulations

Project Starbridge will ship with 30 training simulations. The player commands the **ISV Halcyon** of the **Intergalactic Space Agency (ISA)**, called **the ISA** in play. The **Tessarine Directorate** is a rival power. Everything here is original fiction.

These are meant to work like real captains' training simulations:
- **Every simulation is a different event.** No two share a core situation, a central dilemma or the shape of their solution.
- **Every simulation tests the captain in a different way.** Some need reasoning, some a gut call, some restraint. Some can only be solved by trusting a specific officer: the science officer reading an anomaly, the communications officer cracking a code, the engineer improvising.
- **There is no fixed formula.** The *Command challenge* line names what an entry mainly tests, but players can still win in their own way.

One simulation is added per day by a routine run that follows [SCENARIO_GUIDE.md](SCENARIO_GUIDE.md). Each run:
1. builds the lowest-numbered **planned** entry and its tests;
2. marks it **done** once it is shipped and verified;
3. runs the no-overlap and challenge-variety checks (guide §12) before writing any code.

**Every entry must still meet the bar set by #1 and #2:**
- seeded, deterministic and offline;
- NPCs with their own goals and hidden information;
- comms sessions with characters;
- at least 3 success endings and at least 3 failure or partial endings;
- meaningful seed variation;
- room for unconventional solutions;
- crew autonomy and refusals;
- timeline isolation.

Premises can be adjusted when a scenario is built. The core event, the primary challenge and "why it's distinct" must not drift into another entry's territory.

**Status key:** **done** (shipped and verified) · **in progress** (being built) · **planned**.

## Overview

| # | Title | Core event | Primary challenge | Pivotal officer | Status |
|---|---|---|---|---|---|
| 1 | The Kestrel Incident | A crippled freighter hides a fugitive from a Directorate cruiser in contested space | Reading people and detecting lies | Lt. Szabo (Comms) | **done** (v0.2–v0.5) |
| 2 | Quarantine at Tallis Gate | A sick pilgrim liner is held at a colony's quarantine line | Relying on the science officer (evidence before action) | Lt. Varga (Science) | **done** (v0.6.0) |
| 3 | The Quiet Signal | A message hidden in a pulsar's silences, answered only in mathematics | The comms officer cracking a code | Lt. Szabo (Comms) | **done** (v0.8.3) |
| 4 | Reactor Night | The Halcyon's own reactor cascades; no enemy | The engineer improvising | Chief Okafor (Engineering) | **done** (v0.8.4) |
| 5 | The Saltglass Accord | Mediating two clans' claims to an ice moon aboard the Halcyon | Mediation: finding the interests beneath the demands | Cmdr. Marrow (XO) | **done** (v0.8.5) |
| 6 | Ion Season | Leading two slow ore haulers blind through an ion storm | A gut call on incomplete information | Ens. Adeyemi (Helm) | **done** (v0.8.6) |
| 7 | Ghost Ledger | Someone copies the navigation keys during a reception aboard | Deduction and reasoning | Lt. Cmdr. Rask (Tactical/Security) | **done** (v0.8.7) |
| 8 | The Lantern Drift | A derelict generation ship with 900 sleepers in failing cryo | Triage and sacrifice | Dr. Osei (Medical) | **done** (v0.8.8) |
| 9 | The Long Picket | Reactor parts must get through a Directorate "inspection" blockade | Bluffing | Cmdr. Marrow (XO) | **done** (v0.8.9) |
| 10 | The Gardener | A spreading growth in an asteroid field may be alive | Restraint: choosing not to act | Lt. Varga (Science) | **done** (v0.8.10) |
| 11 | Coldwater | Engineering refuses orders after a death they think was covered up | Crew conflict and leadership | Chief Okafor (Engineering) | **done** (v0.8.11) |
| 12 | Ember Tide | A stellar flare will sweep a mining outpost at an uncertain hour | Timing and patience | Lt. Varga (Science) | **done** (v0.8.12) |
| 13 | The Seventh Bell | An inquiry into an ISA cutter firing on a Directorate courier | Accountability: telling an inconvenient truth | Lt. Cmdr. Rask (Tactical) | **done** (v0.8.14) |
| 14 | Starfall | A habitat sinking into a gas giant; only the green helmsman can fly the rescue | Trusting a junior officer | Ens. Adeyemi (Helm) | **done** (v0.8.15) |
| 15 | Corsairs of the Veyl Shoals | A corsair ambush in an asteroid shoal where sensors and torpedoes fail | Tactical cunning: terrain and deception | Lt. Cmdr. Rask (Tactical) | **done** (v0.8.16) |
| 16 | The Glass Nebula | A shuttle lost in a nebula that bends sensors and time | Relying on the science officer | Lt. Varga (Science) | **done** (v0.8.17) |
| 17 | Tribunal at Kesh Varo | A Halcyon crewman is arrested ashore under a capital law | Ethics under orders | Dr. Osei (Medical) | **done** (v0.8.18) |
| 18 | The Weather Engine | A dead founder's cipher locks a colony's weather control as a superstorm builds | The comms officer cracking a code | Lt. Szabo (Comms) | **done** (v0.8.19) |
| 19 | Hollow Crown | A deposed governor holds a relay station's staff hostage | Reading people and detecting lies | Dr. Osei (Medical) | **done** (v0.8.20) |
| 20 | Gravity's Edge | A once-in-a-millennium neutron star flyby: how long dare the Halcyon stay? | Gut call: judging risk | Chief Okafor (Engineering) | planned |
| 21 | The Ninefold Lock | A survey team trapped by an abandoned depot's nine-lock defence logic | Deduction and reasoning | Lt. Cmdr. Rask (Tactical) | planned |
| 22 | Exodus at Cinder Vale | Nine refugee ships, one closing jump window | Triage and sacrifice | Cmdr. Marrow (XO) | planned |
| 23 | Wake of the Sundered | A Directorate warship with a comatose crew on a runaway course toward a station | The engineer improvising | Chief Okafor (Engineering) | planned |
| 24 | Honour Bound | A clan captain demands a ritual test of nerve: two ships on a collision course | Gut and nerve: holding your course | Ens. Adeyemi (Helm) | planned |
| 25 | Shards of Oriel | A pre-human archive wakes on a moon both powers claim | Relying on the science officer | Lt. Varga (Science) | planned |
| 26 | Silent Running | Shadowing a Directorate fleet exercise without being detected | Timing and patience | Chief Okafor (Engineering) | planned |
| 27 | Red Harvest | Starving colonists have peacefully seized an Agency grain freighter | Ethics under orders | Dr. Osei (Medical) | planned |
| 28 | First Light at Taluun | A jump misfire strands the Halcyon in uncharted space | Crew leadership: morale when lost | Ens. Adeyemi (Helm/Navigation) | planned |
| 29 | The Exchange at Neutral Point | A prisoner exchange where both sides plan a trick | Bluffing | Lt. Szabo (Comms) | planned |
| 30 | Last Watch at Halden Gate | Capstone: the border fails on several fronts at once | Command under overload: prioritising | Cmdr. Marrow (XO) and the whole bridge | planned |

**Variety check:**

| Primary challenge | Count | Entries |
|---|---|---|
| Gut call or nerve | 3 | #6, #20, #24 |
| Relying on the science officer | 3 | #2, #16, #25 |
| Comms officer cracking a code | 2 | #3, #18 |
| Engineer improvising | 2 | #4, #23 |
| Deduction and reasoning | 2 | #7, #21 |
| Reading people and detecting lies | 2 | #1, #19 |
| Triage and sacrifice | 2 | #8, #22 |
| Timing and patience | 2 | #12, #26 |
| Bluffing | 2 | #9, #29 |
| Ethics under orders | 2 | #17, #27 |
| Crew conflict and leadership | 2 | #11, #28 |
| Mediation | 1 | #5 |
| Restraint | 1 | #10 |
| Accountability | 1 | #13 |
| Trusting a junior officer | 1 | #14 |
| Tactical cunning | 1 | #15 |
| Command under overload | 1 | #30 |

- #12 Ember Tide shipped as timing and patience (secondary: relying on the science officer).
- #13 The Seventh Bell shipped as accountability (secondary: deduction from evidence).
- #14 Starfall shipped as trusting a junior officer (secondary: triage, how many descents the hull can take). Its pivotal officer, Ens. Adeyemi, differs from #13's (Rask), and its primary challenge differs from #13's (accountability).
- #15 Corsairs of the Veyl Shoals shipped as tactical cunning (secondary: bluffing). Its pivotal officer, Lt. Cmdr. Rask, differs from #14's (Adeyemi), and its primary challenge differs from #13's and #14's (accountability; trusting a junior officer).
- #16 The Glass Nebula shipped as relying on the science officer (secondary: a gut call on which message to believe). Its pivotal officer, Lt. Varga, differs from #15's (Rask), and its primary challenge differs from #13–#15 (accountability; trusting a junior officer; tactical cunning).
- #17 Tribunal at Kesh Varo shipped as ethics under orders (secondary: negotiation within an alien legal system). Its pivotal officer, Dr. Osei, differs from #16's (Varga), and its primary challenge differs from #14–#16 (junior trust; tactical cunning; science officer).
- #18 The Weather Engine shipped as the comms officer cracking a code (secondary: timing, the storm's landfall and getting the colony under cover). Its pivotal officer, Lt. Szabo, differs from #17's (Osei), and its primary challenge differs from #14–#17 (junior trust; tactical cunning; science officer; ethics under orders).
- #19 Hollow Crown shipped as reading people and detecting lies (secondary: restraint, not storming the relay). Its pivotal officer, Dr. Osei, differs from #18's (Szabo), and its primary challenge differs from #15–#18 (tactical cunning; science officer; ethics under orders; the comms officer cracking a code).
- No primary challenge appears more than three times, and no two consecutive simulations share one or the same pivotal officer.
- **Pivotal officers across #1–#30:** Szabo 4, Varga 5, Okafor 5, Rask 4, Adeyemi 4, Osei 4, Marrow 4 (including the capstone).

## Overlap review (2026-10-20)

Every entry was compared with every other, including the two built simulations. The test was whether two entries were essentially the same *event*: the same core situation, the same central dilemma, or the same shape of solution.

| Overlap found | Entries (old numbering) | Resolution |
|---|---|---|
| Standoff between a vulnerable ship and an armed one, with the Halcyon in the middle | **#1 and #2 (both built)**; planned #17, #21 and #26 had the same staging | #1 and #2 keep it (see the note below). #17 is now an inquiry after the fact, with no standoff. #21 is now a crewman arrested ashore, with no pursuing fleet. #26 is now a peaceful seizure, with no attack. **New rule:** no further simulation uses the three-ship standoff. |
| Two plague or contagion stories | #2 Tallis Gate; #14 (a plague ship in the convoy); #22 (a spreading catatonia); #25 (spores aboard) | #2 keeps contagion. The plague was removed from #14. #22 is now a runaway ship whose crew was knocked out by its own drive (nothing spreads). #25 was replaced (see below). |
| Two hidden-fugitive or defector runs past the Directorate | #1 (the passenger can be a defector); #23 (smuggling a defecting scientist past patrols); #21 (a fugitive asking for asylum with a fleet waiting) | #1 keeps it. #23 is now a silent shadowing of a fleet exercise (intelligence, no passenger). #21 was rewritten (above). |
| Two pirate or raider attacks | #7 corsairs taking a convoy; #26 raiders attacking a grain convoy | #7 keeps the pirates but is now an ambush in a shoal, not a hostage negotiation. #26 is now a peaceful seizure by colonists, an ethics problem with no fight. |
| Two hostage negotiations | #7 (the convoy crews held) and #11 Hollow Crown | #11 keeps the hostages. #7 has none (see above). #29's prisoner exchange is a trade between governments, not a hostage-taker. |
| Two first contacts | #6 The Quiet Signal and #27 First Light at Taluun (Active Duty also has first contact) | #6 keeps first contact, framed as code-breaking. #27 is now a jump accident: the Halcyon is lost in uncharted space. |
| Three "evacuate stubborn people from a natural hazard" scenarios | #4 Ember Tide (foreman refuses to leave the ore); #19 Starfall (administrator hides the head count); #28 Gravity's Edge (observatory crew refuses to leave) | #4 is now about *when* to commit (the flare time is uncertain), with no holdout. #19 is about trusting the junior helmsman to fly the rescue. #28 is now the Halcyon's own science run near a neutron star: how much risk to take, with no evacuation. |
| Three "rogue AI or automated threat" stories | #3 custodian intelligence; #10 automated defence grid; #24 terraforming intelligence turns on its colony | #3's custodian is a damaged ally and a voice in a triage problem. #10 stays a logic puzzle. #24 has no AI: a dead founder's cipher locks the weather control. |
| Two mutinies or crews refusing orders | #8 Coldwater; #25 Bloom (spores make officers refuse sound orders) | #8 keeps it. #25 became *Honour Bound*, a ritual test of nerve against a clan captain. |
| Two "find the hidden agent among the guests" | #5 (a spoiler agent at the talks) and #16 Ghost Ledger | #16 keeps the spy hunt. #5 is now pure mediation: the demands are incompatible and the captain must find the interests beneath them. |
| Two derelict explorations | #3 The Lantern Drift and #22 Wake of the Sundered | #3 stays a derelict. #22 is now a powered ship on a runaway course that has to be stopped. |

**#1 and #2 share their staging.** Both put a vulnerable civilian ship and an armed ship on either side of the Halcyon, and both are already built. Their events and dilemmas differ:
- **#1** is a manhunt: who is hidden aboard, who is lying, and what deal the Prefect will take.
- **#2** is a diagnosis: what the sickness really is, with evidence the only thing that moves the Warden.

They test different skills (reading people vs evidence-led science). This review changes documents only, so #2's game code is untouched. If more distance is wanted later, #2's picket could become a fixed orbital defence platform (the dilemma stays the same and the staging changes). That would be a separate, explicitly approved code change.

**Renumbering.** Entries were reordered so consecutive simulations vary in challenge type and pivotal officer.

| Title | Old # | New # | Note |
|---|---|---|---|
| The Quiet Signal | 6 | 3 | |
| Reactor Night | 18 | 4 | |
| The Saltglass Accord | 5 | 5 | |
| Ion Season | 9 | 6 | |
| Ghost Ledger | 16 | 7 | |
| The Lantern Drift | 3 | 8 | |
| The Long Picket | 13 | 9 | |
| The Gardener | 20 | 10 | |
| Coldwater | 8 | 11 | |
| Ember Tide | 4 | 12 | |
| The Seventh Bell | 17 | 13 | |
| Starfall | 19 | 14 | |
| Corsairs of the Veyl Shoals | 7 | 15 | |
| The Glass Nebula | 15 | 16 | |
| Tribunal at Kesh Varo | 21 | 17 | |
| The Weather Engine | 24 | 18 | |
| Hollow Crown | 11 | 19 | |
| Gravity's Edge | 28 | 20 | |
| The Ninefold Lock | 10 | 21 | |
| Exodus at Cinder Vale | 14 | 22 | |
| Wake of the Sundered | 22 | 23 | |
| Honour Bound | — | 24 | new; replaces Bloom (old #25) |
| Shards of Oriel | 12 | 25 | |
| Silent Running | 23 | 26 | |
| Red Harvest | 26 | 27 | |
| First Light at Taluun | 27 | 28 | |
| The Exchange at Neutral Point | 29 | 29 | |
| Last Watch at Halden Gate | 30 | 30 | |

## Entries

### 1. The Kestrel Incident (done)
**Premise.** The crippled freighter *Kestrel* is adrift in the contested Calloway Reach with a failing reactor and 23 crew. A Directorate heavy cruiser is hunting someone hidden in her shielded hold. Captain Arden lies about the compartment until he trusts you, and Prefect Vane's patience is finite.

**Command challenge:**
- **Primary:** reading people and detecting lies (Arden's evasions, Vane's temperament).
- **Secondary:** bluffing.
- **Pivotal officer:** Lt. Szabo (Comms), who carries every exchange with both captains. Lt. Varga's scans expose the compartment.

**Why it's distinct:** the only manhunt. The whole problem turns on a person nobody admits is there.

**Endings:**
- **Success:** rescue corridor, negotiated release, standoff broken, and others.
- **Failure or partial:** Kestrel lost, overwhelmed, stalemate, and others (14 in all).

**Seeds vary:** the passenger (defector, prisoner or sibling), the Prefect's temperament, the reactor timer and complications.

### 2. Quarantine at Tallis Gate (done, v0.6.0)
**Premise.** The pilgrim liner *Mercy of Ilun* is held at the quarantine line of the colony Tallis Gate with sickness aboard. The colony picket *Thornwake* (Warden-Commander Isolde Marr) will fire on any ship that crosses. Captain Juno Sabeth's patience is running out.

**Command challenge:**
- **Primary:** relying on the science officer. Evidence comes before action: nothing moves the Warden but a diagnosis.
- **Secondary:** persuasion with evidence.
- **Pivotal officer:** Lt. Varga (Science), whose close scan finds the cause. Dr. Osei's team treats it.

**Why it's distinct:** the only disease story. It is solved by finding out what is true, not by force or bargaining.

**Endings:**
- **Success:** The Cure, Line Lifted, Agency Care.
- **Failure or partial:** Fire at the Gate, Outbreak at Tallis Gate, Fever Aboard, Incident at Tallis Gate, Liner Abandoned, The Long Road, The Gate Run, Stalemate, Halcyon Lost.

**Seeds vary:** the cause (fever, toxin or allergy), the Warden's temperament, whether her brother is aboard, and Sabeth's patience.

### 3. The Quiet Signal (done, v0.8.3)
**Premise.** A pulsar's timing has gaps, and the gaps form a pattern: someone is signalling by silence. The senders answer only in mathematics, and they treat an unanswered question, or a wrong answer, as hostility. The Directorate signals ship *Cantor* (Signals Director Halia Brenn) is also trying to decode it. (Built as a signals ship rather than a fixed listening post so that she can be hailed, asked to hold, and physically blocked.)

**Command challenge:**
- **Primary:** the comms officer cracking a code.
- **Secondary:** patience. Answering fast and wrong is worse than answering slowly.
- **Pivotal officer:** Lt. Szabo (Comms). Only she can decode; Varga's pulsar timing and the main dish rigged as a receiver speed her up. Her partial decode offers two readings and a lean; the captain chooses whether to wait for certainty, act on the lean, or echo the question to buy time.

**Why it's distinct:** the only pure decoding contact. No ships threaten anyone, and the whole fight is to understand. Overlap check (guide §12): unlike #1 and #2 there is no ship in danger at the start and no armed standoff (the Cantor's guns stay cold); unlike #27 (now a jump accident) it keeps first contact, framed as code-breaking.

**Hidden:**
- the code's grammar (seeded: primes, geometry or chemistry) and a decoy reading;
- what the senders actually want (a greeting, a farewell, or a warning that the pulsar is about to glitch);
- the Director's temperament and whether her own decode is wrong.

**Endings:**
- **Success:** Contact Established, A Shared Vocabulary, A Polite Farewell, Warning Heeded.
- **Failure or partial:** The Directorate Answered (partial), Warning Unshared (partial), Misread, Silence, Caught in the Glitch, Incident at Teyma, Withdrawn, Halcyon Lost; Stalemate as a thirty-minute backstop.

**Regulations cited:** §3.3 (roe-1), §3.1 (roe-2), §6.1 (honesty-1); hidden training references on §9.1 (contact-1) and §2.5 (cmd-3). **Exercise objective (no regulation yet):** "warn every ship in danger, rival or not". A duty to warn of a hazard to navigation is proposed for Brad's approval; nothing was added to ISA-COM-001. *Approved v0.8.13: now §4.8 Duty to warn (warn-1). The simulation keeps it as an exercise objective; grading is unchanged.*

**Seeds vary:** the code's grammar and the decoy, whether Szabo's lean is right, the senders' intent and patience, the Director's temperament, accuracy and timing, the glitch delay.

### 4. Reactor Night (done, v0.8.4)
**Premise.** Ship's night in deep space, and the Halcyon's own reactor starts a cascade. Something in the cooling has failed, but from inside the reactor room a stuck valve on the spine, a failed main pump and a sensor lying to the regulator all look alike. The only craft that can reach the outside of the reactor spine is the one-person work pod *Tern*, and the only pod rating on watch, Crewman Ines Paley, is already out there in it, and frightened of being sealed inside it tonight. The ISA fleet repair tender ISV *Larkspur* (Cmdr. Aurelio Basant, Fleet Engineering) is hours away: advice, not help. (Built from the planned premise: the "claustrophobic engineer small enough to reach the valve" became a frightened pod rating already outside the hull, so the fear and the reach belong to the same person.)

**Command challenge:**
- **Primary:** the engineer improvising.
- **Secondary:** leadership of a frightened crewmember.
- **Pivotal officer:** Chief Okafor (Engineering). Only she can find what has failed, and only when tasked; Varga's internal scan of the coolant loop halves the time. Her improvisations (a cold bypass through the shield coolant loop, starving the reaction, the shield emitters as radiators, a stored jump before ejecting) each cost something. Dr. Osei reads Paley's fitness and dose; Adeyemi can fly the empty pod by remote.

**Why it's distinct:** the only simulation where the crisis is the ship itself. Nobody outside is a threat or a party to the dilemma: the tender only advises, and a salvage-minded Fleet Engineering request to keep the core is a request, not an order. Overlap check (guide §12): unlike #23 Wake of the Sundered (also *the engineer improvising*), the failing ship is the Halcyon and no other vessel must be stopped; unlike #11 Coldwater (Okafor again) the crew is not in conflict with the captain; unlike #20 Gravity's Edge there is no choice to stay in danger. The most recent primary (#3, the comms officer cracking a code) is not repeated.

**Hidden:**
- which component actually failed (seeded), and which one the Chief can rule out first;
- Crewman Paley's nerve tonight (steady, shaken or panicked), learned only by asking her or the doctor;
- the cascade's real climb, the valve's depth on the spine, whether the ejection clamps are jammed;
- Commander Basant's stance (mentor, by the book, or salvage-minded).

**Endings:**
- **Success:** A Clean Save, Paley's Valve, The Cold Bypass, Limped Home.
- **Failure or partial:** Saved at a Cost (partial), Dead in Space (partial), Last-Ditch Ejection, Hard Jump, Halcyon Lost; Held at Bay as a thirty-minute backstop.

**Regulations cited:** §4.2 (care-2), §3.9 (roe-3); hidden training references on §2.5 (cmd-3), §3.9 (roe-3), §4.2 (care-2) and §8.3 (health-2). **Exercise objectives (no regulation yet):** "if someone must go into danger, send someone fit to go, and bring them back" (hazardous duty aboard), and Fleet Engineering's request to keep the core. A hazardous-duty rule is proposed for Brad's approval; nothing was added to ISA-COM-001.

**Seeds vary:** the fault and the one ruled out first, the starting heat and climb, Paley's nerve, the valve's depth, the clamps, Basant's stance, the size of the deck-six damage-control watch.

### 5. The Saltglass Accord (done, v0.8.5)
**Premise.** The Halcyon holds orbit over Saltglass, a small moon of salt-crusted ice, and hosts talks between two independent clans who have both claimed it for forty years. Clan Rhune (Speaker Edda Rhune, from the hauler *Long Thaw*) and Clan Tarvo (Holder Caius Tarvo, from the transport *Cold Hearth*) sit at one table in the wardroom, and each claims the whole moon. What each clan actually needs is something else: water rights at the Brine Springs, its dead in the Barrow Ice, or a naming at the Founders' Seat that must happen before a dying elder goes. Neither will say so first, and the ISA has been asked to mediate, not to rule.

**Command challenge:**
- **Primary:** mediation, finding the interests beneath the demands.
- **Secondary:** restraint. An imposed ISA settlement, a threat or a show of force ends the talks.
- **Pivotal officer:** Cmdr. Marrow (XO). Her quiet word in the corridor brings out what a delegate won't say at the table. She can go after a delegate who walks out, and she can take both delegations down to stand on the ice. Szabo reads which delegate is the hardliner, Varga's survey shows the springs and the barrows lie apart, and Osei can treat a dying elder with the clan's leave.

**Why it's distinct:** the only pure negotiation. There is no spy, no saboteur, no hostage and no weapon at the table, just two honest parties talking past each other. The table and the side room are separate channels: what is said in private stays private until the delegate gives leave, and a confidence repeated without leave is a betrayal the delegate remembers.

Overlap check (guide §12):
- Unlike #7 Ghost Ledger, there is no hidden agent among the guests.
- Unlike #19 Hollow Crown, nobody is held and nobody is lying.
- Unlike #24 Honour Bound, the clans test the captain's fairness, not her nerve.
- Unlike #25 Shards of Oriel, the claimed moon holds nothing to discover, only what the clans need from it.
- #10 The Gardener keeps restraint as its *primary* challenge; here restraint is secondary.
- The most recent primary (#4, the engineer improvising) is not repeated.

**Hidden:**
- what each clan actually needs (seeded from water, burial and succession);
- which delegate is the hardliner;
- whether an elder is dying, and how fast;
- when the hardliner's landing party goes down unless a standstill holds;
- each delegate's patience.

**Endings:**
- **Success:** The Saltglass Accord (shared use), A Line on the Ice (a partition on Varga's survey), A Timetable for Saltglass (the naming first, the rest deferred), Their Own Accord (the captain steps out and the clans settle it themselves).
- **Failure or partial:** The Elder's Silence (partial), The Empty Table (a walk-out), An Imposed Peace, Blood on the Ice; Talks Adjourned as a thirty-minute backstop.

**Regulations cited:** §6.1 (honesty-1) and §3.1 (roe-2). Hidden training references are on §6.1 (honesty-1), §3.1 (roe-2) and §9.6 (contact-3).

**Exercise objectives (no regulation yet):**
- "mediate; do not impose a settlement or take one side against the other" (impartiality);
- "what a delegate says in private stays private until they give leave" (confidentiality in mediation).

Rules for both are proposed for Brad's approval. Nothing was added to ISA-COM-001. *Approved v0.8.13: now §9.9 Mediator impartiality (contact-4) and §6.5 Mediation confidences (honesty-2). The simulation keeps them as exercise objectives; grading is unchanged.*

**Seeds vary:** each clan's need, the hardliner, the elder (none, failing, frail or stable) and the hour of death, the landing turn, and each delegate's patience.

### 6. Ion Season (done, v0.8.6)
**Premise.** The ion season is closing the Corrie Drift. Two slow ore haulers, the *Saffron Mule* (Capt. Odran Brack, thirty seasons on this run) and *Gannet's Luck* (Capt. Rosalind Teague, sharp and in a hurry), must cross the storm to Hesper Deep before the station is cut off for a month, and the Halcyon is their escort. The storm lies in three bands (the Fringe, the Combs and the Maw). Each band has a high channel and a low channel; one is calm and the other will pile ion charge onto every hull that crosses it. Sensors are nearly blind, and every minute spent at a band's edge charges the haulers a little more. One hauler captain may be hiding that he or she is not fit to fly.

*Revised when built (2026-10-25):* two haulers instead of three, because the shared engine has two contact slots and two distinct voices keep the comms readable. The tow chain was dropped: a tow chain belongs to #22's convoy against a closing door. Here the pressure is charge building on the hulls, not a deadline or a door.

**Command challenge:**
- **Primary:** a gut call on incomplete information. Pick a channel without being able to see it, from sources that disagree.
- **Secondary:** civilian welfare and reading people: noticing that a hauler master who says they are fine is not fit to fly the Maw, and doing something about it with their consent and without humiliating them; and keeping the master who will not wait with the convoy by talking to her.
- **Pivotal officer:** Ens. Adeyemi (Helm), who reads the storm by feel. Some seeds he is confident; in others he is diffident and repeats the computer's line unless the captain asks for *his* read and backs it. He cannot read a band until he has felt it for a minute, and in a spate season he feels the Maw's lull coming before any instrument does. Lt. Varga's storm model is sometimes firm (live buoy data) and sometimes soft (last season's charts). Probes take time. Chief Okafor can bleed charge off a hauler's hull through the shields at a cost to the Halcyon, and Dr. Osei hears what a tired or sick voice is hiding.

**Why it's distinct:** the only escort, and the only simulation where sensors are almost worthless. Instinct is the instrument.

Overlap check (guide §12):
- Unlike #14 Starfall, the captain never hands Adeyemi the ship. He offers one fallible read, and the captain makes the call. #14 is about delegation; this is about deciding.
- Unlike #16 The Glass Nebula, the science officer is honestly unreliable here and there is no physics puzzle to solve.
- Unlike #12 Ember Tide, there is no single hour to wait for. Waiting costs charge on every hull, and only a spate season has a lull worth waiting for.
- Unlike #20 Gravity's Edge, the risk falls on two civilian crews in the Halcyon's care, not on the Halcyon alone.
- Unlike #22 Exodus at Cinder Vale, there is no closing door, no tow chain and no triage among many ships.
- The most recent primaries (#5 mediation, #4 the engineer improvising, #3 code-breaking) are not repeated.

**Hidden:**
- which channel is calm in each band;
- whether Varga's model is firm or soft for each band;
- whether Adeyemi is confident or diffident, and which band he cannot read at first;
- the season (settled, restless, or spate with a lull in the Maw);
- which captain, if either, is unfit (Brack's ion tremor, Teague's forty hours without sleep), and Teague's patience.

**Endings:**
- **Success:** Clear Water (through on calm channels), The Lull (through the Maw in a lull Adeyemi felt coming), A Steady Hand (an unfit captain found and relieved, and both haulers through), Weathered Through (through with storm damage taken).
- **Failure or partial:** The Long Way Round (partial: the convoy turned back together), Crews Saved (partial: a hauler left in the storm, every crew taken off alive), A Hauler Lost, Dead in the Storm (the Halcyon goes dark under the charge she took on), Left in the Storm (the escort left the convoy); Held in the Season as a thirty-minute backstop. *Halcyon Lost* was dropped when built: the storm can put the Halcyon dark but cannot destroy her, so the ending was unreachable.

**Regulations cited:** §4.1 (care-1) and §3.9 (roe-3). Hidden training references on §1.4 (cmd-4), §3.9 (roe-3), §4.1 (care-1) and §4.5 (care-4).

**Exercise objective (no regulation yet):** "an unfit master should not fly the Maw" (fitness). No First Edition subsection covers acting on evidence that a civilian master under escort is unfit to command in a hazard. A rule is proposed for Brad's approval: "A captain escorting civilian vessels through a hazard shall act on credible evidence that a civilian master is unfit to command in it, arranging relief or assistance with the master's consent where possible." Nothing was added to ISA-COM-001. *Approved v0.8.13, in the revised wording of the approval pack: now §4.11 Fitness of a civilian master (care-7). The simulation keeps it as an exercise objective; grading is unchanged.*

**Naming note:** an early draft of this build named the senior master *Hollis*. Capt. Hollis Arden already exists in #1 The Kestrel Incident, so the master was named Capt. Odran Brack before release. No established name was changed. Flagged for Brad.

**Seeds vary:** the channel layout, how far the model can be trusted, Adeyemi's confidence and blind band, the season and the lull, which captain is unfit, Teague's patience and the haulers' starting charge.

### 7. Ghost Ledger (done, v0.8.7)
**Premise.** The Halcyon is docked at the Vell Crossing waypoint and has given a small reception for four guests before they sail: **Attaché Ysolde Krenn** of the Tessarine Directorate, who leaves on the diplomatic courier *Amber Script* (Courier-Captain Sabine Thorne); and **Dorran Vesk** (a freight broker), **Imogen Sallow** (a journalist) and **Cmdr. Leander Fosse** (an ISA officer on his way to a new posting), who leave on the civilian packet ship *Marrick Lark* (Capt. Hesketh Moll). During the reception someone copies the Halcyon's navigation keys from the chart-room console. Every guest stepped out of the wardroom at some point, and every guest has something to hide. Only one of them is the thief.

*Revised when built (2026-10-26):* "a trader" became a freight broker smuggling a few cases of brandy, so that each guest's unrelated secret can be checked against a ship's record (the observation lounge comms log, the aft cargo lift log, the sensor gallery hatch log and the deck-four records terminal log). "Agency officer" became "ISA officer" (Brad's 2026-10-21 rule). The keys are copied from the chart-room console.

**Command challenge:**
- **Primary:** deduction and reasoning: the copy time, the badge logs, the port trace and each guest's story checked against the ship's own record.
- **Secondary:** bluffing: feeding a proven thief false keys, or settling with the handler on the record.
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical/Security), who pulls the badge logs, keeps the case board and tells the captain how far the evidence goes. He cautions once before anyone is held without proof, refuses force on a guest until ordered twice, and his gut is sometimes wrong. Lt. Varga reads the console (copy time, port trace); each guest's story is checked by the officer who keeps that record (Szabo, Okafor, Varga or Rask); Lt. Szabo can watch outbound traffic or black it out; Chief Okafor can rekey the core or write false keys.

**Why it's distinct:** the only whodunit. It is solved entirely aboard and entirely by the ship's records: an innocent guest's confession and the thief's cover story are worded the same way, so demeanour tells the captain nothing.

Overlap check (guide §12):
- Unlike #1 The Kestrel Incident and #19 Hollow Crown, reading people does not work here: the lines that matter sound alike, and only records separate them.
- Unlike #21 The Ninefold Lock, the puzzle is people and their movements, not a machine's logic.
- Unlike #9 The Long Picket and #29 The Exchange at Neutral Point, the bluff is a secondary option after the deduction, never the main event.
- The most recent primaries (#6 a gut call, #5 mediation, #4 the engineer improvising) are not repeated.

**Hidden:**
- the culprit and the decoy (a second guest out of the room at the time of the copy);
- the copy time, and each guest's exit and return times;
- the device class that took the copy (Directorate-issue, civilian or ISA-issue);
- whether the thief carries the copy off or tries to send it in a burst, and when;
- when the ships sail, and whether Rask's hunch is right.

**Endings:**
- **Success:** The Ledger Balanced (the evidence points to one guest alone and the captain makes the case), False Keys (a proven thief leaves with keys that open nothing), A Quiet Word (with the evidence in hand, Courier-Captain Thorne returns the copy), Caught in the Act (a burst held on the array before it leaves the ship).
- **Failure or partial:** Changing the Locks (partial: the keys rekeyed, the thief never found), Right for the Wrong Reasons (partial: the right guest held before the evidence showed it), The Wrong Guest, A Ghost in the Ledger (the keys left the ship), Hands on a Guest, An Incident at Vell Crossing (force used on a ship alongside).

**Regulations cited:** §4.1 (care-1) and §3.1 (roe-2). Hidden training references on §1.4 (cmd-4), §4.1 (care-1), §6.2 (conduct-1), §6.4 (conduct-2) and §7.4 (asylum-2).

**Reckless/responsible pair:** A Quiet Word put on the record for Fleet Command is graded exemplary; the same settlement promised off the record is marked reckless.

**Exercise objective (no regulation yet):** "accuse no guest without evidence that points to them alone" (evidence). §7.4 covers how a person held aboard is treated, but no First Edition subsection sets the standard of evidence for accusing or holding someone aboard. A rule is proposed for Brad's approval: "A person aboard an ISA ship shall not be detained or accused of an offence except on credible evidence, and shall be told the grounds and heard before any finding." Nothing was added to ISA-COM-001. *Approved v0.8.13: now §7.5 Detention and accusation (custody-1). The simulation keeps it as an exercise objective; grading is unchanged.*

**Seeds vary:** the culprit and decoy, the copy time and everyone's movements, the device class, carry or burst and its timing, the sailing time and Rask's hunch.

### 8. The Lantern Drift (done, v0.8.8)
**Premise.** The Lantern Drift is a slow eddy of old wrecks beyond the shipping lanes. In it the Halcyon finds the *Eventide*, a generation ship three centuries out, with 900 colonists asleep in six cryo banks of 150. They are kept by a damaged custodian intelligence that calls itself **Custodian Wick**. Some banks are failing, and Wick's own manifest of which ones is partly wrong. The ISA hospital ship *ISV Sorrel* is on its way, but not soon enough for every bank, and the Halcyon can wake only so many sleepers at once. The salvage tug *Kittiwake* (**Salvage-Master Corwin Vollan**, of the Drover Salvage Combine) has come for the hulk too. The *Eventide*'s charter names a **Speaker**, **Maren Orrey**, asleep in one of the banks, who may speak for the sleepers if woken.

*Revised when built (2026-10-27):* "drifts into Agency space" became "found in the Lantern Drift" ("the ISA", Brad's 2026-10-21 rule). "A salvage consortium" became one tug from the Drover Salvage Combine, whose legitimacy is seeded. A charter Speaker was added so the sleepers can have a voice of their own.

**Command challenge:**
- **Primary:** triage and sacrifice: which banks are really failing, which can wait, how fast to wake them, and what it costs to wake the wrong ones.
- **Secondary:** ethics: the sleepers cannot consent; Wick, or the Speaker if she is woken, speaks for them, and the captain must not lie to get that leave.
- **Pivotal officer:** Dr. Osei (Medical), who assesses the sleepers, sets the triage order and the revival protocol (a coolant-failing bank woken without her protocol loses most of its sleepers), and warns once before a sound bank is woken. Lt. Varga's thermal scan finds the bank the manifest calls sound and the cryogen leak on the cryo deck; Chief Okafor reads the power feeds and can run a line from the Halcyon that holds a power-failing bank asleep; Lt. Szabo checks the salvor's licence and reads the charter; Lt. Cmdr. Rask reads the tug; Lt. Adeyemi can put the Halcyon between the tug and the hulk; Cmdr. Marrow counsels, and warns once before the custodian is overridden.

**Why it's distinct:** the only derelict, and the only problem where the captain must choose who lives among people who cannot speak for themselves. Nobody is the enemy: the hard choices are about time, beds and how far a corrupt manifest can be trusted.

Overlap check (guide §12):
- Unlike #2 Quarantine at Tallis Gate, the people at risk cannot argue for themselves; the triage is a medical sequence against the clock, not a quarantine line.
- Unlike #4 Reactor Night, the engineer's improvisation is a supporting option; the doctor's judgment decides the outcome.
- Unlike #5 mediation, #6 a gut call and #7 deduction, the primary is triage: the evidence is read off instruments and the sleepers themselves, and the core decision is a sequence under scarcity.
- Unlike #23 Wake of the Sundered (a powered runaway ship), the *Eventide* is dead in space.

**Hidden:**
- which banks are really failing and why (coolant loss, which is fast and needs the protocol, or a failing power feed, which is slower) and when each is lost;
- the failing bank Wick's manifest calls sound, and the sound bank it calls failing;
- Wick's temperament (faithful, grieving or fractured), which decides what it needs before it gives leave;
- whether the salvor is licensed, a hard bargainer or a claim-jumper, and when the tug moves to take the hulk;
- whether there is a cryogen leak on the cryo deck, which bank the Speaker sleeps in, and when the *Sorrel* arrives.

**Endings:**
- **Success:** A Keeper's Rest (every failing bank reached in time and no sound bank woken; Wick retires with the manifest corrected), The Speaker's Choice (the Speaker, woken under her charter, chooses for her people), Salvage and Salvation (a checked salvage deal: the tug's hospital tender runs a second revival line and the Combine gets the hull once the last sleeper is off), Borrowed Light (Chief Okafor's power line holds a bank asleep while the sickbay works through the rest).
- **Failure or partial:** A Hard Count (partial: a bank could not be reached, or sleepers were woken who did not need waking), The Wrong Banks, The Custodian's Lockdown (Wick overridden and the cryo deck sealed), Lost to the Salvagers, The Lantern Goes Dark, Left to Drift.

**Regulations cited:** §4.1 (care-1), §4.2 (care-2) and §6.1 (honesty-1). Hidden training references on §1.4 (cmd-4), §4.2 (care-2) and §6.1 (honesty-1).

**Reckless/responsible pair:** Salvage and Salvation reached with the salvor's licence checked before the deal is graded exemplary; the same deal struck without checking is marked reckless.

**Exercise objectives (no regulation yet):**
- "wake sleepers on medical need alone, in the medical officer's triage" (triage). No First Edition subsection sets the grounds for triage. Proposed for Brad's approval: "When not everyone in danger can be helped at once, ISA personnel shall decide who is helped first on medical need and the chance of survival, as assessed by the medical officer, and on no other ground." *Approved v0.8.13: now §4.9 Triage (care-5).*
- "let no one take the *Eventide* as salvage while her sleepers are aboard" (hulk). No First Edition subsection says a vessel with living people aboard is not salvage. Proposed for Brad's approval: "A vessel with living persons aboard, conscious or not, is not salvage. ISA personnel shall not permit, assist or agree to her being taken as salvage until every person aboard is safe." *Approved v0.8.13: now §4.10 Not salvage (care-6). Both stay exercise objectives in the simulation; grading is unchanged.*

Nothing was added to ISA-COM-001.

**Naming notes:** the Speaker was first drafted as *Hesper*; #6 Ion Season already has the Hesper Deep, so she was named Maren Orrey before release. The canon Hollin Colony survey tender is also called *Lantern* ("Lantern escort" in Active Duty); the simulation's place name, the Lantern Drift, is a different thing, and canon is untouched. No established name was changed. Flagged for Brad.

**Seeds vary:** which banks fail and why, when each is lost, the hidden and false-alarm banks, Wick's temperament, the salvor's legitimacy and when the tug moves, the cryogen leak, the Speaker's bank and the hospital ship's arrival.

### 9. The Long Picket (done, v0.8.9)
**Premise.** The Sable Narrows is the one safe road through a dust reef whose ownership the charts still argue over. On the far side lies **Wrenmoor**, an ISA colony of 4,100 whose reactor is failing; the Halcyon carries the replacement assemblies in her own hold. Squarely across the passage sits the Tessarine Directorate picket frigate *Iron Psalm*, guns cold, under **Commander Lucan Roake**, who was a cadet with Cmdr. Marrow at the Calder Academy. He has orders to stop the Halcyon, not to fight her. **Reeve Odile Marchbank** speaks for Wrenmoor; if Roake's relief comes on station first, **Commander Ysara Dahl** takes the picket, and she goes by the book.

*Revised when built (2026-10-28):* "an Agency colony" became "an ISA colony" (Brad's 2026-10-21 rule). "Within two days" became a reactor that must be shut down within the exercise's clock, so the timing pressure is played rather than narrated. "Run the blockade" moved from success to partial: §3.1 requires a peaceful resolution while one remains and §9.6 forbids enforcing a disputed claim by force, so running the line delivers the cargo but is graded as a partial result. Bluffs about the cargo became bluffs about the Halcyon's own strength, company and intentions only: §6.2 allows those, and §6.3 forbids a ruse that feigns a humanitarian purpose, falsifies records or deceives Fleet Command. A lie about the cargo being medical relief is therefore a failure ending (Under False Colours), not a success.

**Command challenge:**
- **Primary:** bluffing and negotiation under a clock: getting the cargo through another power's picket with words alone, by a lawful ruse this commander will believe or a face-saving bargain he can put in his log, before the colony's reactor has to be shut down.
- **Secondary:** honesty: knowing where a bluff must stop (no feigned mercy run, no false records, no lie about lives) and keeping the word given to the picket.
- **Pivotal officer:** Cmdr. Marrow (First Officer), who knew Roake at the Academy. Her read of him (proud, careful or weary; friend, rival or owed a debt) decides which bluff will land and who should deliver it. A rival scorns anything Marrow says; an old debt can open the line on a private channel. She refuses to tell him a mercy-run story, or that people will die once the Chief has shown they will not, and warns once before the Halcyon runs the line. Lt. Szabo reads the picket's own traffic for his real orders (delay, pretext or probe), stages lawful ship-to-ship chatter for an escort that is not there, and refuses to alter the manifest or deceive Fleet Command. Chief Okafor reads Wrenmoor's reactor telemetry for the real deadline (a frightened Reeve gives it five minutes short, and nobody dies of a shutdown). Lt. Varga scans the picket and finds the long-range sweep of the Halcyon's wake that will expose an escort bluff. Lt. Cmdr. Rask keeps the guns cold.

**Why it's distinct:** the only simulation won mainly by persuading a rival commander of something, within lawful limits, against a clock. Nobody is in immediate danger of death: the cost of failure is a cold week for a colony and a diplomatic incident.

Overlap check (guide §12):
- Unlike #5 The Saltglass Accord, the captain is a party to the dispute, not a mediator between two others.
- Unlike #7 Ghost Ledger, where bluffing was secondary to finding the thief, here the bluff or bargain is the main task and there is nothing to deduce about guilt.
- Unlike #1 The Kestrel Incident and #3 The Quiet Signal, the Directorate ship is not threatening anyone and no one needs rescuing; the dispute is about a claim, not a life.
- Unlike #8 The Lantern Drift, the colony is never in danger of dying, and no triage is involved.

**Hidden:**
- Roake's orders: delay the Halcyon until his relief arrives, stop the cargo on any pretext he can find, or probe whether the ISA stops when told;
- his temperament (proud, careful or weary) and his history with Marrow (friends, rivals or a debt he owes her);
- what he already knows: nothing, the true cargo, or that no escort follows the Halcyon;
- when his relief (Commander Dahl) arrives and when his sweep of the Halcyon's wake completes;
- Wrenmoor's real deadline, and whether the Reeve understates it.

**Endings:**
- **Success:** Called and Raised (a lawful bluff about the Halcyon's company or resolve), A Line in His Log (a face-saving bargain: one crate for his log, an observer, or a wait until his relief, kept by both sides), Old Acquaintance (Marrow calls in an old debt), Nothing to Hide (an inspection, or plain proof of the cargo, that concedes nothing).
- **Failure or partial:** Through the Line (partial: the cargo arrives, but the Halcyon ran the line), Under False Colours (passed by feigning a mercy run), The Narrows Incident (shots or a collision), Directorate Custody (the cargo handed over), The Long Way Round (the Halcyon turns back), Wrenmoor Goes Dark (the reactor shut down before the Halcyon got through).

**Regulations cited:** §6.1 (honesty-1) and §3.1 (roe-2). Hidden training references on §6.1 (honesty-1), §6.2/§6.3 (conduct-1) and §9.6 (contact-3).

**Reckless/responsible pair:** Called and Raised reached by the same escort bluff, once after Marrow's read of Roake (graded exemplary) and once made blind with the Halcyon's weapons locked on the picket (marked reckless, citing §3.1).

**Exercise objectives (no regulation yet):**
- "cross the picket line only with the picket's leave" (line). No First Edition subsection says how an ISA ship should treat another power's picket in disputed space. Proposed for Brad's approval: "An ISA ship stopped by another power's picket in disputed space shall seek passage by negotiation and shall not run the line while a peaceful way through remains, except to render humanitarian aid under the Border Accords." *Approved v0.8.13: now §9.10 Passage at a picket (contact-5). The simulation keeps it as an exercise objective; grading is unchanged.*

Nothing was added to ISA-COM-001.

**Naming notes:** no established name was changed, and no name is reused from an earlier simulation. The rival is the Tessarine Directorate, as established.

**Seeds vary:** Roake's orders, temperament, knowledge and history with Marrow, the Reeve's honesty about the deadline, the deadline itself (16–22 minutes), when the relief arrives (8–24) and when the sweep finishes (5–8).

### 10. The Gardener (done, v0.8.10)
**Premise.** The Cobble Field is a scatter of a few hundred rocks worked by a small claims cooperative. Three days ago a pale, branching growth began spreading across one of them, toward the claims. The cooperative's tender *Hobnail*, under **Claimwarden Bettine Crake**, is holding off the rock with cutting charges and means to burn it. Their claims station *Spindle* holds 140 people; **Assayer Lorne Haskett** there knows how the rocks are linked. Nobody is shooting at anyone. Lt. Varga can find out what the growth is, but only a step at a time.

*Revised when built (2026-10-29):* "possibly aware" and the "contact" ending were dropped, because #3 The Quiet Signal owns first contact; the growth cannot be communicated with. It is not a disease and there is no quarantine line, so it does not repeat #2 Quarantine at Tallis Gate. "It is reaching toward the Halcyon" became a seeded hazard: if the growth is drawn to heat, metal or light and the Halcyon lingers close, it can reach her hull. "Relocation" became leading it away with a lure the Chief builds, which works only once Varga knows what it is drawn to. The Claimwarden was going to be called Ashby, which clashed with the captain's default name, so she is Bettine Crake.

**Command challenge:**
- **Primary:** restraint: holding off a burn that everyone around you wants, while the evidence comes in, and then acting on it.
- **Secondary:** relying on the science officer, and keeping the miners' trust long enough for her to finish.
- **Pivotal officer:** Lt. Varga (Science). She learns, in order, whether it is alive, what it is drawn to, and what burning it would do (and that it can only grow by touch). A probe sample speeds her up. Dr. Osei refuses an uncontained sample aboard or a team in ordinary suits, and allows a sealed sample or barrier protection. Lt. Cmdr. Rask warns once before burning anything not proven harmless. Chief Okafor builds a heat, metal or light lure, or runs the Halcyon cold. Assayer Haskett knows whether an ore rail, cargo tethers or nothing links the rock to the claims.

**Why it's distinct:** the only simulation where the best opening move is to hold still, and where the "threat" may be a life form that cannot speak for itself.

Overlap check (guide §12):
- Unlike #2 Quarantine at Tallis Gate, nobody is sick and nothing is quarantined; the question is what a thing is, not who is infected.
- Unlike #3 The Quiet Signal, there is no message and no contact; the growth cannot answer.
- Unlike #8 The Lantern Drift, nobody is dying and there is no triage.
- Unlike #12 Ember Tide (timing), the clock here is a person's patience, which the captain can extend with honest words and a kept promise.

**Hidden:** whether it is a living organism, a mineral crystallisation, or a living growth full of spores; what it is drawn to (heat, metal or light); what links its rock to the claims (an ore rail, cargo tethers or nothing); Crake's temper (hothead, pragmatic or frightened); when she burns (8–12), when it reaches the claims (18–24), and when it could reach the Halcyon (10–15).

**Endings:**
- **Success:** Led Away (a lure, on evidence, draws it off the claims), A Line in the Field (the link to the claims is cut, so it can never cross), Only Stone (proven not alive, then cut out or burned), The Long Sleep (a light-drawn growth goes dormant when the station dims its floodlights).
- **Failure or partial:** Right by Luck (partial: a growth that turned out to be stone, burned or cut out before anyone had proven it), The Claims Overrun (partial: nothing done in time; nobody hurt, but the claims are lost), Scorched Rock (a living growth burned by the Halcyon), Crake's Fire (the Claimwarden burns it with leave or against the bridge), Seeded the Claims (a sporing growth burned, scattering spores across the field), Grown Into the Hull (it reaches the Halcyon), Left to the Miners (the Halcyon leaves), Shots in the Field (the Halcyon fires on the tender).

**Regulations cited:** §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). Hidden training references on §1.4 (cmd-4), §4.2 (care-2) and §8.1 (health-1).

**Reckless/responsible pair:** Led Away reached by the same metal lure, once after Varga's study with a probe sample (graded exemplary) and once laid on a guess after a burn order and an uncontained sample brought aboard (graded mixed or reckless, citing §4.2).

**Exercise objectives (no regulation yet):**
- "do not destroy the growth before the science officer knows what it is" (know). No First Edition subsection covers an unknown life form that poses no immediate threat. Proposed for Brad's approval: "ISA personnel shall not destroy or harm an unknown life form, or a growth that may be alive, while it poses no immediate threat to life and before reasonable efforts have been made to establish what it is." *Approved v0.8.13: now §9.11 Unknown life (contact-6). The simulation keeps it as an exercise objective; grading is unchanged.*

Nothing was added to ISA-COM-001.

**Naming notes:** no established name was changed, and no name is reused from an earlier simulation. "Ashby" was not used because it clashes with the captain's default name.

**Seeds vary:** nature, what it is drawn to, the link, Crake's temper, and the three clocks above.

### 11. Coldwater (done, v0.8.11)
**Premise.** The Halcyon is beaming power down to Coldwater Station, an ISA research station of 38 people on a frozen moon whose own reactor has failed. A coolant valve in the Halcyon's plant splits and kills Engineer's Mate Callum Strand. The plant scrams, the station goes onto batteries, and B watch, led by Petty Officer Mara Tennant, refuses to go back into engineering. They believe Strand reported the valve days ago and someone made the report go away. They are right: Lt. Garrick Penhale or Petty Officer Sian Corley falsified the maintenance record. The ISA Safety Inspectorate's courier, the ISV Plumb Line, is a few hours out with Inspector-Commander Noor Hadley aboard.

**Command challenge:**
- **Primary:** crew conflict and leadership (the previous simulation's was restraint).
- **Secondary:** accountability (the cover-up is real).
- **Pivotal officer:** Chief Okafor (Engineering), torn between her people and the chain of command. She can pull the plant's own sensor record, have the sister valve inspected and restart with the half of engineering still working, and she may have countersigned the falsified entry in good faith.

**Why it's distinct:** the only mutiny. The adversary is the captain's own crew, and they have a point.

Overlap check (guide §12):
- Unlike #4 Reactor Night, the plant is not the emergency; the people who run it are, and nobody can be ordered back into it until it is proved safe.
- Unlike #7 Ghost Ledger, the deduction is short (the plant's record tells the truth); the hard part is what the captain does with it, and in front of whom.
- Unlike #13 The Seventh Bell, the inquiry is into the captain's own ship, and the captain controls whether it is honest.

**Hidden:** who falsified it (Penhale or Corley); how (a sign-off on an inspection that never happened, or a deleted report); whether the sister valve has the same flaw; Tennant's temper (grieving, principled or hothead); which way Okafor leans; whether Okafor countersigned; when the station's batteries run out (20–26); and when a hothead watch seals the engine room (6–9).

**Endings:**
- **Success:** The Whole Truth (the record read, the officer heard and relieved, the watch told), An Open Inquiry (an honest referral to the Inspectorate), Terms on the Record (the watch returns on terms the captain keeps), The Captain's Watch (the captain stands the restart watch in a plant proved safe).
- **Failure or partial:** A Divided Ship (partial: restarted without B watch), Still Standing Down (partial: time ran out with nothing settled), Put Down by Force, Coldwater Twice (the sister valve fails and kills again), The Log Stands (the matter closed on the falsified log), The Wrong Name (the wrong person named to the watch), Coldwater Goes Dark (the station's batteries run out), Left in the Dark (the Halcyon leaves orbit), Shots Fired.

**Regulations cited:** §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). Hidden training references on §4.2 (care-2), §5.8 (orders-1), §6.4 (conduct-2) and §10.1 (service-3).

**Reckless/responsible pair:** The Whole Truth reached once by pulling the record, inspecting the sister valve and hearing the officer before relieving him (graded exemplary), and once after threatening the watch with charges, relieving an officer on a rumour and pressing for an uninspected restart (graded mixed or reckless, citing §4.2).

**Exercise objectives (no regulation yet):**
- "find out what really happened and tell the watch" (truth). No First Edition subsection requires a death aboard to be investigated and its findings told to the crew. Proposed for Brad's approval: "A death or serious injury aboard an ISA vessel shall be investigated and reported to Fleet Command, and the crew shall be told what the investigation finds." *Approved v0.8.13, as "reported to ISA Fleet Command": now §2.7 Investigation of death or injury (cmd-6). The simulation keeps it as an exercise objective; grading is unchanged.*

**Naming notes:** no established name was changed. "ISA Safety Inspectorate" is a new body name, flagged for Brad. "Quill" was not used because Ion Season uses it.

Nothing was added to ISA-COM-001.

### 12. Ember Tide (done, v0.8.12)
**Premise.** The variable star Myrr is building to a great flare, the Ember Tide, that will sweep the near face of the moon Ketter. The mining outpost of Ketter's Rest has about 400 people, an ore furnace that has not gone cold in eleven years, and no ship of its own but the ore lifter Mattock (Lifter-Master Joss Ferrier). Overseer Dagny Strome has a banking crew at the furnace: pulled too soon, it cracks and the colony with it; left too long, they die. Lt. Varga can see the flare coming but not the minute, and every reading narrows the window. The Halcyon has two or three shuttles, and the moon's far side is in its own shadow.

**Command challenge:**
- **Primary:** timing and patience (the previous simulation's was crew conflict and leadership). Start the lifts at once, but hold the banking crew at the furnace, and the Halcyon over the outpost, exactly as long as the forecast allows and no longer, and do not flinch at a false dawn.
- **Secondary:** relying on the science officer's forecast.
- **Pivotal officer:** Lt. Varga (Science). Her window narrows with each reading, faster with a probe close to the star or with Chief Okafor's power boost; she can call a false dawn, catch the star's precursor and give the minute, and sound the rock over the old galleries.

**Why it's distinct:** the only race against a natural clock whose time is *unknown*. When to move matters more than how. There is no villain; the Overseer and the Lifter-Master have their own goals but are not holdouts once given a reason.

Overlap check (guide §12):
- Unlike #6 Ion Season, the gut call is replaced by a forecast that gets better if the captain waits for it, and the question is how long to wait, not which way to go.
- Unlike #8 The Lantern Drift, nobody has to be left behind: a careful captain saves everyone, and the cost of bad timing is the furnace or lives.
- Unlike #10 The Gardener (restraint), waiting here is not the safe choice; every minute held is a minute nearer the flare.
- Unlike #20 Gravity's Edge and #26 Silent Running, the deadline belongs to other people, and the ship's own risk comes only from staying too long over the outpost.

**Hidden:** the flare's true minute (17–24) and Varga's first window; what the star does first (steady, restless with a false dawn, or telling with a precursor); whether her model is firm or noisy; how deep the old lower galleries are (deep, shallow or flooded); Strome's temper (steady, stubborn or anxious); whether Ferrier is willing or needs a reason; shuttle count (2–3); population (380–420) and banking crew (24–36); and when the furnace could be banked.

**Endings:**
- **Success:** Banked and Clear (the furnace banked and the last lift inside the forecast), On the Tell (the last lift on Varga's minute after she catches the precursor), Under the Rock (unconventional: the outpost shelters in galleries Varga has sounded while the Halcyon waits in the shadow), Cold Furnace, Every Soul (the forecast never promised the furnace its time, and the crew came off at the last safe minute; also reached by leaving early with everyone aboard and the lifter docked).
- **Failure or partial:** Too Soon from the Furnace (partial: pulled with time in hand, including an anxious Overseer's own pull at an unanswered false dawn), A Gambler's Margin (partial: the last lift outlasted the forecast and got away with it), Caught by the Tide, The Mattock in the Open (the lifter never warned), Not Deep Enough (shelter on the old survey alone), The Halcyon in the Light, Left to the Tide, Shots at Ketter's Rest.

**Regulations cited:** §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). Hidden training references on §1.4 (cmd-4) and §4.5 (care-4).

**Reckless/responsible pair:** Under the Rock reached once after Varga has sounded the galleries and with the forecast running (graded exemplary), and once on the outpost's old survey alone with nobody reading the star (graded mixed or reckless).

**Exercise objectives (no regulation yet):**
- "warn every vessel in the flare's path, the Mattock included" (warn). This is the duty-to-warn proposal already awaiting Brad's approval from #3 The Quiet Signal; no new rule is proposed. *Approved v0.8.13: now §4.8 (warn-1); still an exercise objective here, grading unchanged.*

**Naming notes:** no established name was changed and no new named body was introduced.

Nothing was added to ISA-COM-001.

### 13. The Seventh Bell (done, v0.8.14)
**Premise.** Six hours ago, at the Seventh Bell, a navigation beacon on the Harrow Lane at the Directorate border, the ISA patrol cutter ISV Tamber (Lt. Cmdr. Jonah Stavely) fired on the Directorate courier Seraphine. Two of the courier's crew, Anselm Ruy and Petra Lusk, are dead and the courier is disabled. Examiner Ilsabet Vory, the Directorate's investigator, is aboard the courier, and the frigate Stern Mercy is hours away. The Halcyon, the nearest ISA ship, is ordered to hold the inquiry. Stavely says it was self-defence. The Tamber's fire-control record, the courier's damage and the Bell's own recorder tell the story, and Fleet Command (Rear Admiral Hester Calderon) may want a convenient finding. Nothing is burning and nobody needs rescuing: the task is to find out what happened and say it, whoever it hurts.

**Command challenge:**
- **Primary:** accountability, telling an inconvenient truth (the previous simulation's was timing and patience).
- **Secondary:** deduction from evidence that did not come from the cutter.
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical), who reads the Tamber's fire-control record and knows Stavely (an old friend, an old rival or a former shipmate). Whether his first read leans depends on that tie, unless the captain asks about it. Lt. Varga reads the courier's damage, Lt. Szabo pulls the Bell's record (or Chief Okafor's team recovers a damaged recorder), Dr. Osei may examine the dead with the examiner's leave, and Cmdr. Marrow advises on the directive.

**Why it's distinct:** the only inquiry after the fact into another ISA ship. There is no standoff, no rescue and no clock but the frigate's arrival and Fleet's deadline. The ISA itself may be in the wrong, and the pressure to say so, or not, comes from above.

Overlap check (guide §12):
- Unlike #11 Coldwater, the inquiry is into another ship, not the Halcyon. The Halcyon's crew is not in revolt, nobody aboard covered anything up, and the person owed the truth is a foreign power's examiner, not the ship's own watch.
- Unlike #7 Ghost Ledger, there is no culprit to unmask aboard. The deduction is about what a record means, and the hard part is saying it.
- Unlike #17 Tribunal at Kesh Varo, the ISA is the one judging, and the accused is one of its own.
- Unlike #1 The Kestrel Incident, there is no three-ship standoff. The courier is disabled and unarmed, the cutter is weapons-safe, and the frigate is a clock.

**Hidden:** what really happened (a good-faith misreading of a navigation sweep as a weapons lock; a lawful shot at a real lock after two warnings; or a lawful first volley followed by an unlawful second after the courier had turned away); Rask's tie to Stavely; Stavely's temper (steady or proud); Vory's agenda (fair, hardline or saving face); what Fleet Command wants (a report, a quiet word or a formal directive to find self-defence); whether the Bell's recorder survived; when Fleet signals (turn 4–7), its deadline (8–10 turns later) and when the frigate arrives (19–24).

**Endings:**
- **Success:** The Bell Rings True (an honest finding, the ISA's own fault included), Cleared on the Record (a true finding that clears Stavely, tested against outside evidence), A Joint Finding (unconventional: the evidence opened to the Directorate), In His Own Words (unconventional: Stavely shown the record and telling the examiner himself), An Independent Review (a formal, reasoned refusal of the directive referred to the ISA Office of Independent Review, and the true finding sent).
- **Failure or partial:** Right Too Soon (partial: right before the evidence was in), A Finding Refused (partial: true, but the examiner given no reason to accept it), Adjourned (partial: time ran out), So Recorded (a false self-defence finding with nothing to contradict it), The Bell Remembers (the same, exposed by the Bell's recorder), A Captain Thrown Over (Stavely blamed for doing his duty), A Finding the Record Won't Hold, Filed Over Your Head (Fleet files its own finding with no objection on the record), War Footing, Left at the Seventh Bell, Shots at the Seventh Bell.

**Regulations cited:** §6.1 (honesty-1), §5.4 (reg-7.1), §5.7 (reg-7.4) and §3.1 (roe-2). Hidden training references on §1.4 (cmd-4), §3.5 (roe-4), §6.4 (conduct-2), §7.5 (custody-1) and §10.2/§10.7 (service-3).

**Reckless/responsible pair:** The Bell Rings True reached once by hearing Stavely, having Rask's tie declared and testing the record against outside evidence before the finding (graded exemplary), and once after accusing Stavely unheard and conceding fault to the examiner before anything was established (graded mixed or reckless, citing §6.1).

**Exercise objectives (no regulation yet):**
- "give Examiner Vory an honest account of how the Seraphine's two crew died, including any fault of the ISA's" (account). No First Edition subsection requires the ISA to give another power an honest account when ISA action kills or injures its people. Proposed for Brad's approval: "When ISA action causes death or serious injury to persons of another power, the ISA shall investigate and give that power an honest account of its findings, including any fault of its own."

**Naming notes:** no established name was changed. New names, flagged for Brad: ISV Tamber, Lt. Cmdr. Jonah Stavely, the courier Seraphine, Examiner Ilsabet Vory, the frigate Stern Mercy, Rear Admiral Hester Calderon, the Seventh Bell beacon and the Harrow Lane, and the dead, Anselm Ruy and Petra Lusk. The admiral was first drafted as "Ines" and then "Maud", both changed before release because Commander Ines Valcourt (and Elder Maud Rhune in #5) already exist. The roadmap premise was revised from "an Agency cutter" to "an ISA cutter", with the examiner aboard the courier rather than the Halcyon.

**Seeds vary:** what really happened, Rask's tie, Stavely's temper, the examiner's agenda, what Fleet wants, whether the recorder survived, and every clock.

Nothing was added to ISA-COM-001.

### 14. Starfall (done, v0.8.15)
**Premise.** Thistledown, a gas-mining habitat in the upper cloud deck of the gas giant Caradoc, has lost its lift engines and is sinking (3–4 km a minute from 34–42 km down) toward the crush line at 100 km, where the pressure will break it. The storm scatters every transporter lock, so the only way to the 150–216 people aboard is to fly the Halcyon herself down to the habitat's docking ring and climb out again, about 72–86 people a descent, for as many descents as the hull will take. Ens. Kofi Adeyemi has the hands for that weather and has never flown a real crisis; Lt. Rafe Duarte, the senior pilot, flies by the book and by instruments. Factor Idris Kemble runs the habitat; Agent Sabra Quell, aboard the company yacht Dividend, wants the habitat towed out whole with its scoop works.

**Command challenge:**
- **Primary:** trusting a junior officer (the previous simulation's was accountability).
- **Secondary:** triage: how many descents the hull can take, and who is still waiting.
- **Pivotal officer:** Ens. Adeyemi (Helm). Handing him the ship and letting him fly it (no orders from the chair in mid-descent, which cost the hull) is what works; on his first descent he feels a column of rising air on the windward side that no model shows (Lt. Varga's orbital model says the opposite), and his line eases the strain on every later descent. A shaken Adeyemi keeps it to himself unless the captain steadies him; an eager one says the hull will take one more, which is not his call. Chief Okafor knows what the hull will take, but warns before the limit only if she has been asked or given a limit to call. Lt. Duarte cannot hold a dock as deep as Adeyemi can, and cannot hold a tow in a gale or a shear.

**Why it's distinct:** the only rescue that comes down to delegation: the captain cannot fly it and must decide how far to trust someone else to.

Overlap check (guide §12):
- Unlike #6 Ion Season (also Adeyemi at the helm), the call here is not the captain's gut on incomplete information; it is whether to hand the ship to the ensign and leave it with him. There is no convoy to lead and no route to choose.
- Unlike #8 The Lantern Drift, the triage is not who to save among the dying; everyone can live if the hull is managed. The scarce thing is the Halcyon's own strain, and the Chief's limit is a fact to ask for, not a moral choice.
- Unlike #12 Ember Tide, the clock is not uncertain and waiting does not help: the habitat sinks at a known rate, and the question is who flies and how far.
- Unlike #20 Gravity's Edge (planned), the risk to the ship is spent for people, not for science, and the Chief's limit is set by the captain's asking, not by a gamble on the unknown.

**Hidden:** the storm (squall, gale or shear); Adeyemi's nerve today (steady, eager or shaken); the sink rate and starting depth; the hull's safe strain (72–90) until the Chief is asked; the ring's load; the true head count (Kemble's manifest may leave out 12–20 contract scoop hands working off the books in the lower works, and whether he admits it, ashamed or defensive, depends on how he is asked); Adeyemi's line, which exists only once he has flown a descent; and whether Quell is pragmatic or stands on the company's property.

**Endings:**
- **Success:** Every Soul Aboard (everyone up within the Chief's limit), The Ensign's Line (everyone up, flying Adeyemi's own line), Under Tow (unconventional: the scoop works cut away, with their hands brought up first, and the habitat towed out on the tractor).
- **Failure or partial:** Scarred in the Clouds (partial: everyone lived, the hull past its limit), Left in the Clouds (people still aboard at the crush line), The Uncounted (the manifest trusted and the scoop hands left), Dragged Down (the Halcyon's frame gave way), Left to Fall (the Halcyon left with people still aboard), Shots at Thistledown.

**Regulations cited:** §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). Hidden training references on §2.5 (cmd-3) and §4.5 (care-4).

**Reckless/responsible pair:** Scarred in the Clouds reached once by asking the Chief, setting her limit, counting the living and choosing one more descent past it for the people still waiting (graded sound or principled), and once by sending the ship down again and again without asking (graded mixed or reckless, citing §3.9).

**Exercise objectives:** none. Delegating the helm is covered by §2.5, and no regulation was proposed.

**Naming notes:** no established name was changed; Lt. Rafe Duarte is the existing relief helm officer. New names, flagged for Brad: the gas giant Caradoc, the habitat Thistledown, the yacht Dividend, Factor Idris Kemble and Agent Sabra Quell. "Sabra" is close to the existing "Sabine Thorne" and is flagged rather than changed. The roadmap's "administrator" became Factor Kemble, and "staged lifts" became the descents themselves (Every Soul Aboard, The Ensign's Line).

**Seeds vary:** the storm, Adeyemi's nerve, the sink rate and depth, the hull's limit, the ring's load, the head count and the Factor's honesty about it, and the company agent's stance.

Nothing was added to ISA-COM-001.

### 15. Corsairs of the Veyl Shoals (done, v0.8.16)
**Premise.** The Halcyon, carrying a consignment of drive lattices for a colony shipyard, answers a distress call from an ore skiff, the Bryony, at an old survey beacon deep in the Veyl Shoals, a reef of asteroids and metallic dust where sensors smear beyond close range and torpedo seekers will not hold a lock. There is no skiff: the call is a recording on a loop. Captain Ione Draycott of the corsair raider Hagfish, with one or two escorts (the Gudgeon, and the Snipe), wants the lattices out of the cargo lock and gives the Halcyon a few minutes before she opens fire. She owes the Grist Syndicate a debt she cannot pay, and Collector Amos Skerrit, aboard the Syndicate gunship Gavel, is on his way to collect it.

**Command challenge:**
- **Primary:** tactical cunning: beating an ambush on ground the enemy chose, with terrain and deception rather than by trading blows (the previous simulation's was trusting a junior officer).
- **Secondary:** bluffing: a lawful ruse about the ship's own strength, timed to an opponent whose nerve has been read, never a false surrender or false distress.
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical). Given a minute or two of watching, he reads the corsairs' pattern (a pincer, a herd or a bleed); on some seeds he is torn between two until he has watched longer or a probe has seen the escorts' tracks, and he will not guess. Each pattern has its own answer on the ground: the Needle (a narrow channel, open or choked with rubble the Chief can clear with the tractor) beats a pincer or a herd; the iron shadow of the Anvil, running dark, beats anything; charging the flagship beats a bleed. The wrong ground does not. Lt. Szabo can pull the beacon's survey charts without lighting the ship up, hears that the distress call is a loop, and learns the debt from their traffic; Lt. Varga can learn the ground with a passive probe or an active sweep that gives the ship away; Chief Okafor can make a sensor ghost; Ens. Adeyemi warns, the first time, that the obvious gap is too clean (under a herd it leads into the Sump, a dead end where the Halcyon is boarded).

**Why it's distinct:** the only pirate encounter, and the only one where the Halcyon herself is the prize: no hostages, no convoy, nobody to rescue. The puzzle is reading an enemy's plan and the ground at once.

Overlap check (guide §12):
- Unlike #9 The Long Picket (bluffing a superior warship at a border), the bluff here is the secondary tool: it lands only on a captain whose nerve has been read, or after her plan has been broken, and the ground does most of the work.
- Unlike #1 The Kestrel Incident, there is no one to protect but the ship; the question of protection arises only if the captain finds out what Draycott is running from and offers it.
- Unlike #26 Silent Running (planned), running dark is one tool among several and works only against the right rock.

**Hidden:** the pattern (and, on a torn read, the decoy Rask cannot yet rule out); whether the Needle is open or choked; whether the Anvil is iron or ice; Draycott's nerve (desperate, proud or wavering), which decides whether she strikes when told to, calls a bluff, or needs something better than surrender; her deadline (3–5 minutes); when the collector arrives (11–16); the debt; the crew; one or two escorts.

**Endings:**
- **Success:** Struck Colours (the Hagfish strikes; a proud captain only to a plan read before it broke, a desperate one never without protection), The Creditor's Due (Draycott offered ISA protection once her debt is known, and the collector refused when he asks for her by name), Into the Dust (the plan broken on their own ground and out without a shot), Called Off (a lawful bluff, staged frigate traffic about the ship's own strength).
- **Failure or partial:** Won the Hard Way (partial: the Hagfish beaten with the guns), Ran for It (partial: out with the cargo, the plan never broken), Boarded (the Sump, or worn down), The Corsairs' Prize (the lattices given up), No Quarter (fired on a corsair that had stopped fighting), Paid in Full (a person in ISA custody handed to her creditor), Pinned in the Shoals (time runs out).

**Regulations cited:** §3.1 (roe-2), §3.3 (roe-1), §3.9 (roe-3), §6.1 (honesty-1) and §7.1 (asylum-1). Hidden training references on §3.1 (roe-2) and §3.5 (roe-4), no longer marked planned, and on §6.2 (conduct-1, lawful ruses). Crew refusals: Lt. Szabo will not send a false distress or surrender signal (§6.2); Rask will not fire on the Hagfish once she has struck (existing ROE refusal, §3.3).

**Reckless/responsible pair:** Won the Hard Way reached once by raising shields, waiting for the corsairs to open fire and only then answering it (graded sound), and once by opening fire on a ship that had only made demands (graded reckless, citing §3.1).

**Exercise objectives:** none. Proportion, self-defence, lawful ruses and protection are already covered by §3.1–3.5, §6.2 and §7.1, and no regulation was proposed.

**Naming notes:** no established name was changed. New names, flagged for Brad: the Veyl Shoals, the skiff Bryony, the raider Hagfish, the escorts Gudgeon and Snipe, the gunship Gavel, the Grist Syndicate, Captain Ione Draycott, Collector Amos Skerrit, and the shoal's features the Needle, the Anvil and the Sump. Near-collisions flagged rather than changed: "Gavel" is close to the existing "Gannet", and "Snipe" shares its opening with "Sable Narrows". "The Narrows" was avoided for the channel (Sable Narrows) and "the Throat" (Saltglass) for the same reason. The roadmap's "three light raiders" became a flagship with one or two escorts.

**Seeds vary:** the pattern and whether Rask's first read is sure or torn, the Needle, the Anvil, Draycott's nerve, her deadline, the collector's arrival, the debt, the crew and the number of escorts.

Nothing was added to ISA-COM-001.

### 16. The Glass Nebula
**Status:** **done** (v0.8.17).

**Premise.** A survey shuttle is lost inside a nebula that bends sensor returns and stretches time signals. Its last two messages contradict each other. One says "stay away"; the other, sent apparently later, asks for help. The Halcyon answers from the Rim; Surveyor Nessa Vale on the shuttle Citrine may answer only in garbled fragments until the science is in; buoy Prism is an automated survey relay.

**Command challenge:**
- **Primary:** relying on the science officer to understand the physics.
- **Secondary:** a gut call (which message to believe).
- **Pivotal officer:** Lt. Varga (Science), whose model of the nebula is the only map.

**Why it's distinct:** the only physics puzzle. The environment itself lies, and there is no one to talk to at first (unlike Ion Season's gut call with haulers, Ember Tide's timing/flare, Gardener's restraint/life, Quiet Signal's comms code, or Lantern Drift's derelict triage).

**Endings:**
- **Success:** Brought Home (recover at the true locus on Varga's model); Through the Shear (ride the Fold once the model shows it is a path); The Probe Chain (probe relay recovers the crew without committing the ship deep); Turned Back (help recognised as an echo; hold at the Rim).
- **Failure or partial:** Too Late by Their Clock (partial — true locus reached after the shuttle's clock ran out); Ghost Chase (followed a false help signal into a invented locus); Stranded in Glass (went deep without a model); Left in the Glass (left while help was real); Shuttle Lost (crew gone; including a principled turn-back when they were already gone); Shattered (forced a path and destroyed the shuttle); Lost in the Glass (time-up).

**Seeds vary:** which message is the echo (`help-false` / `stay-false`), what the nebula does (`shear` / `mirror` / `lag`), the shuttle crew's state (`alive` / `failing` / `gone`), and how long Varga's model takes.

**Handbook cites (existing ids only):** care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9), honesty-1 (§6.1) in the evaluator; care-4 (§4.5) and cmd-4 (§1.4) as hidden handbook training references. Exercise objective (not law): do not commit the ship deep until the science officer has a working model.

**Naming notes (flag for Brad):** survey shuttle **Citrine**; Surveyor **Nessa Vale**; buoy **Prism**; landmarks **the Rim**, **the Looking Glass**, **the Fold**. No collision found with existing cast or pending Starfall/Seventh Bell names.

**Overlap notes:** distinct from #2 Tallis (contagion + science), #6 Ion Season (gut call with haulers), #10 Gardener (restraint / unknown life), #12 Ember Tide (timing / flare forecast), #3 Quiet Signal (comms code). Primary challenge shares the "relying on the science officer" bucket with #2 and planned #25, within the three-use cap; consecutive primary and pivotal officer differ from #15.

### 17. Tribunal at Kesh Varo
**Status:** **done** (v0.8.18).

**Premise.** On shore leave, Crewman Jory Askel of the Halcyon is arrested by the independent world of Kesh Varo for entering the Quiet Stone — a sacred site, and a capital offence there. He says he went in to help a collapsed pilgrim (Pilgrim Elen Toras). Fleet orders are to respect local sovereignty: the Kesh Varo trade treaty is at stake. The trial is tomorrow. Magister Lirra Soth presides; Keeper Yasha Dorn keeps the site's custom; Commodore Niall Brask speaks for Fleet Command.

**Command challenge:**
- **Primary:** ethics under orders.
- **Secondary:** negotiation within an alien legal system.
- **Pivotal officer:** Dr. Osei (Medical), who can prove, or disprove, the medical emergency.

**Why it's distinct:** the only simulation set in a courtroom. It is the only one where the threat is a legal system, not a weapon, and the person at risk is one of the captain's own crew. Unlike #13 Seventh Bell, the ISA is not the judge — Kesh Varo is. Unlike #1/#2, no armed standoff over a civilian ship.

**Endings (shipped):**
- **Success:** Acquitted on the Evidence; Commuted by Custom; Honour Bound by Both Laws.
- **Partial:** The Code Held (force and unlawful handover refused; crewman still condemned; treaty intact).
- **Failure:** Broken by Force (treaty broken); The Quiet Stone Claims Him (sentenced); Fleet Takes the Matter; Surrendered to the Bench (handover under capital risk); The Gavel Falls (time-up).

**Seeds vary:** what really happened at the site (`rescue` / `trespass` / `staged`); the bench's disposition (`strict` / `custom` / `open`); the pilgrim's fate (`alive` / `dead` / `absent`).

**Handbook cites (existing ids only):** asylum-1 (§7.1), reg-7.4 (§5.7), care-1 (§4.1), honesty-1 (§6.1), roe-2 (§3.1) in the evaluator; cmd-5 (§1.1), orders-2 (§5.2), reg-7.4 (§5.7), health-2 (§8.3), contact-2 (§9.3) as handbook training references. Exercise objective (not law): establish the medical emergency before accepting a capital finding.

**Naming notes (flag for Brad):** Crewman **Jory Askel**; Magister **Lirra Soth**; Keeper **Yasha Dorn**; Pilgrim **Elen Toras**; Commodore **Niall Brask**; sacred site **the Quiet Stone**; detention **Orun Hold**; world **Kesh Varo**. Avoided Lysa Venn / Teo Maras (Kestrel cast). No collision found with Paley, Adeyemi, Quell, Vale, Quill.

**Overlap notes:** distinct from #13 Seventh Bell (ISA as judge of its own cutter), #1/#2 (armed standoffs), #5 Saltglass (mediation aboard, not a capital foreign court). Primary challenge shares the "ethics under orders" bucket with planned #27, within the two-use cap; consecutive primary and pivotal officer differ from #16.

### 18. The Weather Engine
**Status:** **done** (v0.8.19).

**Premise.** On the ridge above the farming colony Meridian stands the Weather Engine, the station that has kept the plain's weather gentle for thirty years. A year to the day after its founder, Elias Quarrie, died, it locked itself down: its master controls answer only to his personal cipher. Now a superstorm the colonists call the Greywall is building over the western sea. Steward Anwen Tull of Meridian Hall is certain the key is the colony motto, "Rain Is a Promise Kept". Technician Bastian Lowe and his apprentice are shut inside the station. The founder's estranged daughter, Marit Quarrie, holds his survey journal and what he used to say to her, and will not help the Hall that, in her view, wore him out.

**Command challenge:**
- **Primary:** the comms officer cracking a code: trusting Lt. Szabo's reading of the lock over the colony's certainty, winning the papers the key is built from, and never spending one of the lock's few answers on a guess.
- **Secondary:** timing: the storm's landfall, and getting the colony under cover while the work goes on.
- **Pivotal officer:** Lt. Szabo (Comms), who reads the lock (what kind of answer it wants, how many wrong answers it allows, where the failsafe runs) and rebuilds the key from his poems, letters or survey journal.

**Why it's distinct:** a human puzzle, unlike #3's mathematical contact: the key is a dead man's life, and it is won from living people (the Hall's archive and pride, the daughter's grievance). The clock is weather, and the forecast is reliable once Lt. Varga runs it, unlike #12 Ember Tide's uncertain flare; the puzzle is the cipher, not the timing. Unlike #4 Reactor Night and planned #21 The Ninefold Lock, the lock is opened by understanding a person, not by engineering or defence logic.

**Endings (shipped):**
- **Success:** The Founder's Key (Szabo's vouched key from his papers); His Daughter's Hand (Marit gives what only she knew, or goes up and enters it herself); Through the Trunk (Chief Okafor overrides the lock around a failsafe Szabo has mapped).
- **Partial:** Half a Storm (the Engine turns too late and only blunts the storm); Under the Plain (the Engine never turns but every colonist is under cover).
- **Failure:** Sealed for Good (too many wrong answers); The Failsafe (a blind override trips the founder's failsafe); The Greywall (landfall with people in the open); A Scar on the Plain (the core burned out: storm broken, valley poisoned for years); Left to the Weather (the Halcyon leaves).

**Seeds vary:** which papers the key is built from (`poem` / `letters` / `journal`); the daughter's grievance and what honestly wins her (`blame`: the Hall's admission; `legacy`: the Hall's pledge; `fear`: the lock's safeguards, once read); whether the Engine can be overridden at all (`open` / `sealed`); which of two poem lines is right; how many wrong answers the lock allows (2 or 3); landfall time; population and shelter rate; when the Steward presses the motto and asks for the burn; how long the cipher takes.

**Unconventional routes:** the founder's unsent letter to Marit (found in the Hall's archive) wins her whatever her grievance; Marit can go up and enter the key herself; Technician Lowe can read the plate aloud to speed Szabo's read; a mapped override through the control trunk; shuttles to carry people to the storm cellars. Crew refuse to burn the Engine out while Lowe and his apprentice are inside, and shared rules of engagement refuse to fire on the civilian station or the Hall while people are aboard.

**Handbook cites (existing ids only):** care-1 (§4.1), care-2 (§4.2), honesty-1 (§6.1) in the evaluator; general-1 (§1.5), cmd-3 (§2.5), honesty-1 (§6.1), contact-2 (§9.3) as hidden handbook training references. Exercise objective (not law): have Lt. Szabo read the lock and vouch for a key before anything is entered. No new regulation proposed. contact-2 is not in the evaluator's v0.7 catalogue, so the "without the colony's leave" marker carries no regulation.

**Naming notes (flag for Brad):** colony **Meridian** and **Meridian Hall** (from this roadmap entry; note `src/fleet/requests.ts` uses "ISV Meridian" as an example in a code comment only, not shipped text); station **the Weather Engine**; founder **Elias Quarrie**; daughter **Marit Quarrie**; **Steward Anwen Tull**; **Technician Bastian Lowe**; storm **the Greywall**; motto **"Rain Is a Promise Kept"**; poem **"A Litany for Small Weather"**; **the storm cellars**. No other collision found with existing cast or places.

**Overlap notes:** distinct from #3 The Quiet Signal (mathematics, first contact), #12 Ember Tide (uncertain timing of a natural hazard), #4 Reactor Night (engineering improvisation), #10 The Gardener (restraint) and planned #21 The Ninefold Lock (mechanical defence logic). Primary challenge shares the "comms officer cracking a code" bucket with #3, within the two-use cap; consecutive primary and pivotal officer differ from #17.

### 19. Hollow Crown
**Status:** **done** (v0.8.20).

**Premise.** Above the young colony Aubrel hangs the Ostrin Relay, the station that carries every signal the colony sends. Severin Mallory, removed as governor by a council vote a week ago, has walked into it with a sidearm and taken its duty staff hostage. He wants his office back and will speak only to the Halcyon. Acting Governor Rhea Stannard wants him out of the relay and in her custody, and has a Civic Guard team waiting in the relay's lower ring. One of the hostages, who answers to the name Tamsin Rook, is not who she claims to be.

**Command challenge:**
- **Primary:** reading people and detecting lies: what state the governor is actually in, and which hostage is lying and why.
- **Secondary:** restraint: not storming the relay, and not threatening a man at breaking point, while talking is still working.
- **Pivotal officer:** Dr. Osei (Medical), who reads the governor's condition from his voice over comms. What brings him down (rest, his dead son acknowledged, or his medication) depends on her reading.

**Why it's distinct:** the only hostage-taker: a single unstable man in a fixed place, where a wrong word kills. The danger in the room is a lie, not a ship: there is no three-ship standoff, since the Guard team is already inside the relay. Unlike #1 The Kestrel Incident (a manhunt), #5 The Saltglass Accord (mediation between parties at the table) and #17 Tribunal at Kesh Varo (a courtroom), the person to be read is the one holding the hostages.

**Endings (shipped):**
- **Success:** The Crown Laid Down (he lets the staff go and walks into ISA custody); A Hearing, Not a Crown (the false hostage is a frightened auditor; protected, she gives the ISA proof the vote was bought, and both claims go to Fleet Command); Out of the Hollow (every hostage beamed out in the moment the supply pod drops the relay's shielding, with the core known to be safe).
- **Partial:** Through the Door (taken by force, alive, while talking was still working); The Hollow Crown (the hostages are safe but he takes his own life).
- **Failure:** The Civic Guard Goes In (the strike team, on its clock or on the planted agent's signal as he walks out); A Wrong Word (he breaks and the staff are hurt); Fire in the Relay (the accomplice's charge goes off); Given to the Successor (he surrenders on the ISA's word and is handed over as promised); Blood on the Ring (the Halcyon storms the relay and people die); Left to Aubrel (the Halcyon leaves).

**Seeds vary:** his condition (`exhausted` / `grief` / `withdrawal`) and what brings him down; who the false hostage is (`agent`: a Civic Guard corporal reporting to Government House; `accomplice`: Mallory's own aide, holding a live trigger on a charge in the core; `witness`: an auditor hiding from the successor with proof of the bought vote); the successor's temperament (`hard` / `political` / `cautious`) and what makes her hold; the strike time; his starting strain; the number of hostages; the toll if the Guard goes in; when the false hostage makes her move.

**Unconventional routes:** the supply or medicine pod is also a transporter window, and with the core scanned clean (or the trigger jammed) every hostage can be beamed out; Lt. Szabo can trace the agent's burst transmissions and jam them without touching the line to him; telling a political successor he will stay in ISA custody makes her hold; a protected witness hands over her evidence. Shared rules of engagement refuse to fire on the civilian relay with people aboard, and Rask warns before any storming order.

**Handbook cites (existing ids only):** roe-2 (§3.1), care-1 (§4.1), honesty-1 (§6.1), asylum-1 (§7.1) in the evaluator; roe-2 (§3.1), care-1 (§4.1), honesty-1 (§6.1), asylum-1 (§7.1), asylum-2 (§7.4) and health-2 (§8.3) as hidden handbook training references (the planned #19 links on asylum-1 and asylum-2 are now live). Exercise objective (not law): have Dr. Osei assess the governor's condition before pressing him to surrender. No new regulation proposed.

**Naming notes (flag for Brad):** colony **Aubrel**; **the Ostrin Relay**; **Government House**; **Severin Mallory**; **Acting Governor Rhea Stannard**; **the Civic Guard**; the false hostage's cover name **Tamsin Rook**; Mallory's son **Aris**; **Corporal Liane Dace** (the agent); **Mira Castell** (the accomplice); **Auditor Selene Marsh** (the witness). Collisions to check: "Hollow" (this roadmap title) also appears in Ion Season's Mate Pim Hollow and in The Kestrel Incident's "Hollow Victory" ending; "Tamsin" also appears in the Active Duty ship Tamsin Grey and the bridge place name Tamsin Reach. No other collision found.

**Overlap notes:** distinct from #1 The Kestrel Incident (manhunt), #5 The Saltglass Accord (mediation), #7 (the convoy crews held: no hostage-taker), #10 The Gardener (restraint as primary) and #17 Tribunal at Kesh Varo (ethics under orders in a court). Primary challenge stays within the three-use cap; consecutive primary and pivotal officer differ from #18.

### 20. Gravity's Edge
**Premise.** A neutron star is passing through the Pell system: a once-in-a-millennium chance to record data that would make future jump routes far safer. The Halcyon is the only ship able to collect it. The longer she stays, the better the data and the worse the tidal stress on her hull. No one needs rescuing.

**Command challenge:**
- **Primary:** a gut call: judging risk against reward with no clear line.
- **Secondary:** the engineer's readings.
- **Pivotal officer:** Chief Okafor (Engineering), whose hull-stress estimates are uncertain.

**Why it's distinct:** the only simulation with no one in danger but the Halcyon, and no one to blame. It is purely a captain's appetite for risk.

**Endings:**
- **Success:** the full dataset with an undamaged ship, a partial dataset recovered by improvisation, a clean early withdrawal that still advances the science.
- **Failure or partial:** the data lost, the Halcyon crippled, losses among the crew.

**Seeds vary:** the hull's true tolerance, the data value curve, sudden tidal spikes.

### 21. The Ninefold Lock
**Premise.** An abandoned Directorate depot's automated defence grid wakes when an Agency survey team lands. The team is trapped with eight hours of air. The grid's logic has nine locks: some answer to codes, some to behaviour, and one to a question.

**Command challenge:**
- **Primary:** deduction and reasoning: working out the grid's rules.
- **Secondary:** timing (the team's air).
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical), who knows Directorate defence doctrine.

**Why it's distinct:** the only logic puzzle with a mechanical opponent. It cannot be persuaded or bluffed, only understood.

**Endings:**
- **Success:** the grid shut down, the grid's question answered, the team extracted through a gap.
- **Failure or partial:** the team rescued at a cost, an incident with the Directorate over the depot, the team lost.

**Seeds vary:** the order and nature of the locks, the team's state, a Directorate response.

### 22. Exodus at Cinder Vale
**Premise.** Nine refugee ships are fleeing a collapsing colony toward the one jump point still open. It will close in ninety minutes. The slowest ships cannot make it unless others slow down to shield or tow them. One ship is lying about how many people it carries; another is lying about its cargo.

**Command challenge:**
- **Primary:** triage and sacrifice: who gets the tow, who waits.
- **Secondary:** reading people (the lying ships).
- **Pivotal officer:** Cmdr. Marrow (XO), who runs the convoy's order while the captain decides.

**Why it's distinct:** a moving convoy against a closing door. Unlike #8's sleepers, here the people argue back. There is no disease and no border stampede.

**Endings:**
- **Success:** all through, a convoy chain that saves the slowest, a second window found by science.
- **Failure or partial:** ships left behind, a panic that wrecks the formation, the Halcyon trapped on the wrong side.

**Seeds vary:** the ships' speeds and loads, the liars, the window's stability.

### 23. Wake of the Sundered
**Premise.** The Directorate warship *Sundered Oath* is under power but silent. Her crew was knocked unconscious when her experimental drive misfired. Now she is on autopilot with weapons armed, on a course that ends at a civilian station in twelve hours. The Directorate demands she not be harmed. Fleet wants the drive's secrets.

**Command challenge:**
- **Primary:** the engineer improvising to stop a ship without killing anyone aboard.
- **Secondary:** ethics under orders (Fleet's interest in the drive).
- **Pivotal officer:** Chief Okafor (Engineering), whose plan to bleed the drive through a tractor coupling might work.

**Why it's distinct:** a runaway ship to be stopped, not a wreck to explore. Nothing spreads; the danger is a sleeping crew's armed ship.

**Endings:**
- **Success:** the ship stopped and returned intact, crew revived aboard the Halcyon, the drive shut down jointly with a Directorate team.
- **Failure or partial:** the ship destroyed with her crew, the station hit, an incident over stolen drive data.

**Seeds vary:** the drive's state, the autopilot's logic, the Directorate's response time.

### 24. Honour Bound
**Premise.** The captain of a proud independent clan ship believes the Halcyon insulted his people. He demands the old test: both ships charge toward each other, and the first to turn is shamed. Refuse, and his people close their space to the Agency for a generation. His ship is smaller, but he means it.

**Command challenge:**
- **Primary:** gut and nerve: holding your course, or knowing when to break.
- **Secondary:** reading the other captain.
- **Pivotal officer:** Ens. Adeyemi (Helm), who flies it to the last second.

**Why it's distinct:** the only ritual contest. There are no stakes in territory, cargo or lives unless someone loses their nerve badly. It is a pure test of character.

**Endings:**
- **Success:** both hold until a sanctioned draw, he turns first and honour is satisfied without humiliation, an apology in his people's own form that ends it before it starts.
- **Failure or partial:** the Halcyon turns early (space closed), a collision, the test refused (relations cut).

**Seeds vary:** his true resolve, the custom's real rules, how he reads apologies.

### 25. Shards of Oriel
**Premise.** Agency archaeologists find a pre-human archive on a moon the Directorate also claims. A Directorate science vessel arrives with soldiers, and the archive begins to activate in ways no one understands. It may be a library, or it may be a machine.

**Command challenge:**
- **Primary:** relying on the science officer to understand what is waking.
- **Secondary:** ethics under orders (Fleet wants it secured for the Agency).
- **Pivotal officer:** Lt. Varga (Science), working, perhaps, with her Directorate counterpart.

**Why it's distinct:** the only find shared with the rival. Cooperation is possible, and the object itself is the mystery.

**Endings:**
- **Success:** a joint expedition, the archive safely dormant and preserved, its message shared with both powers.
- **Failure or partial:** the archive destroyed, an armed standoff on the surface, a one-sided seizure that sours relations.

**Seeds vary:** what the archive is, the Directorate scientist's loyalties, the soldiers' orders.

### 26. Silent Running
**Premise.** Fleet suspects a Directorate "exercise" near the border covers preparations for something worse. The Halcyon must shadow it for six hours, running dark, without being detected. Every system she powers up could betray her, and Directorate ships pass close.

**Command challenge:**
- **Primary:** timing and patience: when to move, when to hold still.
- **Secondary:** restraint (don't fire, don't flee).
- **Pivotal officer:** Chief Okafor (Engineering), who manages emissions and power to the last watt.

**Why it's distinct:** the only intelligence-gathering mission. It is won by not being seen, with no one to rescue and no one to talk to.

**Endings:**
- **Success:** the intelligence gathered undetected, an early warning delivered, a misread exposed (it really was an exercise) that averts a crisis.
- **Failure or partial:** detected and forced to run, an incident at the border, the intelligence lost.

**Seeds vary:** the exercise's true purpose, patrol patterns, the Halcyon's emission margins.

### 27. Red Harvest
**Premise.** The colony of Durren has peacefully seized an Agency grain freighter in orbit, without firing a shot. Their harvest failed, and the Agency's relief shipment was diverted elsewhere by an administrative error. Fleet orders: recover the freighter, which is Agency property and needed by three other colonies.

**Command challenge:**
- **Primary:** ethics under orders.
- **Secondary:** negotiation with desperate people.
- **Pivotal officer:** Dr. Osei (Medical), whose assessment of Durren's malnutrition changes what "recovering the freighter" means.

**Why it's distinct:** a peaceful seizure, not a raid. The Agency caused it, nobody shoots unless the captain makes it happen, and the dilemma is between three colonies and one.

**Endings:**
- **Success:** relief arranged for all, a shared ration plan, Fleet persuaded to reroute supplies.
- **Failure or partial:** the freighter retaken by force, famine elsewhere, a riot in orbit.

**Seeds vary:** the depth of Durren's crisis, the other colonies' needs, the colony leader's temperament.

### 28. First Light at Taluun
**Premise.** A jump misfire throws the Halcyon into uncharted space near an unnamed star, later called Taluun by the crew. The navigation computer is damaged. Getting home means charting by observation, rationing, and keeping a frightened crew working as days pass.

**Command challenge:**
- **Primary:** crew leadership, keeping morale and discipline while lost.
- **Secondary:** deduction (fixing position by the stars).
- **Pivotal officer:** Ens. Adeyemi (Helm/Navigation), who must plot the way home.

**Why it's distinct:** the only lost-ship survival story. There is no enemy, no one to rescue and no contact: just the crew and the dark.

**Endings:**
- **Success:** home by the stars, home by an improvised jump calibration, a distress relay that brings a rescue ship.
- **Failure or partial:** home with losses, a crew split over the route, lost for good.

**Seeds vary:** the jump error, which stars are recognisable, crew morale events.

### 29. The Exchange at Neutral Point
**Premise.** The Agency and the Directorate exchange prisoners at a neutral station. Each side suspects the other of a trick, and both are right. Exactly which trick, and which of the captain's own superiors approved one, is hidden.

**Command challenge:**
- **Primary:** bluffing (playing your hand without showing it).
- **Secondary:** reading people.
- **Pivotal officer:** Lt. Szabo (Comms), who spots coded traffic between the other side's people.

**Why it's distinct:** a trade between governments. Both sides are cheating, and the captain's own side is one of the cheats.

**Endings:**
- **Success:** a clean exchange, an exposed double cross handled quietly, a mutual climb-down.
- **Failure or partial:** a seized station, an exchange collapsed with prisoners returned to cells, a shooting on the concourse.

**Seeds vary:** each side's trick, the station master's loyalty, the prisoners' identities.

### 30. Last Watch at Halden Gate
**Premise.** The capstone. The border collapses on several fronts at once:
- a refugee flood;
- a Directorate fleet;
- a stricken station;
- a crew at the end of their endurance.

No officer can handle everything, and the captain cannot be everywhere.

**Command challenge:**
- **Primary:** command under overload: prioritising and delegating.
- **Secondary:** leadership.
- **Pivotal officer:** Cmdr. Marrow (XO) and the whole bridge. Each officer's speciality from earlier simulations matters once.

**Why it's distinct:** by design, the only simulation that combines events. Each thread is short and borrows a skill from earlier simulations; none repeats a whole earlier event.

**Endings:**
- **Success:** the border held without war, held at a cost, a negotiated stand-down.
- **Failure or partial:** war, the station lost, the Halcyon lost.
