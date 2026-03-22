#!/usr/bin/env python3
"""Convert labels.json to a GeoJSON file."""
import json

with open("labels.json") as f:
    labels = json.load(f)

features = []
for l in labels:
    features.append({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [l["snapped_lon"], l["snapped_lat"]],
        },
        "properties": {
            "stop_id": l["stop_id"],
            "stop_name": l["stop_name"],
            "route_id": l["route_id"],
            "status": l["label"],
            "notes": l.get("notes", ""),
            "image_date": l.get("image_date", ""),
            "labeled_at": l.get("labeled_at", ""),
        },
    })

geojson = {"type": "FeatureCollection", "features": features}

with open("labels.geojson", "w") as f:
    json.dump(geojson, f, indent=2)

print(f"Wrote {len(features)} features to labels.geojson")
