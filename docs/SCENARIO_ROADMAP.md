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
| 12 | Ember Tide | A stellar flare will sweep a mining outpost at an uncertain hour | Timing and patience | Lt. Varga (Science) | planned |
| 13 | The Seventh Bell | An inquiry into an Agency cutter firing on a Directorate courier | Accountability: telling an inconvenient truth | Lt. Cmdr. Rask (Tactical) | planned |
| 14 | Starfall | A habitat sinking into a gas giant; only the green helmsman can fly the rescue | Trusting a junior officer | Ens. Adeyemi (Helm) | planned |
| 15 | Corsairs of the Veyl Shoals | A corsair ambush in an asteroid shoal where sensors and torpedoes fail | Tactical cunning: terrain and deception | Lt. Cmdr. Rask (Tactical) | planned |
| 16 | The Glass Nebula | A shuttle lost in a nebula that bends sensors and time | Relying on the science officer | Lt. Varga (Science) | planned |
| 17 | Tribunal at Kesh Varo | A Halcyon crewman is arrested ashore under a capital law | Ethics under orders | Dr. Osei (Medical) | planned |
| 18 | The Weather Engine | A dead founder's cipher locks a colony's weather control as a superstorm builds | The comms officer cracking a code | Lt. Szabo (Comms) | planned |
| 19 | Hollow Crown | A deposed governor holds a relay station's staff hostage | Reading people and detecting lies | Dr. Osei (Medical) | planned |
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

**Regulations cited:** §3.3 (roe-1), §3.1 (roe-2), §6.1 (honesty-1); hidden training references on §9.1 (contact-1) and §2.5 (cmd-3). **Exercise objective (no regulation yet):** "warn every ship in danger, rival or not". A duty to warn of a hazard to navigation is proposed for Brad's approval; nothing was added to ISA-COM-001.

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

Rules for both are proposed for Brad's approval. Nothing was added to ISA-COM-001.

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

**Exercise objective (no regulation yet):** "an unfit master should not fly the Maw" (fitness). No First Edition subsection covers acting on evidence that a civilian master under escort is unfit to command in a hazard. A rule is proposed for Brad's approval: "A captain escorting civilian vessels through a hazard shall act on credible evidence that a civilian master is unfit to command in it, arranging relief or assistance with the master's consent where possible." Nothing was added to ISA-COM-001.

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

**Exercise objective (no regulation yet):** "accuse no guest without evidence that points to them alone" (evidence). §7.4 covers how a person held aboard is treated, but no First Edition subsection sets the standard of evidence for accusing or holding someone aboard. A rule is proposed for Brad's approval: "A person aboard an ISA ship shall not be detained or accused of an offence except on credible evidence, and shall be told the grounds and heard before any finding." Nothing was added to ISA-COM-001.

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
- "wake sleepers on medical need alone, in the medical officer's triage" (triage). No First Edition subsection sets the grounds for triage. Proposed for Brad's approval: "When not everyone in danger can be helped at once, ISA personnel shall decide who is helped first on medical need and the chance of survival, as assessed by the medical officer, and on no other ground."
- "let no one take the *Eventide* as salvage while her sleepers are aboard" (hulk). No First Edition subsection says a vessel with living people aboard is not salvage. Proposed for Brad's approval: "A vessel with living persons aboard, conscious or not, is not salvage. ISA personnel shall not permit, assist or agree to her being taken as salvage until every person aboard is safe."

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
- "cross the picket line only with the picket's leave" (line). No First Edition subsection says how an ISA ship should treat another power's picket in disputed space. Proposed for Brad's approval: "An ISA ship stopped by another power's picket in disputed space shall seek passage by negotiation and shall not run the line while a peaceful way through remains, except to render humanitarian aid under the Border Accords."

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
- "do not destroy the growth before the science officer knows what it is" (know). No First Edition subsection covers an unknown life form that poses no immediate threat. Proposed for Brad's approval: "ISA personnel shall not destroy or harm an unknown life form, or a growth that may be alive, while it poses no immediate threat to life and before reasonable efforts have been made to establish what it is."

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
- "find out what really happened and tell the watch" (truth). No First Edition subsection requires a death aboard to be investigated and its findings told to the crew. Proposed for Brad's approval: "A death or serious injury aboard an ISA vessel shall be investigated and reported to Fleet Command, and the crew shall be told what the investigation finds."

