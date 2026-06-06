from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "client/public/catalog-products/raw"
OUT = ROOT / "client/public/catalog-products/products"
PDF = ROOT / "sizzling lights catalogue.pdf"


def slots(source: str, rows: list[tuple[int, int, list[int], list[str]]]) -> list[tuple[str, str, tuple[int, int, int, int]]]:
    result: list[tuple[str, str, tuple[int, int, int, int]]] = []
    for top, bottom, boundaries, skus in rows:
        for index, sku in enumerate(skus):
            result.append((sku, source, (boundaries[index], top, boundaries[index + 1], bottom)))
    return result


MAPPINGS = [
    *slots(
        "p03_i02_1800x1200.jpg",
        [
            (0, 535, [0, 430, 765, 1206, 1800], ["Innova-WLN1", "Innova-WLN2", "Innova-WLN3", "Innova-WLN4"]),
            (642, 1090, [0, 500, 906, 1372, 1800], ["Innova-WLN5", "Innova-WL6", "Innova-WLN7", "Innova-WLN8"]),
        ],
    ),
    *slots(
        "p03_i01_1800x1200.jpg",
        [
            (0, 495, [0, 503, 790, 1246, 1800], ["Innova-WLN9", "Innova-WLN10", "Innova-WLN11", "Innova-WLN12"]),
            (615, 1110, [0, 433, 925, 1401, 1800], ["Innova-WLN13", "Innova-WLN14", "Innova-WLN15", "Innova-WLN16"]),
        ],
    ),
    *slots(
        "p04_i04_1800x1200.jpg",
        [
            (0, 485, [0, 407, 899, 1244, 1800], ["Innova-WLN17", "Innova-WLN18", "Innova-WLN19", "Innova-WLN20"]),
            (625, 1055, [0, 503, 997, 1371, 1800], ["Innova-WLN21", "Innova-WLN22", "Innova-WLN23", "Innova-WLN24"]),
        ],
    ),
    *slots(
        "p04_i01_1800x1200.jpg",
        [
            (0, 470, [0, 521, 899, 1291, 1800], ["Innova-WLN25", "Innova-WLN26", "Innova-WLN27", "Innova-WLN28"]),
            (615, 1100, [0, 396, 793, 1366, 1800], ["Innova-WLN29", "Innova-WLN30", "Innova-WLN31", "Innova-WLN32"]),
        ],
    ),
    *slots(
        "p05_i04_1800x1200.jpg",
        [
            (0, 480, [0, 538, 1083, 1800], ["Innova-WLN33", "Innova-WLN34", "Innova-WLN35"]),
            (605, 1100, [0, 422, 934, 1318, 1800], ["Innova-WLN40", "Innova-WLN41", "Innova-WLN42", "Innova-WLN43"]),
        ],
    ),
    *slots(
        "p05_i01_1800x1200.jpg",
        [
            (0, 435, [0, 490, 978, 1455, 1800], ["Innova-HLN1", "Innova-HLN2", "Innova-HLN3", "Innova-HLN4"]),
            (575, 1060, [0, 544, 918, 1419, 1800], ["Innova-HLN5", "Innova-HLN8", "Innova-HLN7", "Innova-HLN6"]),
        ],
    ),
    *slots(
        "p06_i04_1800x1200.jpg",
        [
            (0, 515, [0, 566, 1200, 1800], ["Innova-HLN9", "Innova-HLN10", "Innova-HLN11"]),
            (605, 1100, [0, 675, 1120, 1800], ["Innova-HLN12", "Innova-HLN13", "Innova-HLN14"]),
        ],
    ),
    *slots(
        "p06_i01_1800x1200.jpg",
        [
            (0, 505, [0, 626, 1231, 1800], ["Innova-HLN15", "Innova-HLN16", "Innova-HLN17"]),
            (630, 1100, [0, 518, 935, 1335, 1800], ["Innova-HLN18", "Innova-HLN19", "Innova-HLN20", "Innova-HLN21"]),
        ],
    ),
]

