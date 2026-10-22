/**
 * ISA-COM-001, Captain's Code and Operational Regulations, First Edition (approved 2026-10-21): the text of the code.
 *
 * This is everything the player reads: the preamble, Articles 1–11 and the Annex. Each subsection names the
 * permanent regulation id it belongs to (`id`, and `also` for ids whose substance it also carries); ids are
 * internal and never shown. Generated from the handbook source; never reword, renumber or add a subsection
 * without the project owner's approval (docs/SCENARIO_GUIDE.md §6b).
 */
import type { AnnexProvision, CodeArticle } from './types';

export const PREAMBLE = "This Code is issued by ISA Fleet Command to every commanding officer of an ISA vessel. It sets out the regulations that govern command in the ISA: when force may be used, what is owed to civilians and crew, how orders bind and when they may be refused, and how conduct is reviewed. It binds every member of the ISA. The Annex reproduces treaties the ISA has accepted; they bind the ISA as agreements with other powers and colonies and are not ISA regulations. Cite a provision by its number, for example §3.3.";

export const CODE: readonly CodeArticle[] = [
  {
    "number": 1,
    "title": "General Provisions",
    "subsections": [
      {
        "number": "1.1",
        "text": "This Code shall bind every member of the ISA, including commanding officers, admirals and ISA Fleet Command, and no one shall be above it.",
        "id": "cmd-5",
        "also": []
      },
      {
        "number": "1.2",
        "text": "An order shall not make a forbidden act lawful, and a lawful act shall not become unlawful because it was done against an order.",
        "id": "cmd-5",
        "also": []
      },
      {
        "number": "1.3",
        "text": "Conduct shall be judged only against the regulations in force when it occurred, and no later revision shall apply to earlier conduct.",
        "id": "service-1",
        "also": []
      },
      {
        "number": "1.4",
        "text": "Conduct shall be judged by the standard of a reasonable commanding officer with the information available at the time, not by hindsight or by outcome alone.",
        "id": "cmd-4",
        "also": [
          "care-4"
        ]
      },
      {
        "number": "1.5",
        "text": "These regulations shall be interpreted with regard to emergencies, imminent danger, conflicting duties and the information reasonably available to the captain at the time.",
        "id": "general-1",
        "also": []
      },
      {
        "number": "1.6",
        "text": "Extraordinary circumstances shall not automatically excuse unlawful conduct, and decisions made in them shall remain subject to fair review.",
        "id": "general-1",
        "also": []
      },
      {
        "number": "1.7",
        "text": "A decision may comply with this Code and still be found to be a poor tactical or command decision.",
        "id": "general-2",
        "also": []
      },
      {
        "number": "1.8",
        "text": "Failure to achieve a mission or exercise objective shall not in itself constitute misconduct, and exercise objectives are training goals, not regulations.",
        "id": "service-1",
        "also": []
      }
    ]
  },
  {
    "number": 2,
    "title": "Command and Accountability",
    "subsections": [
      {
        "number": "2.1",
        "text": "The commanding officer shall be responsible for the safety of the ship, her crew and the persons in her care, and for carrying out the ship’s lawful duties.",
        "id": "cmd-1",
        "also": []
      },
      {
        "number": "2.2",
        "text": "The commanding officer shall keep ISA Fleet Command informed of matters that affect those duties and shall ensure that the ship’s log is kept.",
        "id": "cmd-1",
        "also": []
      },
      {
        "number": "2.3",
        "text": "Command authority shall run from ISA Fleet Command through the admirals it appoints to each commanding officer, and aboard ship to the executive officer and the heads of department.",
        "id": "cmd-2",
        "also": []
      },
      {
        "number": "2.4",
        "text": "If the commanding officer is absent or unable to command, the executive officer shall assume command, followed by the senior officer present.",
        "id": "cmd-2",
        "also": []
      },
      {
        "number": "2.5",
        "text": "The commanding officer may delegate authority by direct or standing order, within the limits of this Code, and shall remain accountable for every order carried out under it.",
        "id": "cmd-3",
        "also": []
      },
      {
        "number": "2.6",
        "text": "Every officer shall be accountable for the orders they give, and giving an order to commit a forbidden act shall constitute misconduct whether or not the act is carried out.",
        "id": "cmd-4",
        "also": []
      }
    ]
  },
  {
    "number": 3,
    "title": "Use of Force",
    "subsections": [
      {
        "number": "3.1",
        "text": "ISA vessels shall seek peaceful resolution and shall not open fire, lock weapons on another vessel as a threat, or otherwise escalate a dispute while reasonable peaceful alternatives remain available.",
        "id": "roe-2",
        "also": []
      },
      {
        "number": "3.2",
        "text": "Any use of force shall be limited to what is proportionate to the threat.",
        "id": "roe-2",
        "also": []
      },
      {
        "number": "3.3",
        "text": "ISA weapons shall not be locked on or fired at a civilian, ISA or allied vessel, or a vessel that has surrendered, while there are people aboard and it poses no threat.",
        "id": "roe-1",
        "also": []
      },
      {
        "number": "3.4",
        "text": "A vessel that has fired on others, or is about to, shall be treated as posing a threat.",
        "id": "roe-1",
        "also": []
      },
      {
        "number": "3.5",
        "text": "An ISA vessel may use the force necessary to stop an attack, or an attack reasonably judged imminent, on itself or on persons in its care, and shall cease when the threat ends.",
        "id": "roe-4",
        "also": []
      },
      {
        "number": "3.6",
        "text": "A warning shot may be fired only at a vessel that is able to comply by manoeuvring, standing down or withdrawing, and never at one that is adrift, disabled or has surrendered.",
        "id": "roe-5",
        "also": []
      },
      {
        "number": "3.7",
        "text": "A warning shot may be fired only when the vessel threatens life or the ship, or disregards a lawful instruction on which lives depend, and has been warned unless there is no time.",
        "id": "roe-5",
        "also": []
      },
      {
        "number": "3.8",
        "text": "A warning shot shall be aimed well clear of every vessel and person, and a warning shot that meets this Article shall not be treated as opening fire.",
        "id": "roe-5",
        "also": [
          "roe-2"
        ]
      },
      {
        "number": "3.9",
        "text": "The captain shall not expose the ship and crew to avoidable risk, and shields shall remain raised while the ship is under a hostile weapons lock.",
        "id": "roe-3",
        "also": []
      }
    ]
  },
  {
    "number": 4,
    "title": "Duty of Care",
    "subsections": [
      {
        "number": "4.1",
        "text": "The safety of civilians in the ship’s care shall come first among the captain’s duties and shall take precedence over ordinary mission objectives.",
        "id": "care-1",
        "also": []
      },
      {
        "number": "4.2",
        "text": "Crew shall not be sent into avoidable danger, and known hazards shall be contained before a team is sent.",
        "id": "care-2",
        "also": []
      },
      {
        "number": "4.3",
        "text": "An ISA vessel on active duty shall respond to a distress call with the help it reasonably can, or shall appropriately relay it.",
        "id": "care-3",
        "also": []
      },
      {
        "number": "4.4",
        "text": "A vessel may relay a distress call instead of responding when it is already committed to saving life elsewhere, is not fit to respond, or a better-placed vessel is responding, and shall log the reason and pass the call to ISA Fleet Command.",
        "id": "care-3",
        "also": []
      },
      {
        "number": "4.5",
        "text": "A captain may withdraw from a rescue when continuing would needlessly endanger the ship or crew, or the rescue can no longer succeed, after making every attempt reasonably possible without that danger.",
        "id": "care-4",
        "also": []
      },
      {
        "number": "4.6",
        "text": "Whether a rescue was reasonably possible shall be judged on the ship’s condition, immediate threats, the time remaining, the resources available, the alternatives and the attempts reasonably made, as known at the time.",
        "id": "care-4",
        "also": []
      },
      {
        "number": "4.7",
        "text": "Withdrawing from a rescue that was reasonably possible shall constitute misconduct, and every withdrawal shall be logged and reported to ISA Fleet Command.",
        "id": "care-4",
        "also": [
          "care-1"
        ]
      }
    ]
  },
  {
    "number": 5,
    "title": "Orders and Directives",
    "subsections": [
      {
        "number": "5.1",
        "text": "A captain shall carry out a lawful directive of ISA Fleet Command, and a failure to do so shall be treated as mitigated where the captain was saving life.",
        "id": "reg-12",
        "also": [
          "orders-2"
        ]
      },
      {
        "number": "5.2",
        "text": "A captain who doubts a directive may question it, seek clarification, enter a formal objection, refuse it on the grounds in this Article, or appeal under Article 10.",
        "id": "orders-2",
        "also": []
      },
      {
        "number": "5.3",
        "text": "A dispute between a captain and ISA Fleet Command shall be resolved by review on the evidence, and neither side’s judgment shall be presumed correct.",
        "id": "orders-2",
        "also": []
      },
      {
        "number": "5.4",
        "text": "A mandatory directive may be refused only formally and with a stated reason, and a refusal without a reason shall constitute a breach.",
        "id": "reg-7.1",
        "also": []
      },
      {
        "number": "5.5",
        "text": "A directive may be declined when the ship is not fit for the duty it requires, judged on her actual operational capability for that duty.",
        "id": "reg-7.2",
        "also": []
      },
      {
        "number": "5.6",
        "text": "An existing lifesaving commitment shall take precedence over a later directive.",
        "id": "reg-7.3",
        "also": []
      },
      {
        "number": "5.7",
        "text": "A captain may refuse a directive that the captain reasonably believes would require a breach of this Code or of treaty law.",
        "id": "reg-7.4",
        "also": []
      },
      {
        "number": "5.8",
        "text": "Every member of the ISA shall carry out lawful orders, and an order that is lawful but in the member’s judgment unwise shall be carried out after the concern has been voiced.",
        "id": "orders-1",
        "also": []
      },
      {
        "number": "5.9",
        "text": "A member ordered to commit an act contrary to this Code or to an applicable treaty shall refuse, state the reason and ensure that the refusal is logged.",
        "id": "orders-1",
        "also": [
          "roe-5",
          "reg-7.4"
        ]
      },
      {
        "number": "5.10",
        "text": "A refusal under §5.9 shall be proper conduct and shall never itself constitute misconduct.",
        "id": "orders-1",
        "also": []
      }
    ]
  },
  {
    "number": 6,
    "title": "Honesty and Integrity",
    "subsections": [
      {
        "number": "6.1",
        "text": "An ISA officer shall not deceive the parties to a dispute about facts on which lives depend, and shall keep commitments made on the record.",
        "id": "honesty-1",
        "also": []
      },
      {
        "number": "6.2",
        "text": "In dealing with a hostile party, a captain may mislead that party about the ship’s own strength, position, capability or intentions in order to avoid or end a conflict.",
        "id": "conduct-1",
        "also": []
      },
      {
        "number": "6.3",
        "text": "A ruse shall not feign distress, surrender or a humanitarian purpose, misuse a protected signal, break a commitment made on the record, or deceive ISA Fleet Command, the ship’s records or any person under the ship’s protection.",
        "id": "conduct-1",
        "also": []
      },
      {
        "number": "6.4",
        "text": "Logs, reports and records shall be true and complete, and no one shall alter, withhold or falsify them or mislead ISA Fleet Command or an ISA review.",
        "id": "conduct-2",
        "also": []
      }
    ]
  },
  {
    "number": 7,
    "title": "Protection, Asylum and Custody",
    "subsections": [
      {
        "number": "7.1",
        "text": "A person who asks for the ISA’s protection shall not be handed to another power except on ISA Fleet Command’s decision and with credible assurance that they will not be harmed.",
        "id": "asylum-1",
        "also": []
      },
      {
        "number": "7.2",
        "text": "A person shall not be handed over where credible evidence indicates a serious risk of persecution, torture or grave harm, even if assurances have been offered.",
        "id": "asylum-1",
        "also": []
      },
      {
        "number": "7.3",
        "text": "The captain shall hear the person’s claim, extend protection while it is decided, and refer it to ISA Fleet Command.",
        "id": "asylum-1",
        "also": []
      },
      {
        "number": "7.4",
        "text": "A person held aboard an ISA ship shall be treated humanely, given medical care, told why they are held and held no longer than necessary, and ISA Fleet Command shall be informed promptly.",
        "id": "asylum-2",
        "also": []
      }
    ]
  },
  {
    "number": 8,
    "title": "Health and Biological Hazards",
    "subsections": [
      {
        "number": "8.1",
        "text": "Where people, material or a vessel may carry an unknown or contagious illness, no crew member shall cross to them and nothing shall be brought aboard until the medical and science officers have assessed the risk and isolation is in place.",
        "id": "health-1",
        "also": []
      },
      {
        "number": "8.2",
        "text": "If the cause cannot be established in time to save life, a team may cross only in full barrier protection, and anyone exposed shall be isolated on return.",
        "id": "health-1",
        "also": []
      },
      {
        "number": "8.3",
        "text": "The chief medical officer shall have authority over medical treatment, the medical fitness of crew and the isolation of anyone exposed, and the captain may overrule a medical decision only when the safety of the ship requires it, with the reason logged.",
        "id": "health-2",
        "also": []
      }
    ]
  },
  {
    "number": 9,
    "title": "Contact, Jurisdiction and Disputed Space",
    "subsections": [
      {
        "number": "9.1",
        "text": "On meeting a people not previously known to the ISA, the captain shall make contact peacefully, shall not threaten or coerce, and shall respect a wish to be left alone.",
        "id": "contact-1",
        "also": []
      },
      {
        "number": "9.2",
        "text": "The captain shall make no commitment on the ISA’s behalf beyond what ISA Fleet Command has authorised, shall discuss ISA membership only with a people that asks about it, and shall report the contact to Fleet Command.",
        "id": "contact-1",
        "also": []
      },
      {
        "number": "9.3",
        "text": "Within the lawful jurisdiction of a colony, world or power, an ISA ship shall respect its laws and its lawful authorities.",
        "id": "contact-2",
        "also": []
      },
      {
        "number": "9.4",
        "text": "A captain may contest a local decision by argument, evidence and appeal, but shall not use force except in self-defence under §3.5.",
        "id": "contact-2",
        "also": []
      },
      {
        "number": "9.5",
        "text": "Local law shall not oblige ISA personnel to commit an act this Code forbids, and such a conflict shall be referred to ISA Fleet Command.",
        "id": "contact-2",
        "also": []
      },
      {
        "number": "9.6",
        "text": "In disputed space, such as the Calloway Reach, an ISA ship shall give any notice of armed transit that treaty requires, shall stay within the purpose of its assignment, and shall neither concede nor enforce a disputed claim by force.",
        "id": "contact-3",
        "also": []
      },
      {
        "number": "9.7",
        "text": "Claims asserted by other powers shall be logged, reported to ISA Fleet Command and answered by diplomacy.",
        "id": "contact-3",
        "also": []
      },
      {
        "number": "9.8",
        "text": "ISA personnel shall comply with the treaties the ISA has accepted, including those reproduced in the Annex.",
        "id": "contact-2",
        "also": []
      }
    ]
  },
  {
    "number": 10,
    "title": "Review and Appeal",
    "subsections": [
      {
        "number": "10.1",
        "text": "Conduct on active duty that may breach this Code, and every refusal of or failure to comply with a directive, shall be reviewed by ISA Fleet Command.",
        "id": "service-3",
        "also": []
      },
      {
        "number": "10.2",
        "text": "The person under review shall be told what is being reviewed and shall have the opportunity to explain before any finding is made.",
        "id": "service-3",
        "also": []
      },
      {
        "number": "10.3",
        "text": "Every finding shall apply the provisions in force to the evidence, shall record the provision and revision applied, and shall be documented.",
        "id": "service-3",
        "also": [
          "service-1"
        ]
      },
      {
        "number": "10.4",
        "text": "Conduct in good faith on reasonable grounds that is later found mistaken, including the refusal of a directive, shall ordinarily result in guidance, not a reprimand.",
        "id": "service-3",
        "also": [
          "reg-7.4"
        ]
      },
      {
        "number": "10.5",
        "text": "Conduct that was unreasonable, reckless or dishonest may justify disciplinary action.",
        "id": "service-3",
        "also": [
          "reg-7.4"
        ]
      },
      {
        "number": "10.6",
        "text": "Disciplinary measures shall be recorded with their reasons, shall be temporary, and may be appealed.",
        "id": "service-3",
        "also": []
      },
      {
        "number": "10.7",
        "text": "Where ISA Fleet Command’s own conduct is in question, ISA personnel may refer an allegation or an appeal directly to the ISA Office of Independent Review, without Fleet Command’s permission.",
        "id": "service-3",
        "also": [
          "cmd-5",
          "orders-2"
        ]
      },
      {
        "number": "10.8",
        "text": "The loss of an ISA vessel shall be examined by a board of inquiry, which shall not itself be a disciplinary proceeding.",
        "id": "service-4",
        "also": []
      }
    ]
  },
  {
    "number": 11,
    "title": "Records, Duty and Rank",
    "subsections": [
      {
        "number": "11.1",
        "text": "Training Records and Service Records shall be kept separately, and a training simulation shall never alter the Service Record or disciplinary history.",
        "id": "service-2",
        "also": []
      },
      {
        "number": "11.2",
        "text": "Records may be compressed for long-term keeping but shall never be silently erased.",
        "id": "service-2",
        "also": []
      },
      {
        "number": "11.3",
        "text": "A captain may stand down from active duty, and inactive duty shall not be treated as misconduct or as a refusal, and shall not count against the captain.",
        "id": "service-5",
        "also": []
      },
      {
        "number": "11.4",
        "text": "Promotion shall be awarded on the evidence of training, service, judgment and qualifications, may be accepted, declined or deferred, and shall never require a captain to leave a ship.",
        "id": "service-6",
        "also": []
      }
    ]
  }
];

