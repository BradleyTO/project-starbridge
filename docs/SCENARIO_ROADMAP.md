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
| 3 | The Quiet Signal | A message hidden in a pulsar's silences, answered only in mathematics | The comms officer cracking a code | Lt. Szabo (Comms) | planned |
| 4 | Reactor Night | The Halcyon's own reactor cascades; no enemy | The engineer improvising | Chief Okafor (Engineering) | planned |
| 5 | The Saltglass Accord | Mediating two clans' claims to an ice moon aboard the Halcyon | Mediation: finding the interests beneath the demands | Cmdr. Marrow (XO) | planned |
| 6 | Ion Season | Leading slow ore freighters blind through an ion storm | A gut call on incomplete information | Ens. Adeyemi (Helm) | planned |
| 7 | Ghost Ledger | Someone copies the navigation keys during a reception aboard | Deduction and reasoning | Lt. Cmdr. Rask (Tactical/Security) | planned |
| 8 | The Lantern Drift | A derelict generation ship with 900 sleepers in failing cryo | Triage and sacrifice | Dr. Osei (Medical) | planned |
| 9 | The Long Picket | Reactor parts must get through a Directorate "inspection" blockade | Bluffing | Cmdr. Marrow (XO) | planned |
| 10 | The Gardener | A spreading growth in an asteroid field may be alive | Restraint: choosing not to act | Lt. Varga (Science) | planned |
| 11 | Coldwater | Engineering refuses orders after a death they think was covered up | Crew conflict and leadership | Chief Okafor (Engineering) | planned |
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

### 3. The Quiet Signal
**Premise.** A pulsar's timing has gaps, and the gaps form a pattern: someone is signalling by silence. The senders answer only in mathematics, and they treat an unanswered question, or a wrong answer, as hostility. A Directorate listening post is also trying to decode it.

**Command challenge:**
- **Primary:** the comms officer cracking a code.
- **Secondary:** patience. Answering fast and wrong is worse than answering slowly.
- **Pivotal officer:** Lt. Szabo (Comms). The captain chooses which of her partial decodes to trust and when to transmit.

**Why it's distinct:** the only pure decoding contact. No ships threaten anyone, and the whole fight is to understand.

**Hidden:**
- the code's grammar (seeded: primes, geometry or chemistry);
- what the senders actually want.

**Endings:**
- **Success:** contact established, a shared vocabulary, a polite mutual farewell.
- **Failure or partial:** a misunderstanding read as a threat, the senders fall silent forever, the Directorate decodes it first.

**Seeds vary:** the code's grammar, the senders' patience, the Directorate's progress.

### 4. Reactor Night
**Premise.** The Halcyon's own reactor starts a cascade failure in deep space. A coolant valve is stuck behind a radiation-soaked bulkhead. The only engineer small enough to reach it is claustrophobic. There is no enemy: the ship and the crew are the whole challenge.

**Command challenge:**
- **Primary:** the engineer improvising.
- **Secondary:** leadership of a frightened crewmember.
- **Pivotal officer:** Chief Okafor (Engineering). The captain must give her room to work and decide which of her improvised fixes to risk.

**Why it's distinct:** the only simulation with no outside party at all. It is a pure engineering crisis aboard.

**Hidden:**
- which component actually failed;
- how long the cascade really allows.

**Endings:**
- **Success:** a clean save, an improvised bypass, eject the core and limp home.
- **Failure or partial:** losses on one deck, the ship dead in space awaiting rescue, the ship lost.

**Seeds vary:** the fault, the valve position, the engineer's state, the time margin.

### 5. The Saltglass Accord
**Premise.** The Halcyon hosts talks between two independent clans who both claim the ice moon Saltglass. Their stated demands cannot both be met. What each clan actually needs is something else: water rights, a burial ground, a succession that must be settled before an elder dies. Neither will say so first.

**Command challenge:**
- **Primary:** mediation, finding the interests beneath the demands.
- **Secondary:** restraint. An imposed Agency solution fails.
- **Pivotal officer:** Cmdr. Marrow (XO), whose quiet side-conversations bring out what the delegates won't say at the table.

**Why it's distinct:** the only pure negotiation. There is no spy, no saboteur and no weapon: just two honest parties talking past each other.

**Endings:**
- **Success:** a shared-use accord, a partition both can live with, a deferred deal with a timetable.
- **Failure or partial:** a walk-out, an imposed settlement that breaks within a year, a feud that becomes war.

**Seeds vary:** each clan's true interest, the elder's health, which delegate is the hardliner.

### 6. Ion Season
**Premise.** Three slow ore freighters must cross an ion storm before their destination station is cut off for a month. Sensors are blind, the storm's calm channels shift, and one freighter captain is hiding that he is unfit to fly.

**Command challenge:**
- **Primary:** a gut call on incomplete information. Pick a channel without being able to see it.
- **Secondary:** reading people (the captain who says he is fine).
- **Pivotal officer:** Ens. Adeyemi (Helm), who reads the storm by feel. The captain decides whether to trust his hunches over the computer's guesses.

