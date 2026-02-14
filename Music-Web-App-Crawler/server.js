import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBrowser } from './src/browser.js';
import { BASE_URL } from './src/config.js';
import { downloadSong } from './src/downloader.js';
import { searchSongs } from './src/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let browserInstance = null;
const downloadedSongs = new Map();

async function initBrowser() {
  if (!browserInstance) {
    browserInstance = await createBrowser();
    await browserInstance.page.goto(BASE_URL, { waitUntil: "networkidle" });
    console.log('✅ Browser initialized');
  }
  return browserInstance;
}

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('🔍 Searching for:', q);
    
    const { page } = await initBrowser();
    const songs = await searchSongs(page, q);
    
    res.json({ success: true, songs });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/download', async (req, res) => {
  try {
    const { song } = req.body;
    console.log('⬇️  Downloading:', song.title);
    
    const { page } = await initBrowser();
    
    const songs = await searchSongs(page, song.title);
    const targetSong = songs.find(s => 
      s.title === song.title && s.artist === song.artist
    );
    
    if (!targetSong) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    const filename = await downloadSong(page, targetSong.element, './songs');
    
    const songId = Date.now().toString();
    const songWithId = {
      ...song,
      id: songId,
      filename,
    };
    
    downloadedSongs.set(songId, filename);
    
    res.json({ success: true, song: songWithId });
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const filename = downloadedSongs.get(id);
    
    if (!filename) {
      const songsDir = path.join(__dirname, 'songs');
      const files = fs.readdirSync(songsDir).filter(f => f.endsWith('.flac'));
      
      if (files.length === 0) {
        return res.status(404).json({ error: 'No files found' });
      }
      
      const filePath = path.join(songsDir, files[0]);
      return streamFile(filePath, req, res);
    }
    
    const filePath = path.join(__dirname, 'songs', filename);
    streamFile(filePath, req, res);
    
  } catch (error) {
    console.error('❌ Stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

function streamFile(filePath, req, res) {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/flac',
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'audio/flac',
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
}

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Android can access at: http://10.213.164.15:${PORT}`);
});