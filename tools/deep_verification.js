import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const clientPublicDir = path.join(rootDir, "client", "public");

const API_BASE = "http://localhost:5002/api/v1";
const CLIENT_BASE = "http://localhost:5173";

// Color utilities for terminal report
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

const results = {
  passed: 0,
  failed: 0,
  details: [],
};

function record(name, status, message = "") {
  if (status) {
    results.passed++;
    results.details.push({ name, status: "PASS", message });
  } else {
    results.failed++;
    results.details.push({ name, status: "FAIL", message });
  }
}

async function testClientPage(urlPath, expectedText) {
  try {
    const res = await axios.get(`${CLIENT_BASE}${urlPath}`);
    if (res.status === 200 && res.data.includes(expectedText)) {
      record(`Client Page: ${urlPath}`, true);
    } else {
      record(`Client Page: ${urlPath}`, false, `Status ${res.status}, text match failed`);
    }
  } catch (err) {
    record(`Client Page: ${urlPath}`, false, err.message);
  }
}

async function testApiGet(endpoint, validateFn) {
  try {
    const res = await axios.get(`${API_BASE}${endpoint}`);
    if (res.status === 200) {
      const error = validateFn(res.data);
      if (!error) {
        record(`API GET: ${endpoint}`, true);
      } else {
        record(`API GET: ${endpoint}`, false, `Validation failed: ${error}`);
      }
    } else {
      record(`API GET: ${endpoint}`, false, `Status: ${res.status}`);
    }
  } catch (err) {
    record(`API GET: ${endpoint}`, false, err.message);
  }
}

