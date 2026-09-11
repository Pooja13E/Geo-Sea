# GeoSea Dashboard + ML Prediction

## Current prediction architecture

GeoSea uses the confirmed production **Tabular MLP** and retrieves environmental
inputs for the clicked coordinate directly from **Bio-ORACLE v3.0 ERDDAP**.
The browser no longer substitutes the nearest observed GeoSea record for an
arbitrary map click.

Prediction flow:

1. Choose **Habitat Suitability Prediction**.
2. Click a marine coordinate on the map.
3. FastAPI sends the coordinate to the Bio-ORACLE ERDDAP service.
4. Bio-ORACLE returns the same eight baseline variables used to construct the
   training dataset:
   - temperature
   - salinity
   - chlorophyll
   - nitrate
   - phosphate
   - pH
   - PAR
   - kdPAR
5. FastAPI applies the saved `StandardScaler`.
6. FastAPI runs the saved Tabular MLP.
7. The frontend displays the probability, suitability class, environmental
   values, and data provenance.

The eight Bio-ORACLE datasets are the training-compatible baseline layers:

- `thetao_baseline_2000_2019_depthsurf` / `thetao_mean`
- `so_baseline_2000_2019_depthsurf` / `so_mean`
- `chl_baseline_2000_2018_depthsurf` / `chl_mean`
- `no3_baseline_2000_2018_depthsurf` / `no3_mean`
- `po4_baseline_2000_2018_depthsurf` / `po4_mean`
- `ph_baseline_2000_2018_depthsurf` / `ph_mean`
- `par_mean_baseline_2000_2020_depthsurf` / `par_mean_mean`
- `kdpar_mean_baseline_2000_2020_depthsurf` / `kdpar_mean_mean`

The backend selects the first baseline time slice, matching the original
GeoSea extraction script. Bio-ORACLE's grid is 0.05° (~5.5 km at the equator).
This is **baseline environmental data, not real-time/current observations**.

## Backend model files

The confirmed artifacts are already included in `backend/models/`:

    backend/models/geosea_mlp_model.pth
    backend/models/geosea_mlp_scaler.joblib

The backend also accepts `geosea_scaler.joblib` for compatibility with older
training runs.

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
