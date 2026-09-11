import type {
  EnvironmentalVariables,
  HabitatPrediction,
  MapLocation,
  ModelMeta,
} from "@/types/environmental";
import { ENV_VARIABLE_KEYS } from "@/types/environmental";
import { classifySuitability } from "@/data/suitabilityConfig";
import { getEnvironmentalRanges } from "@/services/dataService";
import { FINAL_MODEL } from "@/services/modelConfig";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const AVAILABLE_MODELS: ModelMeta[] = [
  { id: "tabular_mlp", label: "Tabular MLP", status: "ready" },
];

export function findOutOfRangeVariables(
  values: EnvironmentalVariables
): Array<keyof EnvironmentalVariables> {
  const ranges = getEnvironmentalRanges();
  const out: Array<keyof EnvironmentalVariables> = [];
  for (const key of ENV_VARIABLE_KEYS) {
    const [min, max] = ranges[key];
    const v = values[key];
    if (!Number.isFinite(v) || v < min || v > max) out.push(key);
  }
  return out;
}

/**
 * Sends the eight environmental features to the FastAPI inference service.
 * The backend owns the PyTorch model and StandardScaler so the browser never
 * needs to load model weights.
 */
export interface EnvironmentalSourceMeta {
  provider: string;
  version: string;
  temporal_basis: string;
  baseline_time_slice: string;
  spatial_resolution: string;
  spatial_resolution_km_equator: string;
  access: string;
}

/**
 * Requests a coordinate-based prediction. The backend now retrieves the
 * eight environmental inputs directly from Bio-ORACLE before running the
 * saved MLP, so the browser no longer substitutes a nearest GeoSea row.
 */
export async function getPrediction(
  location: MapLocation
): Promise<HabitatPrediction> {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Prediction service returned an error.");
    }

    const probability = Number(data.probability);
    const environmentalValues = data.environment as EnvironmentalVariables;
    const outOfRangeVariables = findOutOfRangeVariables(environmentalValues);

    return {
      modelId: FINAL_MODEL,
      location,
      probability,
      suitabilityClass: classifySuitability(probability),
      confidence: data.confidence == null ? null : Number(data.confidence),
      environmentalValues,
      environmentalSource: data.environmental_source as EnvironmentalSourceMeta,
      isLive: true,
      outOfRangeVariables,
    };
  } catch (error) {
    console.error("GeoSea prediction request failed:", error);
    return {
      modelId: FINAL_MODEL,
      location,
      probability: null,
      suitabilityClass: classifySuitability(null),
      confidence: null,
      environmentalValues: null,
      environmentalSource: null,
      isLive: false,
      outOfRangeVariables: [],
    };
  }
}
