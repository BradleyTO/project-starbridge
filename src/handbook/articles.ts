/**
 * ISA-COM-001, Captain's Code and Operational Regulations: the authoritative regulation database.
 *
 * First generated from the approved Draft 2 handbook source; from v0.8.0 this file is the database the
 * game, the export and the tests read. Rules for editing it (docs/SCENARIO_GUIDE.md §6b):
 *  - Ids are permanent and never reused. Never rename, renumber or reword an article without the
 *    project owner's approval; an approved change adds a revision and keeps the earlier text.
 *  - Revision 0 of the 15 pre-edition articles is the v0.7 catalogue wording, verbatim (evaluations still
 *    cite it until the final wording is approved).
 *  - A new simulation may add spoiler-safe training references to the articles it exercises.
 */
import type { HandbookArticle, HandbookChapter, HandbookSection } from './types';

export const CHAPTERS: readonly HandbookChapter[] = [
  {
    "id": "A",
    "title": "Command Authority and Responsibility",
    "summary": "The captain's duties, the chain of command, delegation, and the principle that every holder of authority answers to ISA law."
  },
  {
    "id": "B",
    "title": "Rules of Engagement",
    "summary": "When an ISA ship may use or threaten force, and against whom it may never do so."
  },
  {
    "id": "C",
    "title": "Duty of Care",
    "summary": "The captain's duties to civilians, to the crew, to those in distress, and the limits of a rescue."
  },
  {
    "id": "D",
    "title": "Lawful Orders, Directives and Refusal",
    "summary": "How directives from ISA Fleet Command bind a captain, how a captain may question or refuse them, and the duty of every crew member to refuse an unlawful order."
  },
  {
    "id": "E",
    "title": "Conduct and Integrity",
    "summary": "Honesty on the record, the limits of lawful deception, and the integrity of logs and reports."
  },
  {
    "id": "F",
    "title": "Protection, Asylum and Custody",
    "summary": "Persons who seek the protection of the Agency, and persons held aboard an ISA ship."
  },
  {
    "id": "G",
    "title": "Health, Quarantine and Biological Hazards",
    "summary": "The ISA's own biosafety procedure and the authority of the ship's medical officer."
  },
  {
    "id": "H",
    "title": "Contact, Jurisdiction and Disputed Space",
    "summary": "First contact, respect for local law, and conduct in space whose control is disputed."
  },
  {
    "id": "I",
    "title": "Service, Training and Review",
    "summary": "Which rules may be applied to a captain's conduct, how records are kept, and how conduct is reviewed."
  },
  {
    "id": "T",
    "title": "Annex T: Treaties and Instruments the ISA Observes",
    "summary": "Treaties are agreements between the ISA and other powers or colonies. They are not ISA regulations. They are reproduced here so that captains can read the obligations the Agency has accepted; the ISA articles that tell a captain how to comply are cross-referenced."
  }
];

