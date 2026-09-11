# GeoSea — Decision Support Dashboard

**Stage 2** — connected to the real dataset (`GeoSea_8_Variables.csv`,
336,924 records). ML predictions are still not implemented — that's Stage 3.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`). First
load parses the 65 MB CSV (a few seconds); every filter/pan/zoom after that
reads from memory, no re-parsing.

```bash
npm run build
npm run preview
```

## What's included in this stage

- Real dataset loaded from `public/data/GeoSea_8_Variables.csv`, parsed
  once into an in-memory columnar store (see "Performance decisions" below)
- Loading and error states while the CSV downloads/parses
- KPI cards computed from the loaded data: total records, species count
  (excluding `Pseudo_Absence`), presence/absence split, environmental
  variable count, spatial fold count — all calculated, never hard-coded
- Map automatically fits the real data extent (lat -60→30, lon 20→147)
  instead of the old mock UK-centred region
- Species search/filter (debounced, capped result list — see below),
  presence/absence filter, spatial-fold filter (labelled as validation
  folds, not species categories), and a "Clear" action for all three
- Map rendering switches automatically between an aggregated grid view
  (when many records are visible) and individual canvas markers (when
  fewer are visible) — click a grouped circle to zoom into it
- Location info panel shows the actual record: scientific name (or
  "Pseudo-absence / absence"), presence/absence, coordinates, all 8
  environmental variables, and spatial fold
- Layer list now includes one entry per environmental variable, each
  marked "Soon" until a real visualization exists for it

## Project structure

```
src/
  types/
    environmental.ts     # OccurrenceRecord, DatasetSummary, FilterState,
                          # GridCell, per-variable LayerId — all match the
                          # real CSV's 13 columns
  data/
    mockEnvironmentalData.ts   # kept for dev/testing only — not imported
                                # by any production component or service
    layerConfig.ts             # initial layer list, incl. all 8 env vars
  services/
    dataService.ts        # real CSV loading, filtering, summaries,
                           # grid aggregation — the only file that touches
                           # raw dataset storage
    predictionService.ts  # unchanged placeholder for future ML integration
  components/
    layout/     Header, SummaryCards
    sidebar/    Sidebar, SpeciesSelect (new — searchable species combobox)
    map/        MapView, MapLegend, LocationInfoPanel
  utils/
    formatters.ts    # + formatCount() for comma-formatted numbers
  App.tsx       # loading/error states, filter state, summary computation
  main.tsx
public/
  data/GeoSea_8_Variables.csv   # the real dataset, served as a static asset
```

## Where to connect things later (Stage 3)

`src/services/predictionService.ts` is untouched and still the seam for ML
model outputs — `getPrediction()` still returns `probability: null`.
`layerConfig.ts` marks `habitatSuitability` and each environmental-variable
layer as `available: false`; flip them once there's real data/tiles to show.
