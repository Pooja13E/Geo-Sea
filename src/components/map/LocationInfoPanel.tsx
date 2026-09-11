import type { HabitatPrediction, MapLocation, OccurrenceRecord } from "@/types/environmental";
import { ENV_VARIABLE_KEYS } from "@/types/environmental";
import { ENV_VARIABLE_META } from "@/data/envVariableConfig";
import { suitabilityBand, UNKNOWN_SUITABILITY_COLOR } from "@/data/suitabilityConfig";
import { formatCoordinate, formatVariable } from "@/utils/formatters";
import "./LocationInfoPanel.css";

const VARIABLE_ROWS: Array<{
  key: keyof Pick<
    OccurrenceRecord,
    "temperature" | "salinity" | "chlorophyll" | "nitrate" | "phosphate" | "pH" | "PAR" | "kdpar"
  >;
  label: string;
  unit: string;
}> = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "salinity", label: "Salinity", unit: "PSU" },
  { key: "chlorophyll", label: "Chlorophyll", unit: "mg/m³" },
  { key: "nitrate", label: "Nitrate", unit: "µmol/L" },
  { key: "phosphate", label: "Phosphate", unit: "µmol/L" },
  { key: "pH", label: "pH", unit: "" },
  { key: "PAR", label: "PAR", unit: "mol/m²/d" },
  { key: "kdpar", label: "kdPAR", unit: "m⁻¹" },
];

type LocationInfoPanelProps =
  | { kind: "record"; record: OccurrenceRecord; onClose: () => void }
  | {
      kind: "prediction";
      location: MapLocation;
      status: "loading" | "loaded";
      prediction: HabitatPrediction | null;
      onClose: () => void;
    };

export function LocationInfoPanel(props: LocationInfoPanelProps) {
  if (props.kind === "record") {
    return <ObservedRecordPanel record={props.record} onClose={props.onClose} />;
  }
  return (
    <PredictedLocationPanel
      location={props.location}
      status={props.status}
      prediction={props.prediction}
      onClose={props.onClose}
    />
  );
}

function ObservedRecordPanel({ record, onClose }: { record: OccurrenceRecord; onClose: () => void }) {
  const displayName = record.isPseudoAbsence ? "Pseudo-absence / absence" : record.scientific_name;

  return (
    <div className="gs-info-panel" role="dialog" aria-label="Observation information">
      <div className="gs-info-panel__header">
        <div>
          <p className="gs-info-panel__eyebrow">Observed Record</p>
          <h3 className={record.isPseudoAbsence ? "" : "gs-info-panel__scientific-name"}>{displayName}</h3>
        </div>
        <button type="button" className="gs-info-panel__close" onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div
        className={
          "gs-info-panel__badge-row" +
          (record.presence ? " gs-info-panel__badge-row--presence" : " gs-info-panel__badge-row--absence")
        }
      >
        <span className="gs-info-panel__badge-dot" />
        <span>{record.presence ? "Presence recorded" : "Absence / background sample"}</span>
      </div>

      <p className="gs-info-panel__coords">
        {formatCoordinate(record.latitude)}, {formatCoordinate(record.longitude)}
      </p>

      <div className="gs-info-panel__divider" />

      <dl className="gs-info-panel__variables">
        {VARIABLE_ROWS.map((row) => (
          <div className="gs-info-panel__variable" key={row.key}>
            <dt>{row.label}</dt>
            <dd>{formatVariable(record[row.key], row.unit, row.key === "pH" ? 2 : 1)}</dd>
          </div>
        ))}
      </dl>

      <details className="gs-info-panel__details">
        <summary>Technical details</summary>
        <div className="gs-info-panel__variable">
          <dt>Spatial fold</dt>
          <dd>{record.spatial_fold}</dd>
        </div>
      </details>

      <p className="gs-info-panel__footnote">Values are read directly from the loaded dataset.</p>
    </div>
  );
}

function PredictedLocationPanel({
  location,
  status,
  prediction,
  onClose,
}: {
  location: MapLocation;
  status: "loading" | "loaded";
  prediction: HabitatPrediction | null;
  onClose: () => void;
}) {
  const band = prediction ? suitabilityBand(prediction.suitabilityClass) : null;
  const hasWarnings = (prediction?.outOfRangeVariables.length ?? 0) > 0;

  return (
    <div className="gs-info-panel" role="dialog" aria-label="Habitat suitability prediction">
      <div className="gs-info-panel__header">
        <div>
          <p className="gs-info-panel__eyebrow">Predicted Location</p>
          <h3>Habitat Suitability</h3>
        </div>
        <button type="button" className="gs-info-panel__close" onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <p className="gs-info-panel__coords">
        {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
      </p>

      <div className="gs-info-panel__divider" />

      {status === "loading" ? (
        <p className="gs-info-panel__loading">Looking up environmental conditions…</p>
      ) : (
        <>
          <div className="gs-suitability-result">
            <div
              className="gs-suitability-result__dot"
              style={{ background: band?.color ?? UNKNOWN_SUITABILITY_COLOR }}
            />
            <div>
              <p className="gs-suitability-result__value">
                {prediction?.probability !== null && prediction?.probability !== undefined
                  ? `${Math.round(prediction.probability * 100)}%`
                  : "Not connected"}
              </p>
              <p className="gs-suitability-result__label">{band ? band.label : "Prediction unavailable"}</p>
            </div>
          </div>

          {!prediction?.isLive && (
            <p className="gs-info-panel__status-note">
              Live prediction unavailable. Start the GeoSea inference server and try again.
            </p>
          )}

          {hasWarnings && (
            <p className="gs-info-panel__warning">
              Warning: environmental conditions at this location are outside the model's training range
              for {prediction!.outOfRangeVariables.map((k) => ENV_VARIABLE_META[k].label).join(", ")}.
              Prediction may be unreliable.
            </p>
          )}

          <div className="gs-info-panel__divider" />

          <p className="gs-info-panel__section-label">Environmental Conditions</p>
          {prediction?.environmentalValues ? (
            <dl className="gs-info-panel__variables">
              {ENV_VARIABLE_KEYS.map((key) => {
                const meta = ENV_VARIABLE_META[key];
                const outOfRange = prediction.outOfRangeVariables.includes(key);
                return (
                  <div
                    className={"gs-info-panel__variable" + (outOfRange ? " gs-info-panel__variable--warn" : "")}
                    key={key}
                  >
                    <dt>{meta.label}</dt>
                    <dd>{formatVariable(prediction.environmentalValues![key], meta.unit, meta.decimals)}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="gs-info-panel__empty">Environmental data could not be retrieved for this coordinate.</p>
          )}

          {prediction?.environmentalSource && (
            <p className="gs-info-panel__footnote">
              <strong>Source:</strong> {prediction.environmentalSource.provider} {prediction.environmentalSource.version}.
              <br />
              <strong>Temporal basis:</strong> {prediction.environmentalSource.temporal_basis}.
              <br />
              <strong>Resolution:</strong> {prediction.environmentalSource.spatial_resolution}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
