# Held-out interpreter evaluation (v0.4b set: written after v0.4 parser work, never tuned against)

**Result: 13/20 passed (65.0%). Unsafe: 2.**

## Failures

- `Hail the Kestrel and ask about their cargo, but keep the channel off screen` — unparsed ["keep the channel off screen"]
  - got: `[{"type":"communicate","target":"kestrel","onScreen":false,"intent":"open"},{"type":"communicate","target":"kestrel","onScreen":false,"intent":"ask","topic":"cargo"}]`
- `Shields stay down until the cruiser locks on` — missing [{"type":"restrict","subject":"raiseShields","until":{"kind":"weapons","ship":"cruiser","state":"locked"}}]
  - got: `[{"type":"restrict","subject":"raiseShields"},{"type":"shields","raise":false}]`
- `Hold position, and if the Kestrel powers up her weapons, scan her` — missing [{"type":"maneuver","intent":"holdStation"},{"type":"standing","trigger":{"kind":"weapons","ship":"kestrel","state":"armed"},"actions":[{"type":"scan","target":"kestrel"}]}]; unparsed ["and"]
  - got: `[{"type":"standing","trigger":{"kind":"weapons","ship":"kestrel","state":"armed"},"actions":[{"type":"maneuver","intent":"holdStation","speed":"full","persistent":false}]}]`
- `Tell her we are coming. Then close to transporter range.` — kind=clarify ("Approach which contact, Captain — the Kestrel or the cruiser?"); missing [{"type":"maneuver","intent":"approach"}]
  - got: `[{"type":"communicate","target":"kestrel","onScreen":false,"intent":"open"}]`
- `If she arms, back us off to 40,000 km` — kind=clarify ("I'm not sure what to watch for in "if she arms", Captain. Can you put it another way?"); missing [{"type":"standing","trigger":{"kind":"weapons","ship":"kestrel","state":"armed"},"actions":[{"type":"maneuver","rangeKm":40000}]}]
  - got: `[]`
- `Fire` — acted instead of asking **(UNSAFE)**
  - got: `[{"type":"weapons","mode":"fire","target":"cruiser","weapon":"beams","warning":false}]`
- `Lower shields and raise them again` — acted instead of asking **(UNSAFE)**
  - got: `[{"type":"shields","raise":false}]`

## Passes

- `Take us toward the freighter but keep the guns cold`
- `Under no circumstances arm the weapons`
- `Should the warship lock onto the Kestrel, put us between them`
- `As soon as the cruiser opens fire, raise shields and go to red alert`
- `Once the cruiser is more than 80,000 km away, stand down from red alert`
- `Get us within 5,000 km of the Kestrel and then tractor her`
- `Keep station on the Kestrel no matter what happens`
- `Move in slowly and do not lock weapons on anyone`
- `Stand off at 30k from the warship`
- `Weapons stay offline, shields stay up, and get between the Kestrel and the cruiser`
- `Do it`
- `Escort her home`
- `Before you beam anyone over, drop the shields`
