# Film Room roadmap

- [x] Angle label uses pixel coordinates (`angleAt(p0, p1, p2)`)
- [x] Video stage height capped at 70vh and centered
- [x] Space ignored when a BUTTON has focus (no double-toggle)
- [x] `downloadBlob` revokes the object URL after 1s (Safari)
- [ ] YouTube mode: paste-link embed via the YouTube IFrame Player API
  - reuse speed selector via `setPlaybackRate` (0.25x minimum)
  - reuse frame step buttons via `seekTo(currentTime ± 1/fps, true)` while paused
  - drawing canvas over the player: taps captured when paused, pointer-events pass through when playing
  - line / angle / circle tools behave the same
  - hide Capture, show the "Capture unavailable for YouTube" note
  - upload features unchanged
