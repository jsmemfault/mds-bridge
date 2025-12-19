# nRF Cloud Powered by Memfault
## CES 2026 — Silent Looping Video (60 seconds)

**Format:** No audio, text-driven, looping seamlessly
**Display:** Monitor above demo station
**Purpose:** Explain what visitors are seeing in the live demo below

---

## TIME BREAKDOWN

| Content | Duration | Notes |
|---------|----------|-------|
| Branding/Problem | 10s | Set context |
| **USB-HID Demo** | **40s** | **Core focus** |
| Benefits/CTA | 10s | Wrap up |

---

## VISUAL STORYBOARD

### FRAME 1: Title + Context (0:00 - 0:05)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                      nRF Cloud                           │
│                 Powered by Memfault                      │
│                                                          │
│        ─────────────────────────────────────             │
│                                                          │
│          USB-HID Diagnostic Streaming Demo               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Logos fade in, "USB-HID" emphasized

---

### FRAME 2: The Problem (0:05 - 0:10)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Your device crashes in the field.           │
│                                                          │
│                   No JTAG. No logs.                      │
│                   No way to know why.                    │
│                                                          │
│                      Until now.                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Text fades in, "Until now." appears last with emphasis

---

### FRAME 3: Demo Overview — The Setup (0:10 - 0:18)

```
┌──────────────────────────────────────────────────────────┐
│                      LIVE DEMO SETUP                     │
│                                                          │
│    ┌────────────┐       USB        ┌────────────┐       │
│    │ nRF54LM20  │ ───────────────► │  Gateway   │       │
│    │     DK     │       HID        │  (below)   │       │
│    └────────────┘                  └─────┬──────┘       │
│          │                               │ HTTPS        │
│      [Button]                            ▼              │
│                                    ┌────────────┐       │
│                                    │  nRF Cloud │       │
│                                    └────────────┘       │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Flow animates: Device → Gateway → Cloud

---

### FRAME 4: Demo Step 1 — Trigger Fault (0:18 - 0:24)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    STEP 1: TRIGGER                       │
│                                                          │
│                                                          │
│                 Press button on device                   │
│                         ▼                                │
│                  Fault injected                          │
│                         ▼                                │
│              Coredump captured instantly                 │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Steps cascade down, button icon pulses

---

### FRAME 5: Demo Step 2 — USB-HID Stream (0:24 - 0:32)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   STEP 2: STREAM                         │
│                                                          │
│       ┌──────────┐                  ┌──────────┐        │
│       │  Device  │  ═══════════►   │ Gateway  │        │
│       └──────────┘   USB HID        └──────────┘        │
│                      packets                             │
│                                                          │
│            • Standard USB HID — no drivers              │
│            • Works on Mac, Windows, Linux               │
│            • Chunks streamed in real-time               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Data packets animate along the arrow, bullet points fade in

---

### FRAME 6: Demo Step 3 — Gateway Processing (0:32 - 0:38)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                  STEP 3: GATEWAY                         │
│                                                          │
│         ┌─────────────────────────────────────┐         │
│         │  ◄── See terminal output below      │         │
│         │                                     │         │
│         │  📦 Packet received                 │         │
│         │  📤 Uploading chunk...              │         │
│         │  ✓  Upload successful               │         │
│         └─────────────────────────────────────┘         │
│                                                          │
│            Gateway auto-reconnects after resets          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Terminal mockup with lines appearing, arrow points down

---

### FRAME 7: Demo Step 4 — Cloud Dashboard (0:38 - 0:46)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                 STEP 4: CLOUD ANALYSIS                   │
│                                                          │
│         Crash appears in nRF Cloud instantly:            │
│                                                          │
│            ✓ Full stack trace                            │
│            ✓ Register dump                               │
│            ✓ System metrics                              │
│            ✓ Device timeline                             │
│                                                          │
│              From crash to cloud in seconds.             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Checkmarks animate in, tagline emphasized

---

### FRAME 8: Why This Matters (0:46 - 0:52)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                 CHIP-TO-CLOUD VISIBILITY                 │
│                                                          │
│        This demo shows one device, one crash.            │
│                                                          │
│         nRF Cloud scales to millions of devices:         │
│                                                          │
│            • Fleet-wide crash analytics                  │
│            • OTA firmware updates                        │
│            • Remote diagnostics                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Text scales up on "millions of devices"

---

### FRAME 9: Call to Action (0:52 - 0:57)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                          ▼                               │
│                                                          │
│               See the live demo below                    │
│                                                          │
│          Press the button. See the crash.                │
│                   Fix the bug.                           │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Arrow bounces, pointing down to demo station

---

### FRAME 10: Loop Point (0:57 - 1:00)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                      nRF Cloud                           │
│                 Powered by Memfault                      │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Motion:** Fade out, seamless crossfade to Frame 1

---

## DESIGN NOTES

### Color Palette
- Nordic blue (#00A9CE) as primary accent
- Memfault green (#00D26A) for success states
- Dark background (#1a1a2e or similar) for contrast
- White/light gray text

### Typography
- Clean sans-serif (Inter, SF Pro, or similar)
- Large, readable from 10+ feet away
- High contrast for visibility in booth lighting

### Animation Style
- Smooth, confident transitions
- No flashy effects — professional and modern
- 0.3-0.5s transitions between elements
- Subtle motion keeps it alive without being distracting

### Loop Seamlessness
- Frame 8 fades to match Frame 1 exactly
- No jarring cut — should feel continuous
- Consider a 0.5s crossfade at loop point

---

## PRODUCTION SPECS

| Property | Value |
|----------|-------|
| Duration | 60 seconds (exact) |
| Resolution | 1920x1080 (16:9) or 3840x2160 (4K) |
| Frame Rate | 30fps |
| Audio | None (silent) |
| Format | MP4 (H.264) or MOV |
| Loop | Seamless |

---

## TEXT SUMMARY (All On-Screen Copy)

**Frame 1:** "nRF Cloud / Powered by Memfault / USB-HID Diagnostic Streaming Demo"

**Frame 2:** "Your device crashes in the field. / No JTAG. No logs. / No way to know why. / Until now."

**Frame 3:** "LIVE DEMO SETUP / nRF54LM20 DK → Gateway → nRF Cloud"

**Frame 4:** "STEP 1: TRIGGER / Press button → Fault injected → Coredump captured"

**Frame 5:** "STEP 2: STREAM / USB HID packets / No drivers, works on any OS"

**Frame 6:** "STEP 3: GATEWAY / See terminal below / Auto-reconnects after resets"

**Frame 7:** "STEP 4: CLOUD ANALYSIS / Stack trace, registers, metrics / From crash to cloud in seconds"

**Frame 8:** "CHIP-TO-CLOUD VISIBILITY / One demo, millions of devices / Fleet analytics, OTA, remote diagnostics"

**Frame 9:** "▼ See the live demo below / Press the button. See the crash. Fix the bug."

**Frame 10:** "nRF Cloud / Powered by Memfault"

---

**Document Version:** 3.0
**Last Updated:** 2025-12-18
**Format:** Silent looping video — 40 seconds demo-focused, 20 seconds branding/CTA