PCL_PAGE_MAP = {
    "Innova-PCL-9": (15, "br"),
    "Innova-PCL-10": (16, "tl"),
    "Innova-PCL-11": (16, "tr"),
    "Innova-PCL-12": (16, "bl"),
    "Innova-PCL-13": (16, "br"),
    "Innova-PCL-26": (20, "tl"),
    "Innova-PCL-27": (20, "tr"),
    "Innova-PCL-28": (20, "bl"),
    "Innova-PCL-29": (20, "br"),
    "Innova-PCL-46": (25, "tl"),
    "Innova-PCL-47": (25, "tr"),
    "Innova-PCL-48": (25, "bl"),
    "Innova-PCL-49": (25, "br"),
    "Innova-PCL-66": (30, "tl"),
    "Innova-PCL-67": (30, "tr"),
    "Innova-PCL-68": (30, "bl"),
    "Innova-PCL-69": (30, "br"),
    "Innova-PCL-70": (31, "tl"),
    "Innova-PCL-71": (31, "tr"),
    "Innova-PCL-72": (31, "bl"),
    "Innova-PCL-73": (31, "br"),
    "Innova-PCL-94": (37, "tl"),
    "Innova-PCL-95": (37, "tr"),
    "Innova-PCL-96": (37, "bl"),
    "Innova-PCL-97": (37, "br"),
    "Innova-PCL-118": (43, "tl"),
    "Innova-PCL-119": (43, "tr"),
    "Innova-PCL-120": (43, "bl"),
    "Innova-PCL-121": (43, "br"),
    "Innova-PCL-130": (46, "tl"),
    "Innova-PCL-131": (46, "tr"),
    "Innova-PCL-132": (46, "bl"),
    "Innova-PCL-133": (46, "br"),
}


