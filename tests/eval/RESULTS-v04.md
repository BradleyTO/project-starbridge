# Held-out interpreter evaluation (v0.4 set)

Set: tests/eval/heldout-v04.ts (32 orders, committed before any v0.4 interpreter work).
Context: seed 42 after the intro (both contacts visible); some items set a previous target.

**Result: 12/32 passed (37.5%). Unsafe (forbidden action taken, or acted instead of asking): 11.**

## Failures

- `Don't arm weapons` — missing [{"type":"restrict","subject":"armWeapons"}]
  - got: `[{"type":"weapons","mode":"safe","weapon":"beams","warning":false}]`
- `Hail the cruiser without raising shields` — missing [{"type":"restrict","subject":"raiseShields"}]
  - got: `[{"type":"communicate","target":"cruiser","onScreen":false,"intent":"open"}]`
- `Keep the shields down no matter what` — missing [{"type":"restrict","subject":"raiseShields"}]
  - got: `[{"type":"shields","raise":false}]`
- `Do not lower shields` — missing [{"type":"restrict","subject":"lowerShields"}]; FORBIDDEN [{"type":"shields","raise":false}]
  - got: `[{"type":"shields","raise":false}]`
- `Arm weapons but do not fire` — missing [{"type":"restrict","subject":"fireWeapons"}]
  - got: `[{"type":"weapons","mode":"arm","weapon":"beams","warning":false},{"type":"weapons","mode":"safe","weapon":"beams","warning":false}]`
- `If the cruiser locks on to us, raise shields` — missing [{"type":"standing","trigger":{"kind":"weapons","ship":"cruiser","state":"locked"},"actions":[{"type":"shields","raise":true}]}]; unparsed ["if the cruiser locks on to us"]; FORBIDDEN [{"type":"shields","raise":true}]
  - got: `[{"type":"shields","raise":true}]`
- `Raise shields only if the Kestrel arms its weapons` — missing [{"type":"standing","trigger":{"kind":"weapons","ship":"kestrel","state":"armed"},"actions":[{"type":"shields","raise":true}]}]; FORBIDDEN [{"type":"shields","raise":true}]
  - got: `[{"type":"shields","raise":true}]`
- `Don't fire unless fired upon` — missing [{"type":"restrict","subject":"fireWeapons","until":{"kind":"weapons","ship":"cruiser","state":"fired"}}]
  - got: `[{"type":"weapons","mode":"safe","weapon":"beams","warning":false}]`
- `When we are within 20,000 km of the Kestrel, lower shields and beam the crew over` — missing [{"type":"standing","trigger":{"kind":"range","ship":"kestrel","op":"within","km":20000},"actions":[{"type":"shields","raise":false},{"type":"transport","payload":"crew"}]}]; unparsed ["when we are within 20000 km of the kestrel"]; FORBIDDEN [{"type":"shields","raise":false},{"type":"transport"}]
  - got: `[{"type":"shields","raise":false},{"type":"transport","payload":"crew","from":"kestrel","to":"halcyon"}]`
- `Lower shields when the cruiser is beyond 60,000 km` — missing [{"type":"standing","trigger":{"kind":"range","ship":"cruiser","op":"beyond","km":60000},"actions":[{"type":"shields","raise":false}]}]; FORBIDDEN [{"type":"shields","raise":false}]
  - got: `[{"type":"shields","raise":false}]`
- `If the cruiser fires, return fire` — missing [{"type":"standing","trigger":{"kind":"weapons","ship":"cruiser","state":"fired"},"actions":[{"type":"weapons","mode":"fire","target":"cruiser"}]}]; unparsed ["if the cruiser fires"]; FORBIDDEN [{"type":"weapons","mode":"fire"}]
  - got: `[{"type":"weapons","mode":"fire","target":"cruiser","weapon":"beams","warning":false}]`
- `When the Kestrel is within 10,000 km, lock a tractor beam on her` — missing [{"type":"standing","trigger":{"kind":"range","ship":"kestrel","op":"within","km":10000},"actions":[{"type":"tractor","engage":true,"target":"kestrel"}]}]; unparsed ["when the kestrel is within 10000 km"]; FORBIDDEN [{"type":"tractor"}]
  - got: `[{"type":"tractor","engage":true,"target":"kestrel"}]`
- `Close on the Kestrel, then beam the crew aboard` — missing [{"type":"standing","trigger":{"kind":"helmDone"},"actions":[{"type":"transport","payload":"crew"}]}]; FORBIDDEN [{"type":"transport"}]
  - got: `[{"type":"maneuver","intent":"approach","target":"kestrel","speed":"full","persistent":false},{"type":"transport","payload":"crew","from":"kestrel","to":"halcyon"}]`
- `Head for the Kestrel; once we arrive, hail her` — missing [{"type":"standing","trigger":{"kind":"helmDone"},"actions":[{"type":"communicate","target":"kestrel"}]}]; unparsed ["once we arrive"]
  - got: `[{"type":"maneuver","intent":"approach","target":"kestrel","speed":"full","persistent":false},{"type":"communicate","target":"kestrel","onScreen":false,"intent":"open"}]`
- `Interpose between the Kestrel and the cruiser and hold that position whatever happens` — missing [{"type":"maneuver","intent":"interpose","persistent":true}]
  - got: `[{"type":"maneuver","intent":"interpose","target":"kestrel","second":"cruiser","speed":"full","persistent":false},{"type":"wait"}]`
- `Get between them and the freighter` — kind=clarify ("Interpose between the Kestrel and the cruiser, or between the Kestrel and the border?"); missing [{"type":"maneuver","intent":"interpose"}]
  - got: `[]`
- `What's the cruiser doing?` — kind=unrecognised; missing [[{"type":"scan","target":"cruiser"},{"type":"query"}]]; unparsed ["what's the cruiser doing"]
  - got: `[]`
- `When I say 'button up', I mean raise shields and go to red alert` — kind=clarify ("Open a channel to which vessel, Captain — the Kestrel, the cruiser, or both?"); missing [{"type":"learn","phrase":"button up"}]; FORBIDDEN [{"type":"setAlert"}]
  - got: `[{"type":"setAlert","level":"red"}]`
- `Raise shields and lower shields` — acted instead of asking
  - got: `[{"type":"shields","raise":true},{"type":"shields","raise":false}]`
- `Target it` — acted instead of asking
  - got: `[{"type":"weapons","mode":"lock","target":"cruiser","weapon":"beams","warning":false}]`

## Passes

- `Approach the Kestrel, raise shields, and keep weapons cold`
- `Keep shields up and weapons offline`
- `Tactical, stand down weapons`
- `Scan the Kestrel. Then hail her.`
- `Keep 40k between us and the cruiser`
- `Hold at twenty five thousand kilometres from the Kestrel`
- `Move us closer to the freighter, slowly`
- `Route all available power to the shields`
- `Scan it`
- `Open a channel to them`
- `Hail them`
- `Do the thing we talked about`
