import fs from "fs";
import promptSync from "prompt-sync";

import { createBrowser } from "./browser.js";
import { BASE_URL } from "./config.js";
import { downloadSong } from "./downloader.js";
import { searchSongs } from "./search.js";

const prompt = promptSync();

(async () => {
  console.log("\n🎵 DAB Music CLI Bot\n");

  // Ensure songs folder exists
  if (!fs.existsSync("./songs")) {
    fs.mkdirSync("./songs");
  }

  const { browser, context, page } = await createBrowser();

  try {
    await page.goto(BASE_URL);

    const query = prompt("🔍 Enter song name: ").trim();

    if (!query) {
      console.log("❌ Empty search. Exiting.");
      return;
    }

    const songs = await searchSongs(page, query);

    if (songs.length === 0) {
      console.log("❌ No songs found.");
      return;
    }

    console.log("\n🎶 Results:\n");

    songs.forEach((song, i) => {
      console.log(
        `[${i + 1}] ${song.title} - ${song.artist}`
      );
    });

    const selection =
      parseInt(
        prompt("\n📥 Select song number to download: ")
      ) - 1;

    if (
      isNaN(selection) ||
      selection < 0 ||
      selection >= songs.length
    ) {
      console.log("❌ Invalid selection.");
      return;
    }

    console.log("\n⬇ Downloading FLAC...");

    const filename = await downloadSong(
      page,
      songs[selection].element,
      "./songs"
    );

    console.log(`✅ Downloaded: ${filename}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await context.close();
    await browser.close();
  }
})();
