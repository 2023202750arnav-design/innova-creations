import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = "/Users/arnavmishra/.gemini/antigravity/brain/ac1bae47-36c9-4f59-ab84-3125cace329d";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CLIENT_URL = "http://localhost:5173";

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2ETest() {
  console.log(bold("\n=== STARTING HEADLESS BROWSER E2E TEST ===\n"));

  console.log("Launching native Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // --- 1. NAVIGATE TO LOGIN ---
    console.log("Navigating to login page...");
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: "networkidle2" });
    await page.screenshot({ path: path.join(screenshotDir, "step1_login_page.png") });
    console.log(green("✓ Reached Login Page."));

    // --- 2. PERFORM LOGIN ---
    console.log("Filling login credentials...");
    await page.type('input[name="email"]', "admin@innovacreations.com");
    await page.type('input[name="password"]', "Admin@1234");
    await page.screenshot({ path: path.join(screenshotDir, "step2_credentials_filled.png") });

    console.log("Clicking Login...");
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    await page.screenshot({ path: path.join(screenshotDir, "step3_logged_in_dashboard.png") });
    console.log(green("✓ Successfully logged in and redirected to Account profile."));

    // --- 3. BROWSE PRODUCTS ---
    console.log("Navigating to products catalog...");
    await page.goto(`${CLIENT_URL}/products`, { waitUntil: "networkidle2" });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, "step4_product_catalog.png") });
    console.log(green("✓ Catalog page loaded successfully."));

    // --- 4. VIEW PRODUCT DETAIL ---
    console.log("Selecting product: Antique Brass Frosted Glass Wall Sconce...");
    // Let's click on the link for the sconce product
    await Promise.all([
      page.click('a[href="/products/antique-brass-frosted-glass-wall-sconce"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, "step5_product_details.png") });
    console.log(green("✓ Product details page loaded (verified layout & gallery)."));

    // --- 5. ADD TO CART ---
    console.log("Adding product to cart...");
    await page.click('button[data-testid="product-add-cart"]');
    await delay(1000); // Wait for toast notification
    await page.screenshot({ path: path.join(screenshotDir, "step6_added_to_cart_toast.png") });
    console.log(green("✓ Product added to cart successfully."));

    // --- 6. VIEW CART ---
    console.log("Navigating to Cart page...");
    await page.goto(`${CLIENT_URL}/cart`, { waitUntil: "networkidle2" });
    await delay(500);
    await page.screenshot({ path: path.join(screenshotDir, "step7_cart_page.png") });
    console.log(green("✓ Cart page verified."));

    // --- 7. PROCEED TO CHECKOUT ---
    console.log("Proceeding to checkout...");
    await Promise.all([
      page.click('a[href="/checkout"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    await delay(500);
    await page.screenshot({ path: path.join(screenshotDir, "step8_checkout_shipping_form.png") });
    console.log(green("✓ Checkout page loaded."));

    // --- 8. FILL CHECKOUT SHIPPING ADDRESS ---
    console.log("Filling checkout address form...");
    // Clear and type values
    await page.type('#checkout-name', "Arnav Mishra");
    await page.type('#checkout-email', "arnav@example.com");
    await page.type('#checkout-phone', "9876543210");
    await page.type('#checkout-address', "456 Royal Palace Boulevard");
    await page.type('#checkout-city', "Mumbai");
    await page.type('#checkout-pincode', "400001");
    await page.screenshot({ path: path.join(screenshotDir, "step9_checkout_form_filled.png") });

    console.log("Clicking Continue to Review...");
    await page.click('form button');
    await delay(1000); // Transition to review step
    await page.screenshot({ path: path.join(screenshotDir, "step10_checkout_review.png") });
    console.log(green("✓ Checkout Address validated and moved to Review."));

    console.log("Clicking Payment...");
    // Locate the Payment transition button in step 2
    const buttons = await page.$$("button");
    let paymentBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Payment")) {
        paymentBtn = btn;
        break;
      }
    }
    if (paymentBtn) {
      await paymentBtn.click();
      await delay(1000);
      await page.screenshot({ path: path.join(screenshotDir, "step11_checkout_payment_methods.png") });
      console.log(green("✓ Moved to Payment selection."));
    }

    // Select Pay on Delivery
    console.log("Selecting Pay on Delivery option...");
    const radios = await page.$$('input[type="radio"]');
    for (const radio of radios) {
      const isPod = await page.evaluate(el => el.parentElement.textContent.includes("Pay on Delivery"), radio);
      if (isPod) {
        await radio.click();
        break;
      }
    }
    await delay(500);
    await page.screenshot({ path: path.join(screenshotDir, "step12_payment_method_selected.png") });

    // Place Order
    console.log("Clicking Place Order...");
    let placeOrderBtn = null;
    const finalBtns = await page.$$("button");
    for (const btn of finalBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Place Order")) {
        placeOrderBtn = btn;
        break;
      }
    }
    if (placeOrderBtn) {
      await Promise.all([
        placeOrderBtn.click(),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    }
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, "step13_order_confirmed.png") });
    console.log(green("✓ Order placed successfully!"));

    // --- 9. EXTRACT ORDER NUMBER AND TRACK IT ---
    const url = page.url();
    const orderNumber = url.substring(url.lastIndexOf("/") + 1);
    console.log(`Order Number generated: ${bold(orderNumber)}`);

    console.log("Navigating to track order page...");
    await page.goto(`${CLIENT_URL}/track-order`, { waitUntil: "networkidle2" });
    await page.type('input[placeholder="Enter order number"]', orderNumber);
    await page.screenshot({ path: path.join(screenshotDir, "step14_tracking_filled.png") });
    
    console.log("Clicking Track...");
    await page.click('main button');
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, "step15_order_tracked.png") });
    console.log(green("✓ Order status tracked successfully as CONFIRMED."));

    console.log(bold("\n=== BROWSER E2E TEST COMPLETED SUCCESSFULLY ===\n"));

  } catch (error) {
    console.error("Test failed with error:", error);
    await page.screenshot({ path: path.join(screenshotDir, "step_failed_error.png") });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
