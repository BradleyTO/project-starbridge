# Scenario roadmap: 30 training simulations

Project Starbridge will ship with 30 training simulations. The player commands the **ISV Halcyon** of the **Intergalactic Star Agency (ISA)**, the fleet of **the Agency**. The **Tessarine Directorate** is a rival power. Everything here is original fiction.

One simulation is added per day by a routine run that follows [SCENARIO_GUIDE.md](SCENARIO_GUIDE.md). Each run picks the lowest-numbered entry marked **planned**, builds it and its tests, marks it **in progress**, and marks the previous one **done** once it has been reviewed.

Every entry must still meet the bar set by #1 and #2:
- seeded, deterministic and offline;
- NPCs with their own goals and hidden information;
- comms sessions with characters;
- at least 3 success endings and at least 3 failure or partial endings;
- meaningful seed variation;
- room for unconventional solutions;
- crew autonomy and refusals;
- timeline isolation.

Premises can be adjusted when a scenario is built, but its challenge mix should stay distinct from its neighbours.

**Status key:** **done** (shipped and reviewed) · **in progress** (built, under review) · **planned**.

| # | Title | Main challenge mix | Status |
|---|---|---|---|
| 1 | The Kestrel Incident | rescue · border standoff · hidden passenger | **done** (v0.2–v0.5) |
| 2 | Quarantine at Tallis Gate | quarantine / plague · moral dilemma · medical science | **in progress** (built in v0.6.0) |
| 3 | The Lantern Drift | derelict exploration · automated custodian · salvage ethics | planned |
| 4 | Ember Tide | natural hazard (stellar flare) · evacuation against the clock | planned |
| 5 | The Saltglass Accord | diplomacy · mediation · spoilers | planned |
| 6 | The Quiet Signal | first contact · linguistics puzzle | planned |
| 7 | Corsairs of the Veyl Shoals | piracy · hostages in an asteroid field | planned |
| 8 | Coldwater | mutiny / crew conflict aboard the Halcyon | planned |
| 9 | Ion Season | ion storm · escort of slow freighters | planned |
| 10 | The Ninefold Lock | AI / automated defence grid | planned |
| 11 | Hollow Crown | hostage negotiation · deposed governor | planned |
| 12 | Shards of Oriel | archaeological find · contested claim with the Directorate | planned |
| 13 | The Long Picket | blockade running · supply run | planned |
| 14 | Exodus at Cinder Vale | refugee convoy · contraband · triage | planned |
| 15 | The Glass Nebula | nebula hazard · science anomaly · lost shuttle | planned |
| 16 | Ghost Ledger | espionage aboard the Halcyon | planned |
| 17 | The Seventh Bell | border incident · de-escalation after a shooting | planned |
| 18 | Reactor Night | ship emergency · cascading failure aboard the Halcyon | planned |
| 19 | Starfall | rescue from a habitat sinking into a gas giant | planned |
| 20 | The Gardener | science anomaly · is it alive? | planned |
| 21 | Tribunal at Kesh Varo | moral dilemma · asylum or extradition | planned |
| 22 | Wake of the Sundered | derelict Directorate warship · crew in catatonia | planned |
| 23 | Silent Running | escort under stealth · a defector through patrols | planned |
| 24 | The Weather Engine | AI threat · a terraforming intelligence turns on its colony | planned |
| 25 | Bloom | internal crisis · contamination in hydroponics affects judgement | planned |
| 26 | Red Harvest | piracy · the raiders are starving colonists | planned |
| 27 | First Light at Taluun | first contact with a species that fears machines | planned |
| 28 | Gravity's Edge | natural hazard · a neutron star flyby shreds a system | planned |
| 29 | The Exchange at Neutral Point | hostage exchange with the Directorate · mutual distrust | planned |
| 30 | Last Watch at Halden Gate | capstone · multi-crisis border collapse | planned |

## Entries

### 1. The Kestrel Incident (done)
A crippled freighter with a failing reactor is adrift in the contested Calloway Reach. A Directorate heavy cruiser is hunting a hidden passenger aboard her.
- **Endings:** rescue corridor, negotiated release, standoff broken, withdrawal, and others.
- **Seeds vary:** the passenger (defector, prisoner or sibling), the Prefect's temperament, the reactor timer and complications.

### 2. Quarantine at Tallis Gate (in progress, v0.6.0)
**Premise.** The pilgrim liner *Mercy of Ilun* is holding outside the closed orbital gate of Tallis Gate, a mining colony, with sick passengers aboard. The colony picket *Thornwake*, commanded by Warden-Commander Isolde Marr, will fire on any ship that crosses the quarantine line. Captain Juno Sabeth will run the line when her patience runs out.

