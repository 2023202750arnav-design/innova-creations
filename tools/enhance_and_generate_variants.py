import os
import shutil
import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageEnhance

# Paths
ROOT = Path(__file__).resolve().parents[1]
BRAIN_DIR = Path("/Users/arnavmishra/.gemini/antigravity/brain/ac1bae47-36c9-4f59-ab84-3125cace329d")
PRODUCTS_DIR = ROOT / "client/public/catalog-products/products"
PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy Custom AI Renders (png -> jpg conversion)
AI_COPIES = [
    ("innova_wln16_1_1780763080417.png", "innova-wln16-1.jpg"),
    ("innova_wln16_2_1780763096940.png", "innova-wln16-2.jpg"),
    ("innova_ncp37_1_1780763112462.png", "innova-ncp37-1.jpg"),
    ("innova_ncp38_1_1780763142903.png", "innova-ncp38-1.jpg"),
    ("innova_ncp38_2_1780763158011.png", "innova-ncp38-2.jpg"),
    ("innova_ncp39_1_1780763174539.png", "innova-ncp39-1.jpg"),
    ("innova_ncp39_2_1780763192188.png", "innova-ncp39-2.jpg"),
    ("innova_hln12_1_1780763311249.png", "innova-hln12-1.jpg"),
    ("innova_hln12_2_1780763326821.png", "innova-hln12-2.jpg"),
    ("innova_hln12c_1_1780763341740.png", "innova-hln12c-1.jpg"),
    ("innova_hln12c_2_1780763357864.png", "innova-hln12c-2.jpg"),
    ("innova_hln1_1_1780764047648.png", "innova-hln1-1.jpg"),
    ("innova_wln1_1_1780764222698.png", "innova-wln1-1.jpg"),
    ("innova_pcl9_1_1780764257640.png", "innova-pcl-9-1.jpg"),
]

print("--- STEP 1: Copying premium AI generated images ---")
for png_name, jpg_name in AI_COPIES:
    src_path = BRAIN_DIR / png_name
    if src_path.exists():
        dest_path = PRODUCTS_DIR / jpg_name
        with Image.open(src_path) as img:
            img.convert("RGB").save(dest_path, "JPEG", quality=95)
        print(f"Applied AI image: {jpg_name}")
    else:
        print(f"Warning: AI image {png_name} not found in brain directory")

# Also copy any custom JPG files from the brain directory
print("\n--- STEP 2: Copying custom JPG files from brain ---")
for jpg_path in BRAIN_DIR.glob("innova-*.jpg"):
    dest_path = PRODUCTS_DIR / jpg_path.name
    shutil.copy(jpg_path, dest_path)
    print(f"Copied custom JPG: {jpg_path.name}")

