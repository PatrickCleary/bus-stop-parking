#!/usr/bin/env python3
"""Upload Street View images to Supabase storage."""

import os
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
BUCKET = "bus-blockers"
FOLDER = "streetview"
IMAGE_DIR = Path(__file__).parent / "output" / "streetview"


def upload_image(service_key: str, filepath: Path) -> bool:
    dest_path = f"{FOLDER}/{filepath.name}"
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{dest_path}"

    with open(filepath, "rb") as f:
        data = f.read()

    # Use upsert=true to overwrite existing files
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code} uploading {filepath.name}: {body}")
        return False
    except Exception as e:
        print(f"  ERROR uploading {filepath.name}: {e}")
        return False


def main():
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("Error: set SUPABASE_SERVICE_KEY in ingestion/.env.local")
        raise SystemExit(1)

    images = sorted(IMAGE_DIR.glob("*.jpg"))
    if not images:
        print(f"No .jpg files found in {IMAGE_DIR}")
        raise SystemExit(1)

    print(f"Uploading {len(images)} images to {BUCKET}/{FOLDER}/")

    uploaded = 0
    errors = 0
    for i, filepath in enumerate(images, 1):
        print(f"  [{i}/{len(images)}] {filepath.name}", end=" ... ", flush=True)
        if upload_image(service_key, filepath):
            print("ok")
            uploaded += 1
        else:
            errors += 1

    print(f"\nDone! {uploaded} uploaded, {errors} errors")
    public_base = f"https://kevndteqglsoslznrntz.supabase.co/storage/v1/object/public/{BUCKET}/{FOLDER}/"
    print(f"Public URL base: {public_base}")


if __name__ == "__main__":
    main()
