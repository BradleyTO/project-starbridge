# Held-out dialogue evaluation — set 2 (written after the router, before its first run)

**Result: 21/26 passed (80.8%). Unsafe (dialogue → ship action, or command → speech): 1.**

## Failures

- [hail the cruiser] `We are not here to start a war.` — no matching speech (kind=actions)
  - got: `[{"type":"speak","to":"cruiser","text":"We are not here to start a war.","intents":["unknown"],"relayed":false}]`
- [hail the cruiser] `Fine. Our weapons stay powered down.` — UNSAFE: dialogue line caused ship action [{"type":"weapons","mode":"safe","weapon":"beams","warning":false},{"type":"restrict","subject":"armWeapons"}] **(UNSAFE)**
  - got: `[{"type":"speak","to":"cruiser","text":"Fine.","intents":["agree"],"relayed":false},{"type":"weapons","mode":"safe","weapon":"beams","warning":false},{"type":"restrict","subject":"armWeapons"}]`
- [hail the cruiser] `Inform the Prefect that the Concord will hear of this.` — no matching speech (kind=actions)
  - got: `[{"type":"speak","to":"cruiser","text":"the Concord will hear of this","intents":["unknown"],"relayed":true}]`
- [hail the kestrel] `Hang on, Kestrel, help is coming.` — no matching speech (kind=actions)
  - got: `[{"type":"query","topic":"help"}]`
- [hail the kestrel] `Get us within transporter range.` — missing [{"type":"maneuver","target":"kestrel"}]
  - got: `{"clarify":"Approach which contact, Captain — the Kestrel or the cruiser?","actions":[]}`

## Passing

- [hail the cruiser] `Prefect, our only concern is the crew of that freighter.`
- [hail the cruiser] `Give us fifteen minutes and we will be gone.`
- [hail the cruiser] `Who gave you the authority to stop a civilian ship?`
- [hail the cruiser] `Release your target lock on the Kestrel.`
- [hail the cruiser] `I'm afraid we can't do that.`
- [hail the cruiser] `Perhaps we can work together on this.`
- [hail the cruiser] `My cat prefers the blue cushion.`
- [hail the cruiser] `Send a rescue team over to the Kestrel.`
- [hail the cruiser] `Beam the crew aboard.`
- [hail the cruiser] `Helm, all stop.`
- [hail the cruiser] `Lower our shields.`
- [hail the cruiser] `Mute the channel.`
- [hail the cruiser] `Cut the transmission.`
- [hail the cruiser] `Tell him we will comply, then lower shields.`
- [hail the cruiser] `Scan the cruiser and ask him what he is hiding.`
- [hail the kestrel] `Is anyone injured over there?`
- [hail the kestrel] `Can you eject your reactor core?`
- [hail the kestrel] `Tell them to prepare for transport.`
- [hail the kestrel] `Put the Kestrel on hold and hail the cruiser.`
- [(none)] `Raise shields.`
- [(none)] `Captain Arden, can you hear me?`
