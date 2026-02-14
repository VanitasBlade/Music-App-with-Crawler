export const BASE_URL = "https://dabmusic.xyz/";

export const SELECTORS = {
  // Search input - visible in the input field
  searchInput: 'input[placeholder="Search for songs, artists, or albums..."]',
  
  // Search button - the green "Search" button
  searchButton: 'button.bg-green-500',
  
  // Results container - the grid that contains all song cards
  resultsContainer: 'div.grid.grid-cols-1 > div.rounded-lg',
  
  // Alternative results selector
  resultsContainerAlt: 'div.rounded-lg.border.text-card-foreground',
  
  // Song title - the h3 element (like "Six Blade Knife")
  title: 'h3',
  
  // Artist name - appears to be in a paragraph or div
  artist: 'p.text-sm, div.text-sm',
  
  // Download FLAC button - the blue button with download icon
  flacButton: 'button:has-text("Download FLAC")',
};