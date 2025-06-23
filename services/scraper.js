
import { chromium } from "playwright";

export default async function fetchAttendance(regno, password) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let browser = null;
    try {
      console.log(`🚀 Attempt ${attempt}: Launching browser for ${regno}`);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Step 1: Go to login page
      console.log("🌐 Navigating to login page...");
      await page.goto("http://43.250.40.63/Login.aspx?ReturnUrl=%2f", { waitUntil: "domcontentloaded", timeout: 15000 });

      // Step 2: Fill reg number
      console.log("✍️ Entering registration number...");
      await page.getByRole("textbox", { name: "User Name" }).fill(regno);
      await page.getByRole("button", { name: "Next" }).click();

      // Step 3: Fill password
      console.log("🔐 Entering password...");
      await page.getByRole("textbox", { name: "Enter Password" }).fill(password);
      await page.getByText("Submit").click();

      // Step 4: Wait and click student dashboard
      console.log("📚 Clicking on Student Dashboard...");
      await page.waitForSelector("a[href*='StudentHome.aspx']", { timeout: 10000 });
      await page.getByRole("link", { name: /click here to go student/i }).click();

      // Step 5: Fetch attendance
      console.log("📊 Fetching attendance...");
      await page.waitForSelector("#ctl00_cpStud_lblTotalPercentage", { timeout: 10000 });
      const attendance = await page.locator("#ctl00_cpStud_lblTotalPercentage").textContent();

      await browser.close();
      return attendance?.trim() || "❌ Attendance not found";

    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed: ${err.message}`);
      if (browser) {
        const page = (await browser.contexts()[0].pages())[0];
        if (page) {
          await page.screenshot({ path: `error_attempt${attempt}.png` });
          console.log(`📸 Screenshot saved: error_attempt${attempt}.png`);
        }
        await browser.close();
      }
    }
  }

  return "⚠️ Failed to fetch attendance after multiple attempts.";
}
