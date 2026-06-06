import os
import time
import json
from PIL import Image
from pathlib import Path
from google import genai
from google.genai import errors

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_DIR = ROOT / "client/public/catalog-products/products"
REPORT_PATH = ROOT / "scratch/gemini_audit_report.json"

# Load keys from environment variable (comma-separated list) or fallback to empty list
KEYS = [k.strip() for k in os.getenv("GEMINI_API_KEYS", "").split(",") if k.strip()]

def load_existing_results():
    if REPORT_PATH.exists():
        try:
            with open(REPORT_PATH, "r") as f:
                data = json.load(f)
                # Keep only successful results (ones without 'error' key)
                return {k: v for k, v in data.items() if "error" not in v}
        except Exception as e:
            print(f"Warning: Failed to load existing report: {e}")
    return {}

def save_results(results):
    os.makedirs(REPORT_PATH.parent, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(results, f, indent=2)

def main():
    print("Starting Rotating Key Gemini Image Audit with 4 keys...", flush=True)
    base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")) + list(PRODUCTS_DIR.glob("*-2.jpg")))
    results = load_existing_results()
    print(f"Found {len(base_images)} base images. {len(results)} already successfully audited.", flush=True)
    
    images_to_audit = [img for img in base_images if img.name not in results]
    print(f"Remaining to audit: {len(images_to_audit)}", flush=True)
    
    if not images_to_audit:
        print("All images already audited. Exiting.", flush=True)
        return

    delay = 2.0  # 2.0s delay * 4 keys = 8.0s per key (well within 15 RPM limit)
    
    for idx, img_path in enumerate(images_to_audit):
        name = img_path.name
        # Rotate key
        key = KEYS[idx % len(KEYS)]
        print(f"[{idx + 1}/{len(images_to_audit)}] Auditing {name} with key {key[:8]}...", flush=True)
        
        client = genai.Client(api_key=key)
        
        retries = 5
        backoff = 10.0
        success = False
        
        while retries > 0:
            try:
                pil_img = Image.open(img_path)
                prompt = (
                    "Look at this product photograph of a lighting fixture (wall light, pendant light, or chandelier). "
                    "Is the product fixture cropped correctly and fully visible (i.e. not cut off at the edges, and not "
                    "containing multiple different products or overlapping panels)? "
                    "Answer exactly in the following JSON format: "
                    "{\"is_cropped_properly\": true/false, \"has_issue\": true/false, \"issue_type\": \"cut_off\"/\"multiple_items\"/\"watermark\"/\"none\", \"description\": \"...\", \"recreation_prompt\": \"A premium high-end photorealistic studio product photograph of [describe item in detail] on a clean cream background\"}"
                )
                
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[prompt, pil_img]
                )
                text = response.text.strip()
                
                # Extract JSON block
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                    
                data = json.loads(text)
                results[name] = data
                save_results(results)
                print(f"  - SUCCESS: Cropped: {data.get('is_cropped_properly')}, Issue: {data.get('issue_type')}", flush=True)
                success = True
                break
                
            except errors.ClientError as e:
                err_str = str(e)
                if e.code == 429 or "quota" in err_str.lower():
                    print(f"  - Rate limit hit (429) for key {key[:8]}. Sleeping {backoff}s...", flush=True)
                    time.sleep(backoff)
                    backoff *= 1.5
                else:
                    print(f"  - Client error: {err_str[:120]}", flush=True)
                    time.sleep(3)
                retries -= 1
            except Exception as e:
                err_str = str(e)
                print(f"  - Generic error: {err_str[:120]}", flush=True)
                time.sleep(3)
                retries -= 1
                
        if not success:
            print(f"  - FAILED to audit {name} after retries.", flush=True)
            
        time.sleep(delay)
        
    print("Rotating Key Audit Complete!", flush=True)

if __name__ == "__main__":
    main()
