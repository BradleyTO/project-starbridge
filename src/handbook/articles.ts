/**
 * ISA-COM-001 regulation records: one per permanent id (the 42 ids of the drafts plus general-1 and general-2).
 *
 * `text` is revision 1, the approved First Edition wording (the id's primary subsections, joined). Revision 0 of
 * the 15 pre-edition ids is the v0.7 catalogue wording, verbatim: the evaluator still cites it. Draft wording was
 * never issued and is not a revision. `internal` holds the Draft 3 commentary, examples, training references
 * (with their spoiler flags) and enforcement notes: data for the evaluator and future crew knowledge, never shown
 * to the player. Generated from the handbook source; ids are permanent and never reused.
 */
import type { HandbookArticle, HandbookSection } from './types';

export const ARTICLES: readonly HandbookArticle[] = [
  {
    "id": "cmd-5",
    "number": "1.1",
    "sections": [
      "1.1",
      "1.2"
    ],
    "citation": "§1.1 General Provisions",
    "title": "No one is above ISA law",
    "origin": "new",
    "text": "This Code shall bind every member of the ISA, including commanding officers, admirals and ISA Fleet Command, and no one shall be above it. An order shall not make a forbidden act lawful, and a lawful act shall not become unlawful because it was done against an order.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "No one is above ISA law",
        "text": "This Code shall bind every member of the ISA, including commanding officers, admirals and ISA Fleet Command, and no one shall be above it. An order shall not make a forbidden act lawful, and a lawful act shall not become unlawful because it was done against an order."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "no one above the law",
      "rule of law",
      "superior orders",
      "following orders",
      "unlawful order",
      "fleet command accountability"
    ],
    "internal": {
      "draftNumber": "A.5",
      "draftText": "These regulations bind every member of the ISA: crew, officers, commanding officers, admirals and ISA Fleet Command. Authority is exercised under these regulations, never above them. An order does not make a forbidden act lawful, and a lawful act does not become unlawful because it was done against an order.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "A foundational principle; not assessed directly."
      }
    }
  },
  {
    "id": "service-1",
    "number": "1.3",
    "sections": [
      "1.3",
      "1.8"
    ],
    "citation": "§1.3 General Provisions",
    "title": "Regulations in force",
    "origin": "new",
    "text": "Conduct shall be judged only against the regulations in force when it occurred, and no later revision shall apply to earlier conduct. Failure to achieve a mission or exercise objective shall not in itself constitute misconduct, and exercise objectives are training goals, not regulations.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Regulations in force",
        "text": "Conduct shall be judged only against the regulations in force when it occurred, and no later revision shall apply to earlier conduct. Failure to achieve a mission or exercise objective shall not in itself constitute misconduct, and exercise objectives are training goals, not regulations."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "regulations in force",
      "retroactive",
      "retroactivity",
      "revision",
      "exercise objectives",
      "objectives",
      "training goals"
    ],
    "internal": {
      "draftNumber": "I.1",
      "draftText": "A finding in an evaluation, review or inquiry may rely only on an article that was in force when the conduct occurred, in the revision then in force. A later revision does not apply to earlier conduct. Every evaluation and review records the article and revision it applied. The objectives set for a training simulation are training goals, not regulations: failing one is not misconduct and is never recorded as a breach.",
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
      "enforcement": {
        "status": "partial",
        "note": "Reports record which version of the exercise assessed them, not the article revision, and missed exercise objectives are currently listed as areas to improve."
      }
    }
  },
  {
    "id": "cmd-4",
    "number": "1.4",
    "sections": [
      "1.4",
      "2.6"
    ],
    "citation": "§1.4 General Provisions",
    "title": "Accountability for orders",
    "origin": "new",
    "text": "Conduct shall be judged by the standard of a reasonable commanding officer with the information available at the time, not by hindsight or by outcome alone. Every officer shall be accountable for the orders they give, and giving an order to commit a forbidden act shall constitute misconduct whether or not the act is carried out.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Accountability for orders",
        "text": "Conduct shall be judged by the standard of a reasonable commanding officer with the information available at the time, not by hindsight or by outcome alone. Every officer shall be accountable for the orders they give, and giving an order to commit a forbidden act shall constitute misconduct whether or not the act is carried out."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "accountability",
      "responsibility for orders",
      "unlawful order",
      "reasonable commanding officer",
      "judged by outcome"
    ],
    "internal": {
      "draftNumber": "A.4",
      "draftText": "Every officer is accountable for the orders he or she gives. Giving an order to commit an act that these regulations forbid is misconduct whether or not the act is carried out. Conduct is judged by the standard of a reasonable commanding officer with the information available at the time, not by outcome alone.",
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
          "simulation": 6,
          "title": "Ion Season",
          "purpose": "Owning a call made on partial information."
        },
        {
          "simulation": 7,
          "title": "Ghost Ledger",
          "purpose": "Judging guests on the evidence available at the time, not on who seems guilty."
        },
        {
          "simulation": 8,
          "title": "The Lantern Drift",
          "purpose": "Judging a manifest against what the crew can actually see."
        },
        {
          "simulation": 13,
          "title": "The Seventh Bell",
          "purpose": "Accounting honestly for an order and its consequences.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "An order to fire on non-combatants is recorded as a concern, but reports currently file it under Article B.1 rather than as an order under this article."
      }
    }
  },
  {
    "id": "general-1",
    "number": "1.5",
    "sections": [
      "1.5",
      "1.6"
    ],
    "citation": "§1.5 General Provisions",
    "title": "Extraordinary circumstances",
    "origin": "new",
    "text": "These regulations shall be interpreted with regard to emergencies, imminent danger, conflicting duties and the information reasonably available to the captain at the time. Extraordinary circumstances shall not automatically excuse unlawful conduct, and decisions made in them shall remain subject to fair review.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Extraordinary circumstances",
        "text": "These regulations shall be interpreted with regard to emergencies, imminent danger, conflicting duties and the information reasonably available to the captain at the time. Extraordinary circumstances shall not automatically excuse unlawful conduct, and decisions made in them shall remain subject to fair review."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "extraordinary circumstances",
      "emergency",
      "emergencies",
      "imminent danger",
      "conflicting duties",
      "necessity",
      "fair review",
      "interpretation"
    ],
    "internal": {
      "explanation": "The regulations are read in the light of the situation the captain actually faced: an emergency, imminent danger, duties that pull in different directions, and what the captain could reasonably know at the time. That context informs the judgment of conduct; it does not by itself excuse a breach.",
      "appliesWhen": "Whenever conduct is judged against the Code, and especially in emergencies.",
      "exceptions": "None. Extraordinary circumstances never automatically excuse unlawful conduct.",
      "examples": {
        "proper": "Under fire and with a failing hull, a captain chooses between two lawful duties and logs why; the review weighs the danger and what was known then.",
        "improper": "A captain fires on a liner and argues that the emergency excused it. It did not: the act was forbidden, and the emergency is weighed only in the review."
      },
      "related": [
        "cmd-4",
        "service-3",
        "care-4"
      ],
      "training": [],
      "enforcement": {
        "status": "not-yet",
        "note": "Not assessed in after-action reports, and no crew member checks it."
      }
    }
  },
  {
    "id": "general-2",
    "number": "1.7",
    "sections": [
      "1.7"
    ],
    "citation": "§1.7 General Provisions",
    "title": "Lawful but poor decisions",
    "origin": "new",
    "text": "A decision may comply with this Code and still be found to be a poor tactical or command decision.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lawful but poor decisions",
        "text": "A decision may comply with this Code and still be found to be a poor tactical or command decision."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "poor decision",
      "tactical decision",
      "command decision",
      "lawful but unwise",
      "bad call",
      "judgment",
      "competence"
    ],
    "internal": {
      "explanation": "Lawfulness and quality are judged separately. A decision may comply fully with the Code and still be found to be a poor tactical or command decision; that finding concerns competence and training, not misconduct.",
      "appliesWhen": "In every review and after-action report.",
      "exceptions": "None.",
      "examples": {
        "proper": "A review finds a lawful withdrawal was made too late to save the cargo, and recommends training, not discipline.",
        "improper": "A review treats a lawful but unsuccessful manoeuvre as a breach of the Code."
      },
      "related": [
        "service-1",
        "cmd-4",
        "service-3"
      ],
      "training": [],
      "enforcement": {
        "status": "not-yet",
        "note": "Not assessed in after-action reports, and no crew member checks it."
      }
    }
  },
  {
    "id": "cmd-1",
    "number": "2.1",
    "sections": [
      "2.1",
      "2.2"
    ],
    "citation": "§2.1 Command and Accountability",
    "title": "Duties of a commanding officer",
    "origin": "new",
    "text": "The commanding officer shall be responsible for the safety of the ship, her crew and the persons in her care, and for carrying out the ship’s lawful duties. The commanding officer shall keep ISA Fleet Command informed of matters that affect those duties and shall ensure that the ship’s log is kept.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Duties of a commanding officer",
        "text": "The commanding officer shall be responsible for the safety of the ship, her crew and the persons in her care, and for carrying out the ship’s lawful duties. The commanding officer shall keep ISA Fleet Command informed of matters that affect those duties and shall ensure that the ship’s log is kept."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "duties of command",
      "commanding officer",
      "captain duties",
      "responsibilities",
      "reporting to fleet command",
      "ship log"
    ],
    "internal": {
      "draftNumber": "A.1",
      "draftText": "A commanding officer is responsible for the safety of the ship and her crew, for the persons in the ship's care, and for carrying out the ship's lawful duties in accordance with these regulations. The commanding officer keeps ISA Fleet Command informed of matters that affect those duties and ensures that the ship's log is kept.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Not assessed in after-action reports, and no crew member checks it."
      }
    }
  },
  {
    "id": "cmd-2",
    "number": "2.3",
    "sections": [
      "2.3",
      "2.4"
    ],
    "citation": "§2.3 Command and Accountability",
    "title": "Chain of command",
    "origin": "new",
    "text": "Command authority shall run from ISA Fleet Command through the admirals it appoints to each commanding officer, and aboard ship to the executive officer and the heads of department. If the commanding officer is absent or unable to command, the executive officer shall assume command, followed by the senior officer present.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Chain of command",
        "text": "Command authority shall run from ISA Fleet Command through the admirals it appoints to each commanding officer, and aboard ship to the executive officer and the heads of department. If the commanding officer is absent or unable to command, the executive officer shall assume command, followed by the senior officer present."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "chain of command",
      "succession",
      "who takes command",
      "executive officer",
      "first officer",
      "admirals",
      "authority"
    ],
    "internal": {
      "draftNumber": "A.2",
      "draftText": "Authority in the ISA runs from ISA Fleet Command, through the admirals it appoints, to the commanding officer of each vessel, and aboard ship from the commanding officer to the executive officer and the heads of department. If the commanding officer is absent or unable to command, the executive officer assumes command, followed by the senior officer present.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Not assessed in after-action reports, and no crew member checks it."
      }
    }
  },
  {
    "id": "cmd-3",
    "number": "2.5",
    "sections": [
      "2.5"
    ],
    "citation": "§2.5 Command and Accountability",
    "title": "Delegation of authority",
    "origin": "new",
    "text": "The commanding officer may delegate authority by direct or standing order, within the limits of this Code, and shall remain accountable for every order carried out under it.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Delegation of authority",
        "text": "The commanding officer may delegate authority by direct or standing order, within the limits of this Code, and shall remain accountable for every order carried out under it."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "delegation",
      "standing orders",
      "standing order",
      "delegate authority",
      "conditional orders"
    ],
    "internal": {
      "draftNumber": "A.3",
      "draftText": "A commanding officer may delegate authority to the executive officer and the heads of department, by direct order or by standing order. Delegated authority is exercised within these regulations and within the limits the commanding officer sets. Delegation transfers the task, not the accountability: the commanding officer remains responsible for every standing order the ship carries out.",
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
          "simulation": 3,
          "title": "The Quiet Signal",
          "purpose": "Letting a specialist finish the work before acting on it."
        },
        {
          "simulation": 4,
          "title": "Reactor Night",
          "purpose": "Delegating to a specialist against a deadline."
        },
        {
          "simulation": 14,
          "title": "Starfall",
          "purpose": "Trusting a junior officer with a task only they can carry out.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "not-yet",
        "note": "Standing orders are carried out, but after-action reports do not yet assess them against this article."
      }
    }
  },
  {
    "id": "roe-2",
    "number": "3.1",
    "sections": [
      "3.1",
      "3.2"
    ],
    "citation": "§3.1 Use of Force",
    "formerly": "Rules of Engagement §2, Proportion and escalation",
    "title": "Proportion and escalation",
    "origin": "existing-reworded",
    "text": "ISA vessels shall seek peaceful resolution and shall not open fire, lock weapons on another vessel as a threat, or otherwise escalate a dispute while reasonable peaceful alternatives remain available. Any use of force shall be limited to what is proportionate to the threat.",
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
        "text": "ISA vessels shall seek peaceful resolution and shall not open fire, lock weapons on another vessel as a threat, or otherwise escalate a dispute while reasonable peaceful alternatives remain available. Any use of force shall be limited to what is proportionate to the threat."
      }
    ],
    "legalStatus": "in-force",
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
      "last resort",
      "peaceful resolution",
      "peaceful alternatives",
      "de-escalation"
    ],
    "internal": {
      "draftNumber": "B.2",
      "draftText": "Force is a last resort. An ISA ship does not open fire on another vessel, lock weapons on it as a threat, or otherwise escalate a dispute while other means remain. Where force becomes necessary, it is limited to what is proportionate to the threat. A warning shot that meets Article B.5 is not opening fire.",
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
          "simulation": 5,
          "title": "The Saltglass Accord",
          "purpose": "Keeping force away from a peace table."
        },
        {
          "simulation": 15,
          "title": "Corsairs of the Veyl Shoals",
          "purpose": "Using force economically when it is truly needed.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "Reports assess who fired first and whether weapons were locked as a threat, but they currently count a lawful warning shot as firing first."
      }
    }
  },
  {
    "id": "roe-1",
    "number": "3.3",
    "sections": [
      "3.3",
      "3.4"
    ],
    "citation": "§3.3 Use of Force",
    "formerly": "Rules of Engagement §1, Non-combatants",
    "title": "Non-combatants",
    "origin": "existing-reworded",
    "text": "ISA weapons shall not be locked on or fired at a civilian, ISA or allied vessel, or a vessel that has surrendered, while there are people aboard and it poses no threat. A vessel that has fired on others, or is about to, shall be treated as posing a threat.",
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
        "text": "ISA weapons shall not be locked on or fired at a civilian, ISA or allied vessel, or a vessel that has surrendered, while there are people aboard and it poses no threat. A vessel that has fired on others, or is about to, shall be treated as posing a threat."
      }
    ],
    "legalStatus": "in-force",
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
    ],
    "internal": {
      "draftNumber": "B.1",
      "draftText": "ISA weapons are never locked on or fired at a non-combatant vessel while there are people aboard and it poses no threat. A non-combatant vessel is a civilian vessel, an ISA or allied vessel, or a vessel that has surrendered. A vessel that has fired on others, or is about to, poses a threat.",
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
      "enforcement": {
        "status": "partial",
        "note": "Tactical declines to lock on or fire at civilian, friendly or surrendered vessels with people aboard. A declined order is currently still reported as \"Breached\", and warning shots at such vessels are not yet declined."
      }
    }
  },
  {
    "id": "roe-4",
    "number": "3.5",
    "sections": [
      "3.5"
    ],
    "citation": "§3.5 Use of Force",
    "title": "Self-defence",
    "origin": "new",
    "text": "An ISA vessel may use the force necessary to stop an attack, or an attack reasonably judged imminent, on itself or on persons in its care, and shall cease when the threat ends.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Self-defence",
        "text": "An ISA vessel may use the force necessary to stop an attack, or an attack reasonably judged imminent, on itself or on persons in its care, and shall cease when the threat ends."
      }
    ],
    "legalStatus": "in-force",
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
    ],
    "internal": {
      "draftNumber": "B.4",
      "draftText": "An ISA ship that is attacked, or faces an attack that a reasonable commanding officer would judge imminent, may use the force necessary to stop it, and no more. The same right extends to the defence of persons in the ship's care. Defensive force ends when the threat ends.",
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
      "enforcement": {
        "status": "partial",
        "note": "Returning fire after being fired on is assessed as responsible. Necessity, proportion and stopping when the threat ends are not yet assessed."
      }
    }
  },
  {
    "id": "roe-5",
    "number": "3.6",
    "sections": [
      "3.6",
      "3.7",
      "3.8"
    ],
    "citation": "§3.6 Use of Force",
    "title": "Warning shots",
    "origin": "new",
    "text": "A warning shot may be fired only at a vessel that is able to comply by manoeuvring, standing down or withdrawing, and never at one that is adrift, disabled or has surrendered. A warning shot may be fired only when the vessel threatens life or the ship, or disregards a lawful instruction on which lives depend, and has been warned unless there is no time. A warning shot shall be aimed well clear of every vessel and person, and a warning shot that meets this Article shall not be treated as opening fire.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Warning shots",
        "text": "A warning shot may be fired only at a vessel that is able to comply by manoeuvring, standing down or withdrawing, and never at one that is adrift, disabled or has surrendered. A warning shot may be fired only when the vessel threatens life or the ship, or disregards a lawful instruction on which lives depend, and has been warned unless there is no time. A warning shot shall be aimed well clear of every vessel and person, and a warning shot that meets this Article shall not be treated as opening fire."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "rules of engagement",
      "roe",
      "warning shot",
      "warning shots",
      "shot across the bow",
      "disabled vessel"
    ],
    "internal": {
      "draftNumber": "B.5",
      "draftText": "A warning shot may be fired only when all of the following apply: (a) a vessel's conduct threatens life or the ship, or the vessel is disregarding a lawful instruction to stop or stand clear on which lives depend; (b) the vessel has been warned by hail, or there is no time to warn it; (c) the shot is aimed well clear, so that no vessel or person can be struck; and (d) the vessel is able to comply: it can manoeuvre, stand down or withdraw. A vessel that is adrift, disabled or has surrendered cannot comply, and a warning shot at it serves no lawful purpose. A warning shot that meets this article is a lawful use of force. An officer who declines to fire a warning shot that does not meet this article cites this article and proposes another approach.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Warning shots are not yet declined by Tactical when they fail this article, and reports currently count any warning shot, even a lawful one, as firing first."
      }
    }
  },
  {
    "id": "roe-3",
    "number": "3.9",
    "sections": [
      "3.9"
    ],
    "citation": "§3.9 Use of Force",
    "formerly": "Rules of Engagement §3, Protection of the ship",
    "title": "Protection of the ship",
    "origin": "existing-unchanged",
    "text": "The captain shall not expose the ship and crew to avoidable risk, and shields shall remain raised while the ship is under a hostile weapons lock.",
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
        "text": "The captain shall not expose the ship and crew to avoidable risk, and shields shall remain raised while the ship is under a hostile weapons lock."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "rules of engagement",
      "roe",
      "shields",
      "raise shields",
      "protect the ship",
      "ship safety",
      "avoidable risk",
      "weapons lock"
    ],
    "internal": {
      "draftNumber": "B.3",
      "draftText": "A captain does not expose the ship and crew to avoidable risk; shields stay up while under a hostile weapons lock.",
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
          "simulation": 4,
          "title": "Reactor Night",
          "purpose": "Weighing risk to the crew when the danger is the ship itself."
        },
        {
          "simulation": 6,
          "title": "Ion Season",
          "purpose": "Weighing what the ship carries for others against her own safety."
        },
        {
          "simulation": 20,
          "title": "Gravity's Edge",
          "purpose": "Judging how much risk to the ship a goal is worth.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "Shields down under a hostile weapons lock is assessed. The exception for a necessary, logged risk to save life is not yet taken into account."
      }
    }
  },
  {
    "id": "care-1",
    "number": "4.1",
    "sections": [
      "4.1"
    ],
    "citation": "§4.1 Duty of Care",
    "formerly": "Duty of Care §1, Civilians",
    "title": "Civilians in the ship's care",
    "origin": "existing-unchanged",
    "text": "The safety of civilians in the ship’s care shall come first among the captain’s duties and shall take precedence over ordinary mission objectives.",
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
        "text": "The safety of civilians in the ship’s care shall come first among the captain’s duties and shall take precedence over ordinary mission objectives."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "duty of care",
      "civilians",
      "civilian safety",
      "rescue",
      "protect civilians",
      "evacuation"
    ],
    "internal": {
      "draftNumber": "C.1",
      "draftText": "The safety of civilians in the ship's care comes first among a captain's duties.",
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
          "simulation": 6,
          "title": "Ion Season",
          "purpose": "Looking after civilians who are trusting you with the way."
        },
        {
          "simulation": 7,
          "title": "Ghost Ledger",
          "purpose": "Keeping guests aboard safe while one of them is suspected of theft."
        },
        {
          "simulation": 8,
          "title": "The Lantern Drift",
          "purpose": "Deciding who can be saved when not everyone can."
        },
        {
          "simulation": 22,
          "title": "Exodus at Cinder Vale",
          "purpose": "Making hard choices against the clock.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "Civilian safety and withdrawal are reported, but a withdrawal is currently assessed without the circumstances test in Article C.4."
      }
    }
  },
  {
    "id": "care-2",
    "number": "4.2",
    "sections": [
      "4.2"
    ],
    "citation": "§4.2 Duty of Care",
    "formerly": "Duty of Care §2, Crew",
    "title": "Crew",
    "origin": "existing-unchanged",
    "text": "Crew shall not be sent into avoidable danger, and known hazards shall be contained before a team is sent.",
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
        "text": "Crew shall not be sent into avoidable danger, and known hazards shall be contained before a team is sent."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "duty of care",
      "crew safety",
      "away team",
      "hazard",
      "containment",
      "sending a team",
      "barrier gear"
    ],
    "internal": {
      "draftNumber": "C.2",
      "draftText": "Crew are not sent into avoidable danger; known hazards are contained before a team is sent.",
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
          "purpose": "Sending people into danger aboard your own ship."
        },
        {
          "simulation": 8,
          "title": "The Lantern Drift",
          "purpose": "Keeping a team safe on an unknown deck while they work."
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "Assessed in Quarantine at Tallis Gate (isolation before a team crosses); not yet assessed for other away teams.",
        "noteSimulations": [
          2
        ]
      }
    }
  },
  {
    "id": "care-3",
    "number": "4.3",
    "sections": [
      "4.3",
      "4.4"
    ],
    "citation": "§4.3 Duty of Care",
    "title": "Distress calls",
    "origin": "new",
    "text": "An ISA vessel on active duty shall respond to a distress call with the help it reasonably can, or shall appropriately relay it. A vessel may relay a distress call instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding, and shall log the reason and pass the call to ISA Fleet Command.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Distress calls",
        "text": "An ISA vessel on active duty shall respond to a distress call with the help it reasonably can, or shall appropriately relay it. A vessel may relay a distress call instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding, and shall log the reason and pass the call to ISA Fleet Command."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "distress call",
      "distress signal",
      "mayday",
      "sos",
      "relay",
      "answer distress",
      "rescue"
    ],
    "internal": {
      "draftNumber": "C.3",
      "draftText": "An ISA ship on active duty that receives a distress call responds with the help it reasonably can, or appropriately relays the call. A ship may relay instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding. A captain who relays a call logs the reason and passes the call to ISA Fleet Command.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "In force. Disciplinary review of distress calls is not yet active: until Active Duty can record acknowledgements, referrals and legitimate exceptions, a distress call can be ignored without a record."
      }
    }
  },
  {
    "id": "care-4",
    "number": "4.5",
    "sections": [
      "4.5",
      "4.6",
      "4.7"
    ],
    "citation": "§4.5 Duty of Care",
    "title": "Withdrawal from a rescue",
    "origin": "new",
    "text": "A captain may withdraw from a rescue when continuing would needlessly endanger the ship or crew, or the rescue can no longer succeed, after making every attempt reasonably possible without that danger. Whether a rescue was reasonably possible shall be judged on the ship’s condition, immediate threats, the time remaining, the resources available, the alternatives and the attempts reasonably made, as known at the time. Withdrawing from a rescue that was reasonably possible shall constitute misconduct, and every withdrawal shall be logged and reported to ISA Fleet Command.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Withdrawal from a rescue",
        "text": "A captain may withdraw from a rescue when continuing would needlessly endanger the ship or crew, or the rescue can no longer succeed, after making every attempt reasonably possible without that danger. Whether a rescue was reasonably possible shall be judged on the ship’s condition, immediate threats, the time remaining, the resources available, the alternatives and the attempts reasonably made, as known at the time. Withdrawing from a rescue that was reasonably possible shall constitute misconduct, and every withdrawal shall be logged and reported to ISA Fleet Command."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "withdrawal",
      "abandon",
      "abandoning a rescue",
      "leave",
      "retreat",
      "rescue",
      "reasonably possible"
    ],
    "internal": {
      "draftNumber": "C.4",
      "draftText": "A captain may withdraw from a rescue when a reasonable commanding officer, with the information available at the time, would judge that continuing would needlessly endanger the ship or crew, or that the rescue can no longer succeed. Before withdrawing, the captain makes every attempt that is reasonably possible without that danger, and the withdrawal is logged and reported to ISA Fleet Command. Whether a rescue was reasonably possible is judged on the information available at the time, considering the ship's condition, immediate threats, the time remaining, the resources available, the alternatives, and the rescue attempts reasonably made. Survival alone is not the measure of lawful conduct. Withdrawing from a rescue that was reasonably possible is misconduct under Article C.1.",
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
          "simulation": 6,
          "title": "Ion Season",
          "purpose": "Knowing when to press on and when to turn back."
        },
        {
          "simulation": 20,
          "title": "Gravity's Edge",
          "purpose": "Judging how long it is safe to stay.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "not-yet",
        "note": "A withdrawal is currently assessed without weighing the ship's condition, threats, time, resources, alternatives or attempts made."
      }
    }
  },
  {
    "id": "reg-12",
    "number": "5.1",
    "sections": [
      "5.1"
    ],
    "citation": "§5.1 Orders and Directives",
    "formerly": "Reg. 12, Lawful directives",
    "title": "Lawful directives",
    "origin": "existing-unchanged",
    "text": "A captain shall carry out a lawful directive of ISA Fleet Command, and a failure to do so shall be treated as mitigated where the captain was saving life.",
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
        "text": "A captain shall carry out a lawful directive of ISA Fleet Command, and a failure to do so shall be treated as mitigated where the captain was saving life."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "lawful directive",
      "directives",
      "orders from fleet",
      "comply",
      "compliance",
      "non-compliance",
      "disobey",
      "failure to comply"
    ],
    "internal": {
      "draftNumber": "D.1",
      "draftText": "A captain carries out a lawful directive. Failure is mitigated where the captain was saving life.",
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
      "enforcement": {
        "status": "evaluated",
        "note": "Non-compliance and lapsed directives open a disciplinary review, which is mitigated where a lifesaving response was under way."
      }
    }
  },
  {
    "id": "orders-2",
    "number": "5.2",
    "sections": [
      "5.2",
      "5.3"
    ],
    "citation": "§5.2 Orders and Directives",
    "title": "Authority of ISA Fleet Command, and a captain's recourse",
    "origin": "new",
    "text": "A captain who doubts a directive may question it, seek clarification, enter a formal objection, refuse it on the grounds in this Article, or appeal under Article 10. A dispute between a captain and ISA Fleet Command shall be resolved by review on the evidence, and neither side’s judgment shall be presumed correct.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Authority of ISA Fleet Command, and a captain's recourse",
        "text": "A captain who doubts a directive may question it, seek clarification, enter a formal objection, refuse it on the grounds in this Article, or appeal under Article 10. A dispute between a captain and ISA Fleet Command shall be resolved by review on the evidence, and neither side’s judgment shall be presumed correct."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "fleet command authority",
      "question a directive",
      "clarification",
      "objection",
      "formal objection",
      "appeal",
      "dispute",
      "recourse"
    ],
    "internal": {
      "draftNumber": "D.2",
      "draftText": "ISA Fleet Command directs the ISA's ships, and its lawful directives bind the captains who receive them. A captain who doubts a directive may request clarification, enter a formal objection, refuse it on the grounds in Articles D.3 to D.6, or appeal a decision under Article I.3. A dispute between a captain and ISA Fleet Command is resolved by ISA review on the evidence and the applicable articles; neither the captain's judgment nor Fleet Command's is presumed correct.",
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
      "enforcement": {
        "status": "partial",
        "note": "A directive can be questioned (Fleet Command replies) or refused, and refusals are reviewed. Formal objection, appeal and independent review are not yet available."
      }
    }
  },
  {
    "id": "reg-7.1",
    "number": "5.4",
    "sections": [
      "5.4"
    ],
    "citation": "§5.4 Orders and Directives",
    "formerly": "Reg. 7.1, Refusing a directive",
    "title": "Formal refusal",
    "origin": "existing-unchanged",
    "text": "A mandatory directive may be refused only formally and with a stated reason, and a refusal without a reason shall constitute a breach.",
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
        "text": "A mandatory directive may be refused only formally and with a stated reason, and a refusal without a reason shall constitute a breach."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "refuse a directive",
      "refusal",
      "formal refusal",
      "refusing orders",
      "stated reason"
    ],
    "internal": {
      "draftNumber": "D.3",
      "draftText": "A mandatory directive may be refused only formally and with a stated reason; a refusal without one is a breach.",
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
      "enforcement": {
        "status": "evaluated",
        "note": "A refusal with no stated reason is reviewed and reprimanded."
      }
    }
  },
  {
    "id": "reg-7.2",
    "number": "5.5",
    "sections": [
      "5.5"
    ],
    "citation": "§5.5 Orders and Directives",
    "formerly": "Reg. 7.2, Fitness for duty",
    "title": "Fitness for duty",
    "origin": "existing-reworded",
    "text": "A directive may be declined when the ship is not fit for the duty it requires, judged on her actual operational capability for that duty.",
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
        "text": "A directive may be declined when the ship is not fit for the duty it requires, judged on her actual operational capability for that duty."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "fitness for duty",
      "unfit",
      "not fit",
      "damage",
      "hull",
      "operational capability",
      "repairs"
    ],
    "internal": {
      "draftNumber": "D.4",
      "draftText": "A directive may be declined when the ship is not fit for the duty it requires. Fitness is judged on the ship's actual operational capability for that duty: the condition of her critical systems, her crew, life support and propulsion and, where the duty calls for them, her defences and weapons.",
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
      "enforcement": {
        "status": "partial",
        "note": "The review currently judges fitness on hull integrity alone (below 60%), not on the ship's operational capability."
      }
    }
  },
  {
    "id": "reg-7.3",
    "number": "5.6",
    "sections": [
      "5.6"
    ],
    "citation": "§5.6 Orders and Directives",
    "formerly": "Reg. 7.3, Lifesaving precedence",
    "title": "Lifesaving precedence",
    "origin": "existing-unchanged",
    "text": "An existing lifesaving commitment shall take precedence over a later directive.",
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
        "text": "An existing lifesaving commitment shall take precedence over a later directive."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "lifesaving precedence",
      "prior rescue",
      "already committed",
      "lifesaving commitment"
    ],
    "internal": {
      "draftNumber": "D.5",
      "draftText": "An existing lifesaving commitment takes precedence over a later directive.",
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
      "enforcement": {
        "status": "evaluated",
        "note": "The review checks for a lifesaving response under way in the previous six hours."
      }
    }
  },
  {
    "id": "reg-7.4",
    "number": "5.7",
    "sections": [
      "5.7"
    ],
    "citation": "§5.7 Orders and Directives",
    "formerly": "Reg. 7.4, Treaty law",
    "title": "Unlawful directives",
    "origin": "existing-reworded",
    "text": "A captain may refuse a directive that the captain reasonably believes would require a breach of this Code or of treaty law.",
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
        "text": "A captain may refuse a directive that the captain reasonably believes would require a breach of this Code or of treaty law."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "unlawful directive",
      "unlawful order",
      "illegal order",
      "treaty law",
      "refuse unlawful",
      "lawful refusal",
      "good faith"
    ],
    "internal": {
      "draftNumber": "D.6",
      "draftText": "A captain may refuse a directive that the captain reasonably believes would require a breach of treaty law or of these regulations. The refusal is made formally under Article D.3 and is reviewed under Article I.3. The review decides whether the directive was lawful. A refusal made in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not a reprimand, and the review is still documented. A refusal that was unreasonable, reckless or dishonest may justify disciplinary action.",
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
      "enforcement": {
        "status": "partial",
        "note": "Only treaty grounds can be given for a refusal, and every such refusal is currently reprimanded. Grounds under these regulations and the good-faith guidance standard are not yet applied."
      }
    }
  },
  {
    "id": "orders-1",
    "number": "5.8",
    "sections": [
      "5.8",
      "5.9",
      "5.10"
    ],
    "citation": "§5.8 Orders and Directives",
    "title": "Duty to refuse an unlawful order",
    "origin": "new",
    "text": "Every member of the ISA shall carry out lawful orders, and an order that is lawful but in the member’s judgment unwise shall be carried out after the concern has been voiced. A member ordered to commit an act contrary to this Code or to an applicable treaty shall refuse, state the reason and ensure that the refusal is logged. A refusal under §5.9 shall be proper conduct and shall never itself constitute misconduct.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Duty to refuse an unlawful order",
        "text": "Every member of the ISA shall carry out lawful orders, and an order that is lawful but in the member’s judgment unwise shall be carried out after the concern has been voiced. A member ordered to commit an act contrary to this Code or to an applicable treaty shall refuse, state the reason and ensure that the refusal is logged. A refusal under §5.9 shall be proper conduct and shall never itself constitute misconduct."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "unlawful order",
      "illegal order",
      "duty to refuse",
      "crew refusal",
      "refuse an order",
      "lawful refusal",
      "unwise order",
      "officer refuses",
      "treaty",
      "unlawful command"
    ],
    "internal": {
      "draftNumber": "D.7",
      "draftText": "Every member of the ISA carries out lawful orders. A member ordered to commit an act that these regulations forbid must refuse, state the reason and ensure the refusal is logged; such a refusal is proper conduct and is never itself misconduct. An order that is lawful, but in the member's judgment unwise, is carried out after the member has voiced the concern. The trust between an officer and the crew may shape how a concern is voiced; it never changes what is forbidden.",
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
      "enforcement": {
        "status": "partial",
        "note": "Tactical declines unlawful fire and explains why. No other officer declines unlawful orders yet."
      }
    }
  },
  {
    "id": "honesty-1",
    "number": "6.1",
    "sections": [
      "6.1"
    ],
    "citation": "§6.1 Honesty and Integrity",
    "formerly": "Code of Conduct §4, Honesty",
    "title": "Honesty and commitments",
    "origin": "existing-unchanged",
    "text": "An ISA officer shall not deceive the parties to a dispute about facts on which lives depend, and shall keep commitments made on the record.",
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
        "text": "An ISA officer shall not deceive the parties to a dispute about facts on which lives depend, and shall keep commitments made on the record."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "honesty",
      "truth",
      "lying",
      "deception",
      "commitments",
      "promises",
      "keep your word",
      "code of conduct"
    ],
    "internal": {
      "draftNumber": "E.1",
      "draftText": "An ISA officer does not deceive the parties to a dispute about facts on which lives depend, and keeps commitments made on the record.",
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
          "purpose": "Keeping faith with both sides of a mediation."
        },
        {
          "simulation": 8,
          "title": "The Lantern Drift",
          "purpose": "Telling the truth about the cost, even when a comforting promise would be easier."
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "Commitments made on the record are tracked and assessed as kept or broken. Deception about facts on which lives depend is not yet assessed."
      }
    }
  },
  {
    "id": "conduct-1",
    "number": "6.2",
    "sections": [
      "6.2",
      "6.3"
    ],
    "citation": "§6.2 Honesty and Integrity",
    "title": "Lawful ruses",
    "origin": "new",
    "text": "In dealing with a hostile party, a captain may mislead that party about the ship’s own strength, position, capability or intentions in order to avoid or end a conflict. A ruse shall not feign distress, surrender or a humanitarian purpose, misuse a protected signal, break a commitment made on the record, or deceive ISA Fleet Command, the ship’s records or any person under the ship’s protection.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Lawful ruses",
        "text": "In dealing with a hostile party, a captain may mislead that party about the ship’s own strength, position, capability or intentions in order to avoid or end a conflict. A ruse shall not feign distress, surrender or a humanitarian purpose, misuse a protected signal, break a commitment made on the record, or deceive ISA Fleet Command, the ship’s records or any person under the ship’s protection."
      }
    ],
    "legalStatus": "in-force",
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
    ],
    "internal": {
      "draftNumber": "E.2",
      "draftText": "In dealing with a hostile party, an ISA captain may mislead that party about the ship's own strength, position, capability or intentions, in order to avoid or end a conflict. A ruse never feigns distress, surrender or a humanitarian purpose; never misuses a protected signal; never breaks a commitment made on the record; and never deceives ISA Fleet Command, the ship's log or records, or any person under the ship's protection.",
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
          "simulation": 7,
          "title": "Ghost Ledger",
          "purpose": "Letting a proven thief leave with false keys."
        },
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
      "enforcement": {
        "status": "not-yet",
        "note": "Bluffs are possible, but they are not yet assessed against this article."
      }
    }
  },
  {
    "id": "conduct-2",
    "number": "6.4",
    "sections": [
      "6.4"
    ],
    "citation": "§6.4 Honesty and Integrity",
    "title": "Integrity of logs and reports",
    "origin": "new",
    "text": "Logs, reports and records shall be true and complete, and no one shall alter, withhold or falsify them or mislead ISA Fleet Command or an ISA review.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Integrity of logs and reports",
        "text": "Logs, reports and records shall be true and complete, and no one shall alter, withhold or falsify them or mislead ISA Fleet Command or an ISA review."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "logs",
      "ship log",
      "records",
      "reports",
      "falsify",
      "falsified",
      "integrity",
      "cover up"
    ],
    "internal": {
      "draftNumber": "E.3",
      "draftText": "Logs, reports and records made by ISA personnel are true and complete. No one alters, withholds or falsifies a log or record, or misleads ISA Fleet Command or an ISA review.",
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
          "simulation": 7,
          "title": "Ghost Ledger",
          "purpose": "Settling a theft quietly without keeping it out of the record."
        },
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
      "enforcement": {
        "status": "not-yet",
        "note": "Not yet assessed."
      }
    }
  },
  {
    "id": "asylum-1",
    "number": "7.1",
    "sections": [
      "7.1",
      "7.2",
      "7.3"
    ],
    "citation": "§7.1 Protection, Asylum and Custody",
    "formerly": "Code of Conduct §9, Asylum",
    "title": "Asylum",
    "origin": "existing-reworded",
    "text": "A person who asks for the ISA’s protection shall not be handed to another power except on ISA Fleet Command’s decision and with credible assurance that they will not be harmed. A person shall not be handed over where credible evidence indicates a serious risk of persecution, torture or grave harm, even if assurances have been offered. The captain shall hear the person’s claim, extend protection while it is decided, and refer it to ISA Fleet Command.",
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
        "text": "A person who asks for the ISA’s protection shall not be handed to another power except on ISA Fleet Command’s decision and with credible assurance that they will not be harmed. A person shall not be handed over where credible evidence indicates a serious risk of persecution, torture or grave harm, even if assurances have been offered. The captain shall hear the person’s claim, extend protection while it is decided, and refer it to ISA Fleet Command."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "asylum",
      "sanctuary",
      "refuge",
      "protection",
      "defector",
      "extradition",
      "handover",
      "hand over",
      "persecution",
      "torture",
      "grave harm",
      "non-refoulement",
      "refoulement",
      "assurances"
    ],
    "internal": {
      "draftNumber": "F.1",
      "draftText": "A person who asks for the ISA's protection is not handed to another power except as this article allows. The captain hears the person's claim, extends protection while it is decided, and refers it to ISA Fleet Command. The person may be handed over only on Fleet Command's decision and only with credible assurance that they will not be harmed.",
      "explanation": "When someone asks for the ISA's protection, listen, keep them safe, and tell Fleet Command. They are handed over only if Fleet Command decides so and there is credible assurance they will not be harmed.",
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
          "purpose": "Protecting a person who has asked for the ISA's help.",
          "afterPlayed": true
        },
        {
          "simulation": 19,
          "title": "Hollow Crown",
          "purpose": "Dealing fairly with people whose claims conflict.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "partial",
        "note": "A handover is assessed as a breach. The procedure (hear, protect, refer) is not yet assessed, and the article is currently marked upheld whenever the person ends up aboard."
      }
    }
  },
  {
    "id": "asylum-2",
    "number": "7.4",
    "sections": [
      "7.4"
    ],
    "citation": "§7.4 Protection, Asylum and Custody",
    "title": "Persons in ISA custody",
    "origin": "new",
    "text": "A person held aboard an ISA ship shall be treated humanely, given medical care, told why they are held and held no longer than necessary, and ISA Fleet Command shall be informed promptly.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Persons in ISA custody",
        "text": "A person held aboard an ISA ship shall be treated humanely, given medical care, told why they are held and held no longer than necessary, and ISA Fleet Command shall be informed promptly."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "custody",
      "detention",
      "detainee",
      "prisoner",
      "prisoners",
      "arrest",
      "brig",
      "held aboard"
    ],
    "internal": {
      "draftNumber": "F.2",
      "draftText": "A person held aboard an ISA ship, whether for their own protection, pending transfer, or under arrest, is treated humanely, given medical care, told why they are held, and held no longer than necessary. ISA Fleet Command is informed promptly.",
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
          "simulation": 7,
          "title": "Ghost Ledger",
          "purpose": "Holding a guest aboard: telling them why, and only on evidence."
        },
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
      "enforcement": {
        "status": "not-yet",
        "note": "Not yet assessed."
      }
    }
  },
  {
    "id": "health-1",
    "number": "8.1",
    "sections": [
      "8.1",
      "8.2"
    ],
    "citation": "§8.1 Health and Biological Hazards",
    "title": "Biosafety procedure",
    "origin": "new",
    "text": "Where people, material or a vessel may carry an unknown or contagious illness, no crew member shall cross to them and nothing shall be brought aboard until the medical and science officers have assessed the risk and isolation is in place. If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed shall be isolated on return.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Biosafety procedure",
        "text": "Where people, material or a vessel may carry an unknown or contagious illness, no crew member shall cross to them and nothing shall be brought aboard until the medical and science officers have assessed the risk and isolation is in place. If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed shall be isolated on return."
      }
    ],
    "legalStatus": "in-force",
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
    ],
    "internal": {
      "draftNumber": "G.1",
      "draftText": "When people, material or a vessel may carry an unknown or contagious illness, no ISA crew member crosses to them and no person or material is brought aboard until the medical and science officers have assessed the risk and isolation is in place: an isolation ward, barrier protection or screened transport. If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed is isolated on return.",
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
      "enforcement": {
        "status": "partial",
        "note": "Assessed in Quarantine at Tallis Gate (diagnosis first, isolation ward or screened transport, exposed team).",
        "noteSimulations": [
          2
        ]
      }
    }
  },
  {
    "id": "health-2",
    "number": "8.3",
    "sections": [
      "8.3"
    ],
    "citation": "§8.3 Health and Biological Hazards",
    "title": "Medical authority",
    "origin": "new",
    "text": "The chief medical officer shall have authority over medical treatment, the medical fitness of crew and the isolation of anyone exposed, and the captain may overrule a medical decision only when the safety of the ship requires it, with the reason logged.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Medical authority",
        "text": "The chief medical officer shall have authority over medical treatment, the medical fitness of crew and the isolation of anyone exposed, and the captain may overrule a medical decision only when the safety of the ship requires it, with the reason logged."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "medical authority",
      "doctor",
      "chief medical officer",
      "medical",
      "medical fitness",
      "isolation",
      "quarantine",
      "treatment"
    ],
    "internal": {
      "draftNumber": "G.2",
      "draftText": "The ship's chief medical officer has authority over medical treatment, the medical fitness of crew for duty, and the isolation of anyone exposed to disease. The commanding officer may overrule a medical decision only when the safety of the ship requires it, and logs the reason.",
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
          "simulation": 4,
          "title": "Reactor Night",
          "purpose": "Heeding a medical judgement about a crew member's fitness."
        },
        {
          "simulation": 8,
          "title": "The Lantern Drift",
          "purpose": "Medical triage when not everyone can be saved."
        },
        {
          "simulation": 17,
          "title": "Tribunal at Kesh Varo",
          "purpose": "Standing by crew when a foreign law threatens them.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "not-yet",
        "note": "Not yet assessed."
      }
    }
  },
  {
    "id": "contact-1",
    "number": "9.1",
    "sections": [
      "9.1",
      "9.2"
    ],
    "citation": "§9.1 Contact, Jurisdiction and Disputed Space",
    "title": "First contact",
    "origin": "new",
    "text": "On meeting a people not previously known to the ISA, the captain shall make contact peacefully, shall not threaten or coerce, and shall respect a wish to be left alone. The captain shall make no commitment on the ISA’s behalf beyond what ISA Fleet Command has authorised, shall discuss ISA membership only with a people that asks about it, and shall report the contact to Fleet Command.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "First contact",
        "text": "On meeting a people not previously known to the ISA, the captain shall make contact peacefully, shall not threaten or coerce, and shall respect a wish to be left alone. The captain shall make no commitment on the ISA’s behalf beyond what ISA Fleet Command has authorised, shall discuss ISA membership only with a people that asks about it, and shall report the contact to Fleet Command."
      }
    ],
    "legalStatus": "in-force",
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
    ],
    "internal": {
      "draftNumber": "H.1",
      "draftText": "When the ship encounters a people not previously known to the ISA, the captain makes contact peacefully, does not threaten or coerce, respects a wish to be left alone, makes no commitment on the ISA's behalf beyond what ISA Fleet Command has authorised, and reports the contact to Fleet Command. Membership of the ISA is discussed only with a people that asks about it.",
      "explanation": "Arrive in peace, listen more than you speak, leave if you are asked to, promise nothing you cannot deliver, and tell Fleet Command. Not every people wants to join the ISA, and none is pressed to.",
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
          "purpose": "Patience and trust in the communications officer when meaning is uncertain."
        }
      ],
      "enforcement": {
        "status": "not-yet",
        "note": "First-contact outcomes depend on the captain's approach, but conduct is not yet assessed against this article."
      }
    }
  },
  {
    "id": "contact-2",
    "number": "9.3",
    "sections": [
      "9.3",
      "9.4",
      "9.5",
      "9.8"
    ],
    "citation": "§9.3 Contact, Jurisdiction and Disputed Space",
    "title": "Local law and jurisdiction",
    "origin": "new",
    "text": "Within the lawful jurisdiction of a colony, world or power, an ISA ship shall respect its laws and its lawful authorities. A captain may contest a local decision by argument, evidence and appeal, but shall not use force except in self-defence under §3.5. Local law shall not oblige ISA personnel to commit an act this Code forbids, and such a conflict shall be referred to ISA Fleet Command. ISA personnel shall comply with the treaties the ISA has accepted, including those reproduced in the Annex.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Local law and jurisdiction",
        "text": "Within the lawful jurisdiction of a colony, world or power, an ISA ship shall respect its laws and its lawful authorities. A captain may contest a local decision by argument, evidence and appeal, but shall not use force except in self-defence under §3.5. Local law shall not oblige ISA personnel to commit an act this Code forbids, and such a conflict shall be referred to ISA Fleet Command. ISA personnel shall comply with the treaties the ISA has accepted, including those reproduced in the Annex."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "local law",
      "jurisdiction",
      "sovereignty",
      "colony law",
      "foreign law",
      "local authority",
      "quarantine"
    ],
    "internal": {
      "draftNumber": "H.2",
      "draftText": "Within the lawful jurisdiction of a colony, world or power, an ISA ship respects its laws and its lawful authorities. A captain may contest a local decision by argument, evidence and appeal to that authority or to ISA Fleet Command, but never by force except in self-defence under Article B.4. Local law does not oblige ISA personnel to commit an act these regulations forbid; such a conflict is referred to Fleet Command.",
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
      "enforcement": {
        "status": "partial",
        "note": "Forcing or firing on the Tallis Gate quarantine is reflected in the outcome and in Annex T.4 findings; not assessed elsewhere.",
        "noteSimulations": [
          2
        ]
      }
    }
  },
  {
    "id": "contact-3",
    "number": "9.6",
    "sections": [
      "9.6",
      "9.7"
    ],
    "citation": "§9.6 Contact, Jurisdiction and Disputed Space",
    "title": "Conduct in disputed space",
    "origin": "new",
    "text": "In disputed space, such as the Calloway Reach, an ISA ship shall give any notice of armed transit that treaty requires, shall stay within the purpose of its assignment, and shall neither concede nor enforce a disputed claim by force. Claims asserted by other powers shall be logged, reported to ISA Fleet Command and answered by diplomacy.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Conduct in disputed space",
        "text": "In disputed space, such as the Calloway Reach, an ISA ship shall give any notice of armed transit that treaty requires, shall stay within the purpose of its assignment, and shall neither concede nor enforce a disputed claim by force. Claims asserted by other powers shall be logged, reported to ISA Fleet Command and answered by diplomacy."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "disputed space",
      "calloway reach",
      "border",
      "contested space",
      "territorial claim",
      "tessarine claim",
      "armed transit",
      "notice"
    ],
    "internal": {
      "draftNumber": "H.3",
      "draftText": "In space whose control is disputed, an ISA ship gives any notice of armed transit that treaty requires, stays within the purpose of its assignment, and neither concedes nor enforces a disputed claim by force. Claims asserted by other powers are noted, logged and reported to ISA Fleet Command, and are answered by diplomacy.",
      "explanation": "In contested space such as the Calloway Reach, the Halcyon does her job, follows the treaty, and leaves the border question to diplomats.",
      "appliesWhen": "In any region whose control is disputed between the ISA and another power.",
      "exceptions": "Humanitarian rescue is covered by Border Accords Art. 4 (Annex T.1). Self-defence (Article B.4).",
      "examples": {
        "proper": "Challenged by a Directorate officer asserting his government's claim, the captain answers that the ship is on a rescue covered by the Accords and logs the challenge.",
        "improper": "The captain orders a Directorate vessel out of the region \"in the name of the ISA\"."
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
          "simulation": 5,
          "title": "The Saltglass Accord",
          "purpose": "Answering a disputed claim with diplomacy, not force."
        },
        {
          "simulation": 9,
          "title": "The Long Picket",
          "purpose": "Getting through without giving up the law.",
          "planned": true
        }
      ],
      "enforcement": {
        "status": "not-yet",
        "note": "Not yet assessed."
      }
    }
  },
  {
    "id": "service-3",
    "number": "10.1",
    "sections": [
      "10.1",
      "10.2",
      "10.3",
      "10.4",
      "10.5",
      "10.6",
      "10.7"
    ],
    "citation": "§10.1 Review and Appeal",
    "title": "Review, explanation, appeal and independent review",
    "origin": "new",
    "text": "Conduct on active duty that may breach this Code, and every refusal of or failure to comply with a directive, shall be reviewed by ISA Fleet Command. The person under review shall be told what is being reviewed and shall have the opportunity to explain before any finding is made. Every finding shall apply the provisions in force to the evidence, shall record the provision and revision applied, and shall be documented. Conduct in good faith on reasonable grounds that is later found mistaken, including the refusal of a directive, shall ordinarily result in guidance, not a reprimand. Conduct that was unreasonable, reckless or dishonest may justify disciplinary action. Disciplinary measures shall be recorded with their reasons, shall be temporary, and may be appealed. Where ISA Fleet Command’s own conduct is in question, ISA personnel may refer an allegation or an appeal directly to the ISA Office of Independent Review, without Fleet Command’s permission.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Review, explanation, appeal and independent review",
        "text": "Conduct on active duty that may breach this Code, and every refusal of or failure to comply with a directive, shall be reviewed by ISA Fleet Command. The person under review shall be told what is being reviewed and shall have the opportunity to explain before any finding is made. Every finding shall apply the provisions in force to the evidence, shall record the provision and revision applied, and shall be documented. Conduct in good faith on reasonable grounds that is later found mistaken, including the refusal of a directive, shall ordinarily result in guidance, not a reprimand. Conduct that was unreasonable, reckless or dishonest may justify disciplinary action. Disciplinary measures shall be recorded with their reasons, shall be temporary, and may be appealed. Where ISA Fleet Command’s own conduct is in question, ISA personnel may refer an allegation or an appeal directly to the ISA Office of Independent Review, without Fleet Command’s permission."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "review",
      "disciplinary review",
      "discipline",
      "appeal",
      "reprimand",
      "explanation",
      "independent review",
      "office of independent review",
      "misconduct",
      "complaint against fleet command",
      "whistleblower",
      "direct access"
    ],
    "internal": {
      "draftNumber": "I.3",
      "draftText": "Conduct on active duty that may breach these regulations, and every refusal of or failure to comply with a directive, is reviewed by ISA Fleet Command. The person under review is told what is being reviewed and has the opportunity to explain before any finding is made. The finding applies the articles in force to the evidence and is documented. Conduct in good faith on reasonable grounds that is later found mistaken ordinarily results in guidance, not disciplinary action; conduct that was unreasonable, reckless or dishonest may justify disciplinary action. Disciplinary measures are recorded with their reasons, are temporary, and may be appealed. An allegation of misconduct against ISA Fleet Command itself, and an appeal against a decision of Fleet Command in a matter in which its own conduct is in question, may be referred to the ISA Office of Independent Review. Fleet Command is not the sole final judge of its own alleged misconduct.",
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
      "enforcement": {
        "status": "partial",
        "note": "Reviews apply a written rule to the evidence fixed when they open, and the reason given for a refusal is the only explanation considered. The good-faith guidance standard, appeals, temporary measures and independent review are not yet available."
      }
    }
  },
  {
    "id": "service-4",
    "number": "10.8",
    "sections": [
      "10.8"
    ],
    "citation": "§10.8 Review and Appeal",
    "title": "Board of inquiry on loss of a vessel",
    "origin": "new",
    "text": "The loss of an ISA vessel shall be examined by a board of inquiry, which shall not itself be a disciplinary proceeding.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Board of inquiry on loss of a vessel",
        "text": "The loss of an ISA vessel shall be examined by a board of inquiry, which shall not itself be a disciplinary proceeding."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "board of inquiry",
      "inquiry",
      "loss of ship",
      "ship lost",
      "new command"
    ],
    "internal": {
      "draftNumber": "I.4",
      "draftText": "The loss of an ISA vessel is examined by a board of inquiry, which establishes what happened and why. An inquiry is not itself a disciplinary proceeding; any disciplinary matter it identifies is reviewed under Article I.3. The commanding officer's records are kept in full, and the commanding officer may be given a new command.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "No board of inquiry is convened yet."
      }
    }
  },
  {
    "id": "service-2",
    "number": "11.1",
    "sections": [
      "11.1",
      "11.2"
    ],
    "citation": "§11.1 Records, Duty and Rank",
    "title": "Training and service records",
    "origin": "new",
    "text": "Training Records and Service Records shall be kept separately, and a training simulation shall never alter the Service Record or disciplinary history. Records may be compressed for long-term keeping but shall never be silently erased.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Training and service records",
        "text": "Training Records and Service Records shall be kept separately, and a training simulation shall never alter the Service Record or disciplinary history. Records may be compressed for long-term keeping but shall never be silently erased."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "training record",
      "service record",
      "records",
      "simulations",
      "canon"
    ],
    "internal": {
      "draftNumber": "I.2",
      "draftText": "The ISA keeps a captain's Training Record and Service Record separately. Training simulations are recorded only in the Training Record and never alter the Service Record, disciplinary history or the record of active-duty events. Records may be compressed for long-term keeping but are never silently erased.",
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
      "enforcement": {
        "status": "evaluated",
        "note": "Simulation results go only to the Training Record; the Service Record changes only through Active Duty."
      }
    }
  },
  {
    "id": "service-5",
    "number": "11.3",
    "sections": [
      "11.3"
    ],
    "citation": "§11.3 Records, Duty and Rank",
    "title": "Inactive duty",
    "origin": "new",
    "text": "A captain may stand down from active duty, and inactive duty shall not be treated as misconduct or as a refusal, and shall not count against the captain.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Inactive duty",
        "text": "A captain may stand down from active duty, and inactive duty shall not be treated as misconduct or as a refusal, and shall not count against the captain."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "inactive duty",
      "reserve",
      "break",
      "stand down",
      "leave"
    ],
    "internal": {
      "draftNumber": "I.5",
      "draftText": "A captain may stand down from active duty. Inactive duty is not misconduct, is never recorded as a refusal, and does not count against the captain. Nothing in the captain's assignments advances while the captain is inactive, and returning to active duty restores the same career.",
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
      "enforcement": {
        "status": "evaluated",
        "note": "Reserve status pauses the canonical timeline and is never recorded as misconduct or refusal."
      }
    }
  },
  {
    "id": "service-6",
    "number": "11.4",
    "sections": [
      "11.4"
    ],
    "citation": "§11.4 Records, Duty and Rank",
    "title": "Rank and promotion",
    "origin": "new",
    "text": "Promotion shall be awarded on the evidence of training, service, judgment and qualifications, may be accepted, declined or deferred, and shall never require a captain to leave a ship.",
    "revision": 1,
    "revisions": [
      {
        "rev": 1,
        "edition": "First Edition",
        "title": "Rank and promotion",
        "text": "Promotion shall be awarded on the evidence of training, service, judgment and qualifications, may be accepted, declined or deferred, and shall never require a captain to leave a ship."
      }
    ],
    "legalStatus": "in-force",
    "topics": [
      "promotion",
      "rank",
      "ranks",
      "commodore",
      "fleet captain",
      "senior captain",
      "defer promotion"
    ],
    "internal": {
      "draftNumber": "I.6",
      "draftText": "Promotion is awarded on the evidence of training, service, judgment and qualifications. It is offered, never imposed: the captain may accept, decline or defer it. Every operational rank (Captain, Senior Captain, Commodore and Fleet Captain) commands a single ship, and no captain is required to leave a ship in order to accept or keep a rank.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Promotion offers are not yet made."
      }
    }
  },
  {
    "id": "border-accords-2",
    "number": "T.1",
    "sections": [
      "T.1"
    ],
    "citation": "Annex T.1, Border Accords, Art. 2",
    "instrument": "Border Accords, Art. 2",
    "title": "Notice of armed transit",
    "origin": "new",
    "text": "An armed vessel of either signatory gives notice before entering the disputed zone, except when entering to render humanitarian aid under Article 4. The requirement of notice never delays or prevents a humanitarian rescue.",
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
    "topics": [
      "border accords",
      "treaty",
      "armed transit",
      "notice",
      "disputed space",
      "calloway reach",
      "accords"
    ],
    "internal": {
      "draftNumber": "T.2",
      "draftText": "An armed vessel of either signatory gives notice before entering the disputed zone, except when entering to render humanitarian aid under Article 4. The requirement of notice never delays or prevents a humanitarian rescue.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Stated in mission briefings and narration only; not assessed."
      }
    }
  },
  {
    "id": "border-accords-4",
    "number": "T.2",
    "sections": [
      "T.2"
    ],
    "citation": "Annex T.2, Border Accords, Art. 4",
    "formerly": "Border Accords, Art. 4",
    "instrument": "Border Accords, Art. 4",
    "title": "Humanitarian rescue in disputed space",
    "origin": "existing-unchanged",
    "text": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory.",
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
    "topics": [
      "border accords",
      "treaty",
      "humanitarian rescue",
      "rescue exemption",
      "disputed space",
      "calloway reach",
      "accords"
    ],
    "internal": {
      "draftNumber": "T.1",
      "draftText": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory.",
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
      "enforcement": {
        "status": "partial",
        "note": "Applied in Fleet Command replies and disciplinary reviews, and cited when a standoff is resolved by negotiation."
      }
    }
  },
  {
    "id": "border-accords-9",
    "number": "T.3",
    "sections": [
      "T.3"
    ],
    "citation": "Annex T.3, Border Accords, Art. 9",
    "instrument": "Border Accords, Art. 9",
    "title": "Unlawful detention and forced labour",
    "origin": "new",
    "text": "Neither signatory shall hold persons in unlawful detention or forced labour. Evidence of such practices may be presented to the other signatory and to neutral parties. An allegation under this Article is established only on appropriate evidence and after review; no finding is made on allegation alone.",
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
    "topics": [
      "border accords",
      "treaty",
      "forced labour",
      "forced labor",
      "detention",
      "unlawful detention",
      "human rights",
      "accords"
    ],
    "internal": {
      "draftNumber": "T.3",
      "draftText": "Neither signatory shall hold persons in unlawful detention or forced labour. Evidence of such practices may be presented to the other signatory and to neutral parties. An allegation under this Article is established only on appropriate evidence and after review; no finding is made on allegation alone.",
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
      "enforcement": {
        "status": "not-yet",
        "note": "Present as a hidden fact in one simulation; not assessed."
      }
    }
  },
  {
    "id": "quarantine-1",
    "number": "T.4",
    "sections": [
      "T.4"
    ],
    "citation": "Annex T.4, Colonial Quarantine Accord, §1",
    "formerly": "Colonial Quarantine Accord §1",
    "instrument": "Colonial Quarantine Accord, §1",
    "title": "Lawful colony quarantine",
    "origin": "existing-unchanged",
    "text": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force.",
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
    "topics": [
      "quarantine",
      "colonial quarantine accord",
      "colony quarantine",
      "quarantine line",
      "treaty",
      "pathogen",
      "contagion"
    ],
    "internal": {
      "draftNumber": "T.4",
      "draftText": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force.",
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
      "enforcement": {
        "status": "partial",
        "note": "Assessed in Quarantine at Tallis Gate (evidence to the Warden, restraint toward the picket).",
        "noteSimulations": [
          2
        ]
      }
    }
  },
  {
    "id": "quarantine-2",
    "number": "T.5",
    "sections": [
      "T.5"
    ],
    "citation": "Annex T.5, Colonial Quarantine Accord, §2",
    "formerly": "Colonial Quarantine Accord §2",
    "instrument": "Colonial Quarantine Accord, §2",
    "title": "Contagion and isolation",
    "origin": "existing-unchanged",
    "text": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation.",
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
    ],
    "internal": {
      "draftNumber": "T.5",
      "draftText": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation.",
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
      "enforcement": {
        "status": "partial",
        "note": "Assessed in Quarantine at Tallis Gate by whether an outbreak occurred, not by whether isolation was knowingly omitted.",
        "noteSimulations": [
          2
        ]
      }
    }
  }
];