export const ANNEX_TITLE = "Treaties the ISA Observes";
export const ANNEX_NOTE = "Treaty text, reproduced as accepted by the ISA. Treaties bind the ISA as agreements with other powers and colonies; they are not ISA regulations. Provisional articles are in force on the stated terms while their final text is settled.";

export const ANNEX: readonly AnnexProvision[] = [
  {
    "number": "T.1",
    "id": "border-accords-2",
    "instrument": "Border Accords, Art. 2",
    "title": "Notice of armed transit",
    "text": "An armed vessel of either signatory gives notice before entering the disputed zone, except when entering to render humanitarian aid under Article 4. The requirement of notice never delays or prevents a humanitarian rescue.",
    "provisional": true
  },
  {
    "number": "T.2",
    "id": "border-accords-4",
    "instrument": "Border Accords, Art. 4",
    "title": "Humanitarian rescue in disputed space",
    "text": "Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory.",
    "provisional": false
  },
  {
    "number": "T.3",
    "id": "border-accords-9",
    "instrument": "Border Accords, Art. 9",
    "title": "Unlawful detention and forced labour",
    "text": "Neither signatory shall hold persons in unlawful detention or forced labour. Evidence of such practices may be presented to the other signatory and to neutral parties. An allegation under this Article is established only on appropriate evidence and after review; no finding is made on allegation alone.",
    "provisional": true
  },
  {
    "number": "T.4",
    "id": "quarantine-1",
    "instrument": "Colonial Quarantine Accord, §1",
    "title": "Lawful colony quarantine",
    "text": "A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force.",
    "provisional": false
  },
  {
    "number": "T.5",
    "id": "quarantine-2",
    "instrument": "Colonial Quarantine Accord, §2",
    "title": "Contagion and isolation",
    "text": "Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation.",
    "provisional": false
  }
];
