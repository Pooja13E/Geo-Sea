/**
 * Single configuration point for which ML model the dashboard uses for
 * habitat suitability prediction.
 *
 * The dashboard ships with exactly ONE production model — the user never
 * sees or chooses between model families. To change which model the
 * dashboard is configured for, change this one value; no UI component
 * needs to change.
 *
 * This has not yet been formally selected based on the model-performance
 * metrics (see src/data/modelPerformance.ts) — "xgboost" is a temporary
 * placeholder configuration, not a decision. Valid values are the same
 * six families evaluated there: "xgboost", "random_forest", "lightgbm",
 * "gam_maxent", "tabular_mlp", "spatial_gnn".
 */
import type { ModelId } from "@/types/environmental";

export const FINAL_MODEL: ModelId = "tabular_mlp";
