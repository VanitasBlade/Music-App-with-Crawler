import { chromium } from "playwright";

export async function createBrowser() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  return { browser, context, page };
}