def create_square(source: Path, box: tuple[int, int, int, int], destination: Path) -> None:
    with Image.open(source) as image:
        crop = image.convert("RGB").crop(box)
        draw = ImageDraw.Draw(crop)
        corner_fill = crop.getpixel((min(crop.width - 1, int(crop.width * 0.32)), min(crop.height - 1, 8)))
        # Cover top-left and top-right corners (removes page numbers/prefixes)
        draw.rectangle((0, 0, int(crop.width * 0.24), int(crop.height * 0.16)), fill=corner_fill)
        draw.rectangle((int(crop.width * 0.76), 0, crop.width, int(crop.height * 0.16)), fill=corner_fill)
        # Cover bottom area (removes SKUs, prices, specifications)
        draw.rectangle((0, int(crop.height * 0.82), crop.width, crop.height), fill=corner_fill)
        
        crop = ImageOps.contain(crop, (1080, 1080), Image.Resampling.LANCZOS)
        crop = ImageEnhance.Contrast(crop).enhance(1.05)
        crop = ImageEnhance.Sharpness(crop).enhance(1.35)
        crop = ImageEnhance.Color(crop).enhance(1.05)
        canvas = Image.new("RGB", (1200, 1200), (246, 244, 239))
        canvas.paste(crop, ((1200 - crop.width) // 2, (1200 - crop.height) // 2))
        canvas.save(destination, "JPEG", quality=92, optimize=True, progressive=True)


def render_pdf_page(page: int, directory: Path) -> Path:
    executable = shutil.which("pdftoppm")
    if not executable:
        raise RuntimeError("pdftoppm is required to rebuild product images from the catalogue PDF")
    prefix = directory / f"page-{page}"
    subprocess.run(
        [executable, "-f", str(page), "-l", str(page), "-jpeg", "-r", "180", str(PDF), str(prefix)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return directory / f"page-{page}-{page}.jpg"


def create_quadrant_product(source: Path, quadrant: str, destination: Path) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        width, height = image.size
        half_width, half_height = width // 2, height // 2
        left = 0 if quadrant.endswith("l") else half_width
        top = 0 if quadrant.startswith("t") else half_height
        right = half_width if quadrant.endswith("l") else width
        bottom = half_height if quadrant.startswith("t") else height
        tile = image.crop((left, top, right, bottom))

        # Remove the printed product label/price strip while keeping the complete fixture.
        tile = tile.crop((0, 0, tile.width, int(tile.height * 0.84)))
        draw = ImageDraw.Draw(tile)
        corner = tile.getpixel((min(tile.width - 1, int(tile.width * 0.32)), min(tile.height - 1, 8)))
        draw.rectangle((0, 0, int(tile.width * 0.23), int(tile.height * 0.2)), fill=corner)

        tile = ImageOps.contain(tile, (1080, 1080), Image.Resampling.LANCZOS)
        tile = ImageEnhance.Contrast(tile).enhance(1.05)
        tile = ImageEnhance.Sharpness(tile).enhance(1.35)
        tile = ImageEnhance.Color(tile).enhance(1.05)
        canvas = Image.new("RGB", (1200, 1200), (246, 244, 239))
        canvas.paste(tile, ((1200 - tile.width) // 2, (1200 - tile.height) // 2))
        canvas.save(destination, "JPEG", quality=92, optimize=True, progressive=True)


CUSTOM_MAP = {
    "innova-ncp37": {
        "source": "p47_i02_1800x1200.png",
        "crops": [
            ("-1.jpg", (200, 60, 1450, 450), False)
        ]
    },
    "innova-ncp38": {
        "source": "p47_i04_1800x1200.png",
        "crops": [
            ("-1.jpg", (0, 0, 900, 980), False),
            ("-2.jpg", (900, 0, 1800, 980), False)
        ]
    },
    "innova-ncp39": {
        "source": "p48_i01_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 980), False),
            ("-2.jpg", (900, 0, 1800, 980), False)
        ]
    },
    "innova-ncp40": {
        "source": "p48_i03_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 980), False),
            ("-2.jpg", (900, 0, 1800, 980), False)
        ]
    },
    "innova-ncp41": {
        "source": "p49_i01_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (900, 520, 1800, 920), False),
            ("-2.jpg", (900, 0, 1800, 980), False)
        ],
        "alt_sources": {
            "-2.jpg": "p49_i02_1800x1200.jpg"
        }
    },
    "innova-ncp42": {
        "source": "p49_i02_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 980), False),
            ("-2.jpg", (900, 0, 1800, 980), False)
        ]
    },
    "innova-ncp43": {
        "source": "p50_i01_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 520, 900, 960), False),
            ("-2.jpg", (900, 520, 1800, 960), False)
        ]
    },
    "innova-ncp69": {
        "source": "p50_i07_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 1020), False),
            ("-2.jpg", (900, 0, 1800, 1020), False)
        ]
    },
    "innova-ncp70": {
        "source": "p51_i01_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 1020), False),
            ("-2.jpg", (900, 0, 1800, 1020), False)
        ]
    },
    "innova-ncp71": {
        "source": "p51_i03_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 1020), False),
            ("-2.jpg", (900, 0, 1800, 1020), False)
        ]
    },
    "innova-vermont-01": {
        "source": "p61_i01_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 1200), True),
            ("-2.jpg", (900, 0, 1800, 1200), True)
        ]
    },
    "innova-balmoral": {
        "source": "p61_i02_1800x1200.jpg",
        "crops": [
            ("-1.jpg", (0, 0, 900, 620), True),
            ("-2.jpg", (900, 0, 1800, 620), True)
        ]
    }
}


