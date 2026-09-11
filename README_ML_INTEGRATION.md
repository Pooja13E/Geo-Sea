# GeoSea — ML Prediction Integration

This document describes the machine learning prediction pipeline used by the GeoSea dashboard.

## Prediction Architecture

GeoSea uses a trained Tabular MLP model to estimate marine habitat suitability for a selected geographic location.

The prediction pipeline is:

1. The user clicks a location on the map.
2. The latitude and longitude are sent to the FastAPI backend.
3. The backend retrieves environmental data for the location from Bio-ORACLE v3.0 through ERDDAP.
4. Eight environmental variables are obtained:
   - Temperature
   - Salinity
   - Chlorophyll
   - Nitrate
   - Phosphate
   - pH
   - PAR
   - kdPAR
5. The saved StandardScaler is applied to the environmental values.
6. The trained Tabular MLP generates a suitability probability.
7. The frontend displays the probability, suitability category, and environmental information.

The browser does not use the nearest observed GeoSea record for prediction.

## Environmental Data

GeoSea uses training-compatible Bio-ORACLE v3.0 baseline layers:

| Variable | Bio-ORACLE Dataset |
|---|---|
| Temperature | `thetao_baseline_2000_2019_depthsurf` |
| Salinity | `so_baseline_2000_2019_depthsurf` |
| Chlorophyll | `chl_baseline_2000_2018_depthsurf` |
| Nitrate | `no3_baseline_2000_2018_depthsurf` |
| Phosphate | `po4_baseline_2000_2018_depthsurf` |
| pH | `ph_baseline_2000_2018_depthsurf` |
| PAR | `par_mean_baseline_2000_2020_depthsurf` |
| kdPAR | `kdpar_mean_baseline_2000_2020_depthsurf` |

The backend uses the first baseline time slice, matching the environmental extraction used during model development.

Bio-ORACLE provides a spatial resolution of 0.05° (approximately 5.5 km at the equator).

These are baseline climatological environmental conditions and should not be interpreted as real-time measurements.

## Model Files

The trained model and preprocessing scaler are included in:

```text
backend/models/
├── geosea_mlp_model.pth
└── geosea_mlp_scaler.joblib

## Run the backend

    cd backend
    python -m venv .venv

Windows:

    .venv\\Scripts\\activate

Install dependencies:

    pip install -r requirements.txt

Start:

    uvicorn app:app --reload --host 127.0.0.1 --port 8000

Check:

    http://127.0.0.1:8000/health

The health endpoint should return `"ready": true` once the model and scaler
are loaded.

## Run the frontend

From the project root:

    npm install
    npm run dev

The frontend defaults to `http://127.0.0.1:8000`. To change it, create `.env`
from `.env.example` and set `VITE_API_URL`.

## Bio-ORACLE network requirement

Prediction mode now requires the backend machine to have internet access to
`https://erddap.bio-oracle.org`. If Bio-ORACLE is unavailable, the frontend
shows that the live prediction is unavailable rather than silently using a
nearest observed GeoSea record.
