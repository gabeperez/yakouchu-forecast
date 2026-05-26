# 夜光虫よほう · Sea Sparkle Forecast

An educated guess at **when bioluminescent plankton (_Noctiluca scintillans_ / 夜光虫) are most likely to glow blue** along the Shōnan coast near Enoshima, Japan — built from live sea temperature, wind, waves, tide and moonlight.

> 湘南の海で夜光虫が青く光るのはいつ頃か。海水温・風・波・潮の満ち引き・月明かりのリアルタイムデータから予測します。

It's a single self-contained `index.html` — **no build step, no dependencies, no API keys.** Just open it.

## Run it

Open `index.html` in any browser. That's it.

To serve it locally instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What it does

- **Tonight + 7 nights ahead**, scored 0–100 for the chance of a *visible* glow.
- A sunset→sunrise **time scrubber** — drag to any moment and the score updates live (all times in 24-hour **JST**).
- **Best window(s)** highlighted, plus a "catch it earlier" callout when the peak is late but there's a good, reachable earlier window.
- A **moon-sensitivity** control to dial how much moonlight matters (defaults to a value calibrated against real local sightings).
- **Bilingual EN / 日本語**, defaulting to your browser language.
- **Instant loads** after the first visit (cached, refreshes quietly in the background).

## How the score works

For every 15 minutes from sunset to sunrise, the app combines the factors below into a 0–100 "is it likely there?" score, then multiplies by how visible a glow would be (twilight is a hard gate; the moon dims but never erases a dense bloom; cloud cover that hides the moon brings the darkness back).

| Factor | Weight |
|---|---|
| Sea-surface temperature (16–23 °C is the sweet spot) | 32% |
| Calm sea / low waves | 24% |
| Onshore wind (pushes the surface bloom to the beach) | 24% |
| Tide state | 10% |
| Recent rain / nutrients | 10% |
| × Darkness (moon + twilight) | gate |

It's a probability nudge, **not a promise** — the model can only see the weather around the plankton, not the plankton themselves. Treat a "High" night as *worth the walk to the beach*.

## Data sources (all live, no key)

- Sea temperature & wave height — [Open-Meteo Marine API](https://open-meteo.com/)
- Wind, air temperature, rain, cloud — [Open-Meteo Forecast API](https://open-meteo.com/)
- Tide curve & high/low times — [tide736.net](https://tide736.net/) (Japan Meteorological Agency harmonics)
- Sun & moon — [SunCalc](https://github.com/mourner/suncalc), computed in your browser

## Add your own location

Each spot is one entry in the `LOCATIONS` array near the top of the script:

```js
{ id:'enoshima', nameEn:'Enoshima · Katase', nameJp:'江の島・片瀬',
  lat:35.309, lon:139.481, shoreFacing:185, tide:{pc:14,hc:19} }
```

`shoreFacing` is the compass bearing the beach opens toward (for the onshore-wind math), and `tide` is an optional Japanese tide station. The weather, sun and moon work anywhere on Earth; tide is Japan-only and is dropped (with the other weights re-balanced) elsewhere.

---

Made for the Shōnan coast · 湘南の夜のために · An educated guess, not a guarantee.
