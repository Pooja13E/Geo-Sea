Place the confirmed production model artifacts in this folder:

1. geosea_mlp_model.pth
2. geosea_scaler.joblib

The backend accepts geosea_mlp_scaler.joblib as an alternative scaler filename.

The .pth file must be the production Tabular MLP produced by the GeoSea training
pipeline, with the 8-feature architecture:
temperature, salinity, chlorophyll, nitrate, phosphate, pH, PAR, kdpar.

Do not upload model weights to the React public folder. They stay on the backend.
