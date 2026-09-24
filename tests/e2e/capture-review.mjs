import { chromium } from "@playwright/test";
import path from "node:path";

const root = process.cwd();
const fixture = path.join(root, "tests/e2e/fixtures/minimal.epub");
const output = path.join(root, ".impeccable/review");

async function capture(width, height, suffix) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto("http://localhost:3000");
  await page.locator('input[type="file"]').first().setInputFiles(fixture);
  await page.getByRole("link", { name: "The Quiet Chapter" }).nth(1).waitFor({ timeout: 15_000 });
  await page.waitForTimeout(4_500);
  await page.screenshot({ path: path.join(output, `${suffix}.png`), fullPage: true });
  await page.getByRole("link", { name: "Start reading" }).click();
  await page.locator("iframe").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: path.join(output, `reader-${suffix}.png`) });
  await browser.close();
}

await Promise.all([
  capture(1440, 1000, "desktop"),
  capture(390, 844, "mobile"),
]);