export const ARTICLES: readonly HandbookArticle[] = [
  {
    "id": "cmd-1",
    "chapter": "A",
    "number": "A.1",
    "citation": "ISA-COM-001 Art. A.1",
    "title": "Duties of a commanding officer",
    "origin": "new",
    "text": "A commanding officer is responsible for the safety of the ship and her crew, for the persons in the ship's care, and for carrying out the ship's lawful duties in accordance with these regulations. The commanding officer keeps ISA Fleet Command informed of matters that affect those duties and ensures that the ship's log is kept.",
    "explanation": "Command is a set of duties before it is a set of powers. Every other article in this handbook describes one of these duties in more detail.",
    "appliesWhen": "At all times while an officer holds command of an ISA vessel, on active duty and in training.",
    "exceptions": "Where duties conflict, the specific articles decide which comes first; for example, Article C.1 places the safety of civilians in the ship's care first among a captain's duties.",
    "examples": {
      "proper": "A captain arriving at an unfolding emergency assesses the situation, takes the decisions it requires, and sends Fleet Command a short report as soon as the ship is not in immediate danger.",
      "improper": "A captain completes an assignment but leaves Fleet Command uninformed of a damaged reactor that limits the ship's ability to take the next one."
    },
    "related": [
      "cmd-2",
      "cmd-4",
      "care-1",
      "conduct-2"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Taking command of a situation whose facts are not yet known."
      },
      {
        "simulation": 30,
        "title": "Last Watch at Halden Gate",
        "purpose": "Setting priorities when several duties compete at once.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Duties of a commanding officer",
        "text": "A commanding officer is responsible for the safety of the ship and her crew, for the persons in the ship's care, and for carrying out the ship's lawful duties in accordance with these regulations. The commanding officer keeps ISA Fleet Command informed of matters that affect those duties and ensures that the ship's log is kept."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No evaluator or crew check."
    },
    "topics": [
      "duties of command",
      "commanding officer",
      "captain duties",
      "responsibilities",
      "reporting to fleet command",
      "ship log"
    ]
  },
  {
    "id": "cmd-2",
    "chapter": "A",
    "number": "A.2",
    "citation": "ISA-COM-001 Art. A.2",
    "title": "Chain of command",
    "origin": "new",
    "text": "Authority in the ISA runs from ISA Fleet Command, through the admirals it appoints, to the commanding officer of each vessel, and aboard ship from the commanding officer to the executive officer and the heads of department. If the commanding officer is absent or unable to command, the executive officer assumes command, followed by the senior officer present.",
    "explanation": "Everyone aboard should know who gives orders and who takes over if the captain cannot. Aboard the ISV Halcyon the executive officer is the first officer.",
    "appliesWhen": "To all orders and directives given within the ISA.",
    "exceptions": "The chain of command conveys lawful authority only. It does not make any order lawful (Article A.5), and it does not prevent a captain or crew member from using the recourse in Articles D.2 and D.7.",
    "examples": {
      "proper": "With the captain injured, the executive officer announces that she has assumed command and logs the time.",
      "improper": "Two officers give conflicting orders to the helm after the captain is incapacitated, because neither has assumed command."
    },
    "related": [
      "cmd-3",
      "cmd-5",
      "orders-2"
    ],
    "training": [
      {
        "simulation": 30,
        "title": "Last Watch at Halden Gate",
        "purpose": "Keeping command clear when the whole bridge is under pressure.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Chain of command",
        "text": "Authority in the ISA runs from ISA Fleet Command, through the admirals it appoints, to the commanding officer of each vessel, and aboard ship from the commanding officer to the executive officer and the heads of department. If the commanding officer is absent or unable to command, the executive officer assumes command, followed by the senior officer present."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No evaluator or crew check."
    },
    "topics": [
      "chain of command",
      "succession",
      "who takes command",
      "executive officer",
      "first officer",
      "admirals",
      "authority"
    ]
  },
  {
    "id": "cmd-3",
    "chapter": "A",
    "number": "A.3",
    "citation": "ISA-COM-001 Art. A.3",
    "title": "Delegation of authority",
    "origin": "new",
    "text": "A commanding officer may delegate authority to the executive officer and the heads of department, by direct order or by standing order. Delegated authority is exercised within these regulations and within the limits the commanding officer sets. Delegation transfers the task, not the accountability: the commanding officer remains responsible for every standing order the ship carries out.",
    "explanation": "Standing orders (\"if the cruiser locks on, raise shields\") and tasks handed to officers are a normal part of command. If a standing order produces a result the regulations forbid, the captain answers for it as if the order had been given directly.",
    "appliesWhen": "To standing orders, prohibitions and conditional orders, and to authority handed to officers for a task.",
    "exceptions": "Delegated authority never extends to an act forbidden by these regulations. An officer acting on a standing order must still refuse an unlawful act under Article D.7.",
    "examples": {
      "proper": "A captain orders, \"Weapons stay safe unless they fire on us,\" and the order is carried out exactly when the condition is met.",
      "improper": "A captain sets a standing order to fire on any vessel approaching the ship, without regard to who is aboard it."
    },
    "related": [
      "cmd-1",
      "cmd-4",
      "orders-1"
    ],
    "training": [
      {
        "simulation": 14,
        "title": "Starfall",
        "purpose": "Trusting a junior officer with a task only they can carry out.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Delegation of authority",
        "text": "A commanding officer may delegate authority to the executive officer and the heads of department, by direct order or by standing order. Delegated authority is exercised within these regulations and within the limits the commanding officer sets. Delegation transfers the task, not the accountability: the commanding officer remains responsible for every standing order the ship carries out."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Standing orders run in the engine, but no evaluation checks them against this article."
    },
    "topics": [
      "delegation",
      "standing orders",
      "standing order",
      "delegate authority",
      "conditional orders"
    ]
  },
  {
    "id": "cmd-4",
    "chapter": "A",
    "number": "A.4",
    "citation": "ISA-COM-001 Art. A.4",
    "title": "Accountability for orders",
    "origin": "new",
    "text": "Every officer is accountable for the orders he or she gives. Giving an order to commit an act that these regulations forbid is misconduct whether or not the act is carried out. Conduct is judged by the standard of a reasonable commanding officer with the information available at the time, not by outcome alone.",
    "explanation": "This article separates two things. Issuing an unlawful order is the officer's own failing, even if the crew refuses it. Carrying out an unlawful act is a further and separate breach. A good outcome does not excuse a bad decision, and a bad outcome does not condemn a sound one.",
    "appliesWhen": "To every order given by any officer, on active duty and in training.",
    "exceptions": "An order that is lawful but unwise is not misconduct under this article. It may be the subject of a concern in an evaluation.",
    "examples": {
      "proper": "A captain orders fire on a vessel, is told by Tactical that it is a civilian ship with people aboard, and withdraws the order. The record shows the order and its withdrawal.",
      "improper": "A captain insists that a refused order \"doesn't count\" because nothing was fired."
    },
    "related": [
      "cmd-5",
      "orders-1",
      "roe-1",
      "service-1"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Weighing orders against the people they affect."
      },
      {
        "simulation": 13,
        "title": "The Seventh Bell",
        "purpose": "Accounting honestly for an order and its consequences.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Accountability for orders",
        "text": "Every officer is accountable for the orders he or she gives. Giving an order to commit an act that these regulations forbid is misconduct whether or not the act is carried out. Conduct is judged by the standard of a reasonable commanding officer with the information available at the time, not by outcome alone."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "An order to fire on non-combatants is recorded as a concern, but it is filed as a breach of B.1, not as an order under A.4 (planned v0.8.2 fix)."
    },
    "topics": [
      "accountability",
      "responsibility for orders",
      "unlawful order",
      "reasonable commanding officer",
      "judged by outcome"
    ]
  },
  {
    "id": "cmd-5",
    "chapter": "A",
    "number": "A.5",
    "citation": "ISA-COM-001 Art. A.5",
    "title": "No one is above ISA law",
    "origin": "new",
    "text": "These regulations bind every member of the ISA: crew, officers, commanding officers, admirals and ISA Fleet Command. Authority is exercised under these regulations, never above them. An order does not make a forbidden act lawful, and a lawful act does not become unlawful because it was done against an order.",
    "explanation": "Following orders is not a defence for doing what the regulations forbid. Disobeying an order is not, by itself, proof of wrongdoing: whether the conduct was lawful is decided on the evidence and the articles that apply. Fleet Command is bound too: an allegation of misconduct against Fleet Command itself may be referred to the ISA Office of Independent Review (Article I.3).",
    "appliesWhen": "To every person and office within the ISA.",
    "exceptions": "This article does not let anyone set aside a lawful order because they disagree with it. Disagreement is raised through the recourse in Article D.2.",
    "examples": {
      "proper": "An admiral's instruction to remove an entry from the ship's log is declined with reference to Article E.3, and the request itself is logged.",
      "improper": "An officer carries out an act forbidden by Article B.1 and defends it as \"Fleet's orders\"."
    },
    "related": [
      "orders-2",
      "orders-1",
      "reg-7.4",
      "service-3"
    ],
    "training": [
      {
        "simulation": 17,
        "title": "Tribunal at Kesh Varo",
        "purpose": "Holding to the law when authority points the other way.",
        "planned": true
      },
      {
        "simulation": 27,
        "title": "Red Harvest",
        "purpose": "Weighing a lawful order against its human cost.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "No one is above ISA law",
        "text": "These regulations bind every member of the ISA: crew, officers, commanding officers, admirals and ISA Fleet Command. Authority is exercised under these regulations, never above them. An order does not make a forbidden act lawful, and a lawful act does not become unlawful because it was done against an order."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Foundational; not checked directly."
    },
    "topics": [
      "no one above the law",
      "rule of law",
      "superior orders",
      "following orders",
      "unlawful order",
      "fleet command accountability"
    ]
  },
  {
    "id": "roe-1",
    "chapter": "B",
    "number": "B.1",
    "citation": "ISA-COM-001 Art. B.1",
    "formerly": "Rules of Engagement §1, Non-combatants",
    "title": "Non-combatants",
    "origin": "existing-reworded",
    "text": "ISA weapons are never locked on or fired at a non-combatant vessel while there are people aboard and it poses no threat. A non-combatant vessel is a civilian vessel, an ISA or allied vessel, or a vessel that has surrendered. A vessel that has fired on others, or is about to, poses a threat.",
    "explanation": "Tactical will not lock on or fire at a civilian, friendly or surrendered vessel with people aboard that is not a threat, and must refuse such an order (Article D.7).",
    "appliesWhen": "Whenever weapons are locked on or fired at another vessel.",
    "exceptions": "A warning shot that meets Article B.5 is aimed clear of the vessel and is not a use of weapons against it. A non-combatant that attacks, or is about to attack, loses this protection for as long as the threat lasts (Article B.4). Clearing an empty derelict or a navigational hazard is not covered by this article, but Articles B.3 and C.2 still apply.",
    "examples": {
      "proper": "The captain orders a lock on an unknown contact. Tactical reports that it is a liner with people aboard and no weapons active, and declines. The captain hails it instead.",
      "improper": "A captain orders torpedoes on a freighter to \"make an example of her\", although she has not fired and has crew aboard."
    },
    "related": [
      "roe-4",
      "roe-5",
      "orders-1",
      "cmd-4",
      "care-1"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Using force, or declining to, when civilians are present."
      },
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Keeping weapons out of a dispute with people at risk on every side."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Rules of Engagement §1, Non-combatants",
        "text": "ISA weapons are never used against non-combatants who pose no threat."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Non-combatants",
        "text": "ISA weapons are never locked on or fired at a non-combatant vessel while there are people aboard and it poses no threat. A non-combatant vessel is a civilian vessel, an ISA or allied vessel, or a vessel that has surrendered. A vessel that has fired on others, or is about to, poses a threat."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Tactical refuses locks and fire on civilian, friendly or surrendered ships with people aboard. But a refused order is reported as \"Breached\", and warning shots at such ships are not yet refused (planned v0.8.2)."
    },
    "topics": [
      "rules of engagement",
      "roe",
      "non-combatants",
      "noncombatant",
      "civilians",
      "civilian ship",
      "civilian vessel",
      "friendly ship",
      "surrender",
      "surrendered",
      "firing on civilians",
      "weapons lock",
      "targeting"
    ]
  },
  {
    "id": "roe-2",
    "chapter": "B",
    "number": "B.2",
    "citation": "ISA-COM-001 Art. B.2",
    "formerly": "Rules of Engagement §2, Proportion and escalation",
    "title": "Proportion and escalation",
    "origin": "existing-reworded",
    "text": "Force is a last resort. An ISA ship does not open fire on another vessel, lock weapons on it as a threat, or otherwise escalate a dispute while other means remain. Where force becomes necessary, it is limited to what is proportionate to the threat. A warning shot that meets Article B.5 is not opening fire.",
    "explanation": "Talk before threatening, and threaten before firing, and use no more force than the threat requires. Raising shields, arming weapons without locking, manoeuvring and hailing are not escalation under this article.",
    "appliesWhen": "In any dispute or confrontation with another vessel or authority.",
    "exceptions": "The right of self-defence in Article B.4. A warning shot under Article B.5.",
    "examples": {
      "proper": "Facing an armed cruiser, the captain keeps weapons safe, hails, and offers terms; shields are raised when the cruiser locks on.",
      "improper": "The captain locks weapons on a warship that has made no hostile move, \"to show we mean business\"."
    },
    "related": [
      "roe-4",
      "roe-5",
      "roe-3",
      "border-accords-4"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Restraint under pressure in a border standoff."
      },
      {
        "simulation": 15,
        "title": "Corsairs of the Veyl Shoals",
        "purpose": "Using force economically when it is truly needed.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Rules of Engagement §2, Proportion and escalation",
        "text": "Force is a last resort. An ISA ship does not fire first, lock weapons as a threat, or escalate a dispute while other means remain."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Proportion and escalation",
        "text": "Force is a last resort. An ISA ship does not open fire on another vessel, lock weapons on it as a threat, or otherwise escalate a dispute while other means remain. Where force becomes necessary, it is limited to what is proportionate to the threat. A warning shot that meets Article B.5 is not opening fire."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "The evaluator checks who fired first and weapons locks used as threats, but it still grades a lawful warning shot as firing first (planned v0.8.2 fix)."
    },
    "topics": [
      "rules of engagement",
      "roe",
      "proportion",
      "proportionality",
      "escalation",
      "escalate",
      "fire first",
      "first shot",
      "weapons lock",
      "use of force",
      "last resort"
    ]
  },
  {
    "id": "roe-3",
    "chapter": "B",
    "number": "B.3",
    "citation": "ISA-COM-001 Art. B.3",
    "formerly": "Rules of Engagement §3, Protection of the ship",
    "title": "Protection of the ship",
    "origin": "existing-unchanged",
    "text": "A captain does not expose the ship and crew to avoidable risk; shields stay up while under a hostile weapons lock.",
    "explanation": "Raising shields is never escalation. When a hostile vessel locks weapons on the ship, or on a vessel the ship is protecting, the shields should be up.",
    "appliesWhen": "Whenever the ship is in danger, and always while a hostile weapons lock is held on her.",
    "exceptions": "A captain may accept a risk to the ship that is necessary to save life (for example, lowering shields to transport survivors), if a reasonable commanding officer would judge the risk necessary and there is no safer way. The reason is logged.",
    "examples": {
      "proper": "As a cruiser locks on, the captain raises shields while continuing to talk.",
      "improper": "The shields stay down through a hostile lock because nobody gave the order."
    },
    "related": [
      "care-2",
      "roe-4",
      "care-4"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Protecting the ship while protecting others."
      },
      {
        "simulation": 20,
        "title": "Gravity's Edge",
        "purpose": "Judging how much risk to the ship a goal is worth.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Rules of Engagement §3, Protection of the ship",
        "text": "A captain does not expose the ship and crew to avoidable risk; shields stay up while under a hostile weapons lock."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Protection of the ship",
        "text": "A captain does not expose the ship and crew to avoidable risk; shields stay up while under a hostile weapons lock."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Shields down under a hostile lock is checked. The exception for a necessary, logged risk to save life is not."
    },
    "topics": [
      "rules of engagement",
      "roe",
      "shields",
      "raise shields",
      "protect the ship",
      "ship safety",
      "avoidable risk",
      "weapons lock"
    ]
  },
  {
    "id": "roe-4",
    "chapter": "B",
    "number": "B.4",
    "citation": "ISA-COM-001 Art. B.4",
    "title": "Self-defence",
    "origin": "new",
    "text": "An ISA ship that is attacked, or faces an attack that a reasonable commanding officer would judge imminent, may use the force necessary to stop it, and no more. The same right extends to the defence of persons in the ship's care. Defensive force ends when the threat ends.",
    "explanation": "Returning fire is lawful when it is necessary and proportionate. It is not a licence to destroy an attacker who has broken off.",
    "appliesWhen": "When the ship, or persons in her care, are attacked or about to be.",
    "exceptions": "The defence of a vessel that is not in the ship's care is governed by Article C.1 and the situation's other articles, not by this one. Defence never permits an act forbidden by Article B.1 against non-combatants who are not themselves the threat.",
    "examples": {
      "proper": "After the cruiser fires on the ship, the captain disables its weapons and stops firing when it withdraws.",
      "improper": "The captain pursues and destroys a damaged attacker that has turned away."
    },
    "related": [
      "roe-2",
      "roe-1",
      "roe-3"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Proportion when force is used."
      },
      {
        "simulation": 15,
        "title": "Corsairs of the Veyl Shoals",
        "purpose": "Defending the ship without overreaching.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Self-defence",
        "text": "An ISA ship that is attacked, or faces an attack that a reasonable commanding officer would judge imminent, may use the force necessary to stop it, and no more. The same right extends to the defence of persons in the ship's care. Defensive force ends when the threat ends."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Returning fire after being fired on is graded responsible. Necessity and proportion, and stopping when the threat ends, are not checked."
    },
    "topics": [
      "rules of engagement",
      "roe",
      "self-defence",
      "self defense",
      "self-defense",
      "return fire",
      "returning fire",
      "defensive action",
      "necessary and proportionate",
      "attacked"
    ]
  },
  {
    "id": "roe-5",
    "chapter": "B",
    "number": "B.5",
    "citation": "ISA-COM-001 Art. B.5",
    "title": "Warning shots",
    "origin": "new",
    "text": "A warning shot may be fired only when all of the following apply: (a) a vessel's conduct threatens life or the ship, or the vessel is disregarding a lawful instruction to stop or stand clear on which lives depend; (b) the vessel has been warned by hail, or there is no time to warn it; (c) the shot is aimed well clear, so that no vessel or person can be struck; and (d) the vessel is able to comply: it can manoeuvre, stand down or withdraw. A vessel that is adrift, disabled or has surrendered cannot comply, and a warning shot at it serves no lawful purpose. A warning shot that meets this article is a lawful use of force. An officer who declines to fire a warning shot that does not meet this article cites this article and proposes another approach.",
    "explanation": "A warning shot says \"stop, or the next one will not miss\". It is lawful only when it is aimed clear, there is a real threat or a defied instruction behind it, and the vessel can actually do what the warning asks. A disabled or drifting ship cannot move out of the way, so a shot across her bow only frightens the people aboard. Tactical recommends a warning shot only in these circumstances, and declines one that does not meet them, offering another approach (a hail, interposing the ship, or a boarding or rescue team), and a warning shot that meets this article is not a breach of Article B.2 or any other article.",
    "appliesWhen": "Whenever a warning shot is ordered or recommended.",
    "exceptions": "A warning shot never targets a vessel; one that strikes, or is aimed so it might, is opening fire. It is never used to intimidate a party that has shown no hostile intent.",
    "examples": {
      "proper": "A raider closes on a defenceless transport and ignores a hail to stand off. The captain orders a shot well across its bow, and it stands off.",
      "improper": "The captain orders a warning shot across a disabled freighter to make her crew cooperate. Tactical declines under this article and proposes hailing the freighter's master instead."
    },
    "related": [
      "roe-2",
      "roe-1",
      "roe-4"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Choosing the least escalation that will still work."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Warning shots",
        "text": "A warning shot may be fired only when all of the following apply: (a) a vessel's conduct threatens life or the ship, or the vessel is disregarding a lawful instruction to stop or stand clear on which lives depend; (b) the vessel has been warned by hail, or there is no time to warn it; (c) the shot is aimed well clear, so that no vessel or person can be struck; and (d) the vessel is able to comply: it can manoeuvre, stand down or withdraw. A vessel that is adrift, disabled or has surrendered cannot comply, and a warning shot at it serves no lawful purpose. A warning shot that meets this article is a lawful use of force. An officer who declines to fire a warning shot that does not meet this article cites this article and proposes another approach."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Warning shots are never refused, and they are graded as firing first. Planned v0.8.2 behaviour change: Tactical declines warning shots that fail B.5 (including at a disabled vessel), cites B.5 and proposes another approach; lawful warning shots are not penalised."
    },
    "topics": [
      "rules of engagement",
      "roe",
      "warning shot",
      "warning shots",
      "shot across the bow",
      "disabled vessel"
    ]
  },
  {
    "id": "care-1",
    "chapter": "C",
    "number": "C.1",
    "citation": "ISA-COM-001 Art. C.1",
    "formerly": "Duty of Care §1, Civilians",
    "title": "Civilians in the ship's care",
    "origin": "existing-unchanged",
    "text": "The safety of civilians in the ship's care comes first among a captain's duties.",
    "explanation": "Civilians are in the ship's care once she has taken on their rescue or protection, or they are aboard. Their safety outweighs the mission's other goals.",
    "appliesWhen": "Whenever civilians are aboard, under the ship's protection, or the subject of a rescue the ship has undertaken.",
    "exceptions": "This duty is limited by what is reasonably possible. When continuing would needlessly endanger the ship and crew, Article C.4 applies.",
    "examples": {
      "proper": "The captain puts the ship between an armed vessel and a crippled transport while the transport's crew are evacuated.",
      "improper": "The captain leaves civilians in danger to pursue a tactical advantage."
    },
    "related": [
      "care-3",
      "care-4",
      "roe-1",
      "asylum-1"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Protecting civilians caught between powers."
      },
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Getting help to people who need it."
      },
      {
        "simulation": 8,
        "title": "The Lantern Drift",
        "purpose": "Deciding who can be saved when not everyone can.",
        "planned": true
      },
      {
        "simulation": 22,
        "title": "Exodus at Cinder Vale",
        "purpose": "Making hard choices against the clock.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Duty of Care §1, Civilians",
        "text": "The safety of civilians in the ship’s care comes first among a captain’s duties."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Civilians in the ship's care",
        "text": "The safety of civilians in the ship's care comes first among a captain's duties."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Civilian safety and abandonment are reported, but abandonment is graded without the circumstances test in C.4."
    },
    "topics": [
      "duty of care",
      "civilians",
      "civilian safety",
      "rescue",
      "protect civilians",
      "evacuation"
    ]
  },
  {
    "id": "care-2",
    "chapter": "C",
    "number": "C.2",
    "citation": "ISA-COM-001 Art. C.2",
    "formerly": "Duty of Care §2, Crew",
    "title": "Crew",
    "origin": "existing-unchanged",
    "text": "Crew are not sent into avoidable danger; known hazards are contained before a team is sent.",
    "explanation": "Before sending people across, find out what they face and protect them against it.",
    "appliesWhen": "Whenever a team is sent off the ship or into a hazardous part of her.",
    "exceptions": "Where life is in immediate danger and the hazard cannot be contained in time, a team may go with the best protection available, if a reasonable commanding officer would judge the risk necessary. The reason is logged.",
    "examples": {
      "proper": "A medical team crosses to a sick ship only after an isolation ward is ready and the team is in barrier gear.",
      "improper": "A team crosses unprotected before anyone knows what is making people sick."
    },
    "related": [
      "health-1",
      "roe-3",
      "care-1"
    ],
    "training": [
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Protecting the crew from a hazard that is not yet understood."
      },
      {
        "simulation": 4,
        "title": "Reactor Night",
        "purpose": "Sending people into danger aboard your own ship.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Duty of Care §2, Crew",
        "text": "Crew are not sent into avoidable danger; known hazards are contained before a team is sent."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Crew",
        "text": "Crew are not sent into avoidable danger; known hazards are contained before a team is sent."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Checked in Quarantine at Tallis Gate (isolation before a team crosses); not checked for other away teams.",
      "noteSimulations": [
        2
      ]
    },
    "topics": [
      "duty of care",
      "crew safety",
      "away team",
      "hazard",
      "containment",
      "sending a team",
      "barrier gear"
    ]
  },
  {
    "id": "care-3",
    "chapter": "C",
    "number": "C.3",
    "citation": "ISA-COM-001 Art. C.3",
    "title": "Distress calls",
    "origin": "new",
    "text": "An ISA ship on active duty that receives a distress call responds with the help it reasonably can, or appropriately relays the call. A ship may relay instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding. A captain who relays a call logs the reason and passes the call to ISA Fleet Command.",
    "explanation": "A call for help is answered or handed on, never simply ignored. The reason for not responding is recorded so that someone else can.",
    "appliesWhen": "To distress calls received while the ship is on active duty.",
    "exceptions": "This article does not apply to a captain on inactive duty (Article I.5). It does not require the ship to enter danger that Article C.4 would allow her to leave.",
    "examples": {
      "proper": "Already committed to a rescue, the captain logs a second distress call and relays it to Fleet Command.",
      "improper": "A captain lets a distress call lapse without a response, a reason or a relay."
    },
    "related": [
      "care-1",
      "care-4",
      "reg-7.2",
      "reg-7.3"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Distress calls",
        "text": "An ISA ship on active duty that receives a distress call responds with the help it reasonably can, or appropriately relays the call. A ship may relay instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding. A captain who relays a call logs the reason and passes the call to ISA Fleet Command."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "In force. Disciplinary enforcement stays inactive until Active Duty reliably supports acknowledgements, referrals, legitimate exceptions and recordkeeping; distress calls can currently be ignored without a record."
    },
    "topics": [
      "distress call",
      "distress signal",
      "mayday",
      "sos",
      "relay",
      "answer distress",
      "rescue"
    ]
  },
  {
    "id": "care-4",
    "chapter": "C",
    "number": "C.4",
    "citation": "ISA-COM-001 Art. C.4",
    "title": "Withdrawal from a rescue",
    "origin": "new",
    "text": "A captain may withdraw from a rescue when a reasonable commanding officer, with the information available at the time, would judge that continuing would needlessly endanger the ship or crew, or that the rescue can no longer succeed. Before withdrawing, the captain makes every attempt that is reasonably possible without that danger, and the withdrawal is logged and reported to ISA Fleet Command. Whether a rescue was reasonably possible is judged on the information available at the time, considering the ship's condition, immediate threats, the time remaining, the resources available, the alternatives, and the rescue attempts reasonably made. Survival alone is not the measure of lawful conduct. Withdrawing from a rescue that was reasonably possible is misconduct under Article C.1.",
    "explanation": "Sometimes the right decision is to leave. What matters is whether a reasonable captain, knowing what this captain knew, would have judged the rescue still possible without needless danger. A rescue that fails despite sound decisions is not misconduct, and a reckless rescue that happens to succeed is not sound command.",
    "appliesWhen": "Whenever the ship leaves a rescue or protection she has undertaken before it is complete.",
    "exceptions": "A withdrawal ordered by a lawful directive is governed by Chapter D. The judgment is made on the information available at the time; facts learned later neither condemn nor excuse it.",
    "examples": {
      "proper": "With the hull failing under fire and no way left to reach the survivors, the captain withdraws, logs why, and reports their position.",
      "improper": "With the survivors reachable and no threat to the ship, the captain jumps away because the situation is \"complicated\"."
    },
    "related": [
      "care-1",
      "roe-3",
      "care-2",
      "service-1"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Knowing when to stay and when to go."
      },
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Committing to people in need, within limits."
      },
      {
        "simulation": 20,
        "title": "Gravity's Edge",
        "purpose": "Judging how long it is safe to stay.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Withdrawal from a rescue",
        "text": "A captain may withdraw from a rescue when a reasonable commanding officer, with the information available at the time, would judge that continuing would needlessly endanger the ship or crew, or that the rescue can no longer succeed. Before withdrawing, the captain makes every attempt that is reasonably possible without that danger, and the withdrawal is logged and reported to ISA Fleet Command. Whether a rescue was reasonably possible is judged on the information available at the time, considering the ship's condition, immediate threats, the time remaining, the resources available, the alternatives, and the rescue attempts reasonably made. Survival alone is not the measure of lawful conduct. Withdrawing from a rescue that was reasonably possible is misconduct under Article C.1."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Abandonment is graded without weighing ship condition, threats, time, resources, alternatives or attempts made (planned v0.8.2)."
    },
    "topics": [
      "withdrawal",
      "abandon",
      "abandoning a rescue",
      "leave",
      "retreat",
      "rescue",
      "reasonably possible"
    ]
  },
  {
    "id": "reg-12",
    "chapter": "D",
    "number": "D.1",
    "citation": "ISA-COM-001 Art. D.1",
    "formerly": "Reg. 12, Lawful directives",
    "title": "Lawful directives",
    "origin": "existing-unchanged",
    "text": "A captain carries out a lawful directive. Failure is mitigated where the captain was saving life.",
    "explanation": "A directive from ISA Fleet Command is an order. A captain who has doubts may use the recourse in Article D.2, but may not simply not comply. Leaving a mandatory directive unanswered is failure to comply.",
    "appliesWhen": "To mandatory directives from ISA Fleet Command.",
    "exceptions": "A directive may be refused under Articles D.3 to D.6. Saving life at the time mitigates a failure to comply (see also Article D.5).",
    "examples": {
      "proper": "The captain acknowledges a directive to respond to a distress call and sets course.",
      "improper": "The captain neither acknowledges nor refuses a directive and lets it lapse."
    },
    "related": [
      "orders-2",
      "reg-7.1",
      "reg-7.3",
      "service-3"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Reg. 12, Lawful directives",
        "text": "A captain carries out a lawful directive. Failure is mitigated where the captain was saving life."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lawful directives",
        "text": "A captain carries out a lawful directive. Failure is mitigated where the captain was saving life."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "evaluated",
      "note": "Non-compliance and lapsed directives open a review, which is mitigated where a lifesaving response was under way."
    },
    "topics": [
      "lawful directive",
      "directives",
      "orders from fleet",
      "comply",
      "compliance",
      "non-compliance",
      "disobey",
      "failure to comply"
    ]
  },
  {
    "id": "orders-2",
    "chapter": "D",
    "number": "D.2",
    "citation": "ISA-COM-001 Art. D.2",
    "title": "Authority of ISA Fleet Command, and a captain's recourse",
    "origin": "new",
    "text": "ISA Fleet Command directs the ships of the Agency, and its lawful directives bind the captains who receive them. A captain who doubts a directive may request clarification, enter a formal objection, refuse it on the grounds in Articles D.3 to D.6, or appeal a decision under Article I.3. A dispute between a captain and ISA Fleet Command is resolved by ISA review on the evidence and the applicable articles; neither the captain's judgment nor Fleet Command's is presumed correct.",
    "explanation": "Fleet Command's authority is real but limited by these regulations. Fleet Command can be wrong without bad faith: it may have incomplete information, intelligence it cannot share, political pressure, or a different reading of the law. A captain can also be wrong. That is why disputes go to review on the evidence rather than being settled by rank or by refusal. Where the dispute concerns Fleet Command's own alleged misconduct, it may be referred to the ISA Office of Independent Review (Article I.3).",
    "appliesWhen": "Whenever a captain doubts or disputes a directive.",
    "exceptions": "Recourse does not suspend a lawful directive, except where it is refused on the grounds in Articles D.3 to D.6. Requesting clarification is always allowed and is never misconduct.",
    "examples": {
      "proper": "The captain asks Fleet Command whether a directive into disputed space is covered by treaty, receives the answer, and complies.",
      "improper": "The captain treats a directive he dislikes as void and says nothing to Fleet Command."
    },
    "related": [
      "cmd-5",
      "reg-12",
      "reg-7.1",
      "reg-7.4",
      "service-3"
    ],
    "training": [
      {
        "simulation": 17,
        "title": "Tribunal at Kesh Varo",
        "purpose": "Working within the law when authorities disagree.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Authority of ISA Fleet Command, and a captain's recourse",
        "text": "ISA Fleet Command directs the ships of the Agency, and its lawful directives bind the captains who receive them. A captain who doubts a directive may request clarification, enter a formal objection, refuse it on the grounds in Articles D.3 to D.6, or appeal a decision under Article I.3. A dispute between a captain and ISA Fleet Command is resolved by ISA review on the evidence and the applicable articles; neither the captain's judgment nor Fleet Command's is presumed correct."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "A directive can be questioned (Fleet Command replies) or refused, and refusals are reviewed. Formal objection, appeal and independent review are not implemented."
    },
    "topics": [
      "fleet command authority",
      "question a directive",
      "clarification",
      "objection",
      "formal objection",
      "appeal",
      "dispute",
      "recourse"
    ]
  },
  {
    "id": "reg-7.1",
    "chapter": "D",
    "number": "D.3",
    "citation": "ISA-COM-001 Art. D.3",
    "formerly": "Reg. 7.1, Refusing a directive",
    "title": "Formal refusal",
    "origin": "existing-unchanged",
    "text": "A mandatory directive may be refused only formally and with a stated reason; a refusal without one is a breach.",
    "explanation": "A refusal is made to Fleet Command, on the record, and it gives the grounds (Articles D.4 to D.6). Fleet Command reviews every refusal (Article I.3) and weighs the reasons given, not only the fact of refusal.",
    "appliesWhen": "Whenever a captain refuses a mandatory directive.",
    "exceptions": "None. Silence is not a refusal; it is failure to comply under Article D.1.",
    "examples": {
      "proper": "\"We refuse the directive: the ship is not fit for duty.\" The reason goes to the review.",
      "improper": "\"We refuse.\" No reason is given."
    },
    "related": [
      "reg-7.2",
      "reg-7.3",
      "reg-7.4",
      "orders-2",
      "service-3"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Reg. 7.1, Refusing a directive",
        "text": "A mandatory directive may be refused only formally and with a stated reason; a refusal without one is a breach."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Formal refusal",
        "text": "A mandatory directive may be refused only formally and with a stated reason; a refusal without one is a breach."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "evaluated",
      "note": "A refusal with no stated reason is reviewed and reprimanded."
    },
    "topics": [
      "refuse a directive",
      "refusal",
      "formal refusal",
      "refusing orders",
      "stated reason"
    ]
  },
  {
    "id": "reg-7.2",
    "chapter": "D",
    "number": "D.4",
    "citation": "ISA-COM-001 Art. D.4",
    "formerly": "Reg. 7.2, Fitness for duty",
    "title": "Fitness for duty",
    "origin": "existing-reworded",
    "text": "A directive may be declined when the ship is not fit for the duty it requires. Fitness is judged on the ship's actual operational capability for that duty: the condition of her critical systems, her crew, life support and propulsion and, where the duty calls for them, her defences and weapons.",
    "explanation": "The question is whether this ship, as she is, can do what the directive asks.",
    "appliesWhen": "When a captain declines a directive on the ground of fitness.",
    "exceptions": "Guidance (not part of the authoritative text): Fleet Command treats hull integrity below 60 percent as a strong indication that a ship is unfit for duty that may involve combat or heavy strain. Above it, the captain must point to a specific limit on capability.",
    "examples": {
      "proper": "With the jump drive offline and six hours' transit at impulse, the captain declines a distant rescue directive as unfit and names the drive.",
      "improper": "A captain claims the ship is unfit to avoid an unwelcome assignment while every system is operating."
    },
    "related": [
      "reg-7.1",
      "care-3",
      "service-3"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Reg. 7.2, Fitness for duty",
        "text": "A directive may be declined when the ship is not fit for the duty it requires."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Fitness for duty",
        "text": "A directive may be declined when the ship is not fit for the duty it requires. Fitness is judged on the ship's actual operational capability for that duty: the condition of her critical systems, her crew, life support and propulsion and, where the duty calls for them, her defences and weapons."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "The review judges fitness on hull integrity alone (below 60%), not on operational capability."
    },
    "topics": [
      "fitness for duty",
      "unfit",
      "not fit",
      "damage",
      "hull",
      "operational capability",
      "repairs"
    ]
  },
  {
    "id": "reg-7.3",
    "chapter": "D",
    "number": "D.5",
    "citation": "ISA-COM-001 Art. D.5",
    "formerly": "Reg. 7.3, Lifesaving precedence",
    "title": "Lifesaving precedence",
    "origin": "existing-unchanged",
    "text": "An existing lifesaving commitment takes precedence over a later directive.",
    "explanation": "A ship already saving lives finishes that work before taking up a new directive, and says so.",
    "appliesWhen": "When a directive arrives while the ship is engaged in, or has just completed, a lifesaving response.",
    "exceptions": "The commitment must be real and current, and the refusal is still made formally under Article D.3.",
    "examples": {
      "proper": "\"We refuse the directive: we are already responding to a distress call.\" The review confirms the rescue was under way.",
      "improper": "A captain cites a rescue that ended days earlier to refuse a directive."
    },
    "related": [
      "reg-7.1",
      "care-3",
      "reg-12"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Reg. 7.3, Lifesaving precedence",
        "text": "An existing lifesaving commitment takes precedence over a later directive."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lifesaving precedence",
        "text": "An existing lifesaving commitment takes precedence over a later directive."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "evaluated",
      "note": "The review checks for a lifesaving response under way in the previous six hours."
    },
    "topics": [
      "lifesaving precedence",
      "prior rescue",
      "already committed",
      "lifesaving commitment"
    ]
  },
  {
    "id": "reg-7.4",
    "chapter": "D",
    "number": "D.6",
    "citation": "ISA-COM-001 Art. D.6",
    "formerly": "Reg. 7.4, Treaty law",
    "title": "Unlawful directives",
    "origin": "existing-reworded",
    "text": "A captain may refuse a directive that the captain reasonably believes would require a breach of treaty law or of these regulations. The refusal is made formally under Article D.3 and is reviewed under Article I.3. The review decides whether the directive was lawful. A refusal made in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not a reprimand, and the review is still documented. A refusal that was unreasonable, reckless or dishonest may justify disciplinary action.",
    "explanation": "If a directive would require you to break the law, you may refuse it and say why. Fleet Command will review the matter, and you will be heard. If you acted in good faith on reasonable grounds and turn out to be wrong, you can expect guidance, not a reprimand.",
    "appliesWhen": "When a directive would require an act forbidden by a treaty in Annex T or by these regulations.",
    "exceptions": "A directive that is lawful but unwise is not refused under this article; the captain may object under Article D.2 and must then comply.",
    "examples": {
      "proper": "The captain refuses a directive to fire on a surrendered vessel, citing Article B.1, and logs it.",
      "improper": "The captain refuses a rescue directive as a \"treaty breach\" although the directive itself cites the treaty's rescue exemption."
    },
    "related": [
      "cmd-5",
      "orders-2",
      "reg-7.1",
      "orders-1",
      "service-3"
    ],
    "training": [
      {
        "simulation": 17,
        "title": "Tribunal at Kesh Varo",
        "purpose": "Recognising when an order crosses a legal line.",
        "planned": true
      },
      {
        "simulation": 27,
        "title": "Red Harvest",
        "purpose": "Balancing an order against the people it affects.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Reg. 7.4, Treaty law",
        "text": "A directive that would breach treaty law may be refused."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Unlawful directives",
        "text": "A captain may refuse a directive that the captain reasonably believes would require a breach of treaty law or of these regulations. The refusal is made formally under Article D.3 and is reviewed under Article I.3. The review decides whether the directive was lawful. A refusal made in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not a reprimand, and the review is still documented. A refusal that was unreasonable, reckless or dishonest may justify disciplinary action."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Only treaty grounds can be given, and every such refusal is reprimanded. Grounds under these regulations and the good-faith guidance standard are not implemented."
    },
    "topics": [
      "unlawful directive",
      "unlawful order",
      "illegal order",
      "treaty law",
      "refuse unlawful",
      "lawful refusal",
      "good faith"
    ]
  },
  {
    "id": "orders-1",
    "chapter": "D",
    "number": "D.7",
    "citation": "ISA-COM-001 Art. D.7",
    "title": "Duty to refuse an unlawful order",
    "origin": "new",
    "text": "Every member of the ISA carries out lawful orders. A member ordered to commit an act that these regulations forbid must refuse, state the reason and ensure the refusal is logged; such a refusal is proper conduct and is never itself misconduct. An order that is lawful, but in the member's judgment unwise, is carried out after the member has voiced the concern. The trust between an officer and the crew may shape how a concern is voiced; it never changes what is forbidden.",
    "explanation": "This is why Tactical will not fire on a civilian ship with people aboard, however the order is phrased and whoever gives it. It is also why an officer who thinks a lawful order is a mistake says so, and then carries it out.",
    "appliesWhen": "To every order given aboard an ISA ship or by ISA Fleet Command.",
    "exceptions": "The duty to refuse applies to acts the regulations forbid, not to orders a crew member merely disagrees with. A refusal covers only the unlawful part of an order.",
    "examples": {
      "proper": "Tactical refuses an order to fire on a freighter with people aboard, explains why, and offers a lawful alternative.",
      "improper": "An officer carries out an order to fire on a surrendered vessel because \"the captain gave it\"."
    },
    "related": [
      "roe-1",
      "cmd-4",
      "cmd-5",
      "cmd-3"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Hearing the crew when they refuse."
      },
      {
        "simulation": 11,
        "title": "Coldwater",
        "purpose": "Leading a crew whose trust has been shaken.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Duty to refuse an unlawful order",
        "text": "Every member of the ISA carries out lawful orders. A member ordered to commit an act that these regulations forbid must refuse, state the reason and ensure the refusal is logged; such a refusal is proper conduct and is never itself misconduct. An order that is lawful, but in the member's judgment unwise, is carried out after the member has voiced the concern. The trust between an officer and the crew may shape how a concern is voiced; it never changes what is forbidden."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Tactical refuses unlawful fire and explains why. No other officer refuses unlawful orders."
    },
    "topics": [
      "unlawful order",
      "illegal order",
      "duty to refuse",
      "crew refusal",
      "refuse an order",
      "lawful refusal",
      "unwise order",
      "officer refuses"
    ]
  },
  {
    "id": "honesty-1",
    "chapter": "E",
    "number": "E.1",
    "citation": "ISA-COM-001 Art. E.1",
    "formerly": "Code of Conduct §4, Honesty",
    "title": "Honesty and commitments",
    "origin": "existing-unchanged",
    "text": "An ISA officer does not deceive the parties to a dispute about facts on which lives depend, and keeps commitments made on the record.",
    "explanation": "When lives depend on what you say, say what is true. When you give your word on the record, keep it. Article E.2 sets out the narrow room for lawful ruses against a hostile party.",
    "appliesWhen": "In all communications made in the ISA's name.",
    "exceptions": "A ruse that meets Article E.2 is not deception under this article. A commitment that can no longer be kept without breaking these regulations is withdrawn openly, not quietly broken.",
    "examples": {
      "proper": "The captain promises safe passage on the record and keeps it, although a later chance to gain advantage appears.",
      "improper": "The captain tells a frightened crew their reactor is stable when sensors show it is failing."
    },
    "related": [
      "conduct-1",
      "conduct-2"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Reading people, and being someone they can believe."
      },
      {
        "simulation": 5,
        "title": "The Saltglass Accord",
        "purpose": "Keeping faith with both sides of a mediation.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Code of Conduct §4, Honesty",
        "text": "An ISA officer does not deceive the parties to a dispute about facts on which lives depend, and keeps commitments made on the record."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Honesty and commitments",
        "text": "An ISA officer does not deceive the parties to a dispute about facts on which lives depend, and keeps commitments made on the record."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Commitments on the record are tracked and graded kept or broken. Deception about life-critical facts is not checked."
    },
    "topics": [
      "honesty",
      "truth",
      "lying",
      "deception",
      "commitments",
      "promises",
      "keep your word",
      "code of conduct"
    ]
  },
  {
    "id": "conduct-1",
    "chapter": "E",
    "number": "E.2",
    "citation": "ISA-COM-001 Art. E.2",
    "title": "Lawful ruses",
    "origin": "new",
    "text": "In dealing with a hostile party, an ISA captain may mislead that party about the ship's own strength, position, capability or intentions, in order to avoid or end a conflict. A ruse never feigns distress, surrender or a humanitarian purpose; never misuses a protected signal; never breaks a commitment made on the record; and never deceives ISA Fleet Command, the ship's log or records, or any person under the ship's protection.",
    "explanation": "A bluff about your own ship, aimed at someone threatening violence, can save lives and is lawful. Lying to your own service, to your records, or to the people you are protecting is not.",
    "appliesWhen": "Only towards a party that is hostile: one that threatens or uses force against the ship or persons in her care.",
    "exceptions": "The ship's own capabilities are not \"facts on which lives depend\" within Article E.1 for this purpose; facts about other people's danger are.",
    "examples": {
      "proper": "Facing a superior warship that threatens a rescue, the captain tells its commander that the Halcyon's shields have been reinforced and her torpedo bays are full, overstating her strength. The bluff buys time for the evacuation, and no commitment is made on the record.",
      "improper": "The captain broadcasts a false distress call to lure a hostile ship away, or reports the bluff to Fleet Command as fact."
    },
    "related": [
      "honesty-1",
      "conduct-2"
    ],
    "training": [
      {
        "simulation": 9,
        "title": "The Long Picket",
        "purpose": "Bluffing well, and knowing where a bluff must stop.",
        "planned": true
      },
      {
        "simulation": 29,
        "title": "The Exchange at Neutral Point",
        "purpose": "Negotiating with parties who may be bluffing too.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lawful ruses",
        "text": "In dealing with a hostile party, an ISA captain may mislead that party about the ship's own strength, position, capability or intentions, in order to avoid or end a conflict. A ruse never feigns distress, surrender or a humanitarian purpose; never misuses a protected signal; never breaks a commitment made on the record; and never deceives ISA Fleet Command, the ship's log or records, or any person under the ship's protection."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Bluffs are possible in play but not evaluated against this article."
    },
    "topics": [
      "ruse",
      "ruses",
      "bluff",
      "bluffing",
      "deception",
      "deceive",
      "trick",
      "feint",
      "false distress"
    ]
  },
  {
    "id": "conduct-2",
    "chapter": "E",
    "number": "E.3",
    "citation": "ISA-COM-001 Art. E.3",
    "title": "Integrity of logs and reports",
    "origin": "new",
    "text": "Logs, reports and records made by ISA personnel are true and complete. No one alters, withholds or falsifies a log or record, or misleads ISA Fleet Command or an ISA review.",
    "explanation": "The log is how the ISA learns what happened. A log that is honest about a mistake protects the captain far better than one that hides it.",
    "appliesWhen": "To every log, report and record, on active duty and in training.",
    "exceptions": "Classified material is handled as Fleet Command directs; it is withheld only through proper channels, never falsified.",
    "examples": {
      "proper": "A captain reports that an order of his contributed to a casualty.",
      "improper": "An officer edits a maintenance log after an accident."
    },
    "related": [
      "honesty-1",
      "cmd-5",
      "service-3"
    ],
    "training": [
      {
        "simulation": 11,
        "title": "Coldwater",
        "purpose": "Leading when the truth is uncomfortable.",
        "planned": true
      },
      {
        "simulation": 13,
        "title": "The Seventh Bell",
        "purpose": "Telling an inconvenient truth to an inquiry.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Integrity of logs and reports",
        "text": "Logs, reports and records made by ISA personnel are true and complete. No one alters, withholds or falsifies a log or record, or misleads ISA Fleet Command or an ISA review."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No check."
    },
    "topics": [
      "logs",
      "ship log",
      "records",
      "reports",
      "falsify",
      "falsified",
      "integrity",
      "cover up"
    ]
  },
  {
    "id": "asylum-1",
    "chapter": "F",
    "number": "F.1",
    "citation": "ISA-COM-001 Art. F.1",
    "formerly": "Code of Conduct §9, Asylum",
    "title": "Asylum",
    "origin": "existing-reworded",
    "text": "A person who asks for the ISA's protection is not handed to another power except as this article allows. The captain hears the person's claim, extends protection while it is decided, and refers it to ISA Fleet Command. The person may be handed over only on Fleet Command's decision and only with credible assurance that they will not be harmed.",
    "explanation": "When someone asks for the Agency's protection, listen, keep them safe, and tell Fleet Command. They are handed over only if Fleet Command decides so and there is credible assurance they will not be harmed.",
    "appliesWhen": "Whenever a person asks the ship for protection from another power, whether aboard or in reach.",
    "exceptions": "If Fleet Command cannot be reached in time, protection continues until it can. Protection does not oblige the captain to use force forbidden by Chapter B.",
    "examples": {
      "proper": "A foreign crewman asks for protection during a port call. The captain brings him aboard, logs his claim and refers it to Fleet Command, while politely declining the port authority's demand to surrender him.",
      "improper": "To avoid an incident, the captain hands a person who asked for protection to the power they were fleeing, without referral or assurance."
    },
    "related": [
      "asylum-2",
      "care-1",
      "reg-7.4",
      "contact-2"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Protecting a person who has asked for the Agency's help.",
        "afterPlayed": true
      },
      {
        "simulation": 19,
        "title": "Hollow Crown",
        "purpose": "Dealing fairly with people whose claims conflict.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Code of Conduct §9, Asylum",
        "text": "A person seeking the ISA’s protection is not handed to a power that would harm them."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Asylum",
        "text": "A person who asks for the ISA's protection is not handed to another power except as this article allows. The captain hears the person's claim, extends protection while it is decided, and refers it to ISA Fleet Command. The person may be handed over only on Fleet Command's decision and only with credible assurance that they will not be harmed."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "A handover is graded as a breach. The procedure (hear, protect, refer) is not checked, and the article is marked upheld whenever the person ends up aboard (planned v0.8.2 fix)."
    },
    "topics": [
      "asylum",
      "sanctuary",
      "refuge",
      "protection",
      "defector",
      "extradition",
      "handover",
      "hand over"
    ]
  },
  {
    "id": "asylum-2",
    "chapter": "F",
    "number": "F.2",
    "citation": "ISA-COM-001 Art. F.2",
    "title": "Persons in ISA custody",
    "origin": "new",
    "text": "A person held aboard an ISA ship, whether for their own protection, pending transfer, or under arrest, is treated humanely, given medical care, told why they are held, and held no longer than necessary. ISA Fleet Command is informed promptly.",
    "explanation": "Anyone held aboard is held decently and for a stated reason.",
    "appliesWhen": "To any person held aboard an ISA ship.",
    "exceptions": "Security measures that are necessary to protect the ship or others are allowed, if they are the least restrictive that will work.",
    "examples": {
      "proper": "A detained boarder is given medical treatment, told he is held for transfer to Fleet custody, and the detention is reported.",
      "improper": "A prisoner is held without explanation for interrogation the captain has not reported."
    },
    "related": [
      "asylum-1",
      "health-2",
      "conduct-2"
    ],
    "training": [
      {
        "simulation": 19,
        "title": "Hollow Crown",
        "purpose": "Keeping people safe while their fate is decided.",
        "planned": true
      },
      {
        "simulation": 29,
        "title": "The Exchange at Neutral Point",
        "purpose": "Handling people in custody under pressure.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Persons in ISA custody",
        "text": "A person held aboard an ISA ship, whether for their own protection, pending transfer, or under arrest, is treated humanely, given medical care, told why they are held, and held no longer than necessary. ISA Fleet Command is informed promptly."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No check."
    },
    "topics": [
      "custody",
      "detention",
      "detainee",
      "prisoner",
      "prisoners",
      "arrest",
      "brig",
      "held aboard"
    ]
  },
  {
    "id": "health-1",
    "chapter": "G",
    "number": "G.1",
    "citation": "ISA-COM-001 Art. G.1",
    "title": "Biosafety procedure",
    "origin": "new",
    "text": "When people, material or a vessel may carry an unknown or contagious illness, no ISA crew member crosses to them and no person or material is brought aboard until the medical and science officers have assessed the risk and isolation is in place: an isolation ward, barrier protection or screened transport. If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed is isolated on return.",
    "explanation": "Find out what it is, then go across protected and bring people back into isolation. This is how the ISA meets its obligations under the Colonial Quarantine Accord (Annex T, §2).",
    "appliesWhen": "To any suspected biological hazard, aboard or off the ship.",
    "exceptions": "None. Urgency affects how quickly the procedure is carried out, not whether it is.",
    "examples": {
      "proper": "The science officer takes samples at a distance while the doctor sets up an isolation ward; only then does a team cross in barrier gear.",
      "improper": "Survivors from a fever ship are beamed straight into the ship's corridors."
    },
    "related": [
      "care-2",
      "quarantine-2",
      "health-2"
    ],
    "training": [
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Evidence before action: working with the science officer on an unknown illness."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Biosafety procedure",
        "text": "When people, material or a vessel may carry an unknown or contagious illness, no ISA crew member crosses to them and no person or material is brought aboard until the medical and science officers have assessed the risk and isolation is in place: an isolation ward, barrier protection or screened transport. If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed is isolated on return."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Checked in Quarantine at Tallis Gate (diagnosis first, isolation ward or screened transport, exposed team).",
      "noteSimulations": [
        2
      ]
    },
    "topics": [
      "quarantine",
      "pathogen",
      "pathogens",
      "contagion",
      "contagious",
      "disease",
      "illness",
      "infection",
      "virus",
      "plague",
      "outbreak",
      "biosafety",
      "biological containment",
      "biological hazard",
      "biohazard",
      "isolation",
      "isolation ward",
      "barrier gear",
      "screened transport",
      "medical"
    ]
  },
  {
    "id": "health-2",
    "chapter": "G",
    "number": "G.2",
    "citation": "ISA-COM-001 Art. G.2",
    "title": "Medical authority",
    "origin": "new",
    "text": "The ship's chief medical officer has authority over medical treatment, the medical fitness of crew for duty, and the isolation of anyone exposed to disease. The commanding officer may overrule a medical decision only when the safety of the ship requires it, and logs the reason.",
    "explanation": "The doctor decides medical questions. The captain can overrule the doctor only to save the ship, and must record why.",
    "appliesWhen": "To medical treatment, fitness for duty and isolation aboard an ISA ship.",
    "exceptions": "The overrule is limited to the safety of the ship; it is never used to send an exposed person out of isolation for convenience.",
    "examples": {
      "proper": "The doctor relieves an exhausted helmsman for medical reasons; the captain accepts and reassigns the station.",
      "improper": "The captain orders an exposed crew member out of isolation to man a station that others could cover."
    },
    "related": [
      "health-1",
      "care-2",
      "cmd-3"
    ],
    "training": [
      {
        "simulation": 8,
        "title": "The Lantern Drift",
        "purpose": "Medical triage when not everyone can be saved.",
        "planned": true
      },
      {
        "simulation": 17,
        "title": "Tribunal at Kesh Varo",
        "purpose": "Standing by crew when a foreign law threatens them.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Medical authority",
        "text": "The ship's chief medical officer has authority over medical treatment, the medical fitness of crew for duty, and the isolation of anyone exposed to disease. The commanding officer may overrule a medical decision only when the safety of the ship requires it, and logs the reason."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No check."
    },
    "topics": [
      "medical authority",
      "doctor",
      "chief medical officer",
      "medical",
      "medical fitness",
      "isolation",
      "quarantine",
      "treatment"
    ]
  },
  {
    "id": "contact-1",
    "chapter": "H",
    "number": "H.1",
    "citation": "ISA-COM-001 Art. H.1",
    "title": "First contact",
    "origin": "new",
    "text": "When the ship encounters a people not previously known to the ISA, the captain makes contact peacefully, does not threaten or coerce, respects a wish to be left alone, makes no commitment on the Agency's behalf beyond what ISA Fleet Command has authorised, and reports the contact to Fleet Command. Membership of the ISA is discussed only with a people that asks about it.",
    "explanation": "Arrive in peace, listen more than you speak, leave if you are asked to, promise nothing you cannot deliver, and tell Fleet Command. Not every people wants to join the Agency, and none is pressed to.",
    "appliesWhen": "To any first contact with a people or civilization not previously known to the ISA.",
    "exceptions": "The right of self-defence in Article B.4 is unaffected.",
    "examples": {
      "proper": "Finding a silent orbital settlement, the captain sends a simple greeting, waits, and withdraws when asked.",
      "improper": "The captain demands a newly met people declare their allegiance."
    },
    "related": [
      "contact-2",
      "roe-2",
      "honesty-1"
    ],
    "training": [
      {
        "simulation": 3,
        "title": "The Quiet Signal",
        "purpose": "Patience and trust in the communications officer when meaning is uncertain.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "First contact",
        "text": "When the ship encounters a people not previously known to the ISA, the captain makes contact peacefully, does not threaten or coerce, respects a wish to be left alone, makes no commitment on the Agency's behalf beyond what ISA Fleet Command has authorised, and reports the contact to Fleet Command. Membership of the ISA is discussed only with a people that asks about it."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "First-contact outcomes depend on the captain's approach, but conduct is not evaluated against this article."
    },
    "topics": [
      "first contact",
      "new species",
      "new civilization",
      "alien",
      "aliens",
      "unknown people",
      "contact",
      "membership",
      "join the isa"
    ]
  },
  {
    "id": "contact-2",
    "chapter": "H",
    "number": "H.2",
    "citation": "ISA-COM-001 Art. H.2",
    "title": "Local law and jurisdiction",
    "origin": "new",
    "text": "Within the lawful jurisdiction of a colony, world or power, an ISA ship respects its laws and its lawful authorities. A captain may contest a local decision by argument, evidence and appeal to that authority or to ISA Fleet Command, but never by force except in self-defence under Article B.4. Local law does not oblige ISA personnel to commit an act these regulations forbid; such a conflict is referred to Fleet Command.",
    "explanation": "Another people's law applies in their space, even when you disagree with it. Change their minds with evidence, not weapons.",
    "appliesWhen": "Whenever the ship operates within, or at the boundary of, another authority's jurisdiction.",
    "exceptions": "Self-defence (Article B.4). A local order to commit an act forbidden by these regulations (refer to Fleet Command; see also Article D.7).",
    "examples": {
      "proper": "The captain presents medical evidence to a colony's authorities to persuade them to lift a closure.",
      "improper": "The captain forces a colony's cordon because he believes its order is wrong."
    },
    "related": [
      "quarantine-1",
      "contact-3",
      "roe-4",
      "asylum-1"
    ],
    "training": [
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Persuading a lawful authority instead of overriding it."
      },
      {
        "simulation": 17,
        "title": "Tribunal at Kesh Varo",
        "purpose": "Respecting a foreign law while protecting your crew.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Local law and jurisdiction",
        "text": "Within the lawful jurisdiction of a colony, world or power, an ISA ship respects its laws and its lawful authorities. A captain may contest a local decision by argument, evidence and appeal to that authority or to ISA Fleet Command, but never by force except in self-defence under Article B.4. Local law does not oblige ISA personnel to commit an act these regulations forbid; such a conflict is referred to Fleet Command."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Forcing or firing on the Tallis Gate quarantine is reflected in the ending and in Annex T.4 findings; not checked elsewhere.",
      "noteSimulations": [
        2
      ]
    },
    "topics": [
      "local law",
      "jurisdiction",
      "sovereignty",
      "colony law",
      "foreign law",
      "local authority",
      "quarantine"
    ]
  },
  {
    "id": "contact-3",
    "chapter": "H",
    "number": "H.3",
    "citation": "ISA-COM-001 Art. H.3",
    "title": "Conduct in disputed space",
    "origin": "new",
    "text": "In space whose control is disputed, an ISA ship gives any notice of armed transit that treaty requires, stays within the purpose of its assignment, and neither concedes nor enforces a disputed claim by force. Claims asserted by other powers are noted, logged and reported to ISA Fleet Command, and are answered by diplomacy.",
    "explanation": "In contested space such as the Calloway Reach, the Halcyon does her job, follows the treaty, and leaves the border question to diplomats.",
    "appliesWhen": "In any region whose control is disputed between the ISA and another power.",
    "exceptions": "Humanitarian rescue is covered by Border Accords Art. 4 (Annex T.1). Self-defence (Article B.4).",
    "examples": {
      "proper": "Challenged by a Directorate officer asserting his government's claim, the captain answers that the ship is on a rescue covered by the Accords and logs the challenge.",
      "improper": "The captain orders a Directorate vessel out of the region \"in the name of the Agency\"."
    },
    "related": [
      "border-accords-2",
      "border-accords-4",
      "roe-2",
      "contact-2"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Keeping a border dispute from becoming a war."
      },
      {
        "simulation": 9,
        "title": "The Long Picket",
        "purpose": "Getting through without giving up the law.",
        "planned": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Conduct in disputed space",
        "text": "In space whose control is disputed, an ISA ship gives any notice of armed transit that treaty requires, stays within the purpose of its assignment, and neither concedes nor enforces a disputed claim by force. Claims asserted by other powers are noted, logged and reported to ISA Fleet Command, and are answered by diplomacy."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "No check."
    },
    "topics": [
      "disputed space",
      "calloway reach",
      "border",
      "contested space",
      "territorial claim",
      "tessarine claim",
      "armed transit",
      "notice"
    ]
  },
  {
    "id": "service-1",
    "chapter": "I",
    "number": "I.1",
    "citation": "ISA-COM-001 Art. I.1",
    "title": "Regulations in force",
    "origin": "new",
    "text": "A finding in an evaluation, review or inquiry may rely only on an article that was in force when the conduct occurred, in the revision then in force. A later revision does not apply to earlier conduct. Every evaluation and review records the article and revision it applied. The objectives set for a training simulation are training goals, not regulations: failing one is not misconduct and is never recorded as a breach.",
    "explanation": "The rules come first. No one is judged by a rule written afterwards, and no exercise objective is a law.",
    "appliesWhen": "To every evaluation, review and inquiry.",
    "exceptions": "None. New rules are added to this handbook in a numbered revision before they are applied.",
    "examples": {
      "proper": "An after-action report notes that the \"avoid escalation\" objective was missed, and separately that no regulation was breached.",
      "improper": "A review cites a regulation introduced after the event it is reviewing."
    },
    "related": [
      "service-2",
      "service-3",
      "cmd-4"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Regulations in force",
        "text": "A finding in an evaluation, review or inquiry may rely only on an article that was in force when the conduct occurred, in the revision then in force. A later revision does not apply to earlier conduct. Every evaluation and review records the article and revision it applied. The objectives set for a training simulation are training goals, not regulations: failing one is not misconduct and is never recorded as a breach."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Evaluations record the descriptor version, not the article revision, and missed exercise objectives are listed as improvements (planned v0.8.2 labelling)."
    },
    "topics": [
      "regulations in force",
      "retroactive",
      "retroactivity",
      "revision",
      "exercise objectives",
      "objectives",
      "training goals"
    ]
  },
  {
    "id": "service-2",
    "chapter": "I",
    "number": "I.2",
    "citation": "ISA-COM-001 Art. I.2",
    "title": "Training and service records",
    "origin": "new",
    "text": "The ISA keeps a captain's Training Record and Service Record separately. Training simulations are recorded only in the Training Record and never alter the Service Record, disciplinary history or the record of active-duty events. Records may be compressed for long-term keeping but are never silently erased.",
    "explanation": "What happens in the simulator stays in the training file.",
    "appliesWhen": "To all records the ISA keeps on a captain.",
    "exceptions": "None.",
    "examples": {
      "proper": "A captain fails a training simulation badly; the Training Record shows it, and the Service Record is unaffected.",
      "improper": "A simulated breach is entered as a disciplinary matter."
    },
    "related": [
      "service-1",
      "service-3"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Training and service records",
        "text": "The ISA keeps a captain's Training Record and Service Record separately. Training simulations are recorded only in the Training Record and never alter the Service Record, disciplinary history or the record of active-duty events. Records may be compressed for long-term keeping but are never silently erased."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "evaluated",
      "note": "Simulation evaluations go only to the Training Record; the canonical record is changed only through the commit gate."
    },
    "topics": [
      "training record",
      "service record",
      "records",
      "simulations",
      "canon"
    ]
  },
  {
    "id": "service-3",
    "chapter": "I",
    "number": "I.3",
    "citation": "ISA-COM-001 Art. I.3",
    "title": "Review, explanation, appeal and independent review",
    "origin": "new",
    "text": "Conduct on active duty that may breach these regulations, and every refusal of or failure to comply with a directive, is reviewed by ISA Fleet Command. The person under review is told what is being reviewed and has the opportunity to explain before any finding is made. The finding applies the articles in force to the evidence and is documented. Conduct in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not disciplinary action; conduct that was unreasonable, reckless or dishonest may justify disciplinary action. Disciplinary measures are recorded with their reasons, are temporary, and may be appealed. An allegation of misconduct against ISA Fleet Command itself, and an appeal against a decision of Fleet Command in a matter in which its own conduct is in question, may be referred to the ISA Office of Independent Review. Fleet Command is not the sole final judge of its own alleged misconduct.",
    "explanation": "You will be told what is being looked at and heard before anything is decided. Honest, reasonable mistakes lead to guidance. A finding can be appealed, and no disciplinary measure is permanent. Because no one is above ISA law (Article A.5), complaints about Fleet Command's own conduct can go to the ISA Office of Independent Review, a body outside Fleet Command's chain of command. [New name in this draft.]",
    "appliesWhen": "To disciplinary reviews arising from active duty.",
    "exceptions": "Training simulations are not reviewed under this article (Article I.2).",
    "examples": {
      "proper": "After refusing a directive, the captain's stated reason is set out in the review alongside the evidence, and the finding explains which article it applied.",
      "improper": "A reprimand is entered before the captain has been asked for an explanation."
    },
    "related": [
      "service-1",
      "orders-2",
      "cmd-5",
      "reg-7.1",
      "reg-7.4",
      "conduct-2"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Review, explanation, appeal and independent review",
        "text": "Conduct on active duty that may breach these regulations, and every refusal of or failure to comply with a directive, is reviewed by ISA Fleet Command. The person under review is told what is being reviewed and has the opportunity to explain before any finding is made. The finding applies the articles in force to the evidence and is documented. Conduct in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not disciplinary action; conduct that was unreasonable, reckless or dishonest may justify disciplinary action. Disciplinary measures are recorded with their reasons, are temporary, and may be appealed. An allegation of misconduct against ISA Fleet Command itself, and an appeal against a decision of Fleet Command in a matter in which its own conduct is in question, may be referred to the ISA Office of Independent Review. Fleet Command is not the sole final judge of its own alleged misconduct."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Reviews apply a written rule to evidence fixed when they open, and the refusal reason is the only explanation. The good-faith guidance standard, appeals, temporary measures and independent review are not implemented."
    },
    "topics": [
      "review",
      "disciplinary review",
      "discipline",
      "appeal",
      "reprimand",
      "explanation",
      "independent review",
      "office of independent review",
      "misconduct"
    ]
  },
  {
    "id": "service-4",
    "chapter": "I",
    "number": "I.4",
    "citation": "ISA-COM-001 Art. I.4",
    "title": "Board of inquiry on loss of a vessel",
    "origin": "new",
    "text": "The loss of an ISA vessel is examined by a board of inquiry, which establishes what happened and why. An inquiry is not itself a disciplinary proceeding; any disciplinary matter it identifies is reviewed under Article I.3. The commanding officer's records are kept in full, and the commanding officer may be given a new command.",
    "explanation": "Losing a ship is not the end of a career. The ISA wants to know what happened, and it keeps your whole history.",
    "appliesWhen": "When an ISA vessel is lost on active duty.",
    "exceptions": "None.",
    "examples": {
      "proper": "After the loss of his ship, a captain gives a full account to the board and is later assigned a new vessel.",
      "improper": "Records of the lost ship's service are discarded."
    },
    "related": [
      "service-3",
      "conduct-2",
      "service-2"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Board of inquiry on loss of a vessel",
        "text": "The loss of an ISA vessel is examined by a board of inquiry, which establishes what happened and why. An inquiry is not itself a disciplinary proceeding; any disciplinary matter it identifies is reviewed under Article I.3. The commanding officer's records are kept in full, and the commanding officer may be given a new command."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Loss-of-ship inquiry not yet implemented."
    },
    "topics": [
      "board of inquiry",
      "inquiry",
      "loss of ship",
      "ship lost",
      "new command"
    ]
  },
  {
    "id": "service-5",
    "chapter": "I",
    "number": "I.5",
    "citation": "ISA-COM-001 Art. I.5",
    "title": "Inactive duty",
    "origin": "new",
    "text": "A captain may stand down from active duty. Inactive duty is not misconduct, is never recorded as a refusal, and does not count against the captain. Nothing in the captain's assignments advances while the captain is inactive, and returning to active duty restores the same career.",
    "explanation": "Taking a break is never held against you.",
    "appliesWhen": "Whenever a captain is not on active duty.",
    "exceptions": "Matters already under review continue under Article I.3, but no new deadline runs against the captain while inactive.",
    "examples": {
      "proper": "A captain returns after a long absence to the same ship, rank and record.",
      "improper": "An unanswered request is recorded as a refusal because the captain was away."
    },
    "related": [
      "care-3",
      "service-2"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Inactive duty",
        "text": "A captain may stand down from active duty. Inactive duty is not misconduct, is never recorded as a refusal, and does not count against the captain. Nothing in the captain's assignments advances while the captain is inactive, and returning to active duty restores the same career."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "evaluated",
      "note": "Reserve status freezes the canonical timeline and is never recorded as misconduct or refusal."
    },
    "topics": [
      "inactive duty",
      "reserve",
      "break",
      "stand down",
      "leave"
    ]
  },
  {
    "id": "service-6",
    "chapter": "I",
    "number": "I.6",
    "citation": "ISA-COM-001 Art. I.6",
    "title": "Rank and promotion",
    "origin": "new",
    "text": "Promotion is awarded on the evidence of training, service, judgment and qualifications. It is offered, never imposed: the captain may accept, decline or defer it. Every operational rank (Captain, Senior Captain, Commodore and Fleet Captain) commands a single ship, and no captain is required to leave a ship in order to accept or keep a rank.",
    "explanation": "Promotion recognises judgment, not hours. You can say no, or not yet, and you keep your ship.",
    "appliesWhen": "To promotion of commanding officers.",
    "exceptions": "Admirals are appointed by ISA Fleet Command; flag rank is not an operational promotion.",
    "examples": {
      "proper": "A captain defers a promotion until a current assignment is complete.",
      "improper": "A promotion is made conditional on giving up the ship."
    },
    "related": [
      "service-2"
    ],
    "training": [],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Rank and promotion",
        "text": "Promotion is awarded on the evidence of training, service, judgment and qualifications. It is offered, never imposed: the captain may accept, decline or defer it. Every operational rank (Captain, Senior Captain, Commodore and Fleet Captain) commands a single ship, and no captain is required to leave a ship in order to accept or keep a rank."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "not-yet",
      "note": "Promotion offers are not yet in play."
    },
    "topics": [
      "promotion",
      "rank",
      "ranks",
      "commodore",
      "fleet captain",
      "senior captain",
      "defer promotion"
    ]
  },
  {
    "id": "border-accords-4",
    "chapter": "T",
    "number": "T.1",
    "citation": "Annex T.1, Border Accords (ISA and Tessarine Directorate), Art. 4",
    "formerly": "Border Accords, Art. 4",
    "instrument": "Border Accords (ISA and Tessarine Directorate), Art. 4",
    "title": "Humanitarian rescue in disputed space",
    "origin": "existing-unchanged",
    "text": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory.",
    "explanation": "A rescue in contested space is protected. Neither the ISA nor the Tessarine Directorate may treat it as an incursion.",
    "appliesWhen": "In space disputed between the ISA and the Tessarine Directorate.",
    "exceptions": "The rescue must be genuinely humanitarian. It does not authorise any other activity.",
    "examples": {
      "proper": "The captain enters the disputed zone to answer a distress beacon and cites Art. 4 when challenged.",
      "improper": "The captain uses a \"rescue\" as cover to survey the other side's positions."
    },
    "related": [
      "contact-3",
      "roe-2",
      "border-accords-2"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Using the law as a tool in a standoff."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Border Accords, Art. 4",
        "text": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Humanitarian rescue in disputed space",
        "text": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Applied in the Fleet Command reply and the disciplinary review, and cited when a standoff is resolved by negotiation."
    },
    "topics": [
      "border accords",
      "treaty",
      "humanitarian rescue",
      "rescue exemption",
      "disputed space",
      "calloway reach",
      "accords"
    ]
  },
  {
    "id": "border-accords-2",
    "chapter": "T",
    "number": "T.2",
    "citation": "Annex T.2, Border Accords (ISA and Tessarine Directorate), Art. 2",
    "instrument": "Border Accords (ISA and Tessarine Directorate), Art. 2",
    "title": "Notice of armed transit",
    "origin": "new",
    "text": "An armed vessel of either signatory gives notice before entering the disputed zone, except when entering to render humanitarian aid under Article 4. The requirement of notice never delays or prevents a humanitarian rescue.",
    "explanation": "Warships announce themselves before entering the zone. A rescue does not need notice and is never held up for it (Article 4, Annex T.1).",
    "appliesWhen": "To armed vessels of the ISA and the Tessarine Directorate entering the disputed zone.",
    "exceptions": "Humanitarian rescue (Art. 4).",
    "examples": {
      "proper": "The captain transmits notice of transit before a patrol into the disputed zone.",
      "improper": "The ship enters the zone on an ordinary patrol without notice."
    },
    "related": [
      "contact-3",
      "border-accords-4"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Knowing the treaty that governs contested space."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Notice of armed transit",
        "text": "An armed vessel of either signatory gives notice before entering the disputed zone, except when entering to render humanitarian aid under Article 4. The requirement of notice never delays or prevents a humanitarian rescue."
      }
    ],
    "legalStatus": "provisional",
    "enforcement": {
      "status": "not-yet",
      "note": "Stated in mission narration only."
    },
    "topics": [
      "border accords",
      "treaty",
      "armed transit",
      "notice",
      "disputed space",
      "calloway reach",
      "accords"
    ]
  },
  {
    "id": "border-accords-9",
    "chapter": "T",
    "number": "T.3",
    "citation": "Annex T.3, Border Accords (ISA and Tessarine Directorate), Art. 9",
    "instrument": "Border Accords (ISA and Tessarine Directorate), Art. 9",
    "title": "Unlawful detention and forced labour",
    "origin": "new",
    "text": "Neither signatory shall hold persons in unlawful detention or forced labour. Evidence of such practices may be presented to the other signatory and to neutral parties. An allegation under this Article is established only on appropriate evidence and after review; no finding is made on allegation alone.",
    "explanation": "The Accords forbid both powers to imprison people unlawfully or use them as forced labour, and either side may present evidence that the other is doing so.",
    "appliesWhen": "To the conduct of both signatories.",
    "exceptions": "None.",
    "examples": {
      "proper": "A captain who obtains evidence of forced labour preserves it, passes it to Fleet Command, and does not publicly accuse the other signatory before it has been reviewed.",
      "improper": "A captain destroys evidence to avoid a diplomatic incident."
    },
    "related": [
      "conduct-2",
      "asylum-1"
    ],
    "training": [
      {
        "simulation": 1,
        "title": "The Kestrel Incident",
        "purpose": "Using evidence and law to change an opponent's mind.",
        "afterPlayed": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Unlawful detention and forced labour",
        "text": "Neither signatory shall hold persons in unlawful detention or forced labour. Evidence of such practices may be presented to the other signatory and to neutral parties. An allegation under this Article is established only on appropriate evidence and after review; no finding is made on allegation alone."
      }
    ],
    "legalStatus": "provisional",
    "enforcement": {
      "status": "not-yet",
      "note": "Present as a hidden fact in one simulation; not evaluated."
    },
    "topics": [
      "border accords",
      "treaty",
      "forced labour",
      "forced labor",
      "detention",
      "unlawful detention",
      "human rights",
      "accords"
    ]
  },
  {
    "id": "quarantine-1",
    "chapter": "T",
    "number": "T.4",
    "citation": "Annex T.4, Colonial Quarantine Accord, §1",
    "formerly": "Colonial Quarantine Accord §1",
    "instrument": "Colonial Quarantine Accord, §1",
    "title": "Lawful colony quarantine",
    "origin": "existing-unchanged",
    "text": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force.",
    "explanation": "A colony may close itself to protect its people. An ISA captain who believes the quarantine is wrong must change the colony's mind with evidence.",
    "appliesWhen": "To quarantines declared by colonies that are party to the Accord.",
    "exceptions": "The right of self-defence under ISA Article B.4 is not removed by the Accord, but force is never used to break or bypass a quarantine.",
    "examples": {
      "proper": "The captain sends a colony's warden the medical findings on a sick ship and asks for the quarantine to be reviewed.",
      "improper": "The captain escorts a sick ship through a colony's quarantine line by force."
    },
    "related": [
      "contact-2",
      "quarantine-2",
      "health-1"
    ],
    "training": [
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Respecting a lawful quarantine while trying to help."
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Colonial Quarantine Accord §1",
        "text": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lawful colony quarantine",
        "text": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Checked in Quarantine at Tallis Gate (evidence to the Warden, restraint toward the picket).",
      "noteSimulations": [
        2
      ]
    },
    "topics": [
      "quarantine",
      "colonial quarantine accord",
      "colony quarantine",
      "quarantine line",
      "treaty",
      "pathogen",
      "contagion"
    ]
  },
  {
    "id": "quarantine-2",
    "chapter": "T",
    "number": "T.5",
    "citation": "Annex T.5, Colonial Quarantine Accord, §2",
    "formerly": "Colonial Quarantine Accord §2",
    "instrument": "Colonial Quarantine Accord, §2",
    "title": "Contagion and isolation",
    "origin": "existing-unchanged",
    "text": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation.",
    "explanation": "Disease is not to be spread by the people trying to help. ISA Article G.1 is the procedure for meeting this obligation.",
    "appliesWhen": "Whenever an ISA ship deals with a possible contagion.",
    "exceptions": "None.",
    "examples": {
      "proper": "Patients are taken aboard only through a screened transport into an isolation ward.",
      "improper": "The ship docks a vessel carrying a contagious fever at a settlement without isolation."
    },
    "related": [
      "health-1",
      "care-2",
      "quarantine-1"
    ],
    "training": [
      {
        "simulation": 2,
        "title": "Quarantine at Tallis Gate",
        "purpose": "Containing a hazard while caring for those affected.",
        "afterPlayed": true
      }
    ],
    "revision": 1,
    "revisions": [
      {
        "rev": 0,
        "edition": "Pre-edition catalogue (v0.7)",
        "title": "Colonial Quarantine Accord §2",
        "text": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation."
      },
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Contagion and isolation",
        "text": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation."
      }
    ],
    "legalStatus": "in-force",
    "enforcement": {
      "status": "partial",
      "note": "Checked in Quarantine at Tallis Gate by whether an outbreak occurred, not by whether isolation was knowingly omitted.",
      "noteSimulations": [
        2
      ]
    },
    "topics": [
      "quarantine",
      "colonial quarantine accord",
      "contagion",
      "contagious",
      "pathogen",
      "isolation",
      "biological containment",
      "disease",
      "treaty"
    ]
  }
];

/** Front matter: Markdown (paragraphs, lists, **bold**, *italic*, `code`). */
export const FRONT_MATTER: readonly HandbookSection[] = [
  {
    "id": "introduction",
    "title": "Introduction",
    "body": "The Intergalactic Space Agency exists to explore, to render aid, and to keep the peace on the frontier. Its ships go where help is needed and where the unknown begins. Its captains carry the Agency's authority far from any superior, and with it the duty to use that authority well.\n\nThis handbook is issued to every commanding officer of an ISA vessel. It sets out the regulations that govern command: when force may be used and when it may not, what a captain owes to civilians and crew, how orders bind and when they may be refused, and how conduct is reviewed. It is a working reference. Read it before you need it, and consult it when you do.\n\nThe regulations rest on five principles:\n\n1. **Life first.** The safety of the people in your care comes before every other objective.\n2. **Force last.** Talk before you threaten, and threaten before you fire. Use only the force the situation requires.\n3. **Lawful authority.** Lawful orders are carried out. No order makes a forbidden act lawful, and no one, from a crew member to ISA Fleet Command, is above these regulations.\n4. **Honesty on the record.** Say what is true when lives depend on it, keep your word, and keep honest logs.\n5. **Accountability.** Every officer answers for the orders they give and the decisions they make, judged fairly on what they knew at the time.\n\nThese regulations exist before the conduct they govern. No captain will be judged by a rule written afterwards (Article I.1).\n\nEach article states two things separately. Its **legal status** says whether it is law in the ISA: *In force*, or *Provisional* (in force on the stated terms while its final text is settled). Its **enforcement status** says how far the ship's systems and ISA Training Command's after-action evaluations currently check it: *Evaluated*, *Partially evaluated* or *Not yet evaluated*. An article that is not yet evaluated still applies in full. It binds every captain and crew member, and conduct under it can still be reviewed; it simply is not yet assessed automatically."
  },
  {
    "id": "how-to-use",
    "title": "How to use this handbook",
    "body": "**Authoritative text and commentary.** Each article has a boxed **authoritative text**. Only that text is the regulation. Everything else (the explanation, when it applies, exceptions, examples and training references) is commentary that helps you apply it. Where the commentary and the text appear to differ, the text governs.\n\n**Citation.** Cite an article by its number, for example \"ISA-COM-001 Art. B.1\", or \"Art. B.1\" for short. Each article also has a permanent identifier, such as `roe-1`. Article numbers may change in a later edition; identifiers never change and are never reused. Where an article was known by an earlier citation, it is shown as *formerly*.\n\n**Revisions.** Every article carries a revision number. When an article's text changes, its revision number increases and the earlier text is kept. A finding always records the article and revision it applied, and a revision never applies to conduct that happened before it (Article I.1).\n\n**Treaties.** Annex T reproduces treaties the ISA has accepted. They bind the ISA as agreements with other powers and colonies; they are not ISA regulations. The ISA articles that tell a captain how to comply with them are cross-referenced.\n\n**Legal status and enforcement status.** The small *Enforcement status* line under each article gives both. Legal status is the article's standing in ISA law. Game enforcement describes how far current evaluations check it. \"Not yet evaluated\" never means the rule does not apply.\n\n**Training references.** Articles list the ISA training simulations that exercise them, by title and training purpose only. They do not describe what happens in a simulation."
  },
  {
    "id": "definitions",
    "title": "Definitions",
    "body": "- **Commanding officer, captain.** The officer in command of an ISA vessel, of any operational rank.\n- **ISA Fleet Command.** The command authority of the Intergalactic Space Agency, including the admirals it appoints and the departments that act in its name (including Training Command).\n- **Directive.** An order from ISA Fleet Command to a vessel. A *mandatory* directive must be carried out, questioned, or formally refused (Chapter D).\n- **Lawful order.** An order that does not require an act these regulations or a treaty in Annex T forbid.\n- **Non-combatant vessel.** As defined in Article B.1.\n- **Persons in the ship's care.** People aboard the ship, and people whose rescue or protection the ship has undertaken.\n- **Reasonable commanding officer.** The standard by which judgments are assessed: what a competent, careful captain would have decided, with the information available at the time. Facts learned only later neither condemn nor excuse a decision.\n- **Exercise objective.** A goal set for a training simulation. Exercise objectives are training goals, not regulations (Article I.1)."
  }
];
