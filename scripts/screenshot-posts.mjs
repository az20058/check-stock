import { chromium } from "file:///C:/Users/kimyechan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// scroll the inner scrollable div all the way down
const scrollerHandle = await page.locator("div.overflow-y-auto").first();
await scrollerHandle.evaluate((el) => { el.scrollTop = el.scrollHeight; });
await page.waitForTimeout(500);
await page.screenshot({ path: "C:/Users/KIMYEC~1/AppData/Local/Temp/home-bottom.png" });

// also capture the middle area
await scrollerHandle.evaluate((el) => { el.scrollTop = el.scrollHeight - 1200; });
await page.waitForTimeout(300);
await page.screenshot({ path: "C:/Users/KIMYEC~1/AppData/Local/Temp/home-mid.png" });

// fetch first post id
const postsRes = await fetch("http://localhost:3000/api/posts").then((r) => r.json());
const firstId = postsRes[0]?.id;
console.log("first post id:", firstId);

if (firstId) {
  await page.goto(`http://localhost:3000/posts/${firstId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "C:/Users/KIMYEC~1/AppData/Local/Temp/post-top.png" });

  const scroller2 = await page.locator("div.overflow-y-auto").first();
  await scroller2.evaluate((el) => { el.scrollTop = 800; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "C:/Users/KIMYEC~1/AppData/Local/Temp/post-mid.png" });

  await scroller2.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "C:/Users/KIMYEC~1/AppData/Local/Temp/post-bottom.png" });
}

await browser.close();
