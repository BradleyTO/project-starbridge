# Held-out duty-bridge evaluation — set 2 (written after set 1 was tuned, before its own first run)

**Result: 4/12 passed (33.3%). Unsafe (a call answered the wrong way, or speech taken as a duty order): 0.**

| # | context | line | expected | got | |
|---|---|---|---|---|---|
| 1 | directive | Acknowledge the directive. | respond:accept | unrecognised | miss |
| 2 | directive | Signal Fleet Command that the Halcyon is responding. | respond:accept | clarify | miss |
| 3 | directive | I want to know why Fleet thinks this is our job. | respond:question | unrecognised | miss |
| 4 | directive | No. We stay here. | respond:refuse | not-bridge | miss |
| 5 | distress | Change course, we are going to help that hauler. | respond:accept | unrecognised | miss |
| 6 | distress | Leave it. Someone closer will answer. | respond:ignore | clarify | miss |
| 7 | voluntary | Tell them we're sorry, we can't make it. | respond:decline | clarify | miss |
| 8 | voluntary | Happy to help. Tell them we accept. | respond:accept | respond:accept | ok |
| 9 | idle | Keep patrolling. | patrol | unrecognised | miss |
| 10 | idle | Science, any signs of intelligent life in range? | civs | civs | ok |
| 11 | idle | Lay in a course for Ostrava, warp speed. | course | course | ok |
| 12 | channel | Tell me about your world. | not-bridge | not-bridge | ok |
