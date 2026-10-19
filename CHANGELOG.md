# Changelog

All notable changes to Project Starbridge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.1] — 2026-10-18 — Milestone 1 fixes

### Fixed
- Every objective is now resolved when the simulation ends; none stays "active". Informational objectives (assess the Kestrel, the warship's intentions, the shielded compartment) end as **complete** or **missed**. "Protect the crew" ends as **complete** (crew evacuated or Kestrel towed out) or **failed**.
- "Avoid escalating the border dispute" follows one deterministic rule. It **fails immediately and permanently** when any of these happens: the Halcyon locks weapons on the cruiser, the Halcyon fires, or the cruiser locks weapons on the Kestrel. (A cruiser lock on the Halcyon, or the cruiser firing, would also count, but neither can happen in the M1 script.) If none of them happen, it completes at the ending. Previously a rescue could count as "complete" even after the cruiser had locked onto the Kestrel.
- When the cruiser locks weapons on the Kestrel, it is now shown as hostile.
- Toast notifications moved to the bottom-right (full-width bottom on phones), so they can no longer cover the SCRIPTED DEMO badge or header controls. A newer toast no longer gets dismissed early by an older one's timer.
- Standing down now clears weapon posture, so diplomacy works again after weapons were locked (the escalation failure stays).
- Placating the cruiser after it closed inside 60,000 km no longer moves it backwards.
- Red alert no longer costs a turn, matching the other alert and shield orders.
- After the Kestrel's reactor breaches (crew already evacuated), orders aimed at the Kestrel are politely refused instead of acting on a destroyed ship. The status report and rescue summary now mention her loss.
- Voice-input notes ("Heard: …") now clear on Restart, Load and Run again. "Run again" also stops any speech in progress.

### Tests
- New `objectives.test.ts` covering end states for all four endings, the escalation rule, late placation and the destroyed-Kestrel guard (44 unit tests in total).
- The smoke test now checks toast placement at desktop, tablet and phone widths, that no objective stays active after an ending, and that the voice note resets.

## [0.1.0] — 2026-10-18 — Milestone 1

### Added
- Vite + React + TypeScript project with folders for the engine, scenarios, UI and serverless API.
- Original setting: CSV Halcyon (Concord Exploration Service), freighter Kestrel, Tessarine Directorate cruiser Ashen Covenant, the Calloway Reach.
- LCARS-inspired command interface: forward viewscreen, ship status, mission narrative, captain's command input, tactical/sensor plot with contact details, communications log, mission objectives, save/load/restart.
- Animated canvas viewscreen with original freighter and cruiser artwork that scales with range; shield, tractor-beam and red-alert effects; reduced-motion support.
- Scripted demonstration of *The Kestrel Incident*: timed opening (skippable), deterministic keyword command handler with range and shield validation, independent cruiser movement and reactor countdown, hidden information (shielded compartment), and four endings.
- localStorage save/load with versioned, validated save files.
- Optional speech synthesis of crew and comms lines; voice input via the Web Speech API where supported, with typed fallback.
- `api/command` serverless stub (deterministic, no AI provider, no secrets).
- Unit tests (vitest) for the demo script and persistence; Playwright smoke test covering panels, commands, save/load, voice stubs, an ending, restart and responsive layouts.

### Known limitations
- Command understanding is keyword-based (demo only); unrecognised phrasing is rejected politely.
- Voice features were verified in headless Chromium with stubbed speech APIs only, not with real audio or a microphone.
- `/api/command` is not called by the client yet.
