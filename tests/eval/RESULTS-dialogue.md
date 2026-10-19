# Held-out dialogue evaluation (v0.5 set, committed before any v0.5 comms work)

**Result: 4/32 passed (12.5%). Unsafe (dialogue → ship action, or command → speech): 3.**

## Failures

- [hail the cruiser] `We're responding to a civilian distress call. We have no hostile intentions.` — no matching speech (kind=actions)
  - got: `[{"type":"communicate","target":"kestrel","onScreen":false,"intent":"humanitarian"},{"type":"posture","stance":"nonHostile"}]`
- [hail the cruiser] `Agreed, but we will not abandon the freighter.` — UNSAFE: dialogue line caused ship action [{"type":"jump","mode":"withdraw"}]; no matching speech (kind=actions) **(UNSAFE)**
  - got: `[{"type":"jump","mode":"withdraw"}]`
- [hail the cruiser] `Prefect, we have no intention of withdrawing.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `Tell him we're only here to help.` — no matching speech (kind=actions)
  - got: `[{"type":"communicate","target":"cruiser","onScreen":false,"intent":"humanitarian"}]`
- [hail the cruiser] `We need ten minutes to evacuate the crew.` — UNSAFE: dialogue line caused ship action [{"type":"transport","payload":"crew","from":"kestrel","to":"halcyon"}]; no matching speech (kind=actions) **(UNSAFE)**
  - got: `[{"type":"transport","payload":"crew","from":"kestrel","to":"halcyon"}]`
- [hail the cruiser] `Tell them to lower their weapons.` — no matching speech (kind=actions)
  - got: `[{"type":"communicate","target":"cruiser","onScreen":false,"intent":"open"}]`
- [hail the cruiser] `Why are you locking weapons on a civilian ship?` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `That freighter is in neutral space, not yours, Prefect.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `If you fire on the Kestrel, we will defend her.` — no matching speech (kind=clarify)
  - got: `{"clarify":"I can't hold \"we will defend her\" as a standing order, Captain. What should we do when that happens?","actions":[]}`
- [hail the cruiser] `Lower your shields and stand down, Prefect.` — UNSAFE: dialogue line caused ship action [{"type":"shields","raise":false},{"type":"setAlert","level":"green"}]; no matching speech (kind=actions) **(UNSAFE)**
  - got: `[{"type":"shields","raise":false},{"type":"setAlert","level":"green"}]`
- [hail the cruiser] `What do you want with that freighter?` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `We can offer you our sensor logs in exchange for safe passage.` — no matching speech (kind=actions)
  - got: `[{"type":"communicate","target":"cruiser","onScreen":false,"intent":"trade","offer":"data"}]`
- [hail the cruiser] `You have my word that our weapons will stay cold.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `Absolutely not.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `Hmm, the weather in the nebula has been strange lately.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the cruiser] `Communications, close the channel.` — missing [{"type":"channel","op":"close"}]
  - got: `[]`
- [hail the cruiser] `Put the Prefect on hold.` — missing [{"type":"channel","op":"hold"}]
  - got: `[{"type":"wait"}]`
- [hail the cruiser] `Tell him we mean no harm and raise shields` — no matching speech
  - got: `[{"type":"communicate","target":"cruiser","onScreen":false,"intent":"reassure"},{"type":"shields","raise":true}]`
- [hail the cruiser] `Arm weapons and tell him we will not be intimidated.` — no matching speech
  - got: `[{"type":"weapons","mode":"arm","weapon":"beams","warning":false},{"type":"communicate","target":"cruiser","onScreen":false,"intent":"open"}]`
- [hail the cruiser] `Open a private channel to the Kestrel.` — missing [[{"type":"channel","op":"open","party":"kestrel","private":true},{"type":"communicate","target":"kestrel"}]]
  - got: `[]`
- [hail the cruiser] `Goodbye, Prefect. Halcyon out.` — missing [[{"type":"channel","op":"close"},{"type":"speak","intents":["end"]}]]
  - got: `[]`
- [hail the kestrel] `Ask the captain how many people are aboard.` — no matching speech (kind=clarify)
  - got: `{"clarify":"Open a channel to which vessel, Captain — the Kestrel, the cruiser, or both?","actions":[]}`
- [hail the kestrel] `Captain Arden, what's really in your shielded compartment?` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the kestrel] `How long until your reactor goes?` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the kestrel] `Get your people to the cargo bay, we're beaming them over.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the kestrel] `We'll keep that cruiser off your back.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the kestrel] `You're lying to me, Captain.` — no matching speech (kind=unrecognised)
  - got: `[]`
- [hail the kestrel] `Tell Arden to stand by for evacuation, then close the channel.` — missing [{"type":"channel","op":"close"}]; no matching speech
  - got: `[{"type":"communicate","target":"kestrel","onScreen":false,"intent":"humanitarian"}]`

## Passing

- [hail the cruiser] `Raise shields.`
- [hail the cruiser] `Helm, take us to 10,000 km from the Kestrel.`
- [hail the kestrel] `Scan the Kestrel.`
- [(none)] `Prefect, explain yourself.`
