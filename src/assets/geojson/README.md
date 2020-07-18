# GeoJSON definitions for UK EER, WPC, Counties and Postcode areas

## To convert from topojson to geojson

### Node (Javascript)

```
npm install --save-dev topojson-client
npm install --save-dev geojson-merge

# Convert topoJSON to geoJSON
./node_modules/.bin/topo2geo uk_eer_geo.json < ../topojson/uk_eer_simple.json
./node_modules/.bin/topo2geo uk_county_geo.json < ../topojson/uk_county_simple.json
./node_modules/.bin/topo2geo uk_wpc_geo.json < ../topojson/uk_wpc_simple.json
./node_modules/.bin/topo2geo uk-postcode-area.json < ../topojson/uk-postcode-area.json
```

### Python

```
pip install topo2geo
```