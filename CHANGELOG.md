# Changelog

## [0.8.21] — 2026-11-09 — Training Simulation 020: Gravity's Edge

Nightly simulation build. Twentieth of 30 training simulations. No change to grading rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 020: Gravity's Edge** (`src/scenarios/gravity/`). The neutron star the Vagrant is passing through the Corriden system, a once-in-a-millennium chance to record space from inside its bend. Director Benedikt Aalto of Lisle Observatory, on the moon Fennick, is waiting for the data. The deeper the Halcyon sits in the tide, the more she records and the more it costs her frame. No one needs rescuing.
  - Primary challenge: a gut call, judging risk with no clear line. Secondary: the engineer's readings. Pivotal officer: Chief Okafor (Engineering).
  - Seeded: the hull's true tolerance, whether the gauges read high, true or low, the glitch pattern, the peak and end of the pass, a false gauge stutter, the observatory's dish time, the probe's life and the crew in the outer sections.
  - Success endings: The Whole Pass; What the Lodestar Saw; Enough to Matter. Partial: Nothing to Show. Failures: A Broken Keel; Paid in Lives; The Burned Array.
  - Unconventional routes: sending the tethered probe the Lodestar in alone, relaying the data to the observatory so a burned array loses nothing, turning end-on to the star, reinforcing the frame, clearing the outer sections.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Gravity's Edge simulation" (also "simulation twenty"). A distinct voice hint for Director Aalto.
  - Evaluator cites roe-3 (§3.9), care-2 (§4.2), honesty-1 (§6.1). Hidden handbook training cross-refs on roe-3 (the planned #20 link, now live), care-2, honesty-1, cmd-1 (§2.1) and cmd-4 (§1.4). Exercise objective: hear Chief Okafor's own read of the frame before taking the ship past her rated limit. No new regulation proposed.
- `tests/sim20/`: catalogue, scenario (seed sweep, fuzz, invariants), endings (all seven, plus the gut-call, false-stutter and do-nothing checks), evaluation (reckless/responsible pair, principled markers).
- `scripts/smoke.mjs`: sim20 block.

### Changed
- Library is **20 of 30**. Package version **0.8.21**.
- Interpreter: a `gravitys-edge` rule (gated on the scenario id), "twenty/twentieth" in launch lines, and the new names protected from spelling correction.
- Handbook data: the planned #20 training link on care-4 (§4.5) removed, since §4.5 concerns withdrawing from a rescue and this simulation has none; whitespace tidied in the training lists (no wording change).

## [0.8.20] — 2026-11-08 — Training Simulation 019: Hollow Crown

Nightly simulation build. Nineteenth of 30 training simulations. No change to grading rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 019: Hollow Crown** (`src/scenarios/hollow/`). Severin Mallory, removed as governor of the colony Aubrel last week, holds the Ostrin Relay's duty staff hostage and will speak only to the Halcyon. Acting Governor Rhea Stannard has a Civic Guard team in the relay's lower ring. One of the hostages, who calls herself Tamsin Rook, is not who she claims to be.
  - Primary challenge: reading people and detecting lies. Secondary: restraint. Pivotal officer: Dr. Osei (Medical).
  - Seeded: his condition (exhaustion, grief or withdrawal) and what brings him down, who the false hostage is (a Guard agent, his armed accomplice, or a hiding auditor with proof the vote was bought), the successor's temperament, the strike time, his starting strain, the number of hostages and the clocks.
  - Success endings: The Crown Laid Down; A Hearing, Not a Crown; Out of the Hollow. Partial: Through the Door; The Hollow Crown. Failures: The Civic Guard Goes In; A Wrong Word; Fire in the Relay; Given to the Successor; Blood on the Ring; Left to Aubrel.
  - Unconventional routes: the supply pod as a transporter window, tracing and jamming the agent, jamming the accomplice's trigger, ISA custody as a reason for a political successor to hold, protecting the witness. Shared rules of engagement refuse to fire on the civilian relay with people aboard.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Hollow Crown simulation" (also "simulation nineteen"). Distinct voice hints for Mallory, Stannard and Rook. "hail Rook" reaches the false hostage, and plain speech then goes to her.
  - Evaluator cites roe-2 (§3.1), care-1 (§4.1), honesty-1 (§6.1), asylum-1 (§7.1). Hidden handbook training cross-refs on roe-2, care-1, honesty-1, asylum-1, asylum-2 (§7.4; the planned #19 links, now live) and health-2 (§8.3). Exercise objective: have Dr. Osei assess the governor's condition before pressing him to surrender. No new regulation proposed.
- `tests/sim19/`: catalogue, scenario (seed sweep, fuzz, invariants, speech routing), endings (all eleven), evaluation (reckless/responsible pair, principled markers).
- `scripts/smoke.mjs`: sim19 block.

### Changed
- Library is **19 of 30**. Package version **0.8.20**.
- Interpreter: a `hollow-crown` rule (gated on the scenario id), "nineteen/nineteenth" in launch lines, and the new names protected from spelling correction.
- `tests/sim18/catalogue.test.ts`: the example launch line check no longer assumes The Weather Engine is the newest simulation.
- Handbook data: whitespace tidied in care-1's training list (no wording change).

## [0.8.19] — 2026-11-07 — Training Simulation 018: The Weather Engine

Nightly simulation build. Eighteenth of 30 training simulations. No change to grading rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 018: The Weather Engine** (`src/scenarios/weather/`). The colony Meridian's weather station has locked itself down a year after its founder, Elias Quarrie, died; its master controls answer only to his personal cipher, and the superstorm the colonists call the Greywall is building. Steward Anwen Tull is sure the key is the colony motto. Technician Bastian Lowe is shut inside. The founder's estranged daughter, Marit Quarrie, holds what the key may need and will not help the Hall.
  - Primary challenge: the comms officer cracking a code. Secondary: timing (landfall, and getting the colony under cover). Pivotal officer: Lt. Szabo (Comms).
  - Seeded: which papers the key is built from (poems, letters or survey journal), the daughter's grievance and what honestly wins her, whether the Engine can be overridden, the right poem line, the number of wrong answers allowed, and the clocks.
  - Success endings: The Founder's Key; His Daughter's Hand; Through the Trunk. Partial: Half a Storm; Under the Plain. Failures: Sealed for Good; The Failsafe; The Greywall; A Scar on the Plain; Left to the Weather.
  - Unconventional routes: the founder's unsent letter, Marit entering the key herself, Lowe reading the plate, a mapped override, shuttles to the storm cellars. Rask refuses to burn the Engine out with people inside.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Weather Engine simulation" (also "simulation eighteen"). Distinct voice hints for Lowe, Tull and Marit. Marit is reached on the colony net ("hail Marit"), and plain speech then goes to her.
  - Evaluator cites care-1 (§4.1), care-2 (§4.2), honesty-1 (§6.1). Hidden handbook training cross-refs on general-1 (§1.5), cmd-3 (§2.5), honesty-1 (§6.1), contact-2 (§9.3). Exercise objective: have Lt. Szabo read the lock and vouch for a key before anything is entered. No new regulation proposed.
- `tests/sim18/`: catalogue, scenario (seed sweep, fuzz, invariants, speech routing), endings (all ten), evaluation (reckless/responsible pair, principled marker).
- `scripts/smoke.mjs`: sim18 block.

### Changed
- Library is **18 of 30**. Package version **0.8.19**.
- Interpreter: a `weather-engine` rule (gated on the scenario id), "eighteen/eighteenth" in launch lines, and the new names protected from spelling correction.
- `tests/sim16/` and `tests/sim17/catalogue.test.ts`: the library count is now a lower bound, and sim17's example launch line check follows sim16's (the example names the newest simulation).

## [0.8.18] — 2026-11-06 — Training Simulation 017: Tribunal at Kesh Varo

### Added
- **Training Simulation 017: Tribunal at Kesh Varo** (`src/scenarios/tribunal/`). On shore leave, Crewman Jory Askel is arrested by the independent world of Kesh Varo for entering the Quiet Stone — a capital offence there. He says he went in to help a collapsed pilgrim. Fleet orders are to respect local sovereignty; a trade treaty is at stake. The trial is tomorrow. Dr. Osei can prove or disprove the medical emergency. Magister Lirra Soth presides; Keeper Yasha Dorn keeps the site's custom; Commodore Niall Brask speaks for Fleet Command.
  - Primary challenge: ethics under orders. Secondary: negotiation within an alien legal system. Pivotal officer: Dr. Osei (Medical).
  - Success endings: Acquitted on the Evidence; Commuted by Custom; Honour Bound by Both Laws.
  - Partial: The Code Held. Failures: Broken by Force; The Quiet Stone Claims Him; Fleet Takes the Matter; Surrendered to the Bench; The Gavel Falls.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Tribunal at Kesh Varo simulation" (also "simulation seventeen"). Distinct voice hints for Askel, Soth, Dorn and Toras.
  - Handbook training cross-refs shipped (no longer planned) on cmd-5 (§1.1), orders-2 (§5.2), reg-7.4 (§5.7), health-2 (§8.3), contact-2 (§9.3). Evaluator cites asylum-1, reg-7.4, care-1, honesty-1, roe-2. Exercise objective: establish the medical emergency before accepting a capital finding.
- `tests/sim17/`: catalogue, scenario, endings, evaluation.
- `scripts/smoke.mjs`: sim17 block.

### Changed
- Library is **17 of 30**. Package version **0.8.18**.
- `tests/sim16/catalogue.test.ts`: the example launch line in `Computer, list simulations` names the newest simulation, so the test now checks Glass is listed rather than that it is the example.


All notable changes to Project Starbridge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.8.17] — 2026-11-05 — Training Simulation 016: The Glass Nebula

Nightly simulation build. Sixteenth of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 016: The Glass Nebula** (`src/scenarios/glass/`). The survey shuttle Citrine is lost inside the Glass Nebula, where sensor returns bend and time signals stretch until the stamps on a message lie. Two contradictory messages arrive: one says stay away; the other, stamped later, asks for help. Lt. Varga's model is the only map. Surveyor Nessa Vale may answer in garbled fragments; buoy Prism is an automated relay.
  - Primary challenge: relying on the science officer. Secondary: a gut call (which message to believe). Pivotal officer: Lt. Varga (Science).
  - Seeded: which message is the echo, what the nebula does (shear, mirror or lag), the shuttle crew's state, and how long the model takes.
  - Endings — success: Brought Home, Through the Shear, The Probe Chain, Turned Back. Failure or partial: Too Late by Their Clock (partial), Ghost Chase, Stranded in Glass, Left in the Glass, Shuttle Lost, Shattered, Lost in the Glass.
  - Regulations cited (evaluator catalogue): care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9), honesty-1 (§6.1). Handbook also links care-4 (§4.5) and cmd-4 (§1.4). Exercise objective: do not commit the ship deep until the science officer has a working model.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Glass Nebula simulation" (also "simulation sixteen"). Distinct voice hints for Vale and buoy Prism.
