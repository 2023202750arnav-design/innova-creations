import { PrismaClient, Role, CouponType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type CategorySlug =
  | "wall-lights"
  | "pendant-lights"
  | "led-pendant-ceiling"
  | "crystal-chandeliers"
  | "grand-chandeliers";

type CatalogueProduct = {
  sku: string;
  price: number;
  name: string;
  categorySlug: CategorySlug;
  subgroup?: string;
  dimensions?: string;
  specs?: string;
};

const categories = [
  {
    name: "Wall Lights",
    slug: "wall-lights",
    description:
      "Elegant wall-mounted sconces and fixtures for every interior style. From minimalist brushed gold to ornate crystal designs.",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600",
    sortOrder: 1,
  },
  {
    name: "Pendant Lights",
    slug: "pendant-lights",
    description:
      "Handcrafted hanging pendant lights in glass, metal, and crystal. Perfect for dining rooms, kitchens, and statement spaces.",
    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600",
    sortOrder: 2,
  },
  {
    name: "LED Pendant & Ceiling Lights",
    slug: "led-pendant-ceiling",
    description:
      "Modern architectural LED pendant and ceiling lights. Energy-efficient, sleek designs for contemporary interiors.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    sortOrder: 3,
  },
  {
    name: "Crystal Chandeliers",
    slug: "crystal-chandeliers",
    description:
      "Premium K9 crystal chandeliers in flush mount and pendant styles. Bring brilliance and glamour to any room.",
    image: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=600",
    sortOrder: 4,
  },
  {
    name: "Grand Crystal Chandeliers",
    slug: "grand-chandeliers",
    description:
      "Bespoke grand chandeliers for hotels, banquet halls, and luxury residences. Custom sizes available on request.",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
    sortOrder: 5,
  },
] as const;

const products: CatalogueProduct[] = [
  { sku: "Innova-WLN1", price: 4480, name: "Antique Brass Frosted Glass Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN2", price: 4150, name: "Modern Gold Linear Bar Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN3", price: 6290, name: "Crystal Column Wall Sconce (3 Glass Tubes)", categorySlug: "wall-lights" },
  { sku: "Innova-WLN4", price: 4640, name: "Dual Globe Gold Stem Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN5", price: 6050, name: "Double Opal Globe Brass Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WL6", price: 4280, name: "Single Stem Opal Globe Wall Light (Brass)", categorySlug: "wall-lights" },
  { sku: "Innova-WLN7", price: 4250, name: "Rose Amber Globe Ring Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN8", price: 6190, name: "Dual Frosted Sphere Curved Arm Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN9", price: 3450, name: "Black Fabric Drum Shade Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN10", price: 4480, name: "Triple Smoked Glass Globe Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN11", price: 3440, name: "Black Conical Shade Brass Stem Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN12", price: 5420, name: "Black Cross-Bar Directional Wall Spotlight", categorySlug: "wall-lights" },
  { sku: "Innova-WLN13", price: 4260, name: "Clear Glass Globe Gold Frame Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN14", price: 2850, name: "Matte Black Minimalist Single Arm Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN15", price: 4260, name: "Brushed Gold Vertical Bar Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN16", price: 2820, name: "Black Dual Cylinder Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN17", price: 5890, name: "Dual Globe Exposed Bulb Wall Lamp", categorySlug: "wall-lights" },
  { sku: "Innova-WLN18", price: 7260, name: "Crystal Chandelier-Style Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN19", price: 4860, name: "Smoked Glass Cylinder Black Mount Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN20", price: 6260, name: "Botanical 6-Arm Opal Leaf Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN21", price: 5840, name: "Amber Dual Globe Vintage Industrial Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN22", price: 4290, name: "White Square Fabric Shade Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN23", price: 4240, name: "Gold Cylinder Glass Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN24", price: 3870, name: "Oval Gold Frame Pendant-Style Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN25", price: 3490, name: "Brass Disc with Exposed Filament Bulb Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN26", price: 5890, name: "Black & Gold Layered Metal Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN27", price: 4380, name: "Crystal Column Gold Frame Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN28", price: 4120, name: "Clear Round Globe Brass Hook Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN29", price: 3840, name: "Matte Black Globe on Slim Rod Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN30", price: 2160, name: "Minimal White Globe Round Base Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN31", price: 3850, name: "Black Horizontal Bar Picture Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN32", price: 4480, name: "Jute Shade Gooseneck Brass Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN33", price: 6840, name: "Dual Globe Brass Cage Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN34", price: 3460, name: "Single Arm Fabric Drum Shade Brass Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN35", price: 3250, name: "Minimal Round Plate Grey Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN40", price: 3890, name: "Black Vertical Bar Accent Wall Light", categorySlug: "wall-lights" },
  { sku: "Innova-WLN41", price: 5420, name: "White Drum Shade on Nickel Arm Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN42", price: 4240, name: "White Square Swing-Arm Wall Sconce", categorySlug: "wall-lights" },
  { sku: "Innova-WLN43", price: 5450, name: "Seeded Glass Cage Black Wall Lantern", categorySlug: "wall-lights" },

  { sku: "Innova-HLN1", price: 8550, name: "Gold Crystal Drum Ring Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN2", price: 11200, name: "LED Ring Black Ceiling Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN3", price: 13860, name: "Copper Layered Disc Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN4", price: 3950, name: "Slim Cylinder Blush Pink Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN5", price: 5190, name: "Gold Ring Opal Globe Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN6", price: 4190, name: "Dual Smoked Glass Globe Pendant (per piece)", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN7", price: 4250, name: "Amber Glass Bell Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN8", price: 4160, name: "Opal Sphere Black Cap Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN9", price: 8250, name: "Triple Opal Globe Brass Cluster Pendant", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN10", price: 4050, name: "Cloud/Organic Form Alabaster Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN11", price: 6190, name: "Dual Floating Opal Globe Pendant", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN12", price: 3190, name: "Single Ring Oval Globe Pendant (per piece, 4 variants: A,B,C,D)", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN12C", price: 4199, name: "Innova-HLN12 Variant C (larger globe)", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN13", price: 13950, name: "Botanical Petal Ceiling Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN14", price: 9990, name: "Branch 7-Arm Opal Globe Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN15", price: 5199, name: "Clear Diamond-Cut Glass Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN16", price: 5199, name: "Honey Amber Geometric Glass Pendant", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN17", price: 5199, name: "Champagne Wide Bowl Glass Pendant", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN18", price: 5199, name: "Amber Globe Mesh Cage Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN19", price: 5199, name: "Grey Cage Mesh Cylinder Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN20", price: 4199, name: "Clear Globe Gold Ring Pendant Light", categorySlug: "pendant-lights" },
  { sku: "Innova-HLN21", price: 4199, name: "Smoked Glass Textured Globe Pendant", categorySlug: "pendant-lights" },

  { sku: "Innova-PCL-9", price: 33000, name: "Rose Gold Dual Ring LED Pendant (2 Rings)", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-10", price: 33000, name: "Black Triple Ring LED Pendant Chandelier", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-11", price: 16500, name: "Interlocking Oval Ring Gold LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-12", price: 33000, name: "Matte Black Triple Ellipse LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-13", price: 29700, name: "Black Geometric Diamond LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-26", price: 29700, name: "Gold Geometric Square Frame LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-27", price: 14850, name: "Black Starburst Linear LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-28", price: 29700, name: "Triple Oval Ring Gold LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-29", price: 16500, name: "Wavy Double Bar Gold LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "2-Ring / 3-Ring LED Pendants" },
  { sku: "Innova-PCL-46", price: 14850, name: "Triple Wave Linear LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-47", price: 16500, name: "Black Chaotic Bar LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-48", price: 29700, name: "Oval Tubular Frame Wood Cap LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-49", price: 19800, name: "Grey Ribbon Curve LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-66", price: 19800, name: "Chrome Wave LED Pendant (Single Bar)", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-67", price: 66000, name: "Gold Triple Oval Ring LED Pendant (XL)", categorySlug: "led-pendant-ceiling", subgroup: "Linear / Bar LED Pendants" },
  { sku: "Innova-PCL-68", price: 19800, name: "Chrome Orbit Semi-Flush LED Ceiling Light", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-69", price: 6600, name: "4-Arm Branch Semi-Flush LED Ceiling", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-70", price: 29700, name: "Gold Double Spiral Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-71", price: 13200, name: "Dual Square Frame LED Semi-Flush", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-72", price: 39600, name: "4-Circle Petal Semi-Flush LED Ceiling", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-73", price: 11550, name: "Gold Curved Rings Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-94", price: 19800, name: "White 6-Petal Floral Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-95", price: 19800, name: "Black Swirl Floral Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-96", price: 14850, name: "Rose Gold Dome Cage Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-97", price: 24750, name: "Crystal & Ring Orbital Semi-Flush LED", categorySlug: "led-pendant-ceiling", subgroup: "Semi-Flush / Ceiling LED Lights" },
  { sku: "Innova-PCL-118", price: 61875, name: "Gold Branch Vertical LED Staircase Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-119", price: 68475, name: "White Loop & Ring Staircase LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-120", price: 79200, name: "Gold Organic Oval Drop LED Staircase Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-121", price: 99000, name: "Gold Helix Spiral LED Staircase Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-130", price: 39600, name: "Chrome Multi-Ring Raindrop LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-131", price: 46200, name: "Silver Linked Oval Chain LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-132", price: 79200, name: "Black Rectangle Frame Cascade LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },
  { sku: "Innova-PCL-133", price: 49500, name: "Chrome Multi-Ring Vertical LED Pendant", categorySlug: "led-pendant-ceiling", subgroup: "Staircase / Duplex / Long-Drop LED Pendants" },

  { sku: "Innova-NCP37", price: 42880, name: "Crystal Wave Flush Ceiling Panel", categorySlug: "crystal-chandeliers", dimensions: '12"x36"x12"(H)' },
  { sku: "Innova-NCP38", price: 38880, name: "Crystal Square Flush Ceiling", categorySlug: "crystal-chandeliers", dimensions: '12"x18"x8"(H)' },
  { sku: "Innova-NCP39", price: 45880, name: "Stepped Crystal Square Ceiling", categorySlug: "crystal-chandeliers", dimensions: '18"x18"x12"(H)' },
  { sku: "Innova-NCP40", price: 42880, name: "Crystal Rain Spiral Drop Chandelier", categorySlug: "crystal-chandeliers", dimensions: '18"(D)x8ft(H)' },
  { sku: "Innova-NCP41", price: 39880, name: "Crystal Dome Raindrop Chandelier", categorySlug: "crystal-chandeliers", dimensions: '18"(D)x8ft(H)' },
  { sku: "Innova-NCP42", price: 42880, name: "Crystal Cylinder Bubble Chandelier", categorySlug: "crystal-chandeliers", dimensions: '18"(D)x8ft(H)' },
  { sku: "Innova-NCP43", price: 46880, name: "Crystal Cascade Waterfall Chandelier", categorySlug: "crystal-chandeliers", dimensions: '18"(D)x8ft(H)' },
  { sku: "Innova-NCP69", price: 72980, name: "Empire Crystal Ball Chandelier", categorySlug: "crystal-chandeliers", dimensions: '2ft(D)x4ft(H)' },
  { sku: "Innova-NCP70", price: 66590, name: "Classic Crystal Basket Chandelier", categorySlug: "crystal-chandeliers", dimensions: '2ft(D)x4ft(H)' },
  { sku: "Innova-NCP71", price: 68250, name: "Gold Empire Crystal Chandelier", categorySlug: "crystal-chandeliers", dimensions: '2ft(D)x4ft(H)' },

  {
    sku: "Innova-Vermont-01",
    price: 632800,
    name: "Innova Vermont - 65-arm Crystal Grand Chandelier",
    categorySlug: "grand-chandeliers",
    dimensions: "H:240cm x W:170cm",
    specs: "65 arms x E14 40W",
  },
  {
    sku: "Innova-Balmoral",
    price: 204435,
    name: "Innova Balmoral - 21-arm Traditional Crystal Chandelier",
    categorySlug: "grand-chandeliers",
    dimensions: "H:133cm x W:96cm",
    specs: "12+6+3 arms x E14 40W",
  },
];

const featuredSkus = new Set([
  "Innova-WLN18",
  "Innova-WLN5",
  "Innova-WLN33",
  "Innova-WLN20",
  "Innova-HLN13",
  "Innova-HLN14",
  "Innova-HLN1",
  "Innova-HLN9",
  "Innova-PCL-67",
  "Innova-PCL-121",
  "Innova-NCP43",
  "Innova-NCP69",
  "Innova-Vermont-01",
  "Innova-Balmoral",
]);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function seededNumber(seed: string): number {
  return [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getStock(product: CatalogueProduct): number {
  if (product.categorySlug === "grand-chandeliers") return 2;

  const seed = seededNumber(product.sku);
  if (product.price < 6000) return 15 + (seed % 11);
  if (product.price < 20000) return 8 + (seed % 8);
  if (product.price < 50000) return 4 + (seed % 5);
  return 1 + (seed % 3);
}

function getCompareAtPrice(product: CatalogueProduct): number {
  if (product.categorySlug === "wall-lights" || product.categorySlug === "pendant-lights") {
    return Math.round((product.price * 1.22) / 10) * 10;
  }
  if (product.categorySlug === "led-pendant-ceiling") {
    return Math.round((product.price * 1.18) / 100) * 100;
  }
  if (product.categorySlug === "crystal-chandeliers") {
    return Math.round((product.price * 1.15) / 100) * 100;
  }
  return Math.round((product.price * 1.12) / 100) * 100;
}

function getRating(product: CatalogueProduct): { rating: number; reviewCount: number } {
  const seed = seededNumber(product.sku);
  if (product.categorySlug === "wall-lights") {
    return { rating: Number((3.8 + (seed % 10) / 10).toFixed(1)), reviewCount: 5 + (seed % 41) };
  }
  if (product.categorySlug === "pendant-lights") {
    return { rating: Number((4.0 + (seed % 10) / 10).toFixed(1)), reviewCount: 8 + (seed % 55) };
  }
  if (product.categorySlug === "led-pendant-ceiling") {
    return { rating: Number((4.2 + (seed % 8) / 10).toFixed(1)), reviewCount: 3 + (seed % 26) };
  }
  return { rating: Number((4.5 + (seed % 6) / 10).toFixed(1)), reviewCount: 2 + (seed % 17) };
}

function includesAny(value: string, words: string[]): boolean {
  const lower = value.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function getFinish(product: CatalogueProduct): string {
  const name = product.name.toLowerCase();
  if (name.includes("rose gold")) return "Rose Gold";
  if (name.includes("brushed gold")) return "Brushed Gold";
  if (name.includes("gold")) return "Gold";
  if (name.includes("antique brass")) return "Antique Brass";
  if (name.includes("brass")) return "Brass";
  if (name.includes("matte black")) return "Matte Black";
  if (name.includes("black")) return "Black";
  if (name.includes("chrome")) return "Chrome";
  if (name.includes("silver")) return "Silver";
  if (name.includes("white")) return "White";
  if (name.includes("copper")) return "Copper";
  if (name.includes("amber")) return "Amber";
  if (name.includes("grey")) return "Grey";
  if (name.includes("champagne")) return "Champagne";
  if (name.includes("nickel")) return "Nickel";
  return product.categorySlug === "crystal-chandeliers" ? "Chrome" : "Mixed";
}

function getMaterial(product: CatalogueProduct): string {
  if (product.categorySlug === "led-pendant-ceiling") return "Aluminium and Acrylic";
  if (product.categorySlug === "crystal-chandeliers" || product.categorySlug === "grand-chandeliers") {
    return "K9 Crystal and Metal Frame";
  }

  const name = product.name.toLowerCase();
  const materials: string[] = [];
  if (includesAny(name, ["brass", "gold"])) materials.push("Brass");
  if (includesAny(name, ["black", "metal", "cage", "bar", "cylinder"])) materials.push("Metal");
  if (includesAny(name, ["crystal"])) materials.push("Crystal");
  if (includesAny(name, ["fabric", "jute", "shade"])) materials.push("Fabric Shade");
  if (includesAny(name, ["glass", "globe", "opal", "smoked", "frosted", "amber", "clear"])) materials.push("Glass");
  if (materials.length === 0) materials.push(product.categorySlug === "wall-lights" ? "Iron" : "Glass and Metal");
  return [...new Set(materials)].join(", ");
}

function getRoom(product: CatalogueProduct): string {
  if (product.categorySlug === "wall-lights") return "Bedroom, Living Room, Hallway";
  if (product.categorySlug === "pendant-lights") return "Dining Room, Kitchen, Cafe";
  if (product.categorySlug === "led-pendant-ceiling") return "Living Room, Office, Lobby";
  return "Drawing Room, Dining Room, Lobby";
}

function getWattage(product: CatalogueProduct): string {
  if (product.categorySlug !== "led-pendant-ceiling") return "Up to 40W";
  if (product.price < 20000) return "Approx. 40W built-in LED";
  if (product.price < 50000) return "Approx. 80W built-in LED";
  return "Approx. 120W built-in LED";
}

function getImages(product: CatalogueProduct): string[] {
  const imageSlug = generateSlug(product.sku);
  return [`/catalog-products/products/${imageSlug}-1.jpg`];
}

function getTags(product: CatalogueProduct): string[] {
  const finish = getFinish(product).toLowerCase();
  const material = getMaterial(product).toLowerCase();

  if (product.categorySlug === "wall-lights") {
    return [
      "wall light",
      "sconce",
      finish,
      material,
      "indoor",
      "bedroom",
      "hallway",
      includesAny(product.name, ["industrial", "cage"]) ? "industrial" : "modern",
    ];
  }
  if (product.categorySlug === "pendant-lights") {
    return ["pendant light", "hanging light", finish, material, "dining", "kitchen", "cafe"];
  }
  if (product.categorySlug === "led-pendant-ceiling") {
    return ["LED", "modern", "ceiling", "architectural", finish, "living room", "office"];
  }
  return ["crystal", "chandelier", "ceiling", "luxury", finish, "hotel", "drawing room"];
}

function getShortDescription(product: CatalogueProduct): string {
  if (product.categorySlug === "wall-lights") {
    return `A ${getFinish(product).toLowerCase()} wall-mounted ${product.name.toLowerCase()} crafted for warm ambient lighting in bedrooms, hallways, and living room accent walls.`;
  }
  if (product.categorySlug === "pendant-lights") {
    return `A handcrafted ${product.name.toLowerCase()} with an adjustable suspension cord, ideal for dining tables, kitchens, cafes, and intimate living spaces.`;
  }
  if (product.categorySlug === "led-pendant-ceiling") {
    return `A modern ${product.name.toLowerCase()} with built-in LED lighting, acrylic diffusion, and architectural presence for contemporary interiors.`;
  }
  if (product.categorySlug === "crystal-chandeliers") {
    return `A premium ${product.name.toLowerCase()} with K9 crystal detailing and catalogue dimensions of ${product.dimensions}.`;
  }
  return `A luxury bespoke ${product.name.toLowerCase()} for hotels, banquet halls, villas, and large formal rooms. Custom sizes and finishes are available.`;
}

function getDescription(product: CatalogueProduct): string {
  const material = getMaterial(product);
  const finish = getFinish(product);

  if (product.categorySlug === "wall-lights") {
    return `<p>The ${product.sku} ${product.name} brings ${finish.toLowerCase()} character and refined ambient light to interior walls. Its ${material.toLowerCase()} construction is selected for everyday durability and a polished decorative presence.</p>
<ul>
  <li>Material: ${material}</li>
  <li>Finish: ${finish}</li>
  <li>Bulb Type: E27 (bulb not included)</li>
  <li>Wattage Capacity: ${getWattage(product)}</li>
  <li>Suitable for: Indoor use in bedrooms, living rooms, hallways, dining rooms, and studies</li>
  <li>Installation: Wall-mounted with standard electrical hardware</li>
</ul>
<p>Brand: Innova Creations | SKU: ${product.sku}</p>`;
  }

  if (product.categorySlug === "pendant-lights") {
    const dimensionNote = product.sku === "Innova-HLN12C" ? "Globe diameter: approx. 24cm" : "Globe or shade diameter: approx. 20cm where applicable";
    return `<p>The ${product.sku} ${product.name} is a decorative hanging light designed for focused ambience over dining tables, counters, bedside corners, and cafe-style seating areas.</p>
<ul>
  <li>Material: ${material}</li>
  <li>Finish: ${finish}</li>
  <li>Bulb Type: E27 (bulb not included)</li>
  <li>Suspension: Approx. 1.2m adjustable cord</li>
  <li>Dimension note: ${dimensionNote}</li>
  <li>Suitable for: Dining rooms, kitchens, living rooms, bedrooms, and cafes</li>
</ul>
<p>Brand: Innova Creations | SKU: ${product.sku}</p>`;
  }

  if (product.categorySlug === "led-pendant-ceiling") {
    return `<p>The ${product.sku} ${product.name} belongs to the Innova Creations modern LED architectural collection. Its aluminium frame and acrylic diffuser create a clean, energy-efficient statement for contemporary interiors.</p>
<ul>
  <li>Collection: ${product.subgroup}</li>
  <li>Material: Aluminium frame with acrylic diffuser</li>
  <li>Light Source: Built-in LED, no bulb required</li>
  <li>Wattage: ${getWattage(product)}</li>
  <li>Colour Temperature: Warm White 3000K or Cool White 6000K options</li>
  <li>Features: Dimmable configuration available where compatible</li>
  <li>Suitable for: Living rooms, dining rooms, offices, lobbies, duplexes, and staircase voids</li>
</ul>
<p>Brand: Innova Creations | SKU: ${product.sku}</p>`;
  }

  if (product.categorySlug === "crystal-chandeliers") {
    const bulb = product.name.toLowerCase().includes("flush") || product.name.toLowerCase().includes("ceiling") ? "GU10 or G9" : "G9 or MR16";
    return `<p>The ${product.sku} ${product.name} is a premium crystal lighting piece with hand-cut K9 crystals and a polished metal frame for brilliant ceiling illumination.</p>
<ul>
  <li>Dimensions: ${product.dimensions}</li>
  <li>Material: K9 Crystal with Chrome/Brass frame</li>
  <li>Bulb Type: ${bulb} (as per installation plan)</li>
  <li>Installation: Ceiling-mounted or hanging chandelier configuration</li>
  <li>Suitable for: Drawing rooms, dining rooms, lobbies, hotels, and luxury residences</li>
  <li>Craft Detail: Each crystal is hand-cut and individually wired</li>
</ul>
<p>Brand: Innova Creations | SKU: ${product.sku}</p>`;
  }

  return `<p>The ${product.sku} ${product.name} is a grand crystal chandelier for luxury residences, hotels, banquet halls, and formal double-height spaces. It is intended for statement installations where scale, brilliance, and craftsmanship matter.</p>
<ul>
  <li>Dimensions: ${product.dimensions}</li>
  <li>Lighting Specification: ${product.specs}</li>
  <li>Material: Premium K9 crystal with traditional metal chandelier frame</li>
  <li>Bulb Type: E14 40W lamps</li>
  <li>Stock: Bespoke limited availability</li>
  <li>Custom sizes and finishes available. Contact us for bulk hotel/banquet orders.</li>
</ul>
<p>Brand: Innova Creations | SKU: ${product.sku}</p>`;
}

function toProductData(product: CatalogueProduct, categoryId: string) {
  const slug = generateSlug(product.name);
  const price = product.price;
  const compareAtPrice = getCompareAtPrice(product);
  const { rating, reviewCount } = getRating(product);

  return {
    sku: product.sku,
    name: product.name,
    slug,
    shortDescription: getShortDescription(product),
    description: getDescription(product),
    price,
    compareAtPrice,
    costPrice: Math.round(price * 0.62),
    gstRate: 18,
    stockQty: getStock(product),
    isActive: true,
    isFeatured: featuredSkus.has(product.sku),
    isNewArrival: product.categorySlug === "led-pendant-ceiling",
    categoryId,
    images: getImages(product),
    tags: getTags(product),
    seoTitle: `${product.name} | Innova Creations`,
    seoDescription: `Buy ${product.name} (${product.sku}) online at Innova Creations. Premium lighting at Rs. ${price.toLocaleString("en-IN")}. Free shipping above Rs. 5,000.`,
    material: getMaterial(product),
    finish: getFinish(product),
    room: getRoom(product),
    rating,
    reviewCount,
  };
}

const coupons = [
  { code: "INNOVA10", type: CouponType.PERCENT, value: 10, minOrderValue: 5000, maxDiscount: 2000, usageLimit: 100 },
  { code: "INNOVA500", type: CouponType.FLAT, value: 500, minOrderValue: 8000, maxDiscount: 500, usageLimit: 50 },
  { code: "WELCOME15", type: CouponType.PERCENT, value: 15, minOrderValue: 3000, maxDiscount: 3000, usageLimit: 200 },
  { code: "CRYSTAL20", type: CouponType.PERCENT, value: 20, minOrderValue: 20000, maxDiscount: 10000, usageLimit: 30 },
  { code: "FREESHIP", type: CouponType.FLAT, value: 99, minOrderValue: 1000, maxDiscount: 99, usageLimit: 500 },
];

const banners = [
  {
    title: "Illuminate Your World",
    subtitle: "Discover our exclusive LED & Crystal lighting collection",
    ctaText: "Shop Now",
    ctaLink: "/products",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Crystal Chandeliers - Pure Elegance",
    subtitle: "Premium K9 crystal chandeliers from Rs. 38,880",
    ctaText: "Explore Chandeliers",
    ctaLink: "/products/category/crystal-chandeliers",
    imageUrl: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=1600",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Modern LED Lighting",
    subtitle: "Architectural LED lights from Rs. 6,600 - energy efficient & stunning",
    ctaText: "View LED Collection",
    ctaLink: "/products/category/led-pendant-ceiling",
    imageUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=1600",
    sortOrder: 3,
    isActive: true,
  },
];

async function main() {
  console.log("Starting Innova Creations database seed...");

  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  const seededCategories = await prisma.$transaction(
    categories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    ),
  );
  const categoryMap = Object.fromEntries(seededCategories.map((category) => [category.slug, category.id]));
  console.log(`Seeded categories: ${seededCategories.length}`);

  const passwordHash = await bcrypt.hash("Admin@Innova2026", 12);
  await prisma.user.upsert({
    where: { email: "admin@innovacreations.com" },
    update: {
      name: "Innova Admin",
      passwordHash,
      role: Role.ADMIN,
      phone: "+91-9999999999",
      isBlocked: false,
    },
    create: {
      name: "Innova Admin",
      email: "admin@innovacreations.com",
      passwordHash,
      role: Role.ADMIN,
      phone: "+91-9999999999",
    },
  });
  console.log("Seeded admin user: admin@innovacreations.com");

  const productOps = products.map((product) => {
    const categoryId = categoryMap[product.categorySlug];
    if (!categoryId) {
      throw new Error(`Missing category for ${product.categorySlug}`);
    }
    const data = toProductData(product, categoryId);
    return prisma.product.upsert({
      where: { sku: product.sku },
      update: data,
      create: data,
    });
  });
  await prisma.$transaction(productOps);
  console.log(`Seeded products: ${products.length}`);

  const ratingOps = products.map((product) => {
    const { rating, reviewCount } = getRating(product);
    return prisma.$executeRawUnsafe(
      'UPDATE "Product" SET "rating" = $1, "reviewCount" = $2 WHERE "sku" = $3',
      rating,
      reviewCount,
      product.sku,
    );
  });
  await prisma.$transaction(ratingOps);
  console.log("Updated product ratings and review counts");

  await prisma.$transaction(
    coupons.map((coupon) =>
      prisma.coupon.upsert({
        where: { code: coupon.code },
        update: { ...coupon, usedCount: 0, isActive: true },
        create: { ...coupon, usedCount: 0, isActive: true },
      }),
    ),
  );
  console.log(`Seeded coupons: ${coupons.length}`);

  await prisma.$transaction(
    banners.map((banner) =>
      prisma.banner.upsert({
        where: { id: `seed-banner-${banner.sortOrder}` },
        update: banner,
        create: { id: `seed-banner-${banner.sortOrder}`, ...banner },
      }),
    ),
  );
  console.log(`Seeded banners: ${banners.length}`);

  const count = await prisma.product.count();
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  const wln1 = await prisma.product.findUnique({
    where: { sku: "Innova-WLN1" },
    select: { sku: true, price: true, compareAtPrice: true },
  });

  console.log("Seed complete!");
  console.log(`   Categories: ${seededCategories.length}`);
  console.log(`   Products: ${count}`);
  console.log(`   Coupons: ${coupons.length}`);
  console.log(`   Banners: ${banners.length}`);
  console.log("   Admin user: admin@innovacreations.com");
  console.log("   Product counts by category:");
  cats.forEach((category) => {
    console.log(`   - ${category.name} (${category.slug}): ${category._count.products}`);
  });
  console.log(`   WLN1 price check: ${wln1?.sku} price=${wln1?.price} compareAtPrice=${wln1?.compareAtPrice}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
