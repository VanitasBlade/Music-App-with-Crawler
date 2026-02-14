import { SELECTORS } from "./config.js";

export async function downloadSong(page, songElement, folderPath) {
  console.log("🎵 Preparing to download...");
  
  // Find the "Download FLAC" button
  const flacButton = songElement.locator(SELECTORS.flacButton).first();
  
  try {
    await flacButton.waitFor({ state: "visible", timeout: 5000 });
    console.log("✅ Found Download FLAC button");
  } catch (e) {
    throw new Error("Download FLAC button not found in this song card");
  }

  // Scroll the button into view
  await flacButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  console.log("⬇️  Initiating download...");

  // Click the button and wait for download
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    flacButton.click()
  ]);

  const filename = download.suggestedFilename();
  console.log(`📥 Downloading: ${filename}`);

  // Save the file
  const filepath = `${folderPath}/${filename}`;
  await download.saveAs(filepath);

  return filename;
}