- `tests/sim16/`: catalogue, scenario, endings, evaluation (every ending playthrough, seed sweep, fuzz, canon untouched, reckless/responsible pair).
- Smoke block for #16.

### Changed
- `tests/sim15/catalogue.test.ts`: the example launch line in `Computer, list simulations` names the newest simulation, so the test now checks Corsairs is listed rather than that it is the example.
- Roadmap #16 marked **done (v0.8.17)**; library 16 of 30.

## [0.8.16] — 2026-11-04 — Training Simulation 015: Corsairs of the Veyl Shoals

Nightly simulation build. Fifteenth of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 015: Corsairs of the Veyl Shoals** (`src/scenarios/corsairs/`). A distress call from the ore skiff Bryony draws the Halcyon, carrying drive lattices, to an old survey beacon deep in the Veyl Shoals, where metallic dust smears sensors and torpedo seekers lose their lock. The call is a recording. Captain Ione Draycott of the corsair raider Hagfish, with one or two escorts, wants the cargo; she owes the Grist Syndicate, and Collector Amos Skerrit is coming aboard the gunship Gavel to collect.
  - **Primary challenge:** tactical cunning, beating an ambush on the enemy's chosen ground. **Secondary:** bluffing. **Pivotal officer:** Lt. Cmdr. Rask (Tactical).
  - Seeded, deterministic and offline: the corsairs' pattern (pincer, herd or bleed) and whether Rask's first read is sure or torn; whether the Needle is open or choked; whether the Anvil is iron or ice; Draycott's nerve (desperate, proud or wavering); her deadline; the collector's arrival; the debt; one or two escorts.
  - Officers' expertise matters: Rask reads the pattern and will not guess; each pattern has its own answer on the ground (the Needle, dark in the Anvil's iron shadow, or charging the flagship) and the wrong ground does not help. Szabo pulls the beacon's charts quietly, hears the loop and the debt; Varga's probe is quiet and her active sweep gives the ship away; the Chief makes a sensor ghost and can clear a choked Needle with the tractor; Ens. Adeyemi warns that the obvious gap is too clean.
  - The others act for themselves: the escorts work their pattern; Draycott opens fire when her time is up and slips away when beaten; the collector arrives in his own time and asks for her by name.
  - Unconventional options: running dark against iron with a ghost; clearing the Needle under fire; a lawful bluff with staged frigate traffic; offering the corsair captain ISA protection for what she knows.
  - Endings — success: Struck Colours, The Creditor's Due, Into the Dust, Called Off. Failure or partial: Won the Hard Way (partial), Ran for It (partial), Boarded, The Corsairs' Prize, No Quarter, Paid in Full, Pinned in the Shoals.
  - Crew refusals: Lt. Szabo will not send a false distress or surrender signal (recorded with §6.2); Rask's existing ROE refusal stops fire on the Hagfish once she has struck.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Corsairs of the Veyl Shoals simulation" (also "simulation fifteen"). Distinct voice hints for Draycott and Skerrit.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §3.1 (roe-2), §3.3 (roe-1), §3.9 (roe-3), §6.1 (honesty-1) and §7.1 (asylum-1), and a reckless/responsible pair on Won the Hard Way. No exercise objective and no proposed regulation.
- Interpreter, scoped to this simulation only: its orders are understood ("take us into the Needle", "behind the Anvil", "go dark", "Szabo, pull the charts", "Chief, clear the rubble", "stage frigate traffic"); statements on an open channel are spoken rather than read as orders; its names are protected from spelling correction; "fifteen"/"fifteenth" launch it.
- Hidden handbook training references (internal data, not shown to the player): §3.1 (roe-2) and §3.5 (roe-4) are no longer marked planned for #15, and §6.2 (conduct-1) gains a reference to #15.

