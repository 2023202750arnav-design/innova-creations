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

# Helper: Get isolated fixture crop and bounding box
def isolate_fixture(img: Image.Image, bg_color: tuple[int, int, int]) -> tuple[Image.Image, tuple[int, int, int, int]]:
    w, h = img.size
    threshold = 15
    non_bg_pixels = []
    
    # Simple bounding box scan
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            pixel = img.getpixel((x, y))
            dist = abs(pixel[0] - bg_color[0]) + abs(pixel[1] - bg_color[1]) + abs(pixel[2] - bg_color[2])
            if dist > threshold:
                non_bg_pixels.append((x, y))
                
    if not non_bg_pixels:
        # Fallback to cropping center 80%
        margin_x, margin_y = int(w * 0.1), int(h * 0.1)
        box = (margin_x, margin_y, w - margin_x, h - margin_y)
    else:
        xs = [p[0] for p in non_bg_pixels]
        ys = [p[1] for p in non_bg_pixels]
        # Expand box slightly for safety
        box = (max(0, min(xs) - 10), max(0, min(ys) - 10), min(w, max(xs) + 10), min(h, max(ys) + 10))
        
    return img.crop(box), box

# Colorize functions
def make_gold(fixture: Image.Image) -> Image.Image:
    # Convert to gold by shifts
    gray = ImageOps.grayscale(fixture)
    # Map intensity to gold: R = Y * 1.18, G = Y * 0.96, B = Y * 0.60
    gold_data = []
    for Y in gray.getdata():
        r = min(255, int(Y * 1.18))
        g = min(255, int(Y * 0.96))
        b = min(255, int(Y * 0.60))
        gold_data.append((r, g, b))
    gold_img = Image.new("RGB", fixture.size)
    gold_img.putdata(gold_data)
    return gold_img

def make_chrome(fixture: Image.Image) -> Image.Image:
    # Chrome is bright, contrasty grayscale
    gray = ImageOps.grayscale(fixture)
    enhancer = ImageEnhance.Contrast(gray)
    contrast_gray = enhancer.enhance(1.4)
    chrome_img = Image.new("RGB", fixture.size)
    chrome_data = [(Y, Y, Y) for Y in contrast_gray.getdata()]
    chrome_img.putdata(chrome_data)
    return chrome_img

def make_black(fixture: Image.Image) -> Image.Image:
    # Matte black is dark gray/black with high-contrast shadows
    gray = ImageOps.grayscale(fixture)
    black_data = []
    for Y in gray.getdata():
        # Lower brightness but keep some highlight details
        val = min(255, int(Y * 0.35))
        black_data.append((val, val, val))
    black_img = Image.new("RGB", fixture.size)
    black_img.putdata(black_data)
    return black_img

# Main processing loop
print("\nGenerating variant images for all products...")
base_images = sorted(list(PRODUCTS_DIR.glob("*-1.jpg")))
print(f"Found {len(base_images)} base products to generate variants for.")

processed_count = 0
for base_img_path in base_images:
    sku = base_img_path.name.replace("-1.jpg", "")
    
    with Image.open(base_img_path) as img:
        img = img.convert("RGB")
        bg_color = detect_bg_color(img)
        fixture, box = isolate_fixture(img, bg_color)
        
        # We will generate 8 variants: finishes x sizes
        finishes = {
            "premium": fixture,  # Original
            "gold": make_gold(fixture),
            "chrome": make_chrome(fixture),
            "black": make_black(fixture)
        }
        
        sizes = {
            "premium": 1000,   # Large
            "standard": 800    # Medium
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
                canvas.paste(scaled_fixture, (x, y))
                
                # Save as optimized JPEG
                canvas.save(dest_path, "JPEG", quality=85, optimize=True)
                
    processed_count += 1
    if processed_count % 10 == 0:
        print(f"Processed {processed_count}/{len(base_images)} products...")

print("\nSuccessfully generated all variant images!")
