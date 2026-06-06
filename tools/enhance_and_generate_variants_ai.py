import os
import time
import shutil
import cv2
import numpy as np
import torch
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageEnhance
from transformers import Swin2SRForImageSuperResolution, Swin2SRImageProcessor

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
    ("innova_hln2_1_1780767956315.png", "innova-hln2-1.jpg"),
    ("innova_hln3_1_1780768066712.png", "innova-hln3-1.jpg"),
    ("innova_hln4_1_1780768117220.png", "innova-hln4-1.jpg"),
    ("innova_hln5_1_1780768131584.png", "innova-hln5-1.jpg"),
    ("innova_hln6_1_1780768146307.png", "innova-hln6-1.jpg"),
    ("innova_hln7_1_1780768161858.png", "innova-hln7-1.jpg"),
    ("innova_hln8_1_1780768178031.png", "innova-hln8-1.jpg"),
    ("innova_hln9_1_1780768193868.png", "innova-hln9-1.jpg"),
    ("innova_hln10_1_1780768208026.png", "innova-hln10-1.jpg"),
    ("innova_hln11_1_1780768225999.png", "innova-hln11-1.jpg"),
    ("innova_hln13_1_1780768244210.png", "innova-hln13-1.jpg"),
    ("innova_hln15_1_1780768261420.png", "innova-hln15-1.jpg"),
    ("innova_hln16_1_1780768279267.png", "innova-hln16-1.jpg"),
    ("innova_hln17_1_1780768296735.png", "innova-hln17-1.jpg"),
    ("innova_hln18_1_1780768314769.png", "innova-hln18-1.jpg"),
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

print("\nLoading Swin2SR model from Hugging Face...")
model_id = "caidas/swin2SR-lightweight-x2-64"
processor = Swin2SRImageProcessor.from_pretrained(model_id)
model = Swin2SRForImageSuperResolution.from_pretrained(model_id)
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
model.to(device)
print(f"Swin2SR initialized on device: {device}")

def enhance_with_swin2sr(rgb_img: Image.Image) -> Image.Image:
    # To keep Swin2SR processing super fast (under 3-4s per image),
    # limit maximum input dimension to 512px before upscaling,
    # then upscale output back to target dimension using LANCZOS.
    orig_size = rgb_img.size
    max_dim = max(orig_size)
    
    if max_dim > 512:
        scale_ratio = 512.0 / max_dim
        new_size = (int(orig_size[0] * scale_ratio), int(orig_size[1] * scale_ratio))
        input_img = rgb_img.resize(new_size, Image.Resampling.LANCZOS)
    else:
        input_img = rgb_img
        
    # Run Swin2SR
    inputs = processor(input_img, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        
    # Postprocess
    output = outputs.reconstruction.data.squeeze().cpu().clamp(0, 1).numpy()
    output = output.transpose(1, 2, 0)
    output = (output * 255.0).round().astype("uint8")
    
    enhanced_img = Image.fromarray(output)
    
    # Resize back to 2x of original size
    target_size = (orig_size[0] * 2, orig_size[1] * 2)
    return enhanced_img.resize(target_size, Image.Resampling.LANCZOS)

print("\n--- STEP 3: Running Swin2SR AI super-resolution on all base images ---")
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
            
            # Get bounding box of the fixture to process only the foreground
            bbox = fixture_rgba.getbbox()
            if bbox:
                cropped_fixture = fixture_rgba.crop(bbox)
            else:
                cropped_fixture = fixture_rgba
                bbox = (0, 0, img.width, img.height)
                
            r, g, b, a = cropped_fixture.split()
            rgb_img = Image.merge("RGB", (r, g, b))
            
            # Run Swin2SR on the foreground fixture
            enhanced_rgb = enhance_with_swin2sr(rgb_img)
            
            # Resize alpha channel to match the enhanced 2x size
            enhanced_a = a.resize(enhanced_rgb.size, Image.Resampling.LANCZOS)
            enhanced_fixture = Image.merge("RGBA", (enhanced_rgb.split()[0], enhanced_rgb.split()[1], enhanced_rgb.split()[2], enhanced_a))
            
            # Sharpness and Color boosts
            enhanced_fixture = ImageEnhance.Sharpness(enhanced_fixture).enhance(1.2)
            enhanced_fixture = ImageEnhance.Color(enhanced_fixture).enhance(1.1)
            
            # Paste back onto the canvas at original size
            # Calculate target scaled fixture size to match the original bounding box size
            orig_w = bbox[2] - bbox[0]
            orig_h = bbox[3] - bbox[1]
            scaled_fixture = ImageOps.contain(enhanced_fixture, (orig_w, orig_h), Image.Resampling.LANCZOS)
            
            canvas = Image.new("RGB", img.size, bg_color)
            canvas.paste(scaled_fixture, (bbox[0], bbox[1]), mask=scaled_fixture.split()[3])
            
            # Overwrite image
            canvas.save(base_img_path, "JPEG", quality=95, optimize=True)
            
        enhanced_count += 1
        if enhanced_count % 10 == 0:
            print(f"AI Enhanced {enhanced_count}/{len(base_images)} base images...")
    except Exception as e:
        print(f"Error AI enhancing {base_img_path.name}: {e}")

print(f"Successfully AI enhanced {enhanced_count} base images.")

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

# Helper: Isolate fixture bounding box for variants
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

print("\n--- STEP 4: Generating variant images from AI enhanced base images ---")
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

print(f"\nSuccessfully AI enhanced all base images and generated variants for {processed_variants} products!")