**Naming notes:** no established name was changed. "ISA Safety Inspectorate" is a new body name, flagged for Brad. "Quill" was not used because Ion Season uses it.

Nothing was added to ISA-COM-001.

### 12. Ember Tide
**Premise.** A variable star will throw a flare across Ketter's Rest, a mining outpost with 400 people and too few shuttles. The flare's hour is uncertain. Every scan narrows the window, but every hour spent waiting is an hour not spent evacuating.

**Command challenge:**
- **Primary:** timing and patience. Commit too early and you waste trips; too late and nobody gets out.
- **Secondary:** relying on the science officer's forecast.
- **Pivotal officer:** Lt. Varga (Science), whose forecast tightens with each reading.

**Why it's distinct:** the only race against a natural clock whose time is *unknown*. When to move matters more than how. There are no holdouts and no villain.

**Endings:**
- **Success:** a full evacuation, a shelter inside the mine (unconventional), staged lifts timed to the forecast.
- **Failure or partial:** partial losses, the Halcyon caught in the flare, the outpost abandoned too early, with the ore lost and the colony bankrupt.

**Seeds vary:** the flare's true timing, the shuttle count, the mine's shielding.

### 13. The Seventh Bell
**Premise.** It has already happened: an Agency patrol cutter fired on a Directorate courier and killed two crew. The Halcyon is sent to lead the inquiry, with a Directorate investigator aboard. The cutter's captain says it was self-defence. The recovered logs and debris tell a more complicated story, and Fleet would prefer a quiet finding.

**Command challenge:**
- **Primary:** accountability, telling an inconvenient truth.
- **Secondary:** deduction from the wreckage.
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical), who knows the cutter's captain and reads the firing logs.

**Why it's distinct:** an inquiry after the fact, not a standoff. It is the only simulation where the Agency itself may be in the wrong.

**Endings:**
- **Success:** de-escalation with justice, a joint finding, an honest finding that costs the Agency face but keeps the peace.
- **Failure or partial:** a cover-up that is later exposed, a border clash, both powers on a war footing.

**Seeds vary:** what really happened, the investigator's agenda, how much Fleet pressures you.

### 14. Starfall
**Premise.** A mining habitat is sinking into a gas giant's atmosphere. Transporters scatter in the storm, so the only way to reach it is to fly the Halcyon itself into the upper cloud deck. The helmsman best suited by reflexes is Ens. Adeyemi, in his first real crisis.

**Command challenge:**
- **Primary:** trusting a junior officer.
- **Secondary:** triage (how many trips the hull can take).
- **Pivotal officer:** Ens. Adeyemi (Helm). The captain must decide whether to hand him the ship and keep him steady.

**Why it's distinct:** the only rescue that comes down to *delegation*. The captain cannot do it personally and must lift someone else up to do it.

**Endings:**
- **Success:** everyone rescued, a habitat tow (unconventional), staged lifts.
- **Failure or partial:** a partial rescue, the Halcyon damaged in the clouds, the Halcyon dragged down.

**Seeds vary:** storm severity, the habitat's sink rate, the administrator's honesty about the head count.

### 15. Corsairs of the Veyl Shoals
**Premise.** The Halcyon answers a fake distress call into an asteroid shoal. It is a corsair ambush: three light raiders using the rocks as cover where sensors and torpedoes are unreliable. The corsair captain owes a debt she cannot pay to someone worse, and she needs a prize, not a fight to the death.

**Command challenge:**
- **Primary:** tactical cunning: using terrain, deception and the corsairs' own constraints.
- **Secondary:** bluffing.
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical), who reads the corsairs' pattern.

**Why it's distinct:** the only pirate encounter, and the only one where the Halcyon itself is the target. There are no hostages and no convoy.

