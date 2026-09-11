# GeoSea

GeoSea is an interactive marine habitat suitability platform that uses environmental conditions and machine learning to estimate the suitability of locations for seaweed habitat.

The platform allows users to explore marine regions on an interactive map, select a location, view its environmental conditions, and obtain a habitat suitability prediction.

## Features

- Interactive marine map
- Location-based habitat suitability prediction
- Environmental data for selected locations
- Machine learning-based suitability estimation
- Visual suitability categories
- Model performance overview
- Bio-ORACLE environmental data integration

## Environmental Variables

GeoSea uses eight environmental variables for prediction:

- Temperature
- Salinity
- Chlorophyll
- Nitrate
- Phosphate
- pH
- PAR
- kdPAR

Environmental values are retrieved from Bio-ORACLE v3.0 based on the selected geographic location.

## Technology

- React
- TypeScript
- Vite
- Leaflet
- Python
- FastAPI
- PyTorch
- Bio-ORACLE

## Project Structure

```text
Geo-Sea/
├── backend/
│   ├── app.py
│   ├── bio_oracle.py
│   ├── models/
│   └── requirements.txt
├── public/
│   └── data/
├── src/
│   ├── components/
│   ├── data/
│   ├── services/
│   └── types/
├── package.json
└── README.md
