const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  formatDisplayDate,
  extractActivitySection,
  extractMarkdownLinks,
  resolveRepoUrl,
  parseLogLine,
  parseActivityLogs,
  mergeLogEntries,
  calculateLogStats
} = require('../js/log-parser.js');

test('formatDisplayDate formats valid dates correctly', () => {
  assert.strictEqual(formatDisplayDate('2026-09-21'), 'Sep 21, 2026');
  assert.strictEqual(formatDisplayDate('2026-01-05'), 'Jan 5, 2026');
  assert.strictEqual(formatDisplayDate('2026-12-31'), 'Dec 31, 2026');
  assert.strictEqual(formatDisplayDate('2026-9-5'), 'Sep 5, 2026');
  assert.strictEqual(formatDisplayDate('2026/09/21'), 'Sep 21, 2026');
  assert.strictEqual(formatDisplayDate('invalid'), 'invalid');
  assert.strictEqual(formatDisplayDate(''), '');
});

test('resolveRepoUrl generates proper GitHub URLs', () => {
  const base = 'https://github.com/D7017E-LLM-Based-Failure-Detection/D7017E-documentation/blob/main';
  assert.strictEqual(
    resolveRepoUrl('CONTRIBUTING.md', base),
    'https://github.com/D7017E-LLM-Based-Failure-Detection/D7017E-documentation/blob/main/CONTRIBUTING.md'
  );
  assert.strictEqual(
    resolveRepoUrl('https://example.com/doc', base),
    'https://example.com/doc'
  );
  assert.strictEqual(
    resolveRepoUrl('./groups/g1/README.md', base),
    'https://github.com/D7017E-LLM-Based-Failure-Detection/D7017E-documentation/blob/main/groups/g1/README.md'
  );
});

test('extractMarkdownLinks captures markdown links, trailing URLs and doc paths', () => {
  const text1 = 'Check out [CONTRIBUTING](CONTRIBUTING.md) and [bibtex](references/references.bib)';
  const links1 = extractMarkdownLinks(text1);
  assert.strictEqual(links1.length, 2);
  assert.strictEqual(links1[0].text, 'CONTRIBUTING');
  assert.strictEqual(links1[0].url, 'CONTRIBUTING.md');
  assert.strictEqual(links1[1].text, 'bibtex');
  assert.strictEqual(links1[1].url, 'references/references.bib');

  const text2 = 'Sensor telemetry verified. → https://github.com/org/repo/issues/42';
  const links2 = extractMarkdownLinks(text2);
  assert.strictEqual(links2.length, 1);
  assert.strictEqual(links2[0].url, 'https://github.com/org/repo/issues/42');

  const text3 = 'Measurement run completed. → experiments/2026-10-02-belt-vibration.md';
  const links3 = extractMarkdownLinks(text3);
  assert.strictEqual(links3.length, 1);
  assert.strictEqual(links3[0].url, 'experiments/2026-10-02-belt-vibration.md');
});

test('parseLogLine handles standard format without author', () => {
  const line = '- 2026-09-21 — ALL — Documentation repo set up. → [CONTRIBUTING.md](CONTRIBUTING.md)';
  const parsed = parseLogLine(line);
  assert.ok(parsed);
  assert.strictEqual(parsed.date, '2026-09-21');
  assert.strictEqual(parsed.displayDate, 'Sep 21, 2026');
  assert.strictEqual(parsed.group, 'ALL');
  assert.strictEqual(parsed.author, null);
  assert.strictEqual(parsed.summary, 'Documentation repo set up.');
  assert.strictEqual(parsed.links.length, 1);
  assert.strictEqual(parsed.links[0].text, 'CONTRIBUTING.md');
});

