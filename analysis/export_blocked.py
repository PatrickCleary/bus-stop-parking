import json
import shutil
from pathlib import Path
from PIL import Image
import numpy as np

LABELS = Path(__file__).parent / "../ingestion/labels.geojson"
STREET_VIEW_DIR = Path(__file__).parent / "../ingestion/output/streetview"
OUTPUT_DIR = Path(__file__).parent / "outputs/blocked"

if OUTPUT_DIR.exists():
    shutil.rmtree(OUTPUT_DIR)
OUTPUT_DIR.mkdir(parents=True)

features = json.loads(LABELS.read_text())["features"]
blocked = [f for f in features if f["properties"]["status"] == "blocked"]

print(f"Found {len(blocked)} blocked stops")

copied, missing = 0, 0
for f in blocked:
    stop_id = f["properties"]["stop_id"]
    src = STREET_VIEW_DIR / f"{stop_id}.jpg"
    if src.exists():
        shutil.copy2(src, OUTPUT_DIR / src.name)
        copied += 1
    else:
        print(f"  Missing image for stop {stop_id}")
        missing += 1

print(f"Copied {copied} images to {OUTPUT_DIR}")
if missing:
    print(f"Missing images: {missing}")

# Rename files with brightness rank prefix (01_, 02_, ... darkest to brightest)
images = list(OUTPUT_DIR.glob("*.jpg"))
brightness = {}
for img_path in images:
    img = Image.open(img_path).convert("L")
    brightness[img_path] = np.array(img).mean()

sorted_images = sorted(brightness.items(), key=lambda x: x[1])
digits = len(str(len(sorted_images)))
for rank, (img_path, b) in enumerate(sorted_images, 1):
    new_name = f"{str(rank).zfill(digits)}_{img_path.name}"
    img_path.rename(OUTPUT_DIR / new_name)

print(f"Renamed {len(sorted_images)} images by brightness (darkest to brightest)")
