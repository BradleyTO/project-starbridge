# Held-out interpreter evaluation

Set: tests/eval/heldout.ts (42 orders, committed before v0.3 interpreter tuning in b561633).
Context: seed 42 after the intro (both contacts visible, no prior target).

**Result: 33/42 passed (78.6%).**

## Failures

- `Cut them off before they reach the freighter` — missing [[{"type":"maneuver","intent":"intercept","target":"cruiser"},{"type":"maneuver","intent":"block","target":"cruiser"},{"type":"maneuver","intent":"interpose"}]]
  - got: `[{"type":"maneuver","intent":"block","target":"kestrel","speed":"full"}]`
- `Make for the border, best speed` — unparsed ["best speed"]
  - got: `[{"type":"maneuver","intent":"flee","speed":"full"}]`
- `Ahead slow toward the Kestrel` — kind=unrecognised; missing [{"type":"maneuver","intent":"approach","target":"kestrel"}]; unparsed ["ahead slow toward the kestrel"]
  - got: `[]`
- `Mr. Rask, drop shields; Ms. Szabo, open hailing frequencies` — kind=clarify ("Open a channel to which vessel, Captain — the Kestrel, the cruiser, or both?"); missing [{"type":"communicate"}]
  - got: `[{"type":"shields","raise":false}]`
- `Science, what can you tell me about that cruiser?` — kind=unrecognised; missing [{"type":"scan","target":"cruiser"}]; unparsed ["what report about that cruiser"]
  - got: `[]`
- `Match course and speed with the cruiser` — unparsed ["speed with the cruiser"]
  - got: `[{"type":"maneuver","intent":"follow","target":"cruiser","speed":"full"}]`
- `Divert everything to shields` — kind=unrecognised; missing [{"type":"power","to":"shields"}]; unparsed ["divert everything to shields"]
  - got: `[]`
- `Keep our distance from the Directorate ship, 40k` — missing [{"type":"maneuver","intent":"standoff","target":"cruiser","rangeKm":40000}]; unparsed ["40000"]
  - got: `[{"type":"maneuver","intent":"standoff","target":"cruiser","speed":"full"}]`
- `Approach the cruiser but stay at 20,000 km` — kind=clarify ("Hold range from which contact, Captain — the Kestrel or the cruiser?"); missing [[{"type":"maneuver","intent":"standoff","target":"cruiser","rangeKm":20000},{"type":"maneuver","intent":"approach","target":"cruiser","rangeKm":20000}]]
  - got: `[{"type":"maneuver","intent":"approach","target":"cruiser","speed":"full"}]`

## Passes

- `Helm, bring us around to face the cruiser`
- `Shadow the warship at fifty thousand kilometres`
- `Put us in the cruiser's path`
- `Escort the Kestrel`
- `Plot an intercept course for the Tessarine ship`
- `Fall back to thirty thousand kilometres from the cruiser`
- `Hold station off the Kestrel's bow`
- `Circle the freighter`
- `Stay out of their weapons range`
- `Close to transporter range of the Kestrel`
- `Keep us between the Kestrel and that ship`
- `Full stop`
- `Ops, transfer power from weapons to engines`
- `Tell the Kestrel's captain to hang on, we're coming`
- `We're not looking for a fight.`
- `Beam over everyone from the freighter`
- `Lock torpedos on the crusier`
- `Raise sheilds and red alert`
- `Get us closer to the frieghter`
- `Back us away from that warship slowly`
- `Run for Concord space`
- `Position us to block the cruiser's approach to the Kestrel`
- `Ask the prefect what he wants`
- `Prepare to jump out`
- `Can we tow her out of here?`
- `Have engineering patch up our sensors`
- `Swing around so our bow faces the freighter`
- `Let's keep things calm — lower our shields`
- `Signal the freighter that help is on the way`
- `Pull alongside the Kestrel and lower shields`
- `Evasive pattern delta, then return fire`
- `Move between the Kestrel and the Tessarine vessel and hold there`
- `Slip in behind the cruiser`
