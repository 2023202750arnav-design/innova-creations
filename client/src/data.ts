export type Product = {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  category: string;
  categoryName?: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number;
  rating: number;
  reviews: number;
  stock: number;
  badges: string[];
  material: string;
  finish: string;
  room: string;
  images: string[];
  variants: { name: string; value: string; stock: number; priceModifier: number }[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  count: number;
  sortOrder: number;
};

export const categories: Category[] = [
  {
    id: "wall-lights",
    name: "Wall Lights",
    slug: "wall-lights",
    description: "Elegant wall-mounted sconces and fixtures for every interior style.",
    image: "/catalog-products/products/innova-wln18-1.jpg",
    count: 39,
    sortOrder: 1,
  },
  {
    id: "pendant-lights",
    name: "Pendant Lights",
    slug: "pendant-lights",
    description: "Handcrafted hanging pendant lights in glass, metal, and crystal.",
    image: "/catalog-products/products/innova-hln13-1.jpg",
    count: 22,
    sortOrder: 2,
  },
  {
    id: "led-pendant-ceiling",
    name: "LED Pendant & Ceiling Lights",
    slug: "led-pendant-ceiling",
    description: "Modern architectural LED pendant and ceiling lights.",
    image: "/catalog-products/products/innova-pcl-67-1.jpg",
    count: 33,
    sortOrder: 3,
  },
  {
    id: "crystal-chandeliers",
    name: "Crystal Chandeliers",
    slug: "crystal-chandeliers",
    description: "Premium K9 crystal chandeliers in flush mount and pendant styles.",
    image: "/catalog-products/products/innova-ncp69-1.jpg",
    count: 10,
    sortOrder: 4,
  },
  {
    id: "grand-chandeliers",
    name: "Grand Crystal Chandeliers",
    slug: "grand-chandeliers",
    description: "Bespoke grand chandeliers for hotels, banquet halls, and luxury residences.",
    image: "/catalog-products/products/innova-vermont-01-1.jpg",
    count: 2,
    sortOrder: 5,
  },
];

export { catalogueProducts as products } from "./catalogue";

export const heroSlides = [
  {
    title: "INNOVA CREATIONS",
    subtitle: "Real wall, pendant, LED, and crystal lighting from the Innova catalogue.",
    image: "/catalog-products/products/innova-pcl-121-1.jpg",
  },
  {
    title: "CRYSTAL CHANDELIERS",
    subtitle: "K9 crystal chandeliers and grand statement pieces for luxury interiors.",
    image: "/catalog-products/products/innova-ncp69-1.jpg",
  },
  {
    title: "MODERN LED LIGHTING",
    subtitle: "Architectural LED pendant and ceiling lights with contemporary profiles.",
    image: "/catalog-products/products/innova-pcl-67-1.jpg",
  },
];

export const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