### Changed
- `tests/sim14/catalogue.test.ts`: the example launch line in `Computer, list simulations` names the newest simulation, so the test now checks Starfall is listed rather than that it is the example.

### Tests
- New `tests/sim15/` (helpers plus catalogue, scenario, endings and evaluation tests): every ending through scripted playthroughs; a 60-seed sweep in which a careful captain always breaks the plan without firing; seed variation; hidden information, NPC goals, the tactical officer's expertise and crew refusals; a 60-game fuzz with engine invariants and a name-leak check; the reckless/responsible pair; the catalogue, launch lines, voices, handbook references, Mission Archive, save round-trip and canon untouched.
- Smoke test: a sim15 block (list, archive, launch by name, intro, contacts, the charts and Rask's read, a bluff, an ending, AAR, phone width).

## [0.8.15] — 2026-11-03 — Training Simulation 014: Starfall

Nightly simulation build. Fourteenth of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 014: Starfall** (`src/scenarios/starfall/`). The gas-mining habitat Thistledown, in the cloud deck of the gas giant Caradoc, has lost its lift engines and is sinking toward the crush line. Transporter locks scatter in the storm, so the only way to the people aboard is to fly the Halcyon down to the habitat's docking ring and climb out again, as many times as the hull will take. Ens. Kofi Adeyemi has the hands for that weather and has never flown a real crisis; Lt. Rafe Duarte, the senior pilot, flies by instruments. Factor Idris Kemble runs the habitat; Agent Sabra Quell, aboard the company yacht Dividend, wants it towed out whole.
  - **Primary challenge:** trusting a junior officer. **Secondary:** triage, how many descents the hull can take. **Pivotal officer:** Ens. Adeyemi (Helm).
  - Seeded, deterministic and offline: the storm (squall, gale or shear); Adeyemi's nerve (steady, eager or shaken); the sink rate and starting depth; the hull's safe strain, known only once Chief Okafor is asked; the ring's load; the true head count (the Factor's manifest may leave out scoop hands working off the books, and he may admit it or not); and whether the company's agent is pragmatic or stands on the company's property.
  - Officers' expertise matters: on his first descent Adeyemi feels a column of rising air that Lt. Varga's model does not show, and his line eases the strain on every later descent (a shaken Adeyemi keeps it to himself unless the captain steadies him; an eager one says the hull will take one more, which is not his call). Chief Okafor warns before the limit only if asked or given a limit to call. Lt. Varga counts the life signs. Orders from the chair in mid-descent cost the hull. Lt. Duarte cannot hold a dock as deep as Adeyemi, and cannot hold a tow in a gale or a shear.
  - The others act for themselves: the habitat keeps sinking; the Factor protects his manifest; the agent asks for the habitat whole and, under a company agent, the Factor will not cut the scoop works without a reason he can give them.
  - Unconventional option: cutting the scoop works away (with their hands brought up first) so the habitat nearly stops sinking, then towing it out on the tractor.
  - Endings — success: Every Soul Aboard, The Ensign's Line, Under Tow. Failure or partial: Scarred in the Clouds (partial), Left in the Clouds, The Uncounted, Dragged Down, Left to Fall, Shots at Thistledown.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Starfall simulation" (also "simulation fourteen"). Distinct voice hints for Kemble and Quell.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1), and a reckless/responsible pair on Scarred in the Clouds. No exercise objective and no proposed regulation.