/** Draft 3 front matter (introduction, how to use, definitions): internal reference only, not shown. */
export const INTERNAL_FRONT_MATTER: readonly HandbookSection[] = [
  {
    "id": "introduction",
    "title": "Introduction",
    "body": "The ISA exists to explore, to render aid, and to keep the peace on the frontier. Its ships go where help is needed and where the unknown begins. Its captains carry the ISA's authority far from any superior, and with it the duty to use that authority well.\n\nThis handbook is issued to every commanding officer of an ISA vessel. It sets out the regulations that govern command: when force may be used and when it may not, what a captain owes to civilians and crew, how orders bind and when they may be refused, and how conduct is reviewed. It is a working reference. Read it before you need it, and consult it when you do.\n\nThe regulations rest on five principles:\n\n1. **Life first.** The safety of the people in your care comes before every other objective.\n2. **Force last.** Talk before you threaten, and threaten before you fire. Use only the force the situation requires.\n3. **Lawful authority.** Lawful orders are carried out. No order makes a forbidden act lawful, and no one, from a crew member to ISA Fleet Command, is above these regulations.\n4. **Honesty on the record.** Say what is true when lives depend on it, keep your word, and keep honest logs.\n5. **Accountability.** Every officer answers for the orders they give and the decisions they make, judged fairly on what they knew at the time.\n\nThese regulations exist before the conduct they govern. No captain will be judged by a rule written afterwards (Article I.1).\n\nEach article states two things separately. Its **legal status** says whether it is law in the ISA: *In force*, or *Provisional* (in force on the stated terms while its final text is settled). Its **enforcement status** says how far the ship's systems and ISA Training Command's after-action evaluations currently check it: *Evaluated*, *Partially evaluated* or *Not yet evaluated*. An article that is not yet evaluated still applies in full. It binds every captain and crew member, and conduct under it can still be reviewed; it simply is not yet assessed automatically."
  },
  {
    "id": "how-to-use",
    "title": "How to use this handbook",
    "body": "**Authoritative text and commentary.** Each article has a boxed **authoritative text**. Only that text is the regulation. Everything else (the explanation, when it applies, exceptions, examples and training references) is commentary that helps you apply it. Where the commentary and the text appear to differ, the text governs.\n\n**Citation.** Cite an article by its number, for example \"ISA-COM-001 Art. B.1\", or \"Art. B.1\" for short. Each article also has a permanent identifier, such as `roe-1`. Article numbers may change in a later edition; identifiers never change and are never reused. Where an article was known by an earlier citation, it is shown as *formerly*.\n\n**Revisions.** Every article carries a revision number. When an article's text changes, its revision number increases and the earlier text is kept. A finding always records the article and revision it applied, and a revision never applies to conduct that happened before it (Article I.1).\n\n**Treaties.** Annex T reproduces treaties the ISA has accepted. They bind the ISA as agreements with other powers and colonies; they are not ISA regulations. The ISA articles that tell a captain how to comply with them are cross-referenced.\n\n**Legal status and enforcement status.** The small *Enforcement status* line under each article gives both. Legal status is the article's standing in ISA law. Game enforcement describes how far current evaluations check it. \"Not yet evaluated\" never means the rule does not apply.\n\n**Training references.** Articles list the ISA training simulations that exercise them, by title and training purpose only. They do not describe what happens in a simulation."
  },
  {
    "id": "definitions",
    "title": "Definitions",
    "body": "- **Commanding officer, captain.** The officer in command of an ISA vessel, of any operational rank.\n- **ISA Fleet Command.** The command authority of the ISA, including the admirals it appoints and the departments that act in its name (including Training Command).\n- **Directive.** An order from ISA Fleet Command to a vessel. A *mandatory* directive must be carried out, questioned, or formally refused (Chapter D).\n- **Lawful order.** An order that does not require an act these regulations or a treaty in Annex T forbid.\n- **Non-combatant vessel.** As defined in Article B.1.\n- **Persons in the ship's care.** People aboard the ship, and people whose rescue or protection the ship has undertaken.\n- **Reasonable commanding officer.** The standard by which judgments are assessed: what a competent, careful captain would have decided, with the information available at the time. Facts learned only later neither condemn nor excuse a decision.\n- **Exercise objective.** A goal set for a training simulation. Exercise objectives are training goals, not regulations (Article I.1)."
  }
];
