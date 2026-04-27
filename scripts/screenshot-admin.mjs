import { chromium } from "playwright-core";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "ac73f107a1ebb54f688f1fafe690c66f";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  httpCredentials: { username: "admin", password: PASSWORD },
});
const page = await context.newPage();
await page.goto("http://localhost:3001/admin/briefing", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: ".playwright-artifacts/admin-after-failed-run.png", fullPage: true });
await browser.close();
console.log("done");
