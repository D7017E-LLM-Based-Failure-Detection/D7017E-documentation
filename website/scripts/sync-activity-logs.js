#!/usr/bin/env node

/**
 * Activity Log Sync Script
 * 
 * Extracts activity logs from README.md (and CONTRIBUTING.md) according to
 * course guidelines and compiles them into website/data/activity-log.json
 * for fast, reliable static serving.
 * 
 * Usage:
 *   node website/scripts/sync-activity-logs.js
 *   node website/scripts/sync-activity-logs.js --watch
 */

const fs = require('fs');
const path = require('path');
const { parseActivityLogs, mergeLogEntries, calculateLogStats, parsePeopleIndex, DEFAULT_REPO_BASE_URL } = require('../js/log-parser.js');

const ROOT_DIR = path.resolve(__dirname, '../..');
const README_PATH = process.env.README_PATH || path.join(ROOT_DIR, 'README.md');
const CONTRIBUTING_PATH = process.env.CONTRIBUTING_PATH || path.join(ROOT_DIR, 'CONTRIBUTING.md');
const OUTPUT_DIR = path.resolve(__dirname, '../data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'activity-log.json');
const PEOPLE_DIR = path.join(ROOT_DIR, 'people');
const PEOPLE_OUTPUT_PATH = path.join(OUTPUT_DIR, 'people-log.json');

/**
 * Compile people/README.md (who's who) + people/<slug>.md (personal logs)
 * into data/people-log.json and data/people-log.js.
 */
function syncPeopleLogs() {
  const indexPath = path.join(PEOPLE_DIR, 'README.md');
  const people = fs.existsSync(indexPath)
    ? parsePeopleIndex(fs.readFileSync(indexPath, 'utf8')).map(person => {
        const filePath = path.join(PEOPLE_DIR, person.file);
        const entries = fs.existsSync(filePath)
          ? parseActivityLogs(fs.readFileSync(filePath, 'utf8'), { repoBaseUrl: `${DEFAULT_REPO_BASE_URL}/people` })
          : [];
        return { ...person, entries };
      })
    : [];

  const payload = { syncedAt: new Date().toISOString(), people };
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(PEOPLE_OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'people-log.js'), `window.PEOPLE_LOG_DATA = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');
  const total = people.reduce((n, p) => n + p.entries.length, 0);
  console.log(`[sync-activity-logs] Synced ${people.length} people, ${total} personal entries into ${PEOPLE_OUTPUT_PATH}`);
  return payload;
}

function syncLogs() {
  console.log(`[sync-activity-logs] Reading activity logs...`);

  let entries = [];
  let sourceFiles = [];

  if (fs.existsSync(README_PATH)) {
    const readmeContent = fs.readFileSync(README_PATH, 'utf8');
    const readmeEntries = parseActivityLogs(readmeContent);
    entries = mergeLogEntries(entries, readmeEntries);
    sourceFiles.push('README.md');
    console.log(`[sync-activity-logs] Found ${readmeEntries.length} entries in ${README_PATH}`);
  } else {
    console.warn(`[sync-activity-logs] Notice: README.md not found at ${README_PATH}`);
  }

  if (fs.existsSync(CONTRIBUTING_PATH)) {
    const contributingContent = fs.readFileSync(CONTRIBUTING_PATH, 'utf8');
    const contributingEntries = parseActivityLogs(contributingContent);
    if (contributingEntries.length > 0) {
      entries = mergeLogEntries(entries, contributingEntries);
      sourceFiles.push('CONTRIBUTING.md');
      console.log(`[sync-activity-logs] Found ${contributingEntries.length} additional entries in ${CONTRIBUTING_PATH}`);
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

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  const jsPath = path.join(OUTPUT_DIR, 'activity-log.js');
  fs.writeFileSync(jsPath, `window.ACTIVITY_LOG_DATA = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');
  if (fs.existsSync(README_PATH)) {
    try {
      fs.copyFileSync(README_PATH, path.join(OUTPUT_DIR, 'README.md'));
    } catch (e) {}
  }
  console.log(`[sync-activity-logs] Successfully synced ${entries.length} log entries into ${OUTPUT_PATH}`);
  console.log(`[sync-activity-logs] Breakdown: ALL=${stats.byGroup.ALL}, G1=${stats.byGroup.G1}, G2=${stats.byGroup.G2}, G3=${stats.byGroup.G3}`);
  return payload;
}

if (require.main !== module) {
  module.exports = { syncLogs, syncPeopleLogs };
} else if (process.argv.includes('--watch')) {
  syncLogs();
  syncPeopleLogs();
  console.log(`[sync-activity-logs] Watching for changes to ${README_PATH}...`);
  if (fs.existsSync(README_PATH)) {
    fs.watch(README_PATH, (eventType) => {
      if (eventType === 'change') {
        console.log(`[sync-activity-logs] README.md changed, resyncing...`);
        syncLogs();
      }
    });
  }
  if (fs.existsSync(CONTRIBUTING_PATH)) {
    fs.watch(CONTRIBUTING_PATH, (eventType) => {
      if (eventType === 'change') {
        console.log(`[sync-activity-logs] CONTRIBUTING.md changed, resyncing...`);
        syncLogs();
      }
    });
  }
  if (fs.existsSync(PEOPLE_DIR)) {
    fs.watch(PEOPLE_DIR, () => {
      console.log(`[sync-activity-logs] people/ changed, resyncing...`);
      syncPeopleLogs();
    });
  }
} else {
  syncLogs();
  syncPeopleLogs();
}