test('parseLogLine handles bracketed groups like [G1] and [G3] (Bob)', () => {
  const line1 = '- 2026-09-25 — [G1] — Conveyor belt powered up.';
  const parsed1 = parseLogLine(line1);
  assert.ok(parsed1);
  assert.strictEqual(parsed1.group, 'G1');
  assert.strictEqual(parsed1.author, null);
  assert.strictEqual(parsed1.summary, 'Conveyor belt powered up.');

  const line2 = '- 2026-09-26 — [G3] (Bob, Charlie) — MQTT broker deployed. → [groups/g3](groups/g3/README.md)';
  const parsed2 = parseLogLine(line2);
  assert.ok(parsed2);
  assert.strictEqual(parsed2.group, 'G3');
  assert.strictEqual(parsed2.author, 'Bob, Charlie');
  assert.strictEqual(parsed2.summary, 'MQTT broker deployed.');

  const line3 = '- 2026-09-27 — [ALL] — Milestone review meeting.';
  const parsed3 = parseLogLine(line3);
  assert.ok(parsed3);
  assert.strictEqual(parsed3.group, 'ALL');
  assert.strictEqual(parsed3.author, null);
});

test('parseLogLine handles group names like Group 1, Group-2, and General', () => {
  const line1 = '- 2026-09-25 — Group 1 — Belt motor test.';
  const parsed1 = parseLogLine(line1);
  assert.ok(parsed1);
  assert.strictEqual(parsed1.group, 'G1');

  const line2 = '- 2026-09-26 — Group-2 (Alice) — Ontologies loaded.';
  const parsed2 = parseLogLine(line2);
  assert.ok(parsed2);
  assert.strictEqual(parsed2.group, 'G2');
  assert.strictEqual(parsed2.author, 'Alice');

  const line3 = '- 2026-09-27 — General — Team sync.';
  const parsed3 = parseLogLine(line3);
  assert.ok(parsed3);
  assert.strictEqual(parsed3.group, 'ALL');
});

test('parseLogLine handles single-digit dates, dots, slashes, and bold dates', () => {
  const line1 = '- 2026-9-5 — G1 — Baseline readings.';
  const parsed1 = parseLogLine(line1);
  assert.ok(parsed1);
  assert.strictEqual(parsed1.date, '2026-09-05');

  const line2 = '- 2026/09/21 — ALL — Repo created.';
  const parsed2 = parseLogLine(line2);
  assert.ok(parsed2);
  assert.strictEqual(parsed2.date, '2026-09-21');

  const line3 = '- **2026-09-28** - ALL (Alice) — Telemetry format decided.';
  const parsed3 = parseLogLine(line3);
  assert.ok(parsed3);
  assert.strictEqual(parsed3.date, '2026-09-28');
  assert.strictEqual(parsed3.group, 'ALL');
  assert.strictEqual(parsed3.author, 'Alice');
});

test('parseLogLine handles colon separator after group', () => {
  const line = '- 2026-09-21 - ALL: Documentation repo set up.';
  const parsed = parseLogLine(line);
  assert.ok(parsed);
  assert.strictEqual(parsed.group, 'ALL');
  assert.strictEqual(parsed.summary, 'Documentation repo set up.');
});

test('parseLogLine handles multiple trailing links and cleans summary', () => {
  const line = '- 2026-09-26 — ALL — Architecture decided. → [ADR-001](docs/adr-1.md), [ADR-002](docs/adr-2.md)';
  const parsed = parseLogLine(line);
  assert.ok(parsed);
  assert.strictEqual(parsed.summary, 'Architecture decided.');
  assert.strictEqual(parsed.links.length, 2);
  assert.strictEqual(parsed.links[0].text, 'ADR-001');
  assert.strictEqual(parsed.links[1].text, 'ADR-002');
});

test('parseLogLine filters out placeholder author names', () => {
  const line1 = '- 2026-09-24 — G2 (name) — Survey reading. → [references.bib](references.bib)';
  const parsed1 = parseLogLine(line1);
  assert.ok(parsed1);
  assert.strictEqual(parsed1.author, null);

  const line2 = '- 2026-09-25 — G1 who — Calibration session.';
  const parsed2 = parseLogLine(line2);
  assert.ok(parsed2);
  assert.strictEqual(parsed2.author, null);
});

