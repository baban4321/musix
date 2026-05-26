You are a senior frontend + PWA + mobile web engineer.

I already have a music streaming web app named "Musix".
Current stack:
- React.js
- TailwindCSS
- Existing audio player already implemented

Objective:
Make the web app behave like a real mobile music app temporarily until native apps are built.

Critical Requirements:
1. Music MUST continue playing when:
   - phone screen is locked
   - user switches apps
   - browser goes to background
   - notification shade is opened

2. Android media player controls must appear:
   - lock screen controls
   - notification controls
   - quick settings media panel
   - bluetooth headset controls

3. App should be installable on Android as a PWA:
   - Add to Home Screen
   - standalone fullscreen mode
   - app icon
   - splash screen feel

4. Existing UI should remain intact.
Do NOT redesign the app.
Only improve playback infrastructure and mobile experience.

====================================================
IMPLEMENTATION REQUIREMENTS
====================================================

STEP 1 — PWA SETUP

Implement full Progressive Web App support.

Create:
- manifest.json
- service worker
- installability support

manifest.json requirements:
- app name: Musix
- standalone display
- portrait orientation
- theme color dark
- app icons
- splash compatibility

Update:
- index.html meta tags
- mobile web app capable settings
- apple mobile meta tags

====================================================

STEP 2 — BACKGROUND AUDIO PLAYBACK

Refactor audio system so playback survives:
- screen off
- app switching
- browser minimized

Rules:
- Use ONE global audio instance only
- Prevent multiple audio instances
- Prevent audio reset on route change
- Persist playback state globally

Use:
- React Context OR Zustand

Global player state must include:
- current song
- queue
- play/pause
- duration
- current time
- repeat
- shuffle
- volume

====================================================

STEP 3 — MEDIA SESSION API

Implement full Media Session API support.

Features required:
- song title
- artist
- album art
- play/pause actions
- next track
- previous track
- seek support if possible

Implement:
navigator.mediaSession.metadata

Implement action handlers:
- play
- pause
- nexttrack
- previoustrack
- seekbackward
- seekforward

Android lockscreen controls MUST work.

====================================================

STEP 4 — MOBILE OPTIMIZATION

Improve mobile behavior:
- prevent accidental page refresh during playback
- preserve playback during route navigation
- prevent player unmounting
- keep mini-player persistent globally

Implement:
- smooth mobile transitions
- touch-friendly controls
- safe-area support for notched devices
- proper viewport handling

====================================================

STEP 5 — AUDIO ENGINE IMPROVEMENTS

Implement robust playback handling:
- buffering state
- loading state
- reconnect handling
- playback recovery
- stalled network recovery

Handle:
- autoplay restrictions
- promise rejection on play()
- mobile browser audio interruptions

====================================================

STEP 6 — PERSISTENCE

Persist:
- last played song
- playback position
- queue
- volume
- repeat/shuffle mode

Use:
- localStorage

On app reopen:
- restore player state automatically

====================================================

STEP 7 — OPTIONAL BUT IMPORTANT

If audio is streamed:
- support HLS streams
- use hls.js if required

Ensure:
- efficient buffering
- low mobile memory usage

====================================================

STEP 8 — INSTALL PROMPT

Implement custom install prompt:
- detect beforeinstallprompt
- show install banner/button
- smooth UX

====================================================

STEP 9 — ANDROID TESTING REQUIREMENTS

Playback MUST continue when:
- screen turns off
- switching apps
- opening WhatsApp
- minimizing Chrome
- receiving notifications

Verify:
- Android media notification appears
- lockscreen controls work
- bluetooth controls work

====================================================

IMPORTANT RULES
====================================================

DO NOT:
- break existing UI
- create duplicate audio players
- reset playback on page navigation
- create multiple contexts unnecessarily

DO:
- keep architecture scalable
- keep code modular
- use clean React patterns
- optimize for Android Chrome first

====================================================

EXPECTED OUTPUT
====================================================

Provide:
1. Complete implementation
2. Updated React architecture
3. New files created
4. Exact code modifications
5. PWA setup
6. Media Session integration
7. Audio persistence system
8. Testing checklist
9. Mobile optimization fixes

Goal:
Musix should behave almost like Spotify/JioSaavn on Android mobile browser for temporary daily usage.