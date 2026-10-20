# Held-out duty-bridge evaluation (Phase D, written before its first run)

**Result: 11/20 passed (55.0%). Unsafe (a call answered the wrong way, or speech taken as a duty order): 0.**

| # | context | line | expected | got | |
|---|---|---|---|---|---|
| 1 | directive | Tell Fleet we're on it. | respond:accept | clarify | miss |
| 2 | directive | Message received. Plot an intercept to the Kestrel. | respond:accept | not-bridge | miss |
| 3 | directive | Ask the admiral why it has to be us. | respond:question | clarify | miss |
| 4 | directive | Inform Fleet Command we will not be going, the Accords forbid it. | respond:refuse | clarify | miss |
| 5 | directive | Pretend we didn't hear it. | respond:ignore | unrecognised | miss |
| 6 | distress | Answer the mayday, best speed. | respond:accept | respond:accept | ok |
| 7 | distress | We can't spare the time. Log it. | respond:decline | respond:decline | ok |
| 8 | distress | Let's go get them. | respond:accept | unrecognised | miss |
| 9 | voluntary | Thank the colony office but say no. | respond:decline | respond:decline | ok |
| 10 | voluntary | Sure, we can escort them. | respond:accept | clarify | miss |
| 11 | idle | Resume our patrol route. | patrol | patrol | ok |
| 12 | idle | Let a few hours go by. | patrol | unrecognised | miss |
| 13 | idle | Varga, are there any alien civilizations out there we have not met? | civs | civs | ok |
| 14 | idle | Which inhabited worlds have we found? | civs | civs | ok |
| 15 | idle | Plot a course to Merrow. | course | course | ok |
| 16 | idle | Take us to the Teshra system, ensign. | course | course | ok |
| 17 | idle | Head back to the patrol station. | course | unrecognised | miss |
| 18 | channel | We come in peace and we would like to learn about you. | not-bridge | not-bridge | ok |
| 19 | channel | Yes, we would like to trade with you. | not-bridge | not-bridge | ok |
| 20 | directive | Raise shields. | not-bridge | not-bridge | ok |
