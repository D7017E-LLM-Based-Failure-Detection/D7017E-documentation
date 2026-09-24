#!/usr/bin/env node

/**
 * Local Development Server for D7017E Documentation
 * 
 * Features:
 * - Pure Node.js (no third-party dependencies)
 * - Automatic live sync of README.md to activity-log.json on save and on request
 * - Serves repo root README.md directly to the browser
 * - Disables cache for instant live reload of unpushed edits
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseActivityLogs, mergeLogEntries, calculateLogStats } = require('../js/log-parser.js');

const WEBSITE_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(__dirname, '../..');
const README_PATH = process.env.README_PATH || path.join(ROOT_DIR, 'README.md');
const CONTRIBUTING_PATH = process.env.CONTRIBUTING_PATH || path.join(ROOT_DIR, 'CONTRIBUTING.md');
const DATA_DIR = path.join(WEBSITE_DIR, 'data');
const JSON_PATH = path.join(DATA_DIR, 'activity-log.json');
const PORT = process.env.PORT || 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function syncActivityLogs() {
  let entries = [];
  let sourceFiles = [];

  if (fs.existsSync(README_PATH)) {
    const readmeContent = fs.readFileSync(README_PATH, 'utf8');
    const readmeEntries = parseActivityLogs(readmeContent);
    entries = mergeLogEntries(entries, readmeEntries);
    sourceFiles.push('README.md');
  }

  if (fs.existsSync(CONTRIBUTING_PATH)) {
    const contribContent = fs.readFileSync(CONTRIBUTING_PATH, 'utf8');
    const contribEntries = parseActivityLogs(contribContent);
    if (contribEntries.length > 0) {
      entries = mergeLogEntries(entries, contribEntries);
      sourceFiles.push('CONTRIBUTING.md');
    }
  }

  const stats = calculateLogStats(entries);
  const payload = {
    syncedAt: new Date().toISOString(),
    sourceFiles: sourceFiles.length > 0 ? sourceFiles : ['README.md'],
    sourceFile: sourceFiles.join(' + ') || 'README.md',
    stats: {
      total: stats.total,
      byGroup: stats.byGroup,
      latestDate: stats.latestDate,
      earliestDate: stats.earliestDate,
      contributorCount: stats.contributorCount,
      contributors: stats.contributors
    },
    entries
  };

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  const jsPath = path.join(DATA_DIR, 'activity-log.js');
  fs.writeFileSync(jsPath, `window.ACTIVITY_LOG_DATA = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');
  if (fs.existsSync(README_PATH)) {
    try {
      fs.copyFileSync(README_PATH, path.join(DATA_DIR, 'README.md'));
    } catch (e) {}
  }
  return payload;
}

// Initial sync on startup
try {
  const initial = syncActivityLogs();
  console.log(`[Dev Server] Initial sync complete: ${initial.entries.length} log entries ready.`);
} catch (e) {
  console.warn('[Dev Server] Initial sync warning:', e.message);
}

// File watcher on README.md
if (fs.existsSync(README_PATH)) {
  const readmeWatcher = fs.watch(README_PATH, () => {
    try {
      const updated = syncActivityLogs();
      console.log(`[Dev Server] README.md changed -> Auto-synced ${updated.entries.length} entries.`);
    } catch (e) {
      console.error('[Dev Server] Auto-sync failed on README change:', e);
    }
  });
  if (readmeWatcher && typeof readmeWatcher.unref === 'function') {
    readmeWatcher.unref();
  }
}

const server = http.createServer((req, res) => {
  // Add CORS and disable caching for seamless local reload
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Serve root README.md directly
  if (pathname === '/README.md' || pathname === '/../README.md') {
    if (fs.existsSync(README_PATH)) {
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.md'] });
      fs.createReadStream(README_PATH).pipe(res);
      return;
    }
  }

  // Serve CONTRIBUTING.md directly
  if (pathname === '/CONTRIBUTING.md' || pathname === '/../CONTRIBUTING.md') {
    if (fs.existsSync(CONTRIBUTING_PATH)) {
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.md'] });
      fs.createReadStream(CONTRIBUTING_PATH).pipe(res);
      return;
    }
  }

  // Fresh sync on demand when activity-log.json or activity-log.js is requested
  if (pathname === '/data/activity-log.json') {
    try {
      const fresh = syncActivityLogs();
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify(fresh, null, 2));
      return;
    } catch (e) {
      // Fallback to static file read below
    }
  }

  if (pathname === '/data/activity-log.js') {
    try {
      const fresh = syncActivityLogs();
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.js'] });
      res.end(`window.ACTIVITY_LOG_DATA = ${JSON.stringify(fresh, null, 2)};\n`);
      return;
    } catch (e) {
      // Fallback to static file read below
    }
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(WEBSITE_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  D7017E Documentation Server`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`  Auto-sync enabled for: ${README_PATH}`);
    console.log(`======================================================\n`);
  });
}

module.exports = { server, syncActivityLogs };