**Hidden information:**
- the real cause: contagious Ilun fever, poisoned water, or an allergy to incense;
- how it started;
- whether Marr's brother is aboard;
- the colony's antiviral stockpile.

**Unconventional routes:**
- an isolation ward;
- screened (biofiltered) transport;
- asking the colony for its own antiviral;
- interposing the Halcyon;
- towing the liner to an Agency hospital.

**Endings:**
- **Success:** quarantine lifted, cure delivered, Agency care.
- **Failure or partial:** liner destroyed, colony outbreak, fever aboard the Halcyon, gate incident, abandoned, the long road, gate run, stalemate, Halcyon lost.

### 3. The Lantern Drift
A three-century-old generation ship drifts into Agency space. Her custodian intelligence still runs the ship and guards 900 sleepers in failing cryo. A salvage consortium claims the hulk under salvage law. Waking the sleepers kills some of them; leaving them asleep kills more.
- **Hidden:** the custodian's damaged directive; which cryo banks are viable.
- **Endings:** sleepers saved and the custodian retired with honour; a salvage deal; the custodian's lockdown (failure).
- **Seeds vary:** the custodian's personality, the cryo failure rate, the salvager's legitimacy.

### 4. Ember Tide
A variable star is about to throw a flare across Ketter's Rest, a mining outpost. Some 400 miners must be evacuated. There are not enough shuttles, the outpost's foreman refuses to abandon the ore, and the flare's timing is uncertain until science pins it down.
- **Endings:** a full evacuation, a shielded shelter inside the mine (an unconventional route), partial losses, the Halcyon caught in the flare.

### 5. The Saltglass Accord
The Halcyon hosts talks between two independent clans who both claim the ice moon Saltglass. A third party wants the talks to fail and has an agent at the table.
- **Endings:** an accord, a partition, the walk-out, and a feud that becomes a war.
- **Seeds vary:** which delegate is the spoiler, and what each clan actually needs.

### 6. The Quiet Signal
A patterned silence in a pulsar's emissions turns out to be a message. The senders answer only in mathematics and take an unanswered question as hostility.
- **Endings:** contact established; misunderstanding; their withdrawal; the Directorate overhearing.
- **Seeds vary:** the grammar of the code.

### 7. Corsairs of the Veyl Shoals
Raiders have taken a three-ship convoy into an asteroid shoal where the Halcyon's sensors and torpedoes are unreliable. The convoy crews are hostages. The corsair captain owes a debt she cannot pay to someone worse.
- **Endings:** a negotiated release, a boarding rescue, the corsairs turned against their creditor, hostages lost.

### 8. Coldwater
After an engineer dies in an accident, part of the Halcyon's engineering section refuses orders. They believe the death was covered up. They are partly right.
- **Endings:** an investigation that restores trust, the mutiny put down by force (partial), a split crew, the ship crippled.
- **Seeds vary:** who is lying and what was covered up.

### 9. Ion Season
Three slow ore freighters must cross an ion storm to reach a station before it is cut off for a month. Sensors are blind, and one freighter's captain is drunk.
- **Endings:** all three through; an unconventional tow chain; a freighter lost in the storm; the convoy turned back.

### 10. The Ninefold Lock
An abandoned Directorate depot's automated defence grid wakes when an Agency survey team lands. The team is trapped. The grid's logic has nine locks, and some of them can be talked to.
- **Endings:** the grid shut down; the grid persuaded; the team rescued at a cost; an incident with the Directorate over the depot.

### 11. Hollow Crown
A deposed colonial governor has taken the staff of a relay station hostage and demands to be restored. His successor wants him dead. One hostage is not who she claims to be.
- **Endings:** a negotiated surrender, a rescue, asylum, bloodshed.
- **Seeds vary:** the governor's state of mind.

### 12. Shards of Oriel
Agency archaeologists find a pre-human archive on a moon the Directorate also claims. A Directorate science vessel arrives with soldiers, and the archive starts to activate.
- **Endings:** a joint expedition, the archive saved, the archive destroyed, an armed standoff.

### 13. The Long Picket
An Agency colony needs reactor parts, and a Directorate "inspection" blockade stands in the way. The blockade commander has orders to delay, not to fight.
- **Endings:** run the blockade, inspect and pass, a deal, a broken blockade with consequences.
- **Seeds vary:** the hidden cargo manifest.

