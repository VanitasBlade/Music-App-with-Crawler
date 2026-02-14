
export async function searchSongs(page, query) {
  console.log("🔍 Searching for:", query);
  
  // Wait for page to be ready
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Find the search input
  const searchInput = page.locator('input[placeholder="Search for songs, artists, or albums..."]').first();
  
  try {
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Found search input");
  } catch (e) {
    throw new Error("Search input not found");
  }

  // Fill the input
  await searchInput.click();
  await searchInput.clear();
  await searchInput.fill(query);
  console.log("✅ Query entered:", query);
  
  await page.waitForTimeout(500);

  // Set up listener for the search API call BEFORE pressing Enter
  const apiPromise = page.waitForResponse(
    response => response.url().includes('/api/search'),
    { timeout: 15000 }
  );

  // Focus the input and press Enter (this is what works!)
  console.log("⌨️  Pressing Enter to search...");
  await searchInput.focus();
  await page.keyboard.press('Enter');

  // Wait for the API call
  try {
    await apiPromise;
    console.log("✅ Search API called successfully");
  } catch (e) {
    throw new Error("Search API did not respond");
  }

  // Wait for results to render
  console.log("⏳ Waiting for results to render...");
  await page.waitForTimeout(3000);

  // Find all song cards (those with "Download FLAC" button)
  const allCards = page.locator('div.rounded-lg.border');
  const cardCount = await allCards.count();
  
  console.log(`📊 Found ${cardCount} total cards`);

  const songs = [];

  for (let i = 0; i < cardCount; i++) {
    const card = allCards.nth(i);
    
    // Check if this card has a Download FLAC button (tracks only)
    const hasDownloadButton = await card.locator('button:has-text("Download FLAC")').count() > 0;
    
    if (!hasDownloadButton) {
      continue; // Skip album cards
    }

    try {
      // Get song title from h3
      let title = 'Unknown';
      const h3 = card.locator('h3').first();
      if (await h3.count() > 0) {
        const titleText = await h3.textContent();
        title = titleText?.trim() || 'Unknown';
      }

      // Get artist name from paragraphs
      let artist = 'Unknown';
      const paragraphs = await card.locator('p').all();
      
      for (const p of paragraphs) {
        const text = await p.textContent();
        const trimmedText = text?.trim() || '';
        
        // Skip album info and audio quality info
        if (trimmedText && 
            !trimmedText.startsWith('Album:') && 
            !trimmedText.includes('16bit') &&
            !trimmedText.includes('kHz') &&
            trimmedText !== title &&
            trimmedText.length > 0) {
          
          // Clean up artist text
          artist = trimmedText.replace(/^[♪♫🎵🎶]\s*/, '').trim();
          break;
        }
      }

      songs.push({
        index: songs.length,
        title,
        artist,
        element: card,
      });

      console.log(`  [${songs.length}] ${title} - ${artist}`);
      
    } catch (e) {
      console.warn(`⚠️  Could not parse card ${i}`);
    }
  }

  if (songs.length === 0) {
    console.log("❌ No track results found");
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'no-results-debug.png', fullPage: true });
    console.log("📸 Screenshot saved to no-results-debug.png");
  }

  console.log(`\n✅ Found ${songs.length} track(s)\n`);
  return songs;
}