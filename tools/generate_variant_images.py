import os
import shutil
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
]

print("Applying premium AI generated images...")
for png_name, jpg_name in AI_COPIES:
    src_path = BRAIN_DIR / png_name
    if src_path.exists():
        dest_path = PRODUCTS_DIR / jpg_name
        with Image.open(src_path) as img:
            img.convert("RGB").save(dest_path, "JPEG", quality=95)
        print(f"Applied AI image: {jpg_name}")
    else:
        print(f"Warning: AI image {png_name} not found in brain directory")

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
    
    # If it is very close to white/off-white, standardise to the catalogue's cream color
    if r > 230 and g > 230 and b > 230:
        return (246, 244, 239)
    return (r, g, b)

# Helper: Isolate fixture with alpha mask (transparency)
def isolate_fixture_rgba(img: Image.Image, bg_color: tuple[int, int, int]) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    data = img.getdata()
    new_data = []
    
    # Use soft thresholds to avoid jagged edges (anti-aliasing)
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
    
    # Bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        pad = 8
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        return img.crop(bbox)
    return img

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

# Main processing loop
print("\nGenerating variant images for all products using transparency masks...")
base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")))
print(f"Found {len(base_images)} base products to generate variants for.")

processed_count = 0
for base_img_path in base_images:
    sku = base_img_path.name.replace("-1.jpg", "")
    
    with Image.open(base_img_path) as img:
        img = img.convert("RGB")
        bg_color = detect_bg_color(img)
        fixture_rgba = isolate_fixture_rgba(img, bg_color)
        
        finishes = {
            "premium": fixture_rgba,  # Original
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
                
                # Paste using alpha channel as mask to avoid colorizing the background
                canvas.paste(scaled_fixture, (x, y), mask=scaled_fixture.split()[3])
                
                # Save as optimized JPEG
                canvas.save(dest_path, "JPEG", quality=85, optimize=True)
                
    processed_count += 1
    if processed_count % 10 == 0:
        print(f"Processed {processed_count}/{len(base_images)} products...")

print("\nSuccessfully generated all variant images with transparency masks!")
