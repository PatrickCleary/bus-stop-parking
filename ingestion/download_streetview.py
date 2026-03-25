#!/usr/bin/env python3
"""Download Google Street View images for all labelled bus stops."""

import json
import time
import urllib.request
import urllib.error
from pathlib import Path

API_KEY = "AIzaSyCnBtJVLiPSDFwdOpZiGrNJfgJXxLgo8gs"
IMAGE_SIZE = "640x400"
OUTPUT_DIR = Path(__file__).parent / "output" / "streetview"
LABELS_FILE = Path(__file__).parent / "labels.json"


def build_image_url(entry):
    """Build Street View Static API URL from a label entry."""
    params = {
        "size": IMAGE_SIZE,
        "key": API_KEY,
    }

    if "pano_id" in entry:
        params["pano"] = entry["pano_id"]
        params["heading"] = entry.get("view_heading", entry["heading"])
        params["pitch"] = entry.get("view_pitch", 0)
        params["fov"] = entry.get("view_fov", 90)
    else:
        sp = entry["streetview_params"]
        params["location"] = sp["location"]
        params["heading"] = sp["heading"]
        params["pitch"] = sp["pitch"]
        params["fov"] = sp.get("fov", 90)

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://maps.googleapis.com/maps/api/streetview?{query}"


def build_metadata_url(entry):
    """Build Street View Metadata API URL (free, no charge)."""
    params = {"key": API_KEY}

    if "pano_id" in entry:
        params["pano"] = entry["pano_id"]
    else:
        sp = entry["streetview_params"]
        params["location"] = sp["location"]

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://maps.googleapis.com/maps/api/streetview/metadata?{query}"


def fetch_metadata(entry):
    """Fetch metadata (date, pano_id) from the Street View Metadata API."""
    url = build_metadata_url(entry)
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())
            if data.get("status") == "OK":
                return {
                    "date": data.get("date"),  # e.g. "2022-07"
                    "pano_id": data.get("pano_id"),
                }
    except Exception:
        pass
    return None


def main():
    with open(LABELS_FILE) as f:
        labels = json.load(f)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing manifest to compare pano IDs
    manifest_path = OUTPUT_DIR / "manifest.json"
    existing_manifest = {}
    if manifest_path.exists():
        with open(manifest_path) as f:
            existing_manifest = json.load(f)

    total = len(labels)
    skipped = 0
    downloaded = 0
    errors = 0
    metadata_map = {}  # stop_id -> {date, pano_id}

    for i, entry in enumerate(labels):  # Limit to first 200 for testing
        stop_id = entry["stop_id"]
        label = entry.get("label", "unknown")
        if label not in ("blocked", "not_blocked"):
            skipped += 1
            continue
        filename = f"{stop_id}.jpg"
        filepath = OUTPUT_DIR / filename

        # Fetch metadata to get date and pano_id
        meta = fetch_metadata(entry)
        if meta:
            metadata_map[stop_id] = meta

        # Re-download if file missing or pano_id has changed
        existing_pano = existing_manifest.get(str(stop_id), {}).get("pano_id")
        current_pano = meta["pano_id"] if meta else None
        needs_download = not filepath.exists() or (current_pano and current_pano != existing_pano)

        if not needs_download:
            skipped += 1
        else:
            if filepath.exists() and current_pano != existing_pano:
                print(f"  Re-downloading {stop_id}: pano changed {existing_pano} -> {current_pano}")
            url = build_image_url(entry)
            try:
                urllib.request.urlretrieve(url, filepath)
                downloaded += 1
            except urllib.error.HTTPError as e:
                print(f"  ERROR {e.code} for stop {stop_id}: {e.reason}")
                errors += 1
            except Exception as e:
                print(f"  ERROR for stop {stop_id}: {e}")
                errors += 1

        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{total} processed, {downloaded} downloaded, {skipped} skipped, {errors} errors")

        # Small delay to avoid rate limiting
        if (i + 1) % 10 == 0:
            time.sleep(0.1)

    print(f"\nDone! {downloaded} downloaded, {skipped} already existed, {errors} errors")
    print(f"Images saved to: {OUTPUT_DIR}")

    # Write manifest JSON mapping stop_id -> filename + metadata
    manifest = {}
    for entry in labels:
        stop_id = entry["stop_id"]
        label = entry.get("label", "unknown")
        if label not in ("blocked", "not_blocked"):
            continue
        filename = f"{stop_id}.jpg"
        meta = metadata_map.get(stop_id, {})
        manifest[str(stop_id)] = {
            "filename": filename,
            "label": label,
            "stop_name": entry.get("stop_name", ""),
            "image_date": meta.get("date") if meta else None,
            "pano_id": meta.get("pano_id") if meta else None,
        }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest written to: {manifest_path}")


if __name__ == "__main__":
    main()
