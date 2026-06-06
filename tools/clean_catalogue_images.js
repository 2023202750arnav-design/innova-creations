import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const productsDir = path.join(rootDir, "client", "public", "catalog-products", "products");

// 1. Get the list of all files that actually exist on disk
const existingFiles = new Set(fs.readdirSync(productsDir));
console.log(`Found ${existingFiles.size} existing image files on disk.`);

function cleanCatalogue(filePath) {
  console.log(`Cleaning image entries in: ${filePath}`);
  const content = fs.readFileSync(filePath, "utf-8");
  
  const arrayStart = content.indexOf("export const catalogueProducts");
  if (arrayStart === -1) {
    console.error(`Could not find catalogueProducts in ${filePath}`);
    return;
  }
  
  // Find the equals sign after the variable declaration
  const equalsIndex = content.indexOf("=", arrayStart);
  // Find the opening square bracket after the equals sign
  const openBracket = content.indexOf("[", equalsIndex);
  // Find the last closing square bracket of the array
  const closeBracket = content.lastIndexOf("]");
  
  const arrayContent = content.substring(openBracket, closeBracket + 1);
  const products = JSON.parse(arrayContent);
  
  let cleanedCount = 0;
  for (const product of products) {
    if (product.images && Array.isArray(product.images)) {
      const originalCount = product.images.length;
      product.images = product.images.filter(img => {
        const basename = path.basename(img);
        return existingFiles.has(basename);
      });
      // Fallback if all images are filtered out
      if (product.images.length === 0 && originalCount > 0) {
        product.images = [ `/catalog-products/products/innova-wln1-1.jpg` ];
      }
      if (product.images.length !== originalCount) {
        cleanedCount += (originalCount - product.images.length);
      }
    }
  }
  
  console.log(`Filtered out ${cleanedCount} missing image entries.`);
  
  // Format the updated array beautifully
  const formattedArray = JSON.stringify(products, null, 2);
  
  // Reconstruct the file content
  const prefix = content.substring(0, openBracket);
  const suffix = content.substring(closeBracket + 1);
  const updatedContent = prefix + formattedArray + suffix;
  
  fs.writeFileSync(filePath, updatedContent, "utf-8");
  console.log(`Successfully updated ${filePath}`);
}

cleanCatalogue(path.join(rootDir, "client", "src", "catalogue.ts"));
cleanCatalogue(path.join(rootDir, "server", "src", "catalogue.ts"));
