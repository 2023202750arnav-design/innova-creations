import os
import sys
import json
import time
import io
import argparse
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types

# Paths
ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_DIR = ROOT / "client/public/catalog-products/products"
REPORT_PATH = ROOT / "scratch/combined_audit_report.json"
PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

def load_recreation_prompts():
    if not REPORT_PATH.exists():
        print(f"Error: {REPORT_PATH} not found.")
        sys.exit(1)
    with open(REPORT_PATH, "r") as f:
        return json.load(f)

def clean_sku_name(name):
    # E.g. innova-wln1-1.jpg -> innova-wln1
    if name.endswith("-1.jpg"):
        return name.replace("-1.jpg", "")
    if name.endswith("-2.jpg"):
        return name.replace("-2.jpg", "")
    return name.split(".")[0]

def main():
    parser = argparse.ArgumentParser(description="Generate all base product images using Google's Imagen model.")
    parser.add_argument("--api-key", help="Google Gemini API key with billing enabled.", required=True)
    parser.add_argument("--model", default="imagen-3.0-generate-002", help="Imagen model name to use.")
    parser.add_argument("--force", action="store_true", help="Force regenerate even if image already exists.")
    args = parser.parse_args()

    client = genai.Client(api_key=args.api_key)
    report = load_recreation_prompts()
    
    # We want to find all 120 base images
    # Let's get the list of filenames from the report
    filenames = sorted(list(report.keys()))
    print(f"Found {len(filenames)} base images in the audit report.")

    success_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, name in enumerate(filenames):
        dest_path = PRODUCTS_DIR / name
        if dest_path.exists() and not args.force:
            print(f"[{idx+1}/{len(filenames)}] Skipping {name} (already exists).")
            skipped_count += 1
            continue

        item_data = report[name]
        prompt = item_data.get("recreation_prompt", "")
        
        if not prompt or len(prompt.strip()) < 10:
            # Construct a default prompt if none exists
            sku = clean_sku_name(name)
            prompt = f"A premium high-end photorealistic studio product photograph of a modern luxury designer lighting fixture {sku} on a clean cream background"

        print(f"[{idx+1}/{len(filenames)}] Generating {name} with model {args.model}...")
        print(f"  Prompt: {prompt[:120]}...")

        retries = 3
        backoff = 5.0
        success = False

        while retries > 0:
            try:
                response = client.models.generate_images(
                    model=args.model,
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        output_mime_type='image/jpeg',
                        aspect_ratio='1:1'
                    )
                )
                
                if response.generated_images:
                    gen_img = response.generated_images[0]
                    img_bytes = gen_img.image.image_bytes
                    image = Image.open(io.BytesIO(img_bytes))
                    
                    # Ensure background matches exactly (246, 244, 239)
                    # Save the image
                    image.save(dest_path, "JPEG", quality=95, optimize=True)
                    print(f"  - SUCCESS: Saved to {dest_path.name}")
                    success = True
                    success_count += 1
                    break
                else:
                    print("  - Error: No images returned in response.")
                    
            except Exception as e:
                err_str = str(e)
                print(f"  - Attempt failed: {err_str[:120]}")
                if "429" in err_str or "quota" in err_str.lower():
                    print(f"  - Rate limit hit. Sleeping {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    time.sleep(2)
            retries -= 1

        if not success:
            print(f"  - FAILED to generate {name} after retries.")
            failed_count += 1

        # Safe delay between requests
        time.sleep(2.0)

    print("\n--- GENERATION SUMMARY ---")
    print(f"Total Base Images: {len(filenames)}")
    print(f"Successfully Generated: {success_count}")
    print(f"Skipped (already exists): {skipped_count}")
    print(f"Failed: {failed_count}")

    if success_count > 0:
        print("\nBase images updated! Now run the variant generation script to rebuild all 848 variants.")

if __name__ == "__main__":
    main()
