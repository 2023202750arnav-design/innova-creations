import os
import numpy as np
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_DIR = ROOT / "client/public/catalog-products/products"

def repair_image(src_path, dest_path):
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    bg_color = (246, 244, 239) # Cream background
    
    pixels = np.array(img)
    row_averages = np.mean(pixels, axis=1)
    
    cream_avg = np.array([246.0, 244.0, 239.0])
    
    top_crop = 0
    bottom_crop = h
    
    # Find top crop (skip dark bars at the top)
    for y in range(h // 3):
        row_color = row_averages[y]
        dist = np.linalg.norm(row_color - cream_avg)
        if dist > 60 or np.mean(row_color) < 180:
            top_crop = y + 1
        else:
            break
            
    # Find bottom crop (skip dark bars at the bottom)
    for y in range(h - 1, h - h // 3, -1):
        row_color = row_averages[y]
        dist = np.linalg.norm(row_color - cream_avg)
        if dist > 60 or np.mean(row_color) < 180:
            bottom_crop = y
        else:
            break
            
    # Crop the image to isolate the fixture
    cropped_img = img.crop((0, top_crop, w, bottom_crop))
    cw, ch = cropped_img.size
    
    # Re-center and pad on a 1200x1200 cream canvas
    canvas = Image.new("RGB", (1200, 1200), bg_color)
    
    # Scale keeping aspect ratio
    scale = 800.0 / ch
    if cw * scale > 1000:
        scale = 1000.0 / cw
        
    nw = int(cw * scale)
    nh = int(ch * scale)
    scaled_img = cropped_img.resize((nw, nh), Image.Resampling.LANCZOS)
    
    # Paste centered but slightly lower to allow suspension rod drawing
    x = (1200 - nw) // 2
    y = (1200 - nh) // 2 + 100
    canvas.paste(scaled_img, (x, y))
    
    # Find the x-coordinate of the suspension rod in the cropped image
    scaled_pixels = np.array(scaled_img)
    cord_x = nw // 2
    
    # Scan the top row of the scaled fixture to locate the dark cord/rod
    top_row = scaled_pixels[5]
    darkness = [np.mean(top_row[col]) for col in range(nw)]
    min_idx = np.argmin(darkness)
    if darkness[min_idx] < 210:
        cord_x = min_idx
        
    # Draw the suspension rod extending to the top of the canvas
    draw = ImageDraw.Draw(canvas)
    cord_color = tuple(top_row[cord_x].astype(int))
    if np.mean(cord_color) > 200:
        cord_color = (60, 60, 60) # Default to grey
        
    line_x = x + cord_x
    draw.line([(line_x, 0), (line_x, y + 8)], fill=cord_color, width=4)
    
    # Save the repaired image
    canvas.save(dest_path, "JPEG", quality=95)
    print(f"Successfully repaired {dest_path.name}")

def main():
    targets = ["innova-hln19-1.jpg", "innova-hln20-1.jpg", "innova-hln21-1.jpg"]
    for filename in targets:
        src = PRODUCTS_DIR / filename
        if src.exists():
            repair_image(src, src)
        else:
            print(f"Warning: {filename} does not exist in products directory")

if __name__ == "__main__":
    main()
