/**
 * Model evaluation results, computed offline under 5-fold spatial
 * cross-validation. This is historical evaluation data for the Model
 * Performance section — it does NOT mean these models are connected to the
 * live prediction workflow. See src/services/predictionService.ts and
 * AVAILABLE_MODELS for what's actually connected right now.
 *
 * Ordinary random train/test splitting tends to look overly optimistic when
 * nearby observations are spatially correlated, which is why these figures
 * come from spatial folds rather than a random split.
 */
import type { ModelPerformanceMetrics } from "@/types/environmental";

export const SPATIAL_CV_DESCRIPTION =
  "5-fold spatial cross-validation. Folds are drawn so nearby observations stay together, " +
  "avoiding the overly optimistic scores that ordinary random splitting can produce when " +
  "spatially correlated points end up in both the training and test sets.";

/**
 * modelId "tabular_mlp" reports a perfect 1.0 on every metric below. This is
 * flagged, not celebrated: a perfect spatial-CV score on real ecological
 * data is far more consistent with data leakage or overfitting (e.g. a
 * feature that leaks the label, or duplicate/near-duplicate points crossing
 * fold boundaries) than with genuine generalization. It should be
 * investigated before this model is treated as the strongest candidate —
 * see the note rendered in ModelPerformancePage.
 */
export const TABULAR_MLP_MODEL_ID = "tabular_mlp" as const;

export const MODEL_PERFORMANCE: ModelPerformanceMetrics[] = [
  {
    modelId: "random_forest",
    label: "Random Forest",
    spatialRocAuc: 0.943,
    accuracy: 0.8184,
    precision: 0.9604,
    recall: 0.646,
    f1: 0.7677,
  },
  {
    modelId: "xgboost",
    label: "XGBoost",
    spatialRocAuc: 0.9395,
    accuracy: 0.8416,
    precision: 0.9518,
    recall: 0.7058,
    f1: 0.8098,
  },
  {
    modelId: "lightgbm",
    label: "LightGBM",
    spatialRocAuc: 0.9369,
    accuracy: 0.8314,
    precision: 0.9489,
    recall: 0.6865,
    f1: 0.7954,
  },
  {
    modelId: "gam_maxent",
    label: "GAM",
    spatialRocAuc: 0.9213,
    accuracy: 0.8506,
    precision: 0.8781,
    recall: 0.7983,
    f1: 0.835,
  },
  {
    modelId: "tabular_mlp",
    label: "Tabular MLP",
    spatialRocAuc: 1.0,
    accuracy: 1.0,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
  {
    modelId: "spatial_gnn",
    label: "Spatial GNN",
    spatialRocAuc: 0.9307,
    accuracy: 0.7873,
    precision: 0.9521,
    recall: 0.5967,
    f1: 0.7336,
  },
];