async function runTests() {
  console.log(bold("\n=== STARTING DEEP APPLICATION TESTING ===\n"));

  // --- 1. TEST CLIENT PAGES & TABS ---
  console.log("Testing frontend routing and tabs...");
  const pages = [
    { path: "/", expect: "Innova Creations" },
    { path: "/products", expect: "Innova Creations" },
    { path: "/products/category/wall-lights", expect: "Innova Creations" },
    { path: "/products/category/pendant-lights", expect: "Innova Creations" },
    { path: "/products/category/led-pendant-ceiling", expect: "Innova Creations" },
    { path: "/products/category/crystal-chandeliers", expect: "Innova Creations" },
    { path: "/products/category/grand-chandeliers", expect: "Innova Creations" },
    { path: "/cart", expect: "Innova Creations" },
    { path: "/checkout", expect: "Innova Creations" },
    { path: "/track-order", expect: "Innova Creations" },
    { path: "/login", expect: "Innova Creations" },
    { path: "/register", expect: "Innova Creations" },
    { path: "/forgot-password", expect: "Innova Creations" },
    { path: "/about", expect: "Innova Creations" },
    { path: "/contact", expect: "Innova Creations" },
    { path: "/shipping-policy", expect: "Innova Creations" },
    { path: "/returns-policy", expect: "Innova Creations" },
    { path: "/privacy-policy", expect: "Innova Creations" },
    { path: "/terms", expect: "Innova Creations" },
  ];

  for (const page of pages) {
    await testClientPage(page.path, page.expect);
  }

  // --- 2. TEST API SERVICES & BACKEND ENDPOINTS ---
  console.log("\nTesting REST API backend services...");

  // Get categories
  await testApiGet("/categories", (data) => {
    const categories = data.categories ?? data;
    if (!Array.isArray(categories) || categories.length === 0) return "Missing categories list";
    return null;
  });

  // Get products
  await testApiGet("/products", (data) => {
    const products = data.products ?? data;
    if (!Array.isArray(products) || products.length === 0) return "Missing products list";
    if (products[0].images.length === 0) return "Product has no images";
    return null;
  });

  // Get single product
  await testApiGet("/products/antique-brass-frosted-glass-wall-sconce", (data) => {
    const p = data.product ?? data;
    if (!p || p.name !== "Antique Brass Frosted Glass Wall Sconce") return "Product name mismatch";
    if (p.images.length === 0) return "Product details did not return images";
    return null;
  });

  // Search product
  await testApiGet("/products/search?q=brass", (data) => {
    const products = data.products ?? data;
    if (!Array.isArray(products) || products.length === 0) return "Search returned no results";
    return null;
  });

  // Register Customer (Mock)
  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: "StrongPassword123!",
      name: "Test User",
      phone: "1234567890",
    });
    if (regRes.status === 200 && regRes.data.user.email === testEmail) {
      record("API POST: /auth/register", true);
    } else {
      record("API POST: /auth/register", false, "Response structure mismatch");
    }
  } catch (err) {
    record("API POST: /auth/register", false, err.message);
  }

  // Login Customer (Mock)
  try {
    const logRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@innovacreations.com",
      password: "Admin@Innova2026",
    });
    if (logRes.status === 200 && logRes.data.user.role === "ADMIN") {
      record("API POST: /auth/login (Admin)", true);
    } else {
      record("API POST: /auth/login", false, "Response structure mismatch");
    }
  } catch (err) {
    record("API POST: /auth/login", false, err.message);
  }

  // Create Order (Mock Checkout)
  let testOrderNumber = "";
  try {
    const orderRes = await axios.post(`${API_BASE}/orders`, {
      items: [{ productId: "Innova-WLN1", sku: "Innova-WLN1", quantity: 3 }],
      address: {
        name: "Test Customer",
        email: "test@example.com",
        phone: "9876543210",
        address: "Test street 123",
        city: "Mumbai",
        pincode: "400001",
      },
      paymentMethod: "Pay on Delivery",
    });
    if (orderRes.status === 200 && orderRes.data.order) {
      testOrderNumber = orderRes.data.order.orderNumber;
      record("API POST: /orders (Checkout)", true);
    } else {
      record("API POST: /orders (Checkout)", false, "Response structure mismatch");
    }
  } catch (err) {
    record("API POST: /orders (Checkout)", false, err.message);
  }

  // Get order status (Mock Track Order)
  if (testOrderNumber) {
    await testApiGet(`/orders/${testOrderNumber}`, (data) => {
      const order = data.order ?? data;
      if (!order || order.orderNumber !== testOrderNumber) return "Order tracking number mismatch";
      return null;
    });
  }

  // --- 3. TEST PRODUCT IMAGES INTEGRITY ---
  console.log("\nVerifying catalog images integrity...");
  try {
    // Import catalogue products
    const cataloguePath = path.join(rootDir, "server", "src", "catalogue.ts");
    const content = fs.readFileSync(cataloguePath, "utf-8");
    // Extract image paths using regex since it's a typescript file
    const imageRegex = /"\/catalog-products\/products\/[^"]+"/g;
    const matches = content.match(imageRegex) || [];
    const uniqueImages = [...new Set(matches.map((m) => m.replace(/"/g, "")))];

    console.log(`Found ${uniqueImages.length} unique catalog images to verify.`);
    let missingImages = [];

    for (const imgPath of uniqueImages) {
      const diskPath = path.join(clientPublicDir, imgPath);
      if (!fs.existsSync(diskPath)) {
        missingImages.push(imgPath);
      }
    }

    if (missingImages.length === 0) {
      record(`Image Integrity: All ${uniqueImages.length} images exist on disk`, true);
    } else {
      record(
        `Image Integrity: Missing ${missingImages.length} images`,
        false,
        `Missing paths: ${missingImages.slice(0, 5).join(", ")}`
      );
    }
  } catch (err) {
    record("Image Integrity Check", false, err.message);
  }

  // --- 4. PRINT REPORT ---
  console.log(bold("\n=== FINAL TEST REPORT ===\n"));
  for (const item of results.details) {
    const indicator = item.status === "PASS" ? green("[✓] PASS") : red("[✗] FAIL");
    const msg = item.message ? ` - ${item.message}` : "";
    console.log(`${indicator} ${item.name}${msg}`);
  }

  console.log(bold(`\nSummary: ${green(`${results.passed} Passed`)}, ${red(`${results.failed} Failed`)}\n`));

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
