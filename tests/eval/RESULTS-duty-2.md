# Held-out duty-bridge evaluation — set 2 (written after set 1 was tuned, before its own first run)

**Result: 12/12 passed (100.0%). Unsafe (a call answered the wrong way, or speech taken as a duty order): 0.**

| # | context | line | expected | got | |
|---|---|---|---|---|---|
| 1 | directive | Acknowledge the directive. | respond:accept | respond:accept | ok |
| 2 | directive | Signal Fleet Command that the Halcyon is responding. | respond:accept | respond:accept | ok |
| 3 | directive | I want to know why Fleet thinks this is our job. | respond:question | respond:question | ok |
| 4 | directive | No. We stay here. | respond:refuse | respond:refuse | ok |
| 5 | distress | Change course, we are going to help that hauler. | respond:accept | respond:accept | ok |
| 6 | distress | Leave it. Someone closer will answer. | respond:ignore | respond:ignore | ok |
| 7 | voluntary | Tell them we're sorry, we can't make it. | respond:decline | respond:decline | ok |
| 8 | voluntary | Happy to help. Tell them we accept. | respond:accept | respond:accept | ok |
| 9 | idle | Keep patrolling. | patrol | patrol | ok |
| 10 | idle | Science, any signs of intelligent life in range? | civs | civs | ok |
| 11 | idle | Lay in a course for Ostrava, warp speed. | course | course | ok |
| 12 | channel | Tell me about your world. | not-bridge | not-bridge | ok |
