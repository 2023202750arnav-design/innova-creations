import os
import time
import json
import google.generativeai as genai
from PIL import Image
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_DIR = ROOT / "client/public/catalog-products/products"
REPORT_PATH = ROOT / "scratch/gemini_audit_report.json"

# API Keys rotation list (loaded from environment variable or fallback to empty list)
KEYS = [k.strip() for k in os.getenv("GEMINI_API_KEYS", "").split(",") if k.strip()]
current_key_idx = 0

def configure_key():
    global current_key_idx
    key = KEYS[current_key_idx]
    genai.configure(api_key=key)
    print(f"Configured Gemini API Key {current_key_idx + 1}")

def rotate_key():
    global current_key_idx
    current_key_idx = (current_key_idx + 1) % len(KEYS)
    configure_key()

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

def audit_images():
    print("Initializing Gemini Image Audit with key rotation...")
    configure_key()
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")) + list(PRODUCTS_DIR.glob("*-2.jpg")))
    print(f"Found {len(base_images)} images to inspect in products folder.")
    
    results = load_existing_results()
    print(f"Loaded {len(results)} existing successful audits. Resuming...")
    
    for idx, img_path in enumerate(base_images):
        name = img_path.name
        if name in results:
            # Skip already successfully audited images
            continue
            
        print(f"[{idx + 1}/{len(base_images)}] Auditing {name}...")
        
        # Retry loop for rate limits
        retries = 3
        delay = 12.5
        
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
                
                response = model.generate_content([prompt, pil_img])
                text = response.text.strip()
                
                # Extract JSON block
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                    
                data = json.loads(text)
                results[name] = data
                print(f"  - Cropped properly: {data.get('is_cropped_properly')}, Issue: {data.get('issue_type')}")
                break # Success, break retry loop
                
            except Exception as e:
                err_str = str(e)
                print(f"  - Attempt failed: {err_str[:120]}...")
                
                if "429" in err_str or "quota" in err_str.lower():
                    # Rate limit hit: rotate key and wait
                    print("  - Rate limit/quota exceeded! Rotating key and waiting...")
                    rotate_key()
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    time.sleep(15)
                else:
                    time.sleep(2)
                    
                retries -= 1
                if retries == 0:
                    print(f"  - Failed all retries for {name}")
                    results[name] = {"error": err_str}
                    
        # Delay to prevent hitting the 5 RPM rate limit
        time.sleep(delay)
        
        # Progressive save
        os.makedirs(REPORT_PATH.parent, exist_ok=True)
        with open(REPORT_PATH, "w") as f:
            json.dump(results, f, indent=2)

    print(f"Audit completed. Report saved to {REPORT_PATH}")

if __name__ == "__main__":
    audit_images()
