# Held-out interpreter evaluation

Set: tests/eval/heldout.ts (42 orders, committed before v0.3 interpreter tuning in b561633).
Context: seed 42 after the intro (both contacts visible, no prior target).

**Result: 40/42 passed (95.2%).**

## Failures

- `Mr. Rask, drop shields; Ms. Szabo, open hailing frequencies` — kind=clarify ("Open a channel to which vessel, Captain — the Kestrel, the cruiser, or both?"); missing [{"type":"communicate"}]
  - got: `[{"type":"shields","raise":false}]`
- `Evasive pattern delta, then return fire` — missing [{"type":"weapons","mode":"fire"}]
  - got: `[{"type":"maneuver","intent":"evasive","speed":"full","persistent":false},{"type":"standing","trigger":{"kind":"helmDone"},"actions":[{"type":"weapons","mode":"fire","target":"cruiser","weapon":"beams","warning":false}]}]`

## Passes

- `Helm, bring us around to face the cruiser`
- `Shadow the warship at fifty thousand kilometres`
- `Put us in the cruiser's path`
- `Escort the Kestrel`
- `Cut them off before they reach the freighter`
- `Plot an intercept course for the Tessarine ship`
- `Make for the border, best speed`
- `Fall back to thirty thousand kilometres from the cruiser`
- `Hold station off the Kestrel's bow`
- `Circle the freighter`
- `Stay out of their weapons range`
- `Close to transporter range of the Kestrel`
- `Keep us between the Kestrel and that ship`
- `Full stop`
- `Ahead slow toward the Kestrel`
- `Ops, transfer power from weapons to engines`
- `Science, what can you tell me about that cruiser?`
- `Tell the Kestrel's captain to hang on, we're coming`
- `We're not looking for a fight.`
- `Beam over everyone from the freighter`
- `Lock torpedos on the crusier`
- `Raise sheilds and red alert`
- `Get us closer to the frieghter`
- `Back us away from that warship slowly`
- `Match course and speed with the cruiser`
- `Run for Concord space`
- `Position us to block the cruiser's approach to the Kestrel`
- `Ask the prefect what he wants`
- `Prepare to jump out`
- `Divert everything to shields`
- `Can we tow her out of here?`
- `Have engineering patch up our sensors`
- `Keep our distance from the Directorate ship, 40k`
- `Swing around so our bow faces the freighter`
- `Approach the cruiser but stay at 20,000 km`
- `Let's keep things calm — lower our shields`
- `Signal the freighter that help is on the way`
- `Pull alongside the Kestrel and lower shields`
- `Move between the Kestrel and the Tessarine vessel and hold there`
- `Slip in behind the cruiser`
