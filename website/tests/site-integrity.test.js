const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WEBSITE_DIR = path.resolve(__dirname, '..');

const REQUIRED_PAGES = [
  'index.html',
  'activity.html',
  'groups.html'
];

test('all required HTML pages exist and have substantial structure', () => {
  for (const page of REQUIRED_PAGES) {
    const pagePath = path.join(WEBSITE_DIR, page);
    assert.ok(fs.existsSync(pagePath), `Page ${page} must exist`);
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.length > 200, `Page ${page} must have substantial content`);
    assert.ok(content.includes('<!DOCTYPE html>'), `Page ${page} must have DOCTYPE`);
  }
});

test('architecture and experiments pages are removed', () => {
  assert.strictEqual(fs.existsSync(path.join(WEBSITE_DIR, 'architecture.html')), false, 'architecture.html must not exist');
  assert.strictEqual(fs.existsSync(path.join(WEBSITE_DIR, 'experiments.html')), false, 'experiments.html must not exist');
});

test('all required asset files and .nojekyll exist', () => {
  const assets = [
    '.nojekyll',
    'css/main.css',
    'css/activity.css',
    'js/main.js',
    'js/log-parser.js',
    'js/activity.js',
    'data/activity-log.json',
    'data/activity-log.js',
    'scripts/serve.js',
    'scripts/sync-activity-logs.js',
    'scripts/sync-activity-logs.py'
  ];

  for (const asset of assets) {
    const assetPath = path.join(WEBSITE_DIR, asset);
    assert.ok(fs.existsSync(assetPath), `Asset ${asset} must exist`);
  }
});

test('navigation links point to existing pages across all HTML files', () => {
  for (const page of REQUIRED_PAGES) {
    const content = fs.readFileSync(path.join(WEBSITE_DIR, page), 'utf8');
    for (const target of REQUIRED_PAGES) {
      assert.ok(
        content.includes(`./${target}`) || content.includes(target),
        `${page} should link to ${target}`
      );
    }
  }
});

test('activity-log.json is valid JSON with expected schema', () => {
  const dataPath = path.join(WEBSITE_DIR, 'data/activity-log.json');
  assert.ok(fs.existsSync(dataPath), 'activity-log.json must exist');
  const json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  assert.ok(json.syncedAt, 'Must have syncedAt timestamp');
  assert.ok(json.stats, 'Must have stats object');
  assert.strictEqual(typeof json.stats.total, 'number');
  assert.ok(Array.isArray(json.entries), 'Must have entries array');
  assert.ok(json.entries.length >= 1, 'Must have at least one entry');

  const first = json.entries[0];
  assert.ok(first.id, 'Entry must have id');
  assert.ok(first.date, 'Entry must have date');
  assert.ok(first.group, 'Entry must have group');
  assert.ok(first.summary, 'Entry must have summary');
  assert.ok(Array.isArray(first.links), 'Entry must have links array');
});

test('landing page contains explicit placeholders for title and description', () => {
  const indexContent = fs.readFileSync(path.join(WEBSITE_DIR, 'index.html'), 'utf8');
  assert.ok(indexContent.includes('hero-title'), 'index.html must have hero-title element');
  assert.ok(indexContent.includes('hero-description'), 'index.html must have hero-description element');
  assert.ok(indexContent.includes('data-placeholder="project-title"'), 'index.html must have data-placeholder for title');
  assert.ok(indexContent.includes('data-placeholder="project-description"'), 'index.html must have data-placeholder for description');
  assert.ok(indexContent.includes('D7017E'), 'index.html must contain project course title');
});

test('activity page contains mechanism for fetching and updating logs', () => {
  const activityHtml = fs.readFileSync(path.join(WEBSITE_DIR, 'activity.html'), 'utf8');
  assert.ok(activityHtml.includes('timeline-container'), 'activity.html must have timeline-container');
  assert.ok(activityHtml.includes('btn-refresh'), 'activity.html must have refresh button');
  assert.ok(activityHtml.includes('sync-banner'), 'activity.html must have sync status banner');
  assert.ok(activityHtml.includes('log-parser.js'), 'activity.html must include log-parser.js');
  assert.ok(activityHtml.includes('activity.js'), 'activity.html must include activity.js');
});

