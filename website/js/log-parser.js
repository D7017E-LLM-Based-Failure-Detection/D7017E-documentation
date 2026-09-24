/**
 * Universal Activity Log Parser
 * Parses activity logs written according to CONTRIBUTING.md / README.md specifications.
 * Format: `YYYY-MM-DD — [G1|G2|G3|ALL] who — what happened. → link`
 * 
 * Works in both Node.js and Browser environments.
 */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.LogParser = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_REPO_BASE_URL = 'https://github.com/D7017E-LLM-Based-Failure-Detection/D7017E-documentation/blob/main';

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  /**
   * Format a YYYY-MM-DD string into a readable date (e.g. "Sep 21, 2026")
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const clean = dateStr.trim();
    const parts = clean.split(/[-/.]/);
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
      }
    }
    return dateStr;
  }

  /**
   * Extract the Activity Log section from markdown content.
   * Strips out HTML comments (like example entries).
   */
  function extractActivitySection(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') return '';

    // First strip HTML comments <!-- ... -->
    const cleanedText = markdownText.replace(/<!--[\s\S]*?-->/g, '');

    // Locate activity heading: ## Activity log, ## Activity, ## Recent Activity, ## Changelog, etc.
    const activityHeadingRegex = /(?:^|\n)#{1,3}\s+(?:Project\s+|Recent\s+)?(?:Activity(?:\s+logs?)?|Changelog|Work\s+Log)\b.*$/im;
    const match = activityHeadingRegex.exec(cleanedText);
    if (!match) {
      // If no explicit heading found, check if text has log lines (date pattern)
      const hasLogPattern = /(?:^|\n)\s*[-*+]?\s*\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(cleanedText);
      return hasLogPattern ? cleanedText : '';
    }

    const startIdx = match.index + match[0].length;
    const remaining = cleanedText.slice(startIdx);

    // Section ends at the next heading of same or higher level (## or #)
    const nextSectionRegex = /\n#{1,2}\s+[^\n]+/g;
    const nextMatch = nextSectionRegex.exec(remaining);
    return nextMatch ? remaining.slice(0, nextMatch.index) : remaining;
  }

  /**
   * Resolve a relative repo file path to a GitHub blob URL.
   */
  function resolveRepoUrl(href, repoBaseUrl = DEFAULT_REPO_BASE_URL) {
    if (!href) return '#';
    const trimmed = href.trim();
    if (/^(https?:|mailto:|#|\/\/)/i.test(trimmed)) {
      return trimmed;
    }
    const cleanPath = trimmed.replace(/^\.?\//, '');
    const cleanBase = (repoBaseUrl || DEFAULT_REPO_BASE_URL).replace(/\/+$/, '');
    return `${cleanBase}/${cleanPath}`;
  }

  /**
   * Extract markdown links and raw trailing URLs from text: [Title](url) or → URL
   */
  function extractMarkdownLinks(text, repoBaseUrl = DEFAULT_REPO_BASE_URL) {
    if (!text || typeof text !== 'string') return [];
    const links = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      links.push({
        text: match[1].trim(),
        url: match[2].trim(),
        githubUrl: resolveRepoUrl(match[2].trim(), repoBaseUrl)
      });
    }

    // Trailing raw URL e.g. "→ https://github.com/..."
    const rawUrlRegex = /(?:→|->|=>|&rarr;)\s*(https?:\/\/[^\s]+)$/;
    const rawUrlMatch = rawUrlRegex.exec(text);
    if (rawUrlMatch) {
      const rawUrl = rawUrlMatch[1].trim();
      if (!links.some(l => l.url === rawUrl)) {
        links.push({
          text: rawUrl.split('/').pop() || 'Link',
          url: rawUrl,
          githubUrl: rawUrl
        });
      }
    }

    // Trailing markdown doc path e.g. "→ experiments/foo.md"
    const rawPathRegex = /(?:→|->|=>|&rarr;)\s*([a-zA-Z0-9_\-\.\/]+\.md\b)$/;
    const rawPathMatch = rawPathRegex.exec(text);
    if (rawPathMatch) {
      const rawPath = rawPathMatch[1].trim();
      if (!links.some(l => l.url === rawPath)) {
        links.push({
          text: rawPath,
          url: rawPath,
          githubUrl: resolveRepoUrl(rawPath, repoBaseUrl)
        });
      }
    }

    return links;
  }

  /**
   * Parse a single activity log line.
   * Format: `YYYY-MM-DD — [G1|G2|G3|ALL] who — what happened. → link`
   */
  function parseLogLine(rawLine, repoBaseUrl = DEFAULT_REPO_BASE_URL, index = 0) {
    if (!rawLine || typeof rawLine !== 'string') return null;

    let line = rawLine.trim();
    if (!line) return null;

    // Remove leading list markers (- or * or + or 1.)
    line = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim();
    if (!line) return null;

    // Remove leading bold/italic stars if present around the date: **2026-09-21**
    line = line.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '').trim();

    // Match date pattern YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (allowing 1 or 2 digit month/day)
    const dateMatch = /^(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/.exec(line);
    if (!dateMatch) return null;

    const y = dateMatch[1];
    const m = String(dateMatch[2]).padStart(2, '0');
    const d = String(dateMatch[3]).padStart(2, '0');
    const date = `${y}-${m}-${d}`;

    let remainder = line.slice(dateMatch[0].length).trim();
    // Strip trailing bold stars from date, dashes, colons, or whitespace
    remainder = remainder.replace(/^[\*\s—–:-]+/, '').trim();

    // Next part contains group and optional author, followed by separator and summary
    // Examples:
    // "ALL — Documentation repo set up. → [CONTRIBUTING.md](CONTRIBUTING.md)"
    // "[G1] — Conveyor belt powered up."
    // "[G3] (Bob, Charlie) — MQTT broker configured."
    // "G2 (Alice) — Read survey, 4 bibtex entries added."
    // "Group 1 — Sensor baseline."
    // "ALL Alice: Architecture agreed."

    let groupPart = '';
    let contentPart = '';

    // Split on separator: space dash space, colon with space, or em-dash
    const sepMatch = /[\s]+[—–-]+[\s]+|[\s]*:[ \t]+/.exec(remainder);
    if (sepMatch) {
      groupPart = remainder.slice(0, sepMatch.index).trim();
      contentPart = remainder.slice(sepMatch.index + sepMatch[0].length).trim();
    } else {
      const altMatch = /[—–]/.exec(remainder);
      if (altMatch) {
        groupPart = remainder.slice(0, altMatch.index).trim();
        contentPart = remainder.slice(altMatch.index + altMatch[0].length).trim();
      } else {
        // Fallback: look for known group token at start e.g. "[G1]" or "G1"
        const knownTokenMatch = /^(\[?\s*(?:ALL|G1|G2|G3|GROUP[\s_\-]*[123]|GENERAL|TEAM)\]?)/i.exec(remainder);
        if (knownTokenMatch) {
          groupPart = knownTokenMatch[1];
          contentPart = remainder.slice(knownTokenMatch[0].length).replace(/^[\s—–:-]+/, '').trim();
        } else {
          groupPart = 'ALL';
          contentPart = remainder;
        }
      }
    }

    // Determine normalized group: G1, G2, G3, ALL, or OTHER
    let group = 'ALL';
    if (/\[?\s*(?:G1|GROUP[\s_\-]*1)\b/i.test(groupPart)) {
      group = 'G1';
    } else if (/\[?\s*(?:G2|GROUP[\s_\-]*2)\b/i.test(groupPart)) {
      group = 'G2';
    } else if (/\[?\s*(?:G3|GROUP[\s_\-]*3)\b/i.test(groupPart)) {
      group = 'G3';
    } else if (/\[?\s*(?:ALL|GENERAL|TEAM)\b/i.test(groupPart)) {
      group = 'ALL';
    } else {
      const cleanGroup = groupPart.replace(/[\[\]()]/g, '').trim().split(/\s+/)[0];
      group = (cleanGroup || 'ALL').toUpperCase();
    }

    // Extract author
    let author = null;
    const parenMatch = /\(([^)]+)\)/.exec(groupPart);
    if (parenMatch) {
      author = parenMatch[1].trim();
    } else {
      // Check for author text following the group token in groupPart e.g. "[G1] Alice" or "ALL Alice"
      const afterToken = groupPart
        .replace(/^\[?\s*(?:G1|G2|G3|GROUP[\s_\-]*[123]|ALL|GENERAL|TEAM)\]?/i, '')
        .replace(/^[—–:,\s-]+/, '')
        .replace(/[\[\]]/g, '')
        .trim();
      if (afterToken) {
        author = afterToken;
      }
    }

    // Filter out template placeholder strings for author
    if (author && /^(who|name|names|author)$/i.test(author.trim())) {
      author = null;
    }

    // Extract links
    const links = extractMarkdownLinks(contentPart, repoBaseUrl);

    // Clean summary by removing trailing arrows and links
    let cleanSummary = contentPart
      .replace(/(?:→|->|=>|&rarr;)\s*(?:(?:\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|[a-zA-Z0-9_\-\.\/]+\.md\b)(?:\s*[,;&and]+\s*)?)+$/g, '')
      .replace(/(?:→|->|=>|&rarr;)\s*$/g, '')
      .replace(/^[:\s—–-]+/, '')
      .replace(/[:\s—–-]+$/, '')
      .trim();

    if (!cleanSummary && contentPart) {
      cleanSummary = contentPart.trim();
    }

    const id = `log-${date}-${group.toLowerCase()}-${index + 1}`;

    return {
      id,
      date,
      displayDate: formatDisplayDate(date),
      group,
      author,
      summary: cleanSummary,
      rawContent: contentPart,
      links,
      raw: rawLine.trim()
    };
  }

  /**
   * Parse full markdown activity log text into an array of structured log objects.
   * Handles multi-line entries and sorts newest first.
   */
  function parseActivityLogs(markdownText, options = {}) {
    const repoBaseUrl = options.repoBaseUrl || DEFAULT_REPO_BASE_URL;
    const includeComments = options.includeComments || false;

    let textToParse = markdownText || '';
    if (!includeComments) {
      textToParse = extractActivitySection(textToParse);
    }

    const lines = textToParse.split(/\r?\n/);
    const entries = [];
    let currentEntry = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip lines that look like markdown headings or format instruction notes
      if (/^#+\s+/.test(line)) continue;
      if (/^format:\s*/i.test(line)) continue;
      if (/^newest first/i.test(line)) continue;
      if (/^<!--/i.test(line)) continue;

      // Skip empty bullet markers (e.g. "-", "- ", "1. ")
      if (!line.replace(/^(?:[-*+]|\d+\.)\s*/, '').trim()) continue;

      // Check if this line starts a new log entry
      const parsed = parseLogLine(line, repoBaseUrl, entries.length);
      if (parsed) {
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = parsed;
      } else if (currentEntry) {
        // Continuation line for the current entry (1-3 lines per session as per spec)
        const additionalLinks = extractMarkdownLinks(line, repoBaseUrl);
        if (additionalLinks.length > 0) {
          currentEntry.links.push(...additionalLinks);
        }
        const cleanedSubLine = line
          .replace(/^[-*+]\s*/, '')
          .replace(/(?:→|->|=>|&rarr;)\s*\[[^\]]+\]\([^)]+\)\s*$/g, '')
          .trim();
        if (cleanedSubLine) {
          currentEntry.summary += ' ' + cleanedSubLine;
        }
      }
    }

    if (currentEntry) {
      entries.push(currentEntry);
    }

    // Sort newest first by date
    entries.sort((a, b) => (b.date > a.date ? 1 : (b.date < a.date ? -1 : 0)));

    // Ensure strictly unique sequential IDs across all entries
    entries.forEach((entry, idx) => {
      entry.id = `log-${entry.date}-${entry.group.toLowerCase()}-${idx + 1}`;
    });

    return entries;
  }

  /**
   * Merge and deduplicate two arrays of log entries (e.g. from README.md and CONTRIBUTING.md)
   */
  function mergeLogEntries(entriesA = [], entriesB = []) {
    const seen = new Set();
    const merged = [];

    const all = [...(entriesA || []), ...(entriesB || [])];
    all.forEach(entry => {
      if (!entry || !entry.date) return;
      const key = `${entry.date}|${entry.group}|${(entry.summary || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(entry);
      }
    });

    merged.sort((a, b) => (b.date > a.date ? 1 : (b.date < a.date ? -1 : 0)));

    // Re-assign unique IDs
    merged.forEach((entry, idx) => {
      entry.id = `log-${entry.date}-${entry.group.toLowerCase()}-${idx + 1}`;
    });

    return merged;
  }

  /**
   * Convert an array of log entries to an activity summary stats object.
   */
  function calculateLogStats(entries = []) {
    const stats = {
      total: entries.length,
      byGroup: {
        ALL: 0,
        G1: 0,
        G2: 0,
        G3: 0,
        OTHER: 0
      },
      latestDate: null,
      earliestDate: null,
      contributors: new Set()
    };

    entries.forEach(entry => {
      const groupKey = ['ALL', 'G1', 'G2', 'G3'].includes(entry.group) ? entry.group : 'OTHER';
      stats.byGroup[groupKey] = (stats.byGroup[groupKey] || 0) + 1;

      if (!stats.latestDate || entry.date > stats.latestDate) {
        stats.latestDate = entry.date;
      }
      if (!stats.earliestDate || entry.date < stats.earliestDate) {
        stats.earliestDate = entry.date;
      }
      if (entry.author) {
        entry.author.split(/[,/&]+/).map(s => s.trim()).filter(Boolean).forEach(a => stats.contributors.add(a));
      }
    });

    return {
      ...stats,
      contributorCount: stats.contributors.size,
      contributors: Array.from(stats.contributors)
    };
  }

  return {
    formatDisplayDate,
    extractActivitySection,
    extractMarkdownLinks,
    resolveRepoUrl,
    parseLogLine,
    parseActivityLogs,
    mergeLogEntries,
    calculateLogStats,
    DEFAULT_REPO_BASE_URL
  };
});
