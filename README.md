# 🛵 Easy Rider

> **Life In The Slow Lane.** A whimsical, mod-1960s navigation app designed for 49cc mopeds and vintage scooters that stay off roads over 40 mph.

**Live App**: [easyrider.atlantadaniel.com](https://easyrider.atlantadaniel.com)

Built with [Lovable](https://lovable.dev).

---

## 🌟 Why Easy Rider?

Standard GPS apps always push you onto arterial boulevards, highways, and fast suburban stroads. If you ride a 49cc moped, vintage Vespa, or Honda Metropolitan, you need backstreets, parkways, and neighborhood cut-throughs where traffic moves at your pace.

Easy Rider plans routes prioritizing quiet, low-speed roads and gives you turn-by-turn guidance without losing your route.

---

## ✨ Features

- **Low-Speed Routing**: Avoids highways and high-speed corridors, favoring roads under 40 mph.
- **Smart Location Search**: Autocomplete for business names, parks, and landmarks so you don't need exact street addresses.
- **Current Location Start**: Tap "Use my location" to quickly map trips from wherever you are parked.
- **Turn-by-Turn GPS Navigation**:
  - Live route-following with upcoming turn prompts and distance meters.
  - Audio voice cues for spoken turns.
  - Off-route detection with clear return prompts.
- **Handlebar Friendly**:
  - **Screen Wake Lock**: Keeps your phone screen awake while mounted on your scooter.
  - Large, high-contrast navigation cards for quick glances.
- **External Maps Handoff**: Open destination endpoints in Google Maps or Apple Maps with one tap if needed.
- **Add to Home Screen**: Install Easy Rider on iOS and Android for a full-screen, app-like experience.
- **Retro Mod Vibe**: Styled in mod 1960s pastels inspired by vintage Italian scooter culture.

---

## ⚠️ Rider Safety & Speed Limit Disclaimer

Easy Rider routes use speed limits and road classifications from OpenStreetMap and the Valhalla routing engine. Because speed limit tagging on crowd-sourced maps can be incomplete or outdated:
- Always obey posted street signs and local traffic laws.
- Exercise your judgment if a road feels unsafe or faster than posted.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, SSR)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with custom vintage pastel design tokens
- **Maps & Routing**: OpenStreetMap, Valhalla routing API, and [Turf.js](https://turfjs.org) for real-time GPS tracking and route matching
- **Web APIs**: Geolocation, Screen Wake Lock, Web Speech

---

## 🚀 Local Development

Prerequisites: Node.js 18+ and npm.

```sh
git clone <your-repo-url>
cd <your-repo-name>
npm install
npm run dev
```

App runs locally at `http://localhost:8080`.