### 14. Exodus at Cinder Vale
Nine refugee ships are fleeing a collapsing colony. One carries weapons, and another carries plague. Agency space will take only some of them.
- **Endings:** all through, triage, the weapons ship uncovered, a stampede at the border.

### 15. The Glass Nebula
A survey shuttle is lost inside a nebula that bends sensor returns and time signals. Its last message contradicts itself.
- **Endings:** the shuttle recovered, a scientific discovery, the Halcyon stranded, the shuttle lost.
- **Seeds vary:** what the nebula actually does.

### 16. Ghost Ledger
During a diplomatic reception aboard the Halcyon, someone copies the ship's navigation keys. The guests include a Tessarine attaché, a trader and a journalist.
- **Endings:** the spy unmasked, a counter-intelligence feed, a diplomatic scandal, the keys lost.
- **Seeds vary:** the culprit.

### 17. The Seventh Bell
An Agency patrol cutter has fired on a Directorate courier, killing two. Both sides are arriving. The cutter's captain says it was self-defence, and the logs disagree.
- **Endings:** de-escalation with justice, a cover-up (partial), a border clash, a war footing.

### 18. Reactor Night
The Halcyon's own reactor begins a cascade failure, a coolant valve is stuck, and the only engineer who can reach it is claustrophobic. No enemies are involved: the ship and the crew are the challenge.
- **Endings:** a clean save, eject and limp home, deck losses, the ship lost.

### 19. Starfall
A mining habitat is sinking into a gas giant's atmosphere. Tractor beams strain, transporters are scattered by the storm, and the habitat's administrator is hiding how many people are aboard.
- **Endings:** all rescued, a habitat tow (unconventional), partial rescue, the Halcyon dragged down.

### 20. The Gardener
A self-replicating growth spreads across an asteroid field. Science suspects it is alive, the miners want it burned, and it is reaching for the Halcyon.
- **Endings:** contact, containment, destruction (a moral cost), infestation.

### 21. Tribunal at Kesh Varo
A man accused of war crimes asks the Halcyon for asylum. The planet he fled demands extradition, and its fleet is waiting. He may be innocent.
- **Endings:** asylum, extradition, a neutral tribunal, violence at the airlock.

### 22. Wake of the Sundered
A Directorate warship is found adrift with her crew alive but catatonic. Something aboard is spreading the condition. The Directorate wants the ship back untouched.
- **Endings:** the cause found and the crew returned, the ship scuttled, the Halcyon's boarding team affected, an incident with the Directorate.

### 23. Silent Running
A Tessarine scientist wants to defect, and the Halcyon must take her shuttle through three Directorate patrols without being identified. Her information may be bait.
- **Endings:** a clean defection, the bait discovered, capture, a firefight.

### 24. The Weather Engine
A terraforming intelligence has decided the colonists are contaminating its work. It controls the planet's weather.
- **Endings:** the intelligence persuaded, shut down, a colony evacuation, a colony lost.
- **Seeds vary:** its reasoning.

### 25. Bloom
A spore bloom in the Halcyon's hydroponics makes the crew suggestible and paranoid. Officers start refusing sound orders and accepting bad ones.
- **Endings:** containment, a purge, the ship adrift, a crew rift.
- **Special challenge:** the crew-autonomy rules themselves are bent.

### 26. Red Harvest
Raiders are attacking a grain convoy. The raiders turn out to be starving colonists from a world the Agency failed to supply.
- **Endings:** relief arranged, the raiders arrested, the convoy lost, a massacre.

### 27. First Light at Taluun
A species that fears machines will only meet unarmed people who arrive without technology. The away team must go down in a shuttle stripped of everything.
- **Endings:** contact, a cultural shock, a hostage crisis, the Directorate's competing envoy.

### 28. Gravity's Edge
A neutron star flyby is tearing a system apart. An observatory crew refuses to leave before their data is safe.
- **Endings:** all evacuated, data and crew saved, data lost, the Halcyon damaged by tidal stress.

### 29. The Exchange at Neutral Point
The Agency and the Directorate exchange prisoners at a neutral station. Each side suspects the other of a trick, and both are right.
- **Endings:** a clean exchange, an exposed double cross, a seized station, a collapse of trust.

### 30. Last Watch at Halden Gate
The capstone. The border collapses on several fronts at once: a refugee flood, a Directorate fleet, a stricken station and a crew at the end of their endurance. Lessons from the earlier simulations apply.
- **Endings:** the border held without war, held at a cost, war, the Halcyon lost.