def create_custom_square(source: Path, box: tuple[int, int, int, int], destination: Path, mask_top_left: bool) -> None:
    with Image.open(source) as image:
        crop = image.convert("RGB").crop(box)
        
        # Detect background color dynamically
        samples = [
            crop.getpixel((5, 5)),
            crop.getpixel((crop.width - 6, 5)),
            crop.getpixel((crop.width // 2, 5)),
        ]
        r = int(sum(s[0] for s in samples) / len(samples))
        g = int(sum(s[1] for s in samples) / len(samples))
        b = int(sum(s[2] for s in samples) / len(samples))
        bg_color = (r, g, b)
        
        if r > 230 and g > 230 and b > 230:
            bg_color = (246, 244, 239)
            
        if mask_top_left:
            draw = ImageDraw.Draw(crop)
            draw.rectangle((0, 0, min(crop.width - 1, 350), min(crop.height - 1, 120)), fill=bg_color)
            
        crop = ImageOps.contain(crop, (1080, 1080), Image.Resampling.LANCZOS)
        crop = ImageEnhance.Contrast(crop).enhance(1.05)
        crop = ImageEnhance.Sharpness(crop).enhance(1.35)
        crop = ImageEnhance.Color(crop).enhance(1.05)
        canvas = Image.new("RGB", (1200, 1200), bg_color)
        canvas.paste(crop, ((1200 - crop.width) // 2, (1200 - crop.height) // 2))
        canvas.save(destination, "JPEG", quality=92, optimize=True, progressive=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for sku, source, box in MAPPINGS:
        filename = f"{sku.lower()}-1.jpg"
        create_square(RAW / source, box, OUT / filename)
        print(f"Created {filename}")

    manifest = ROOT / "client/public/catalog-products/product-image-manifest.tsv"
    split_count = 0
    for line in manifest.read_text().splitlines()[1:]:
        sku, category, primary_source, _secondary_source = line.split("\t")
        if category in {"wall-lights", "pendant-lights"}:
            continue
            
        # Check if the product has a custom crop configuration
        if sku.lower() in CUSTOM_MAP:
            config = CUSTOM_MAP[sku.lower()]
            for suffix, box, mask_top_left in config["crops"]:
                source_name = config.get("alt_sources", {}).get(suffix, config["source"])
                source_path = RAW / source_name
                if not source_path.exists():
                    print(f"Skipping custom {sku}{suffix} (source not found: {source_name})")
                    continue
                destination = OUT / f"{sku.lower()}{suffix}"
                create_custom_square(source_path, box, destination, mask_top_left)
                print(f"Created custom crop: {destination.name}")
            continue
            
        source = RAW / primary_source
        if not source.exists():
            continue
        with Image.open(source) as image:
            width, height = image.size
        
        if category in {"crystal-chandeliers", "grand-chandeliers"}:
            # These are large individual chandeliers. Do not split them down the middle!
            # Crop the entire page/image to keep it intact, removing only bottom margins.
            usable_bottom = int(height * 0.94)
            create_square(source, (0, 0, width, usable_bottom), OUT / f"{sku.lower()}-1.jpg")
            # Remove any stale -2.jpg if it exists
            second = OUT / f"{sku.lower()}-2.jpg"
            if second.exists():
                second.unlink()
            print(f"Cropped entire image {primary_source} into {sku.lower()}-1.jpg (no split)")
        else:
            usable_bottom = int(height * 0.9)
            overlap = max(0, int(width * 0.015))
            create_square(source, (0, 0, width // 2 + overlap, usable_bottom), OUT / f"{sku.lower()}-1.jpg")
            create_square(source, (width // 2 - overlap, 0, width, usable_bottom), OUT / f"{sku.lower()}-2.jpg")
            split_count += 2
            print(f"Split {primary_source} into {sku.lower()}-1.jpg and {sku.lower()}-2.jpg")

    if not shutil.which("pdftoppm"):
        print("pdftoppm not found, skipping PDF quadrant rendering (existing files will be kept)")
    else:
        with tempfile.TemporaryDirectory(prefix="innova-catalogue-") as temp:
            temp_dir = Path(temp)
            rendered_pages: dict[int, Path] = {}
            for sku, (page, quadrant) in PCL_PAGE_MAP.items():
                if page not in rendered_pages:
                    rendered_pages[page] = render_pdf_page(page, temp_dir)
                destination = OUT / f"{sku.lower()}-1.jpg"
                create_quadrant_product(rendered_pages[page], quadrant, destination)
                # A catalogue tile is one verified product view. Remove stale guessed second views.
                second = OUT / f"{sku.lower()}-2.jpg"
                if second.exists():
                    second.unlink()
                print(f"Created exact PDF crop {destination.name} from page {page} ({quadrant})")

    print("Regeneration completed successfully.")


if __name__ == "__main__":
    main()