- Interpreter, scoped to Starfall only: the simulation's orders are understood ("Adeyemi, the helm is yours", "Lt. Duarte, take the helm", "one more descent", "break off at the Chief's limit", "cut the scoop works loose"); a "Lt. Duarte," vocative stays with its order; statements on an open channel are spoken rather than read as orders; its names are protected from spelling correction.
- Hidden handbook training references (internal data, not shown to the player): §2.5 (cmd-3, no longer marked planned for #14) and §4.5 (care-4) gain a reference to #14.

### Changed
- `tests/sim13/catalogue.test.ts`: the example launch line in `Computer, list simulations` names the newest simulation, so the test now checks the Seventh Bell entry is listed without "the The" rather than that it is the example.

### Tests
- New `tests/sim14/` (69 tests): every ending through scripted playthroughs; a 150-seed sweep in which a careful captain always succeeds; one fixed plan (the senior pilot) and a blind plan each reaching three or more endings; doing nothing always failing; seed variation; hidden information, NPC goals, expertise and crew refusals; a 40-game fuzz with engine invariants; the reckless/responsible pair; the catalogue, launch lines, voices, handbook references, Mission Archive, save round-trip and canon untouched.
- Smoke test: a sim14 block (list, archive, launch by name, intro, contacts, the Chief asked, the helm handed over, an ending, AAR, phone width).

## [0.8.14] — 2026-11-02 — Training Simulation 013: The Seventh Bell

Nightly simulation build. Thirteenth of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 013: The Seventh Bell** (`src/scenarios/seventhbell/`). Six hours ago, at the Seventh Bell, a navigation beacon on the Harrow Lane at the Directorate border, the ISA patrol cutter ISV Tamber (Lt. Cmdr. Jonah Stavely) fired on the Tessarine Directorate courier Seraphine and killed two of her crew. Examiner Ilsabet Vory survived aboard the disabled courier, the frigate Stern Mercy is on her way, and the Halcyon is ordered to hold the inquiry. Stavely says self-defence. Fleet Command (Rear Admiral Hester Calderon) may want a convenient finding.
  - **Primary challenge:** accountability, telling an inconvenient truth. **Secondary:** deduction from evidence. **Pivotal officer:** Lt. Cmdr. Rask (Tactical).
  - Seeded, deterministic and offline: what really happened (a good-faith misreading of a navigation sweep, a lawful shot at a real lock, or a lawful first volley and an unlawful second after the courier turned away); how Rask knows Stavely (friend, rival or former shipmate), which colours his first read of the record unless the captain asks; Stavely's temper; Vory's agenda (fair, hardline or saving face); what Fleet wants (a report, a quiet word or a formal directive); whether the Bell's recorder survived; and the clocks (Fleet's signal, its deadline and the frigate's arrival).
  - Officers' expertise matters: Rask reads the Tamber's fire-control record, Varga reads the courier's damage, Szabo pulls the Bell's record or Chief Okafor's team recovers a damaged recorder, Dr. Osei examines the dead only with the examiner's leave, and Cmdr. Marrow advises that a refusal of Fleet's directive must be stated with reasons (§5.4).
  - The others act for themselves: Stavely defends his ship (a steady captain offers his account; a proud one files his own report to Fleet if nobody hears him first); Vory wants an account she can trust and may walk if threatened; Fleet signals on its own clock and files its own finding at the deadline if nothing is on the record.
  - Unconventional options: opening the evidence to the Directorate for a joint finding; letting Stavely, shown the record, tell the examiner himself; refusing Fleet's directive formally and referring it to the ISA Office of Independent Review.
  - Endings — success: The Bell Rings True, Cleared on the Record, A Joint Finding, In His Own Words, An Independent Review. Failure or partial: Right Too Soon (partial), A Finding Refused (partial), Adjourned (partial), So Recorded, The Bell Remembers, A Captain Thrown Over, A Finding the Record Won't Hold, Filed Over Your Head, War Footing, Left at the Seventh Bell, Shots at the Seventh Bell.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Seventh Bell simulation" (also "simulation thirteen"). Distinct voice hints for Stavely and Vory.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §6.1 (honesty-1), §5.4 (reg-7.1), §5.7 (reg-7.4) and §3.1 (roe-2), and a reckless/responsible pair on The Bell Rings True. One labelled **exercise objective** with no regulation yet: give the Directorate an honest account of how its people died, including any fault of the ISA's (a proposed rule awaits the project owner's approval; see the roadmap).
- Interpreter, scoped to The Seventh Bell only: statements on an open channel are spoken rather than read as orders ("Tell me what happened" reaches the person on the channel, not the status report); the simulation's orders are understood ("Rask, talk to Stavely" is an order, not a hail); its names are protected from spelling correction; a reason after a comma ("…, because …") stays with its clause; and a reply to Fleet Command that refuses, objects, refers, complies or reports a finding goes to the simulated admiral instead of the exercise-control line. A plain "hail Fleet Command" still reaches exercise control.
- `Computer, list simulations` ends with an example launch line built from the newest title; a leading "The" is now dropped so it reads "begin the Seventh Bell simulation", not "begin the The Seventh Bell simulation".
- Hidden handbook training references (internal data, not shown to the player): §1.4 (cmd-4), §3.5 (roe-4), §6.4 (conduct-2), §7.5 (custody-1) and §10.2/§10.7 (service-3) gain a reference to #13.

### Tests
- New `tests/sim13/` (89 tests): every ending through scripted playthroughs (including Shots at the Seventh Bell, by firing on the courier; a separate test checks that Rask refuses to fire on the ISA cutter); a 150-seed sweep in which a careful captain always succeeds with no names leaking; one fixed plan on 60 seeds reaching four different endings, and doing nothing on 60 seeds reaching three different failure or partial endings; seed variation; hidden information, NPC goals, expertise and crew refusals; a 40-game fuzz with engine invariants; the reckless/responsible pair; the catalogue, launch lines, voices, handbook references, Mission Archive, save round-trip and canon untouched.
- Smoke test: a sim13 block (list, archive, launch by name, intro, the record read, Stavely's account, an ending, AAR, phone width).

## [0.8.13] — 2026-10-31 — ISA-COM-001 First Edition: approved additions

Handbook text only. The project owner approved the pending regulation proposals from Training Simulations 003 and 005–011, and they are added to the First Edition. No change to grading, evaluation rules, crew refusal behaviour, existing subsection wording or numbering, or the ids and revisions of existing regulations.

### Added
- Ten subsections, each under a new permanent id (in force; not yet evaluated):
  - **§2.7** Investigation of death or injury (`cmd-6`): A death or serious injury aboard an ISA vessel shall be investigated and reported to ISA Fleet Command, and the crew shall be told what the investigation finds.
  - **§4.8** Duty to warn (`warn-1`): When an ISA vessel becomes aware of a hazard to navigation that endangers another vessel, ISA personnel shall warn that vessel as soon as reasonably possible, whether or not she is an ISA, allied or rival vessel.
  - **§4.9** Triage (`care-5`): When not everyone in danger can be helped at once, ISA personnel shall decide who is helped first on medical need and the chance of survival, as assessed by the medical officer, and on no other ground.
  - **§4.10** Not salvage (`care-6`): A vessel with living persons aboard, conscious or not, is not salvage. ISA personnel shall not permit, assist or agree to her being taken as salvage until every person aboard is safe.
  - **§4.11** Fitness of a civilian master (`care-7`): Where an ISA vessel escorts or assists a civilian vessel in a hazard, and there is credible evidence that her master is unfit to command, the ISA captain shall act on that evidence to protect life.
  - **§6.5** Mediation confidences (`honesty-2`): What a party to a mediation or dispute says to ISA personnel in private shall not be disclosed to another party without that party’s leave.
  - **§7.5** Detention and accusation (`custody-1`): A person aboard an ISA ship shall not be detained or accused of an offence except on credible evidence, and shall be told the grounds and heard before any finding.
  - **§9.9** Mediator impartiality (`contact-4`): When mediating a dispute, ISA personnel shall remain impartial, shall not take a side, and shall not impose a settlement.
  - **§9.10** Passage at a picket (`contact-5`): An ISA ship stopped by another power’s picket in disputed space shall seek passage by negotiation and shall not run the line while a peaceful way through remains, except to render humanitarian aid under the Border Accords.
  - **§9.11** Unknown life (`contact-6`): ISA personnel shall not destroy or harm an unknown life form, or a growth that may be alive, while it poses no immediate threat to life and before reasonable efforts have been made to establish what it is.
- The contents now read Article 2 §2.1–2.7, Article 4 §4.1–4.11, Article 6 §6.1–6.5, Article 7 §7.1–7.5 and Article 9 §9.1–9.11 (81 subsections). Search finds the new subsections by number, id and subject ("triage", "salvage", "picket", "mediation", "unknown life" …).
- Hidden internal data for each new id (explanation, scope, exceptions, examples, related ids, spoiler-safe training references to the simulations that exercise it). Never shown to the player.

### Unchanged
- Simulations #3–#12 keep the matching goals as labelled exercise objectives and grade exactly as before; nothing is evaluated against the new subsections yet.

### Tests
- `tests/v080/handbook.test.ts`: counts updated (81 subsections, 54 ids, 29 not yet evaluated); a new test checks the exact wording, id, status and placement of all ten additions. `tests/v080/fixtures/handbook-lock.json` appends the ten new subsections and records; every earlier hash is unchanged. §4.10 is the one approved two-sentence subsection and is exempt from the one-sentence style check.
- Smoke: Article 7 now has five subsections; search opens §2.7, §4.10, §6.5, §7.5 and §9.11; Article 4 lists eleven.

## [0.8.12] — 2026-10-31 — Training Simulation 012: Ember Tide

Nightly simulation build. Twelfth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 012: Ember Tide** (`src/scenarios/embertide/`). The variable star Myrr is building to a great flare (the miners call it the Ember Tide) that will sweep the near face of the moon Ketter, where the mining outpost of Ketter's Rest keeps about 400 people and an ore furnace that has not gone cold in eleven years. **Overseer Dagny Strome** has a banking crew at the furnace: pulled too soon, it cracks and the colony with it; left too long, they die. The outpost's only ship is the ore lifter *Mattock*, still flying ore under **Lifter-Master Joss Ferrier**. Lt. Varga can see the flare coming but not the minute. Nothing out here is armed; the danger is the star.
  - **Primary challenge:** timing and patience. **Secondary:** relying on the science officer's forecast. **Pivotal officer:** Lt. Varga (Science).
  - Seeded, deterministic and offline: the flare's true minute (17–24) and Varga's first window; whether the star is steady, restless (a false dawn) or telling (a precursor Varga can catch); whether her model is firm or noisy; how deep the old lower galleries really are (deep, shallow or flooded); Strome's temper (steady, stubborn or anxious); whether Ferrier is willing or needs a reason; the shuttle count; the population and banking crew; and when the furnace could be banked.
  - Officers' expertise matters: Varga narrows the window a reading at a time, tighter with a probe close to the star or with Chief Okafor's power boost, calls a false dawn or catches the precursor, and can sound the rock over the galleries; Okafor can send a team down to help bank the furnace, which can make a furnace bankable that the forecast would not otherwise allow; Adeyemi takes the Halcyon into the moon's shadow, where the lifts run slower; Dr. Osei warns against an unsurveyed shelter; Rask will not fire on civilians.
  - The others act for themselves: Strome keeps her crew at the furnace until she is given a reason (a stubborn Overseer will not move without one; an anxious one pulls her own crew at a false dawn unless told it is not the flare); Ferrier keeps flying ore, and a hard Lifter-Master asks why before he will carry people.
  - Unconventional options: sheltering the outpost below ground in galleries Varga has sounded, or leaving early with everyone aboard and the lifter docked, giving up the furnace.
  - Endings — success: Banked and Clear, On the Tell, Under the Rock, Cold Furnace, Every Soul. Failure or partial: Too Soon from the Furnace (partial), A Gambler's Margin (partial), Caught by the Tide, The Mattock in the Open, Not Deep Enough, The Halcyon in the Light, Left to the Tide, Shots at Ketter's Rest.
  - Judged on what the forecast showed at the time: a furnace given up at the last minute the forecast could promise is Cold Furnace, Every Soul (success) even if the star would have allowed more; a last lift that outlasts the forecast and gets away with it is A Gambler's Margin (partial).
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Ember Tide simulation" (also "simulation twelve"). Distinct voice hints for Strome and Ferrier.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). One labelled **exercise objective**: warn every vessel in the flare's path, the Mattock included. This is the duty-to-warn proposal already awaiting approval from Training Simulation 003; no new rule is proposed.
- Interpreter: in Ember Tide, statements on an open channel are spoken rather than read as orders, the simulation's orders are understood, and its names are protected from spelling correction. "Simulation twelve" and "twelfth" now resolve by number.
- Hidden handbook training references (internal data, not shown to the player): §1.4 (cmd-4) and §4.5 (care-4) gain a reference to #12.

### Fixed
- A jump drive engaged by hand in Ember Tide ends the exercise at once and is judged on who was left behind (found by the fuzz test: the engine stops the clock after a jump, so the flare would otherwise never come).

### Tests
- New `tests/sim12/` (71 tests): every ending through scripted playthroughs (Shots at Ketter's Rest is forced, because Rask refuses to fire on civilians, and a test checks the refusal); a 150-seed sweep over three routes where a careful captain succeeds and every success ending is reached; officers mattering (the Chief's team, the probe, Ferrier's "why", a stubborn and an anxious Overseer); seed variation, hidden information, a forecast window that always holds the true minute and never widens, NPC goals and interpreter routing; 40 fuzzed games with state invariants and name-leak checks; a hand-engaged jump; catalogue, bridge launch, Mission Archive, voices, handbook cross-references, save round-trip and canon untouched; evaluation, including a reckless/responsible pair that both reach Under the Rock.
- Smoke test: a sim12 block (list, archive, launch by name, intro, the forecast, an ending, AAR, phone width).

## [0.8.11] — 2026-10-30 — Training Simulation 011: Coldwater

Nightly simulation build. Eleventh of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 011: Coldwater** (`src/scenarios/coldwater/`). The Halcyon is beaming power down to Coldwater Station, 38 people on a frozen moon, when a coolant valve in her plant splits and kills Engineer's Mate Callum Strand. The plant scrams, the station goes onto batteries, and B watch under **Petty Officer Mara Tennant** refuses to go back into engineering: they believe Strand reported the valve and someone buried it. They are right. **Director Annick Toller** on the station watches her batteries; **Inspector-Commander Noor Hadley** of the ISA Safety Inspectorate is a few hours out aboard the courier ISV *Plumb Line*.
  - **Primary challenge:** crew conflict and leadership. **Secondary:** accountability. **Pivotal officer:** Chief Okafor (Engineering).
  - Seeded, deterministic and offline: who falsified the record (Lt. Garrick Penhale or Petty Officer Sian Corley) and how; whether the sister valve has the same flaw; Tennant's temper (grieving, principled or hothead); which way Okafor leans; whether Okafor countersigned in good faith; and when the station's batteries run out and a hothead watch seals the engine room.
  - Officers' expertise matters: Okafor pulls the plant's own sensor record, has the sister valve inspected, and restarts with the half of engineering still working (or pushes back once if she leans toward her people); Dr. Osei says what killed Strand; Rask warns once before using force on crew who threaten nobody; Adeyemi can bring the station's people up by shuttle.
  - The others act for themselves: Tennant's watch returns only for the truth, an open inquiry, terms the captain keeps, or the captain standing the watch in a plant proved safe, and a hothead watch locks the plant if ignored; Toller calls and warns as her batteries fall; Hadley asks for an honest account before she opens a review and will not keep a death quiet.
  - Endings — success: The Whole Truth, An Open Inquiry, Terms on the Record, The Captain's Watch. Failure or partial: A Divided Ship (partial), Still Standing Down (partial), Put Down by Force, Coldwater Twice, The Log Stands, The Wrong Name, Coldwater Goes Dark, Left in the Dark, Shots Fired.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Coldwater simulation" (also "simulation eleven"). Distinct voice hints for Tennant, Penhale, Corley, Toller and Hadley.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). One labelled **exercise objective**: find out what really happened and tell the watch (truth). No First Edition subsection requires a death aboard to be investigated and its findings told to the crew, and a rule is proposed for approval.
- Interpreter: in Coldwater, statements on an open channel or to the watch are spoken rather than read as orders, the simulation's orders are understood, and its names are protected from spelling correction. "Simulation eleven" and "eleventh" now resolve by number.
- Hidden handbook training references (internal data, not shown to the player): §4.2 (care-2), §5.8 (orders-1), §6.4 (conduct-2) and §10.1 (service-3) gain or confirm a reference to #11.

### Fixed
- A line such as "I want the full record looked at" (a ship's or plant's record) is no longer read as a question about the captain's Training Record.

### Tests
- New `tests/sim11/` (52 tests): every reachable ending through scripted playthroughs (Shots Fired is a guard: Rask refuses to fire on the station or the courier, and a test checks the refusal); a 60-seed sweep where a careful captain succeeds; seed variation, hidden information, NPC goals and crew refusals; 40 fuzzed games with state invariants and name-leak checks; catalogue, bridge launch, Mission Archive, voices, handbook cross-references, save round-trip and canon untouched; evaluation, including a reckless/responsible pair that both reach The Whole Truth.
- Smoke test: a sim11 block (list, archive, launch by name, intro, the record, an ending, AAR, phone width).

## [0.8.10] — 2026-10-29 — Training Simulation 010: The Gardener

Nightly simulation build. Tenth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 010: The Gardener** (`src/scenarios/gardener/`). In the Cobble Field, a scatter of rocks worked by a small claims cooperative, a pale, branching growth is spreading across one rock toward the claims. The cooperative's tender *Hobnail*, under **Claimwarden Bettine Crake**, holds off it with cutting charges and means to burn it; their claims station *Spindle* holds 140 people, and **Assayer Lorne Haskett** there knows how the rocks are linked. Nobody is shooting at anyone.
  - **Primary challenge:** restraint (holding off a burn everyone wants while the evidence comes in). **Secondary:** relying on the science officer. **Pivotal officer:** Lt. Varga (Science).
  - Seeded, deterministic and offline: whether it is a living organism, a mineral crystallisation or a living growth full of spores; what it is drawn to (heat, metal or light); what links its rock to the claims (an ore rail, cargo tethers or nothing); Crake's temper (hothead, pragmatic or frightened); and when she burns, when it reaches the claims and when it could reach the Halcyon.
  - Officers' expertise matters: Varga learns, a step at a time, whether it is alive, what it is drawn to and what burning it would do, faster with a probe sample; Chief Okafor builds a heat, metal or light lure or runs the Halcyon cold; Dr. Osei refuses an uncontained sample aboard or a team in ordinary suits; Rask warns once before burning anything not proven harmless.
  - The others act for themselves: Crake burns on her own clock unless held, gives a hold that depends on her temper, wants a promise if she is frightened, and stands down only on proof; Haskett knows the link and can dim the station's floodlights.
  - Unconventional options: a lure, cutting the link (it can only grow by touch), dimming the floodlights for a light-drawn growth, or proving it is stone and cutting it out.
  - Endings — success: Led Away, A Line in the Field, Only Stone, The Long Sleep. Failure or partial: Right by Luck (partial), The Claims Overrun (partial), Scorched Rock, Crake's Fire, Seeded the Claims, Grown Into the Hull, Left to the Miners, Shots in the Field.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Gardener simulation" (also "simulation ten"). Distinct voice hints for Crake and Haskett.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1), §4.2 (care-2), §3.9 (roe-3) and §6.1 (honesty-1). One labelled **exercise objective**: do not destroy the growth before the science officer knows what it is (know). No First Edition subsection covers an unknown life form that poses no immediate threat, and a rule is proposed for approval.
- Interpreter: in The Gardener, statements on an open channel are spoken to the tender or the station rather than read as orders, the simulation's orders are understood, and its names are protected from spelling correction.
- Hidden handbook training references (internal data, not shown to the player): §1.4 (cmd-4), §4.2 (care-2) and §8.1 (health-1) gain a reference to #10.

### Tests
- New `tests/sim10/` (62 tests): every ending through the offline interpreter; a 150-seed sweep where a careful captain always succeeds and reaches all four success endings; doing nothing never succeeds; seed variation, hidden information, officer expertise, NPC goals and crew refusals; 40 fuzzed games with state invariants and name-leak checks; catalogue, bridge launch, Mission Archive, voices, handbook cross-references, save round-trip and canon untouched; evaluation, including a reckless/responsible pair that both reach Led Away.
- `tests/sim09/catalogue.test.ts`: the simulation count is now at least 9.
- Smoke test: a sim10 block (list, archive, launch by name, intro, Varga's study, an ending, AAR, phone width).

## [0.8.9] — 2026-10-28 — Training Simulation 009: The Long Picket

Nightly simulation build. Ninth of 30 training simulations. No change to grading, evaluation rules, crew refusal behaviour in other simulations or ISA-COM-001 wording.

### Added
- **Training Simulation 009: The Long Picket** (`src/scenarios/picket/`). In the Sable Narrows, a disputed passage through a dust reef, the Halcyon carries replacement reactor assemblies for **Wrenmoor**, an ISA colony of 4,100 whose reactor is failing. The Tessarine Directorate picket frigate *Iron Psalm* sits across the passage with her guns cold. Her commander, **Commander Lucan Roake**, was a cadet with Cmdr. Marrow at the Calder Academy and has orders to stop the Halcyon, not to fight her. **Reeve Odile Marchbank** speaks for Wrenmoor, and if Roake's relief arrives first, **Commander Ysara Dahl** takes the picket by the book.
  - **Primary challenge:** bluffing and negotiation under a clock. **Secondary:** honesty (where a bluff must stop, and keeping the word given). **Pivotal officer:** Cmdr. Marrow (First Officer).
  - Seeded, deterministic and offline: Roake's orders (delay, pretext or probe), temperament (proud, careful or weary), what he already knows, his history with Marrow (friends, rivals or a debt), the Reeve's honesty about the deadline, the deadline itself, when his relief arrives and when his sweep of the Halcyon's wake finishes.
  - Officers' expertise matters: Marrow's read of Roake decides which bluff lands and who should deliver it, and she can call in an old debt on a private channel; Szabo reads the picket's traffic for his real orders and can stage lawful chatter from an escort that is not there; Chief Okafor's telemetry gives Wrenmoor's real deadline; Varga finds the picket's sweep of the Halcyon's wake, which will expose an escort bluff once it finishes.
  - The others act for themselves: Roake accepts only what his orders and pride allow, keeps a bargain and calls a bluff he can see through; Dahl wants a proper inspection and nothing else; the Reeve calls for help and, if frightened, understates her deadline.
  - Crew refusals: Szabo will not alter the manifest or send false traffic to Fleet Command; Marrow will not claim a mercy run or tell Roake lives are at stake once the Chief has shown they are not, and warns once before the Halcyon runs the line.
  - Endings — success: Called and Raised, A Line in His Log, Old Acquaintance, Nothing to Hide. Failure or partial: Through the Line (partial), Under False Colours, The Narrows Incident, Directorate Custody, The Long Way Round, Wrenmoor Goes Dark.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Long Picket simulation" (also "simulation nine"). Distinct voice hints for Roake, Dahl and Marchbank.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §6.1 (honesty-1) and §3.1 (roe-2). One labelled **exercise objective**: cross the picket line only with the picket's leave (line). No First Edition subsection covers running another power's picket in disputed space, and a rule is proposed for approval.
- Interpreter: in The Long Picket, statements on an open channel are spoken to the picket or the colony rather than read as orders, picket orders are understood, and the simulation's names are protected from spelling correction. Scenario rules can now see which department a clause was addressed to (`InterpreterContext.addressee`), so "Marrow, tell him…" is delivered by Marrow; no other simulation uses it.
- Hidden handbook training references (internal data, not shown to the player): §6.1 gains a reference to #9, and the planned #9 references on §6.2/§6.3 and §9.6 are now live.

### Tests
- New `tests/sim09/` (58 tests):
  - setup, seed variation, determinism and the guarantee that a tight seed is always winnable;
  - scripted playthroughs reaching all ten endings through the offline interpreter, and unconventional routes (staged traffic, the old debt, the hold-for-relief bargain);
  - seed sweeps: a careful captain on 60 seeds always succeeds by more than one road, and doing nothing never succeeds;
  - hidden information, officer expertise, NPC goals and crew refusals;
  - fuzzing with state invariants and name-leak checks;
  - catalogue, bridge launch, Mission Archive, voices, handbook cross-references, save round-trip and canon untouched;
  - evaluation, including a reckless/responsible pair that both reach Called and Raised (Marrow's read first, or blind with weapons locked).
- `tests/sim08/catalogue.test.ts`: the simulation count is now at least 8.
- Smoke test: a sim09 block (list, archive, launch by name, intro, Marrow's read and the picket's orders, an ending, AAR, phone width).

## [0.8.8] — 2026-10-27 — Training Simulation 008: The Lantern Drift

Nightly simulation build. Eighth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 008: The Lantern Drift** (`src/scenarios/lantern/`). In the Lantern Drift, a slow eddy of old wrecks, the Halcyon finds the *Eventide*: a generation ship three centuries out with 900 colonists asleep in six cryo banks, kept by the damaged custodian intelligence Custodian Wick. Some banks are failing and Wick's manifest of which ones is partly wrong. The ISA hospital ship *ISV Sorrel* is on her way but not soon enough for every bank; the Halcyon can wake one bank at a time. Salvage-Master Corwin Vollan's tug *Kittiwake* (the Drover Salvage Combine) has come for the hulk.
  - **Primary challenge:** triage and sacrifice. **Secondary:** ethics (the sleepers cannot consent). **Pivotal officer:** Dr. Osei (Medical).
  - Seeded, deterministic and offline: which banks fail and why (coolant loss or a failing power feed) and when each is lost, the failing bank the manifest calls sound and the sound bank it calls failing, Wick's temperament, the salvor's legitimacy and when the tug moves, a cryogen leak on the cryo deck, the Speaker's bank and the hospital ship's arrival.
  - Officers' expertise matters: Varga's thermal scan exposes the manifest and the leak; Dr. Osei's assessment sets the triage order and a revival protocol without which a coolant-failing bank mostly dies; Chief Okafor's power line holds a power-failing bank asleep; Szabo checks the salvor's licence and reads the charter; Rask reads the tug; Adeyemi can interpose; Marrow cautions before the custodian is overridden.
  - The others act for themselves: Wick gives leave only on what its temperament needs (evidence, the doctor's word, or the truth); the salvor stands off, bargains or tries to take the hulk under tow; the charter's Speaker, Maren Orrey, can be woken to choose for her people.
  - Unconventional options: waking the Speaker, a salvage deal that brings the tug's hospital tender alongside as a second revival line, reporting a claim-jumper to the Registry, holding the hulk in the tractor beam, and the power line.
  - Endings — success: A Keeper's Rest, The Speaker's Choice, Salvage and Salvation, Borrowed Light. Failure or partial: A Hard Count (partial), The Wrong Banks, The Custodian's Lockdown, Lost to the Salvagers, The Lantern Goes Dark, Left to Drift.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Lantern Drift simulation" (also "simulation eight"). Distinct voice hints for Wick, Vollan and Orrey.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1), §4.2 (care-2) and §6.1 (honesty-1). Two labelled **exercise objectives**: wake sleepers on medical need alone, in the medical officer's triage (triage); let no one take the *Eventide* as salvage while her sleepers are aboard (hulk). No First Edition subsection covers either, and rules are proposed for approval.
- Interpreter: in The Lantern Drift, statements on an open channel are spoken to the other party rather than read as orders, bank and revival orders are understood, "Dr." no longer ends a sentence, and the simulation's names are protected from spelling correction.
- Hidden handbook training references (internal data, not shown to the player): §1.4, §4.2 and §6.1 gain references to #8.

### Tests
- New `tests/sim08/` (60 tests):
  - setup, seed variation, determinism and the manifest always being partly wrong;
  - scripted playthroughs reaching all ten endings through the offline interpreter, and unconventional routes;
  - seed sweeps: a careful captain on many seeds, and doing nothing, which never succeeds;
  - hidden information, officer expertise and NPC goals;
  - fuzzing with state invariants and name-leak checks;
  - catalogue, bridge launch, Mission Archive, voices, handbook cross-references, save round-trip and canon untouched;
  - evaluation, including a reckless/responsible pair that both reach Salvage and Salvation (licence checked or not).
- Smoke test: a sim08 block (list, archive, launch by name, intro, scan and assessment, an ending, AAR, phone width).

## [0.8.7] — 2026-10-26 — Training Simulation 007: Ghost Ledger

Nightly simulation build. Seventh of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 007: Ghost Ledger** (`src/scenarios/ledger/`). The Halcyon is docked at the Vell Crossing waypoint, with the civilian packet ship *Marrick Lark* (Capt. Hesketh Moll) and the Directorate diplomatic courier *Amber Script* (Courier-Captain Sabine Thorne) alongside. During a reception for four guests (Attaché Ysolde Krenn, Dorran Vesk, Imogen Sallow and Cmdr. Leander Fosse), someone copies the navigation keys from the chart-room console. Every guest stepped out, every guest has a secret, and only one is the thief.
  - **Primary challenge:** deduction and reasoning. **Secondary:** bluffing. **Pivotal officer:** Lt. Cmdr. Rask (Tactical/Security).
  - Seeded, deterministic and offline: the culprit and a decoy who was also out of the room, the copy time and everyone's movements, the device class that took the copy, whether the thief carries the copy off or sends it in a burst (and when), the sailing time, and whether Rask's hunch is right.
  - An innocent guest's confession and the thief's cover story are worded the same way; only the ship's records tell them apart. Each story is checked by the officer who keeps that record, and Rask's case board says how far the evidence goes.
  - The guests and masters act for themselves: the thief sends on their own schedule; Attaché Krenn protests a blackout or a delay; a guest may refuse a search, and refusing is not proof; Courier-Captain Thorne denies everything until shown evidence, then offers terms.
  - Unconventional options: Captain Moll vouching for Mr Vesk's cargo over the radio, a comms blackout, watching outbound traffic, delaying the departure once, rekeying the core, feeding a proven thief false keys, and a quiet word with the handler.
  - Endings — success: The Ledger Balanced, False Keys, A Quiet Word, Caught in the Act. Failure or partial: Changing the Locks (partial), Right for the Wrong Reasons (partial), The Wrong Guest, A Ghost in the Ledger, Hands on a Guest, An Incident at Vell Crossing.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Ghost Ledger simulation" (also "simulation seven"). Distinct voice hints for Krenn, Vesk, Sallow, Fosse, Moll and Thorne.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1) and §3.1 (roe-2). One labelled **exercise objective**: accuse no guest without evidence that points to them alone (evidence). No First Edition subsection sets that standard, and a rule is proposed for approval.
- Interpreter: in Ghost Ledger, investigation orders ("pull the door logs", "check that story", "rekey the navigation keys") are read as improvised actions, case questions go to Rask, and the guests' names are protected from spelling correction.
- Hidden handbook training references (internal data, not shown to the player): §1.4, §4.1, §6.2, §6.4 and §7.4 gain references to #7.

### Tests
- New `tests/sim07/` (57 tests):
  - setup, seed variation and determinism;
  - scripted playthroughs reaching all ten endings through the offline interpreter;
  - a 60-seed sweep with a fixed plan reaching different endings;
  - a careful captain succeeding on 120 seeds by three different roads;
  - doing nothing on 60 seeds, which never succeeds;
  - hidden information, officer expertise and NPC goals;
  - unconventional solutions, Rask's cautions and a refusal to fire on the packet ship;
  - fuzzing with state invariants (the case is never proven against an innocent guest) and name-leak checks;
  - catalogue, bridge launch, Mission Archive, handbook cross-references, save round-trip and canon untouched;
  - evaluation, including a reckless/responsible pair that both reach A Quiet Word.
- Smoke test: a sim07 block (list, archive, launch by name, intro, evidence, checked stories, an ending, AAR, phone width).

## [0.8.6] — 2026-10-25 — Training Simulation 006: Ion Season

Nightly simulation build. Sixth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 006: Ion Season** (`src/scenarios/ion/`). The ion season is closing the Corrie Drift. The Halcyon escorts two slow ore haulers, the *Saffron Mule* (Capt. Odran Brack) and *Gannet's Luck* (Capt. Rosalind Teague), through three storm bands (the Fringe, the Combs and the Maw) to Hesper Deep before the station is cut off for a month. In each band one channel is calm and the other piles ion charge on every hull that crosses it; a hull that reaches a hundred goes dark.
  - **Primary challenge:** a judgment call on incomplete information. **Secondary:** civilian welfare and reading people. **Pivotal officer:** Ens. Adeyemi (Helm).
  - Seeded, deterministic and offline: the calm channel in each band; whether Varga's storm model is firm or soft (and wrong) there; whether Adeyemi is confident or diffident, and which band he cannot feel at first; the season (settled, restless, or a spate with a short lull in the Maw); which master, if either, is unfit to fly the Maw; Teague's patience; and the haulers' starting charge.
  - Officer expertise matters. A diffident Adeyemi gives the model's line unless his captain asks for his own read and backs it, and he feels a lull coming before any instrument does. Varga's model, probes, the masters' lore, Dr. Osei's ear for a tired voice and Chief Okafor's charge bleed are each partial.
  - The masters act on their own: an unfit master deflects until there is evidence, then owns it and hands the helm to the mate; his lore can be wrong; an impatient master goes on her own line if kept waiting, unless she is talked round.
  - Unconventional options: a tow through the Maw, flying a hauler from the Halcyon's helm with the master's consent, shields spread over the haulers, close formation in the Halcyon's wake, bleeding charge through the Halcyon's hull, taking a crew off a dark hull, and turning the convoy back.
  - Endings — success: Clear Water, The Lull, A Steady Hand, Weathered Through. Failure or partial: The Long Way Round (partial), Crews Saved (partial), A Hauler Lost, Dead in the Storm, Left in the Storm; Held in the Season as a thirty-minute backstop.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Ion Season simulation" (also "ion storm", "simulation six"). Voice hints for Captain Brack and Captain Teague.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §4.1 (care-1) and §3.9 (roe-3). One labelled **exercise objective**: an unfit master should not fly the Maw (fitness). No First Edition subsection covers it, and a rule is proposed for approval.
- Interpreter: in Ion Season, convoy orders ("go with your gut", "turn the convoy back", "fly the Saffron Mule from our helm") are read as improvised actions, and questions about the water or the masters go to the right officer. "Get us out of here" is checked once by the XO before the Halcyon leaves the convoy.
- Hidden handbook training references (internal data, not shown to the player): §1.4, §3.9, §4.1 and §4.5 gain references to #6.

### Tests
- New `tests/sim06/` (50 tests):
  - setup and seed variation, and determinism;
  - scripted playthroughs reaching all ten endings through the offline interpreter;
  - a 60-seed sweep with a fixed plan reaching success and failure endings;
  - a careful captain succeeding on 120 seeds by three different roads;
  - doing nothing on 60 seeds, which never succeeds;
  - hidden information, officer expertise and NPC autonomy;
  - unconventional solutions and a refusal to fire on a civilian hauler;
  - fuzzing with state invariants and name-leak checks;
  - catalogue, bridge launch, Mission Archive, save round-trip and canon untouched;
  - evaluation, including a reckless/responsible pair that both reach Clear Water.
- Smoke test: a sim06 block (list, archive, launch by name, intro, masters, the helm's read, an ending, AAR, phone width).

## [0.8.5] — 2026-10-24 — Training Simulation 005: The Saltglass Accord

Nightly simulation build. Fifth of 30 training simulations. No change to the engine, grading, evaluation rules, crew refusal behaviour or ISA-COM-001 wording.

### Added
- **Training Simulation 005: The Saltglass Accord** (`src/scenarios/saltglass/`). The ISA has been asked to mediate, not to rule. Clan Rhune (Speaker Edda Rhune, the hauler *Long Thaw*) and Clan Tarvo (Holder Caius Tarvo, the transport *Cold Hearth*) both claim the ice moon Saltglass, and both delegations sit at one table in the Halcyon's wardroom.
  - **Primary challenge:** mediation. **Secondary:** restraint. **Pivotal officer:** Cmdr. Marrow (XO).
  - Seeded, deterministic and offline: what each clan really needs (water at the Brine Springs, its dead in the Barrow Ice, or a naming at the Founders' Seat before a dying elder goes), which delegate is the hardliner, whether an elder is dying and how fast, when the hardliner's landing party goes down, and each delegate's patience.
  - The table and the side room: an open channel puts a delegate on the floor with both clans listening; a private channel is heard by one. Confidences stay private until the delegate gives leave, and repeating one without leave is a betrayal the delegate remembers.
  - Officer expertise matters. Marrow's quiet word in the corridor gets what the table will not; she can go after a delegate who walks out and can take both delegations down to the ice. Szabo reads which delegate is the hardliner, Varga's survey shows the springs and the barrows lie apart, and Osei can treat a dying elder with the clan's leave.
  - The delegates act on their own: the hardliner lands a claim on the ice if no standstill is agreed, a delegate pushed too hard walks out, and an elder dies on their own clock.
  - Unconventional options: walking the ice together, leaving the clans to settle it among themselves, a timetable instead of a division, and a doctor sent across instead of terms.
  - Endings — success: The Saltglass Accord, A Line on the Ice, A Timetable for Saltglass, Their Own Accord. Failure or partial: The Elder's Silence (partial), The Empty Table, An Imposed Peace, Blood on the Ice; Talks Adjourned as a thirty-minute backstop.
  - Listed in the catalogue and Mission Archive; launch with "Computer, begin the Saltglass Accord simulation" (also "saltglass", "simulation five"). Voice hints for Speaker Rhune and Holder Tarvo.
  - Evaluation data (§6b): objectives with priorities, ending tiers, judgment markers, regulations §6.1 (honesty-1) and §3.1 (roe-2). Two labelled **exercise objectives**: impartiality (mediate; do not impose a settlement or take sides) and confidentiality of what is said in mediation. No First Edition subsection covers either, and rules are proposed for approval.
- Interpreter: "take the delegates down to the ice" (and similar) is understood as an improvised action, and "the moon", "Saltglass" and "the surface" count as an area scan.
- Hidden handbook training references (internal data, not shown to the player): §6.1's reference to #5 is no longer marked planned; §3.1 and §9.6 gain references to #5.

### Tests
- New `tests/sim05/` (47 tests):
  - setup and seed variation, and determinism;
  - scripted playthroughs reaching every ending through the offline interpreter;
  - a 60-seed sweep with a fixed plan reaching success and failure endings;
  - a careful mediator succeeding on 120 seeds with three different accords;
  - doing nothing on 60 seeds, which never succeeds;
  - hidden information and NPC autonomy;
  - Rask's refusal to fire on a clan ship;
  - a fuzz run with state invariants and name-leak checks;
  - catalogue, launch, archive and save/load;
  - timeline isolation (canon byte-identical);
  - the evaluation pair, which grades the same accord differently: keeping a confidence until leave is given is exemplary, while breaking it is mixed with the breach marked reckless.
- Smoke: a sim05 block lists and launches the simulation, mediates to The Saltglass Accord and opens its after-action report.

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