**Endings:**
- **Success:** the corsairs outmanoeuvred and captured, turned against their creditor, sent off with a deal.
- **Failure or partial:** the Halcyon boarded, a pyrrhic victory, the corsairs escape with plunder.

**Seeds vary:** the shoal layout, the corsair captain's debt and nerve, the number of raiders.

### 16. The Glass Nebula
**Premise.** A survey shuttle is lost inside a nebula that bends sensor returns and stretches time signals. Its last two messages contradict each other. One says "stay away"; the other, sent apparently later, asks for help.

**Command challenge:**
- **Primary:** relying on the science officer to understand the physics.
- **Secondary:** a gut call (which message to believe).
- **Pivotal officer:** Lt. Varga (Science), whose model of the nebula is the only map.

**Why it's distinct:** the only physics puzzle. The environment itself lies, and there is no one to talk to.

**Endings:**
- **Success:** the shuttle recovered, a scientific discovery, a rescue through the time-shear.
- **Failure or partial:** the shuttle lost, the Halcyon stranded for weeks, a rescue that arrives "too late" by the shuttle's clock.

**Seeds vary:** what the nebula actually does, the shuttle crew's state, which message is real.

### 17. Tribunal at Kesh Varo
**Premise.** On shore leave, a Halcyon crewman is arrested by the independent world of Kesh Varo for entering a sacred site, a capital offence there. He says he went in to help a collapsed pilgrim. Fleet orders are to respect local sovereignty: a trade treaty is at stake. The trial is tomorrow.

**Command challenge:**
- **Primary:** ethics under orders.
- **Secondary:** negotiation within an alien legal system.
- **Pivotal officer:** Dr. Osei (Medical), who can prove, or disprove, the medical emergency.

**Why it's distinct:** the only simulation set in a courtroom. It is the only one where the threat is a legal system, not a weapon, and the person at risk is one of the captain's own crew.

**Endings:**
- **Success:** acquittal on the evidence, a sentence commuted by local custom, a diplomatic exchange that honours both laws.
- **Failure or partial:** a rescue by force (the treaty broken), the crewman sentenced, Fleet relieves the captain of the matter.

**Seeds vary:** what really happened at the site, the judges' disposition, the pilgrim's fate.

### 18. The Weather Engine
**Premise.** The colony Meridian's weather control station has locked itself down, and a superstorm is building. Its founder, who died last year, sealed the master controls with a personal cipher hidden in his journals, letters and favourite poems. The colonists know fragments; his estranged daughter knows more and won't help.

**Command challenge:**
- **Primary:** the comms officer cracking a code.
- **Secondary:** timing (the storm's growth).
- **Pivotal officer:** Lt. Szabo (Comms), who rebuilds the cipher from personal documents.

**Why it's distinct:** a human puzzle, unlike #3's mathematical contact. The key is a dead man's mind, and the clock is weather, not a fleet.

**Endings:**
- **Success:** the cipher cracked and the storm dispersed, the daughter persuaded to help, a brute-force override that holds.
- **Failure or partial:** a partial evacuation, the station destroyed to stop the storm (the colony uninhabitable for years), the colony lost.

**Seeds vary:** the cipher's construction, the daughter's grievance, the storm's rate.

### 19. Hollow Crown
**Premise.** A deposed colonial governor has taken the staff of a relay station hostage and demands to be restored. His successor wants him dead and is sending a strike team. One hostage is not who she claims to be.

**Command challenge:**
- **Primary:** reading people and detecting lies: the governor's state of mind, and the false hostage.
- **Secondary:** restraint (not storming the station).
- **Pivotal officer:** Dr. Osei (Medical), who reads the governor's condition over comms.

**Why it's distinct:** the only hostage-taker. A single unstable man in a fixed location, where a wrong word kills.

**Endings:**
- **Success:** a negotiated surrender, a rescue, asylum for the governor.
- **Failure or partial:** the successor's strike team causes bloodshed, hostages harmed, the governor's suicide.

**Seeds vary:** the governor's condition, the false hostage's identity and aim, the strike team's timing.

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