test('extractActivitySection handles heading variations', () => {
  const text1 = `
# Title
## Activity
- 2026-09-21 — ALL — Test 1
`;
  assert.ok(extractActivitySection(text1).includes('Test 1'));

  const text2 = `
# Title
## Recent Activity
- 2026-09-22 — G1 — Test 2
`;
  assert.ok(extractActivitySection(text2).includes('Test 2'));

  const text3 = `
# Title
## Changelog
- 2026-09-23 — G2 — Test 3
`;
  assert.ok(extractActivitySection(text3).includes('Test 3'));
});

test('mergeLogEntries deduplicates and sorts correctly', () => {
  const entriesA = [
    { date: '2026-09-21', group: 'ALL', summary: 'Documentation repo set up.', raw: 'line1' },
    { date: '2026-09-25', group: 'G1', summary: 'Conveyor powered up.', raw: 'line2' }
  ];
  const entriesB = [
    { date: '2026-09-25', group: 'G1', summary: 'Conveyor powered up.', raw: 'line2 duplicate' },
    { date: '2026-09-26', group: 'G3', summary: 'MQTT broker deployed.', raw: 'line3' }
  ];

  const merged = mergeLogEntries(entriesA, entriesB);
  assert.strictEqual(merged.length, 3);
  assert.strictEqual(merged[0].date, '2026-09-26');
  assert.strictEqual(merged[1].date, '2026-09-25');
  assert.strictEqual(merged[2].date, '2026-09-21');
});

test('parseActivityLogs parses existing repository README.md', () => {
  const readmePath = path.resolve(__dirname, '../../README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  const entries = parseActivityLogs(readmeContent);
  assert.ok(entries.length >= 1, 'Should find entries in repository README.md');
  const initEntry = entries.find(e => e.date === '2026-09-21' && e.group === 'ALL');
  assert.ok(initEntry, 'Should contain setup entry');
  assert.strictEqual(initEntry.links.length, 1);
  assert.strictEqual(initEntry.links[0].text, 'CONTRIBUTING.md');
});

test('parseActivityLogs ignores empty bullet lines and does not corrupt summary', () => {
  const sample = `
## Activity log
- 2026-09-24 — ALL — Work completed.
- 
- 2026-09-21 — ALL — Setup.
`;
  const entries = parseActivityLogs(sample);
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].summary, 'Work completed.');
  assert.strictEqual(entries[1].summary, 'Setup.');
});

test('calculateLogStats computes correct metrics', () => {
  const sampleEntries = [
    { date: '2026-09-25', group: 'G1', author: 'Alice, Bob' },
    { date: '2026-09-24', group: 'G2', author: 'Charlie' },
    { date: '2026-09-21', group: 'ALL', author: null }
  ];

  const stats = calculateLogStats(sampleEntries);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.byGroup.G1, 1);
  assert.strictEqual(stats.byGroup.G2, 1);
  assert.strictEqual(stats.byGroup.ALL, 1);
  assert.strictEqual(stats.latestDate, '2026-09-25');
  assert.strictEqual(stats.earliestDate, '2026-09-21');
  assert.strictEqual(stats.contributorCount, 3);
});

test('parseActivityLogs assigns strictly unique sequential IDs when entries share the same date and group', () => {
  const sample = `
## Activity log
- 2026-09-24 — ALL — First meeting of the day.
- 2026-09-24 — ALL — Second meeting of the day.
- 2026-09-24 — ALL — Third sync session.
`;
  const entries = parseActivityLogs(sample);
  assert.strictEqual(entries.length, 3);
  const ids = entries.map(e => e.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 3, 'All entry IDs must be strictly unique');
  assert.strictEqual(ids[0], 'log-2026-09-24-all-1');
  assert.strictEqual(ids[1], 'log-2026-09-24-all-2');
  assert.strictEqual(ids[2], 'log-2026-09-24-all-3');
});

test('parseActivityLogs ignores numbered empty bullets without corrupting previous summary', () => {
  const sample = `
## Activity log
- 2026-09-24 — ALL — Core delivery accomplished.
1. 
2. 
- 2026-09-21 — ALL — Initial baseline.
`;
  const entries = parseActivityLogs(sample);
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].summary, 'Core delivery accomplished.');
  assert.strictEqual(entries[1].summary, 'Initial baseline.');
});