test('GitHub Actions workflow exists for automated deployment and covers README & CONTRIBUTING', () => {
  const workflowPath = path.resolve(WEBSITE_DIR, '../.github/workflows/deploy-pages.yml');
  assert.ok(fs.existsSync(workflowPath), 'GitHub Actions workflow must exist');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  assert.ok(workflowContent.includes('actions/deploy-pages'), 'Workflow must use deploy-pages');
  assert.ok(workflowContent.includes('actions/upload-pages-artifact'), 'Workflow must use upload-pages-artifact');
  assert.ok(workflowContent.includes('sync-activity-logs.js'), 'Workflow must execute sync script');
  assert.ok(workflowContent.includes('README.md'), 'Workflow must trigger on README.md');
  assert.ok(workflowContent.includes('CONTRIBUTING.md'), 'Workflow must trigger on CONTRIBUTING.md');
});

test('sync scripts in Node and Python produce valid and consistent output', () => {
  const nodeSyncOut = execSync('node scripts/sync-activity-logs.js', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  assert.ok(nodeSyncOut.includes('Successfully synced'));

  const pySyncOut = execSync('python3 scripts/sync-activity-logs.py', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  assert.ok(pySyncOut.includes('Synced'));

  const data = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'data/activity-log.json'), 'utf8'));
  assert.ok(data.stats.total >= 1, 'Must have at least 1 total entry');
  const initEntry = data.entries.find(e => e.date === '2026-09-21' && e.group === 'ALL');
  assert.ok(initEntry, 'Must contain setup entry');

  const jsDataPath = path.join(WEBSITE_DIR, 'data/activity-log.js');
  assert.ok(fs.existsSync(jsDataPath), 'activity-log.js must exist');
  const jsDataContent = fs.readFileSync(jsDataPath, 'utf8');
  assert.ok(jsDataContent.includes('window.ACTIVITY_LOG_DATA'), 'activity-log.js must set window.ACTIVITY_LOG_DATA');
});

test('removed architecture css classes do not linger in main.css', () => {
  const css = fs.readFileSync(path.join(WEBSITE_DIR, 'css/main.css'), 'utf8');
  assert.strictEqual(css.includes('.diagram-box'), false, 'main.css must not have diagram-box');
  assert.strictEqual(css.includes('.pipeline-flow'), false, 'main.css must not have pipeline-flow');
  assert.strictEqual(css.includes('.pipeline-node'), false, 'main.css must not have pipeline-node');
  assert.strictEqual(css.includes('.pipeline-arrow'), false, 'main.css must not have pipeline-arrow');
});

test('people page loads personal logs and is linked from every page', () => {
  const peopleHtml = fs.readFileSync(path.join(WEBSITE_DIR, 'people.html'), 'utf8');
  ['people-grid', 'timeline-container', 'btn-refresh', 'log-parser.js', 'people.js', 'people-log.js'].forEach(s => {
    assert.ok(peopleHtml.includes(s), `people.html must include ${s}`);
  });
  ['index.html', 'activity.html', 'groups.html'].forEach(page => {
    assert.ok(fs.readFileSync(path.join(WEBSITE_DIR, page), 'utf8').includes('href="./people.html"'), `${page} must link to people.html`);
  });

  execSync('node scripts/sync-activity-logs.js', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  const data = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'data/people-log.json'), 'utf8'));
  assert.ok(Array.isArray(data.people) && data.people.length > 0, 'people-log.json must list people');
  data.people.forEach(p => {
    assert.ok(p.name && p.slug && p.file, 'person must have name, slug and file');
    assert.ok(Array.isArray(p.entries), 'person must have entries array');
  });
});

test('Node and Python sync scripts compile identical people data', () => {
  const readPeople = () => JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'data/people-log.json'), 'utf8')).people;
  execSync('node scripts/sync-activity-logs.js', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  const fromNode = readPeople();
  execSync('python3 scripts/sync-activity-logs.py', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  const fromPython = readPeople();
  execSync('node scripts/sync-activity-logs.js', { cwd: WEBSITE_DIR, encoding: 'utf8' });
  assert.ok(fromNode.length > 0);
  assert.deepStrictEqual(fromPython, fromNode);
});
