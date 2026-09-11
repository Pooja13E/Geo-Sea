import os
from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .bio_oracle import BioOracleError, get_environment
except ImportError:  # supports `uvicorn app:app` from the backend directory
    from bio_oracle import BioOracleError, get_environment

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "geosea_mlp_model.pth"

# The training pipeline has used both names across iterations. The backend
# accepts either, while preferring the production name from the latest run.
SCALER_CANDIDATES = [
    BASE_DIR / "models" / "geosea_scaler.joblib",
    BASE_DIR / "models" / "geosea_mlp_scaler.joblib",
]

FEATURES = [
    "temperature",
    "salinity",
    "chlorophyll",
    "nitrate",
    "phosphate",
    "pH",
    "PAR",
    "kdpar",
]


class TabularMLP(nn.Module):
    """Exact production architecture used by the confirmed GeoSea MLP."""

    def __init__(self, input_dim=8):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        return self.network(x)


app = FastAPI(
    title="GeoSea ML Inference API",
    version="1.0.0",
    description="Inference service for the GeoSea Tabular MLP habitat suitability model.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_scaler = None


def load_artifacts():
    global _model, _scaler

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found: {MODEL_PATH}. "
            "Copy geosea_mlp_model.pth into backend/models/."
        )

    scaler_path = next((p for p in SCALER_CANDIDATES if p.exists()), None)
    if scaler_path is None:
        raise FileNotFoundError(
            "Scaler artifact not found. Copy geosea_scaler.joblib "
            "or geosea_mlp_scaler.joblib into backend/models/."
        )

    model = TabularMLP(input_dim=8)
    state = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
    model.eval()

    scaler = joblib.load(scaler_path)

    _model = model
    _scaler = scaler


@app.on_event("startup")
def startup():
    # Keep the server bootable even before artifacts are copied. /health
    # reports the missing artifact state and /predict returns a clear 503.
    try:
        load_artifacts()
    except Exception as exc:
        print(f"[GeoSea] Model not loaded: {exc}")


class PredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@app.get("/health")
def health():
    if _model is None or _scaler is None:
        return {
            "status": "degraded",
            "model": "tabular_mlp",
            "ready": False,
            "message": "Model artifacts are not loaded.",
        }

    return {
        "status": "ok",
        "model": "tabular_mlp",
        "ready": True,
        "environmental_source": "Bio-ORACLE v3.0",
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    global _model, _scaler

    if _model is None or _scaler is None:
        try:
            load_artifacts()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"GeoSea model is unavailable: {exc}",
            ) from exc

    try:
        environmental = get_environment(request.latitude, request.longitude)
    except BioOracleError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Bio-ORACLE environmental lookup failed: {exc}",
        ) from exc

    values_dict = environmental["values"]
    values = np.array(
        [[values_dict[feature] for feature in FEATURES]],
        dtype=np.float32,
    )

    if not np.isfinite(values).all():
        raise HTTPException(
            status_code=502,
            detail="Bio-ORACLE returned a non-finite environmental value.",
        )

    try:
        scaled = _scaler.transform(values)
        tensor = torch.tensor(scaled, dtype=torch.float32)

        with torch.no_grad():
            logits = _model(tensor)
            probability = float(torch.sigmoid(logits).item())

        prediction = int(probability >= 0.5)

        return {
            "model": "tabular_mlp",
            "probability": probability,
            "prediction": prediction,
            "confidence": None,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "environment": values_dict,
            "environmental_source": environmental["source"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"GeoSea inference failed: {exc}",
        ) from exc

