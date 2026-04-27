import { chromium } from "file:///C:/Users/kimyechan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";

const url = process.env.URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

async function captureSection(page, label) {
  // Scroll inner container to bottom so 최근 브리핑 is visible
  const container = page.locator("div.overflow-y-auto.h-full").first();
  await container.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `C:/Users/KIMYEC~1/AppData/Local/Temp/home-${label}-bottom.png` });
  await container.evaluate((el) => el.scrollTo({ top: 0 }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `C:/Users/KIMYEC~1/AppData/Local/Temp/home-${label}-top.png` });
}

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("text=최근", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

// Default tab — capture current state first
const krTab = page.getByRole("button", { name: /한국/ });
const usTab = page.getByRole("button", { name: /미국/ });

await usTab.click();
await page.waitForTimeout(400);
await captureSection(page, "us");

await krTab.click();
await page.waitForTimeout(400);
await captureSection(page, "kr");

await browser.close();
console.log("done");
