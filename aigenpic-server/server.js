require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin + 'aigenpic_salt').digest('hex');
}

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.ACCESS_CODE || '08032026';

const PROVIDERS = {
  routerai_flux: {
    name: 'RouterAI.ru',
    label: 'FLUX.2 Klein',
    endpoint: 'https://routerai.ru/api/v1/chat/completions',
    apiKey: process.env.ROUTERAI_API_KEY,
    model: 'black-forest-labs/flux.2-klein-4b',
    modalities: null
  }
};

const PIC_DIR = path.join(__dirname, 'pic');
const DB_FILE = path.join(__dirname, 'app.db');

if (!fs.existsSync(PIC_DIR)) {
  fs.mkdirSync(PIC_DIR, { recursive: true });
}

const initSqlJs = require('sql.js');

let db;

async function initDb() {
  const SQL = await initSqlJs();
  const data = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE) : null;
  db = new SQL.Database(data);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      filename TEXT NOT NULL,
      prompt TEXT,
      provider TEXT,
      provider_name TEXT,
      model TEXT,
      size INTEGER,
      created_at TEXT NOT NULL
    )
  `);

  try {
    db.run(`ALTER TABLE users ADD COLUMN pin_hash TEXT`);
  } catch(e) { }

  saveDb();
  console.log('Database ready:', DB_FILE);
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'aigenpic-react', 'dist')));
app.use('/pic', express.static(PIC_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'aigenpic-react', 'dist', 'index.html'));
});

app.post('/api/check-code', (req, res) => {
  const { code } = req.body;
  if (code === ACCESS_CODE) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Неверный код доступа' });
  }
});

app.post('/api/check-username', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Псевдоним слишком короткий' });
  }
  const safe = username.trim();
  const user = dbGet('SELECT username, pin_hash FROM users WHERE username = ?', [safe]);
  res.json({ exists: !!user, hasPin: !!(user && user.pin_hash) });
});

app.post('/api/login', (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ error: 'Нужен псевдоним и PIN' });
  const safe = username.trim();
  const user = dbGet('SELECT username, pin_hash FROM users WHERE username = ?', [safe]);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (!user.pin_hash) return res.status(400).json({ error: 'PIN не установлен' });
  if (user.pin_hash !== hashPin(pin)) return res.status(401).json({ error: 'Неверный PIN' });
  res.json({ ok: true, username: safe });
});

app.post('/api/register', (req, res) => {
  const { username, pin } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Псевдоним слишком короткий' });
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN должен быть 4 цифры' });
  }
  const safe = username.trim();
  try {
    dbRun('INSERT INTO users (username, pin_hash, created_at) VALUES (?, ?, ?)', [safe, hashPin(pin), new Date().toISOString()]);
    const userDir = path.join(PIC_DIR, safe);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    console.log(`New user registered: ${safe}`);
    res.json({ ok: true, username: safe });
  } catch (e) {
    res.status(409).json({ error: 'Этот псевдоним уже занят' });
  }
});

app.post('/api/reset-pin', (req, res) => {
  const { username, code, newPin } = req.body;
  if (code !== ACCESS_CODE) return res.status(401).json({ error: 'Неверный код доступа' });
  if (!username) return res.status(400).json({ error: 'Нужен псевдоним' });
  if (!newPin || !/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'PIN должен быть 4 цифры' });
  const safe = username.trim();
  const user = dbGet('SELECT username FROM users WHERE username = ?', [safe]);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  dbRun('UPDATE users SET pin_hash = ? WHERE username = ?', [hashPin(newPin), safe]);
  console.log(`PIN reset for: ${safe}`);
  res.json({ ok: true });
});

function verifyUser(username, pin) {
  if (!username || !pin) return false;
  const user = dbGet('SELECT pin_hash FROM users WHERE username = ?', [username.trim()]);
  if (!user || !user.pin_hash) return false;
  return user.pin_hash === hashPin(pin);
}

function extractBase64(imageData) {
  if (typeof imageData === 'string') {
    return imageData.replace(/^data:image\/\w+;base64,/, '');
  }
  if (typeof imageData === 'object') {
    const url = imageData?.image_url?.url || imageData?.url;
    if (url) return url.replace(/^data:image\/\w+;base64,/, '');
    if (imageData?.data) return imageData.data;
  }
  return null;
}

app.post('/api/generate-image', async (req, res) => {
  const { prompt, provider: providerId = 'routerai_flux', username, pin } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!verifyUser(username, pin)) return res.status(401).json({ error: 'Неверный PIN' });

  const safe = username.trim();

  const provider = PROVIDERS[providerId];
  if (!provider) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  console.log(`[${safe}][${provider.label}] Generating: "${prompt.substring(0, 60)}..."`);

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        ...(provider.modalities ? { modalities: provider.modalities } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(response.status).json(data);
    }

    let imageData = null;
    const assistantMsg = data?.choices?.[0]?.message;

    if (assistantMsg?.images && assistantMsg.images.length > 0) {
      imageData = assistantMsg.images[0];
    } else if (Array.isArray(assistantMsg?.content)) {
      for (const block of assistantMsg.content) {
        if (block.type === 'image_url' || block.type === 'image') {
          imageData = block;
          break;
        }
      }
    } else if (typeof assistantMsg?.content === 'string' && assistantMsg.content.startsWith('data:image')) {
      imageData = assistantMsg.content;
    }

    if (!imageData) {
      return res.status(500).json({ error: 'No image in API response', debug: data });
    }

    const base64Data = extractBase64(imageData);
    if (!base64Data) {
      return res.status(500).json({ error: 'Could not extract image data' });
    }

    const userDir = path.join(PIC_DIR, safe);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `image_${timestamp}.png`;
    const filepath = path.join(userDir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);

    dbRun(
      'INSERT INTO images (username, filename, prompt, provider, provider_name, model, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [safe, filename, prompt, providerId, provider.name, provider.model, buffer.length, new Date().toISOString()]
    );

    console.log(`Saved: pic/${safe}/${filename}`);

    res.json({
      ...data,
      savedImage: {
        filename,
        username: safe,
        url: `/pic/${safe}/${filename}`,
        fullUrl: `http://localhost:${PORT}/pic/${safe}/${filename}`,
        size: buffer.length
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/images', (req, res) => {
  const { username, pin } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  if (!verifyUser(username, pin)) return res.status(401).json({ error: 'Неверный PIN' });
  const safe = username.trim();

  try {
    const rows = dbAll('SELECT filename, username, prompt, size, created_at FROM images WHERE username = ? ORDER BY created_at DESC', [safe]);

    const images = rows.map(r => ({
      filename: r.filename,
      username: r.username,
      prompt: r.prompt,
      url: `/pic/${r.username}/${r.filename}`,
      fullUrl: `http://localhost:${PORT}/pic/${r.username}/${r.filename}`,
      size: r.size,
      created: r.created_at
    }));

    res.json({ images, total: images.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/prompts', (req, res) => {
  const { username, pin } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  if (!verifyUser(username, pin)) return res.status(401).json({ error: 'Неверный PIN' });
  const safe = username.trim();

  try {
    const rows = dbAll('SELECT * FROM images WHERE username = ? ORDER BY created_at DESC', [safe]);

    const prompts = rows.map(r => ({
      id: r.id,
      prompt: r.prompt,
      username: r.username,
      provider: r.provider,
      providerName: r.provider_name,
      filename: r.filename,
      size: r.size,
      createdAt: r.created_at
    }));

    res.json({ prompts, total: prompts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/images/:username/:filename', (req, res) => {
  const { username, filename } = req.params;
  const pin = req.body?.pin || req.query?.pin;
  if (!verifyUser(username, pin)) return res.status(401).json({ error: 'Неверный PIN' });
  const filepath = path.join(PIC_DIR, username, filename);
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      dbRun('DELETE FROM images WHERE username = ? AND filename = ?', [username, filename]);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`
============================================
  AI Image Generator Server
  http://localhost:${PORT}

  Database: ./app.db
  Images:   ./pic/<username>/
============================================
  `);
});
