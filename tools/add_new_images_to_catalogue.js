import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const productsDir = path.join(rootDir, "client", "public", "catalog-products", "products");

// Get all files on disk
const files = fs.readdirSync(productsDir);
console.log(`Found ${files.length} total image files on disk.`);

function updateCatalogue(filePath) {
  console.log(`Updating image entries in: ${filePath}`);
  const content = fs.readFileSync(filePath, "utf-8");
  
  const arrayStart = content.indexOf("export const catalogueProducts");
  if (arrayStart === -1) {
    console.error(`Could not find catalogueProducts in ${filePath}`);
    return;
  }
  
  const equalsIndex = content.indexOf("=", arrayStart);
  const openBracket = content.indexOf("[", equalsIndex);
  const closeBracket = content.lastIndexOf("]");
  
  const arrayContent = content.substring(openBracket, closeBracket + 1);
  const products = JSON.parse(arrayContent);
  
  let addedCount = 0;
  for (const product of products) {
    const skuLower = product.sku.toLowerCase();
    
    // Look for all files that belong to this SKU, e.g. sku-1.jpg, sku-2.jpg
    const matchingFiles = files.filter(f => f.startsWith(skuLower + "-") && f.endsWith(".jpg"));
    
    // Sort them so -1.jpg is first, -2.jpg is second, etc.
    matchingFiles.sort((a, b) => {
      const numA = parseInt(a.replace(skuLower + "-", "").replace(".jpg", ""), 10) || 1;
      const numB = parseInt(b.replace(skuLower + "-", "").replace(".jpg", ""), 10) || 1;
      return numA - numB;
    });
    
    const newImages = matchingFiles.map(f => `/catalog-products/products/${f}`);
    
    // Check if the images array has changed
    const currentImagesStr = JSON.stringify(product.images);
    const newImagesStr = JSON.stringify(newImages);
    
    if (currentImagesStr !== newImagesStr) {
      product.images = newImages;
      addedCount++;
    }
  }
  
  console.log(`Updated ${addedCount} products with new image arrays.`);
  
  // Format the updated array beautifully
  const formattedArray = JSON.stringify(products, null, 2);
  
  // Reconstruct the file content
  const prefix = content.substring(0, openBracket);
  const suffix = content.substring(closeBracket + 1);
  const updatedContent = prefix + formattedArray + suffix;
  
  fs.writeFileSync(filePath, updatedContent, "utf-8");
  console.log(`Successfully updated ${filePath}`);
}

updateCatalogue(path.join(rootDir, "client", "src", "catalogue.ts"));
updateCatalogue(path.join(rootDir, "server", "src", "catalogue.ts"));