**Why it's distinct:** the only escort, and the only simulation where sensors are almost worthless. Instinct is the instrument.

**Endings:**
- **Success:** all three through, an unconventional tow chain, waiting out a gap the crew sensed.
- **Failure or partial:** one freighter lost, the convoy turned back, the Halcyon damaged by the storm.

**Seeds vary:** the channel layout, the storm's rhythm, which captain is unfit.

### 7. Ghost Ledger
**Premise.** During a diplomatic reception aboard the Halcyon, someone copies the ship's navigation keys. The guests include a Tessarine attaché, a trader, a journalist and a returning Agency officer. Each one lies about something, but only one is the thief.

**Command challenge:**
- **Primary:** deduction and reasoning: alibis, door logs, timelines.
- **Secondary:** bluffing (feeding the thief false keys).
- **Pivotal officer:** Lt. Cmdr. Rask (Tactical/Security), who runs the logs and the interviews.

**Why it's distinct:** the only whodunit. It is solved entirely aboard and entirely by logic.

**Endings:**
- **Success:** the spy unmasked, a counter-intelligence feed through false keys, a quiet deal with the thief's handler.
- **Failure or partial:** the wrong guest accused (a scandal), the keys lost, a guest harmed.

**Seeds vary:** the culprit, each guest's unrelated secret, the trail of evidence.

### 8. The Lantern Drift
**Premise.** A three-century-old generation ship drifts into Agency space. Her damaged custodian intelligence guards 900 sleepers in failing cryo. Not every bank can be saved: waking sleepers kills some, and leaving them kills more. The custodian's own data on which banks are viable is partly corrupt. A salvage consortium is waiting to claim the hulk.

**Command challenge:**
- **Primary:** triage and sacrifice.
- **Secondary:** ethics (the sleepers cannot consent; the custodian speaks for them).
- **Pivotal officer:** Dr. Osei (Medical), who judges which banks can survive waking.

**Why it's distinct:** the only derelict. The only problem where the captain must choose who lives among people who cannot speak for themselves.

**Endings:**
- **Success:** most sleepers saved and the custodian retired with honour, a staged revival, a salvage deal that funds a rescue fleet.
- **Failure or partial:** the custodian's lockdown, a revival that kills the wrong banks, the hulk lost to the salvagers.

**Seeds vary:** the custodian's personality, the cryo failure pattern, the salvagers' legitimacy.

### 9. The Long Picket
**Premise.** An Agency colony needs reactor parts within two days, and a Directorate "inspection" blockade stands in the way. The blockade commander has orders to delay, not to fight. He was once an academy classmate of Cmdr. Marrow.

**Command challenge:**
- **Primary:** bluffing: about the cargo, about escorts, about deadlines.
- **Secondary:** timing.
- **Pivotal officer:** Cmdr. Marrow (XO), whose history with the blockade commander makes the bluff believable or blows it.

**Why it's distinct:** the only simulation won mainly by convincing a rival of something untrue. Nobody's life is in immediate danger.

**Endings:**
- **Success:** run the blockade, a bluffed pass, a face-saving deal.
- **Failure or partial:** cargo impounded, a broken blockade that becomes a diplomatic incident, the colony goes dark.

**Seeds vary:** the commander's orders and temperament, the true manifest, what the blockade actually knows.

### 10. The Gardener
**Premise.** A self-replicating growth is spreading across an asteroid mining field. Science suspects it is alive and possibly aware. The miners want it burned before it reaches their claims. It is reaching toward the Halcyon.

**Command challenge:**
- **Primary:** restraint. Choose *not* to act while the evidence comes in.
- **Secondary:** relying on the science officer.
- **Pivotal officer:** Lt. Varga (Science), who needs time and protection to learn what it is.

**Why it's distinct:** the only simulation where the best opening move is often to do nothing. The "threat" may be a life form.

**Endings:**
- **Success:** contact, a negotiated boundary, a relocation.
- **Failure or partial:** destruction (with a moral cost), an infested Halcyon, the miners burn it themselves.

**Seeds vary:** whether it is alive, aware or neither; how fast it spreads; how desperate the miners are.

### 11. Coldwater
**Premise.** An engineer dies in an accident, and half of the Halcyon's engineering section refuses orders. They believe the death was covered up, and they are partly right: a supervisor falsified a maintenance log.

**Command challenge:**
- **Primary:** crew conflict and leadership.
- **Secondary:** accountability (the cover-up is real).
- **Pivotal officer:** Chief Okafor (Engineering), torn between her people and the chain of command.

**Why it's distinct:** the only mutiny. The adversary is the captain's own crew, and they have a point.

**Endings:**
- **Success:** an investigation that restores trust, a transparent inquiry, a negotiated return to duty.
- **Failure or partial:** the mutiny put down by force, a split crew, the ship crippled.

**Seeds vary:** who falsified what, who is lying, the ringleader's temperament.

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