# Helper: Detect background color dynamically
def detect_bg_color(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    samples = [
        img.getpixel((5, 5)),
        img.getpixel((w - 6, 5)),
        img.getpixel((w // 2, 5)),
        img.getpixel((5, h - 6)),
        img.getpixel((w - 6, h - 6)),
    ]
    r = int(sum(s[0] for s in samples) / len(samples))
    g = int(sum(s[1] for s in samples) / len(samples))
    b = int(sum(s[2] for s in samples) / len(samples))
    
    if r > 230 and g > 230 and b > 230:
        return (246, 244, 239)
    return (r, g, b)

# Helper: Isolate fixture with alpha mask (transparency)
def isolate_fixture_rgba(img: Image.Image, bg_color: tuple[int, int, int]) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    data = img.getdata()
    new_data = []
    
    threshold_low = 12
    threshold_high = 28
    
    for item in data:
        r, g, b, a = item
        dist = abs(r - bg_color[0]) + abs(g - bg_color[1]) + abs(b - bg_color[2])
        if dist < threshold_low:
            alpha = 0
        elif dist > threshold_high:
            alpha = 255
        else:
            alpha = int((dist - threshold_low) / (threshold_high - threshold_low) * 255)
        new_data.append((r, g, b, alpha))
        
    img.putdata(new_data)
    return img

# OpenCV enhancement function
def enhance_cv2(rgb_np: np.ndarray) -> np.ndarray:
    try:
        bgr = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)
        
        # Denoise with Bilateral Filter
        denoised = cv2.bilateralFilter(bgr, d=7, sigmaColor=50, sigmaSpace=50)
        
        # Local contrast enhancement via CLAHE in LAB space
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        contrast_enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # Detail enhancement
        detail_enhanced = cv2.detailEnhance(contrast_enhanced, sigma_s=8, sigma_r=0.15)
        
        return cv2.cvtColor(detail_enhanced, cv2.COLOR_BGR2RGB)
    except Exception as e:
        print(f"Warning CV2 enhancement failed: {e}")
        return rgb_np

print("\n--- STEP 3: Running AI-like enhancement on all base images ---")
base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")) + list(PRODUCTS_DIR.glob("*-2.jpg")))
print(f"Found {len(base_images)} base images to enhance in products folder.")

enhanced_count = 0
for base_img_path in base_images:
    try:
        with Image.open(base_img_path) as img:
            img = img.convert("RGB")
            bg_color = detect_bg_color(img)
            
            # Isolate fixture
            fixture_rgba = isolate_fixture_rgba(img, bg_color)
            
            # Extract RGB channels
            r, g, b, a = fixture_rgba.split()
            rgb_img = Image.merge("RGB", (r, g, b))
            rgb_np = np.array(rgb_img)
            
            # Apply OpenCV enhancements
            enhanced_rgb_np = enhance_cv2(rgb_np)
            enhanced_rgb = Image.fromarray(enhanced_rgb_np)
            
            # Merge back with alpha
            enhanced_fixture = Image.merge("RGBA", (enhanced_rgb.split()[0], enhanced_rgb.split()[1], enhanced_rgb.split()[2], a))
            
            # PIL Sharpness and Color enhancements
            enhanced_fixture = ImageEnhance.Sharpness(enhanced_fixture).enhance(1.2)
            enhanced_fixture = ImageEnhance.Color(enhanced_fixture).enhance(1.1)
            
            # Paste on a clean canvas with the detected background color
            canvas = Image.new("RGB", img.size, bg_color)
            canvas.paste(enhanced_fixture, (0, 0), mask=a)
            
            # Overwrite image
            canvas.save(base_img_path, "JPEG", quality=95, optimize=True)
            
        enhanced_count += 1
        if enhanced_count % 10 == 0:
            print(f"Enhanced {enhanced_count}/{len(base_images)} base images...")
    except Exception as e:
        print(f"Error enhancing {base_img_path.name}: {e}")

print(f"Successfully enhanced {enhanced_count} base images.")

# Colorize functions preserving alpha mask
def make_gold(fixture: Image.Image) -> Image.Image:
    r, g, b, a = fixture.split()
    gray = ImageOps.grayscale(fixture.convert("RGB"))
    gold_data = []
    for Y in gray.getdata():
        gold_r = min(255, int(Y * 1.25))
        gold_g = min(255, int(Y * 1.05))
        gold_b = min(255, int(Y * 0.65))
        gold_data.append((gold_r, gold_g, gold_b))
        
    gold_rgb = Image.new("RGB", fixture.size)
    gold_rgb.putdata(gold_data)
    return Image.merge("RGBA", (gold_rgb.split()[0], gold_rgb.split()[1], gold_rgb.split()[2], a))

def make_chrome(fixture: Image.Image) -> Image.Image:
    r, g, b, a = fixture.split()
    gray = ImageOps.grayscale(fixture.convert("RGB"))
    contrast_gray = ImageEnhance.Contrast(gray).enhance(1.45)
    return Image.merge("RGBA", (contrast_gray, contrast_gray, contrast_gray, a))

def make_black(fixture: Image.Image) -> Image.Image:
    r, g, b, a = fixture.split()
    gray = ImageOps.grayscale(fixture.convert("RGB"))
    black_data = [min(255, int(Y * 0.32)) for Y in gray.getdata()]
    black_l = Image.new("L", fixture.size)
    black_l.putdata(black_data)
    return Image.merge("RGBA", (black_l, black_l, black_l, a))

# Helper: Isolate fixture bounding box
def isolate_fixture_bbox(fixture: Image.Image) -> Image.Image:
    bbox = fixture.getbbox()
    if bbox:
        w, h = fixture.size
        pad = 8
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        return fixture.crop(bbox)
    return fixture

print("\n--- STEP 4: Generating variant images from enhanced base images ---")
primary_base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")))
print(f"Found {len(primary_base_images)} primary base products to generate variants for.")

processed_variants = 0
for base_img_path in primary_base_images:
    sku = base_img_path.name.replace("-1.jpg", "")
    try:
        with Image.open(base_img_path) as img:
            img = img.convert("RGB")
            bg_color = detect_bg_color(img)
            
            # Isolate the fixture
            fixture_rgba = isolate_fixture_rgba(img, bg_color)
            fixture_rgba = isolate_fixture_bbox(fixture_rgba)
            
            finishes = {
                "premium": fixture_rgba,
                "gold": make_gold(fixture_rgba),
                "chrome": make_chrome(fixture_rgba),
                "black": make_black(fixture_rgba)
            }
            
            sizes = {
                "premium": 1000,
                "standard": 800
            }
            
            for finish_name, fixture_img in finishes.items():
                for size_name, target_dim in sizes.items():
                    dest_filename = f"{sku}-{finish_name}-{size_name}.jpg"
                    dest_path = PRODUCTS_DIR / dest_filename
                    
                    # Resize keeping aspect ratio
                    scaled_fixture = ImageOps.contain(fixture_img, (target_dim, target_dim), Image.Resampling.LANCZOS)
                    
                    # Paste on 1200x1200 canvas
                    canvas = Image.new("RGB", (1200, 1200), bg_color)
                    x = (1200 - scaled_fixture.width) // 2
                    y = (1200 - scaled_fixture.height) // 2
                    
                    # Paste using alpha channel as mask
                    canvas.paste(scaled_fixture, (x, y), mask=scaled_fixture.split()[3])
                    
                    # Save as optimized JPEG
                    canvas.save(dest_path, "JPEG", quality=85, optimize=True)
                    
        processed_variants += 1
        if processed_variants % 10 == 0:
            print(f"Generated variants for {processed_variants}/{len(primary_base_images)} products...")
    except Exception as e:
        print(f"Error generating variants for {base_img_path.name}: {e}")

print(f"\nSuccessfully enhanced all base images and generated variants for {processed_variants} products!")
