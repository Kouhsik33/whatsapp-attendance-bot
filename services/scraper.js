// scraper.js
import { chromium } from "playwright";

export default async function fetchAttendance(regno, password) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let browser = null;

    try {
      console.log(`🚀 Attempt ${attempt}: Launching browser for ${regno}`);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Go to login page
      await page.goto("http://43.250.40.63/Login.aspx?ReturnUrl=%2f", {
        waitUntil: "domcontentloaded",
      });

      // 2. Fill Reg Number
      await page.getByRole("textbox", { name: "User Name" }).fill(regno);
      await page.getByRole("button", { name: "Next" }).click();

      // 3. Fill Password
      await page.getByRole("textbox", { name: "Enter Password" }).fill(password);
      await page.getByText("Submit").click();

      // 4. Click student dashboard link
      await page.getByRole("link", { name: "Click Here to go Student" }).click();

      // 5. Extract attendance value
      console.log("🔍 Fetching attendance value...");
      await page.waitForSelector("#ctl00_cpStud_lblTotalPercentage");
      const attendance = await page
        .locator("#ctl00_cpStud_lblTotalPercentage")
        .textContent();

      await browser.close();
      return attendance?.trim() || "Attendance not found";
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed: ${err.message}`);
      if (browser) {
        const page = (await browser.contexts()[0].pages())[0];
        if (page) await page.screenshot({ path: `error_attempt${attempt}.png` });
        await browser.close();
      }
    }
  }

  return "⚠️ Failed to fetch attendance after multiple attempts.";
}
