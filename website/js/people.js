/**
 * Personal Activity Logs Controller
 * Renders people/<slug>.md logs, one person at a time or everyone combined,
 * and resolves each entry's ⇡ link to the group log entry it belongs to.
 */

(function () {
  'use strict';

  // State
  let people = [];              // [{ name, slug, github, groupLabel, group, file, entries }]
  let groupEntries = new Map(); // anchor -> group log entry
  let selectedSlug = '';        // '' = everyone
  let searchQuery = '';

  function getRepoDetails() {
    let owner = 'D7017E-LLM-Based-Failure-Detection';
    let repo = 'D7017E-documentation';
    const branch = 'main';

    if (window.location.hostname.endsWith('.github.io')) {
      owner = window.location.hostname.replace('.github.io', '');
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        repo = pathParts[0];
      }
    }

    return {
      owner,
      repo,
      rawBaseUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`,
      repoBaseUrl: `https://github.com/${owner}/${repo}/blob/${branch}`
    };
  }

  function isLocalhost() {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]' || !host.endsWith('.github.io');
  }

  // DOM Elements
  const peopleGrid = document.getElementById('people-grid');
  const timelineContainer = document.getElementById('timeline-container');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDescription = document.getElementById('empty-description');
  const searchInput = document.getElementById('search-input');
  const heading = document.getElementById('people-heading');
  const totalCountEl = document.getElementById('total-count');
  const sourceLink = document.getElementById('source-link');
  const syncStatusDot = document.getElementById('sync-dot');
  const syncTitle = document.getElementById('sync-title');
  const syncSubtitle = document.getElementById('sync-subtitle');
  const btnRefresh = document.getElementById('btn-refresh');

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Inline markdown (bold, italics, code, links). Relative links resolve
   * against people/, where the personal log files live.
   */
  function formatInlineMarkdown(text) {
    if (!text) return '';
    const peopleBaseUrl = `${getRepoDetails().repoBaseUrl}/people`;
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const resolved = window.LogParser.resolveRepoUrl(url, peopleBaseUrl);
      return `<a href="${escapeHtml(resolved)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });
    return formatted;
  }

  function truncate(text, max) {
    return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
  }

  function groupBadge(group, label) {
    return `<span class="badge badge-${escapeHtml((group || 'all').toLowerCase())}">${escapeHtml(label || group)}</span>`;
  }

  function shortGroupLabel(person) {
    return /^G[123]$/.test(person.groupLabel) ? person.groupLabel : (person.groupLabel.split(/[\s(]/)[0] || person.group);
  }

  function setGroupEntries(entries) {
    groupEntries = new Map((entries || []).filter(e => e.anchor).map(e => [e.anchor, e]));
  }

  function updateStatusBanner(status, title, subtitle) {
    if (syncStatusDot) syncStatusDot.className = `sync-dot ${status === 'ok' ? '' : status}`;
    if (syncTitle) syncTitle.textContent = title;
    if (syncSubtitle) syncSubtitle.textContent = subtitle;
  }

  /**
   * Render the person picker
   */
  function renderPeopleGrid() {
    if (!peopleGrid) return;
    const total = people.reduce((n, p) => n + p.entries.length, 0);

    const everyoneCard = `
      <button class="person-card ${selectedSlug === '' ? 'active' : ''}" data-slug="" role="listitem">
        <span class="person-avatar person-avatar-all">∗</span>
        <span class="person-info">
          <span class="person-name">Everyone</span>
          <span class="person-meta">${people.length} people · ${total} ${total === 1 ? 'entry' : 'entries'}</span>
        </span>
      </button>`;

    const cards = people.map(person => {
      const latest = person.entries.length ? person.entries[0].date : null;
      const initials = person.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      return `
        <button class="person-card ${selectedSlug === person.slug ? 'active' : ''}" data-slug="${escapeHtml(person.slug)}" role="listitem">
          <span class="person-avatar group-${escapeHtml(person.group.toLowerCase())}">${escapeHtml(initials)}</span>
          <span class="person-info">
            <span class="person-name">${escapeHtml(person.name)}</span>
            <span class="person-meta">
              ${groupBadge(person.group, shortGroupLabel(person))}
              <span>${person.entries.length ? `${person.entries.length} ${person.entries.length === 1 ? 'entry' : 'entries'} · ${escapeHtml(latest.slice(5))}` : 'no entries'}</span>
            </span>
          </span>
        </button>`;
    }).join('');

    peopleGrid.innerHTML = everyoneCard + cards;
  }

  function renderGroupRef(ref) {
    if (!ref) return '';
    const target = groupEntries.get(ref.id);
    if (!target) {
      return `<span class="group-ref-chip missing" title="No group log entry has the anchor '${escapeHtml(ref.id)}'">⇡ ${escapeHtml(ref.id)} (not in group log)</span>`;
    }
    return `
      <a class="group-ref-chip" href="./activity.html#${encodeURIComponent(ref.id)}" title="${escapeHtml(target.summary)}">
        <span class="group-ref-label">⇡ Part of</span>
        ${groupBadge(target.group)}
        <span>${escapeHtml(target.date)} · ${escapeHtml(truncate(target.summary || '', 80))}</span>
      </a>`;
  }

  /**
   * Render the selected person's (or everyone's) entries
   */
  function renderTimeline() {
    if (!timelineContainer) return;
    const person = people.find(p => p.slug === selectedSlug) || null;
    const showPerson = !person;

    if (heading) heading.textContent = person ? person.name : 'Everyone';
    if (sourceLink) {
      const repo = getRepoDetails();
      sourceLink.href = person
        ? `${repo.repoBaseUrl}/people/${person.file}`
        : `https://github.com/${repo.owner}/${repo.repo}/tree/main/people`;
    }

    const query = searchQuery.toLowerCase();
    const items = (person ? [person] : people)
      .flatMap(p => p.entries.map(entry => ({ person: p, entry })))
      .filter(({ person: p, entry }) => {
        if (!query) return true;
        const ref = entry.groupRef ? groupEntries.get(entry.groupRef.id) : null;
        return [entry.summary, entry.date, entry.group, p.name, p.github, ref && ref.summary]
          .concat((entry.links || []).map(l => l.text))
          .some(v => (v || '').toLowerCase().includes(query));
      })
      .sort((a, b) => (b.entry.date > a.entry.date ? 1 : (b.entry.date < a.entry.date ? -1 : 0)));

    if (totalCountEl) {
      totalCountEl.textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
    }

    if (items.length === 0) {
      timelineContainer.innerHTML = '';
      if (emptyTitle) emptyTitle.textContent = query ? 'No matching entries' : 'No entries yet';
      if (emptyDescription) {
        emptyDescription.textContent = query
          ? 'Try a different search.'
          : person ? `${person.name} hasn't logged anything yet (people/${person.file}).` : 'Nobody has logged anything yet.';
      }
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    timelineContainer.innerHTML = items.map(({ person: p, entry }) => {
      const groupLower = (entry.group || 'all').toLowerCase();
      const personHtml = showPerson
        ? `<a class="author-pill person-link" href="#${escapeHtml(p.slug)}" title="Show ${escapeHtml(p.name)}'s log">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             ${escapeHtml(p.name)}
           </a>`
        : '';

      const peopleBaseUrl = `${getRepoDetails().repoBaseUrl}/people`;
      const linkChips = (entry.links || []).map(link => `
        <a href="${escapeHtml(window.LogParser.resolveRepoUrl(link.url, peopleBaseUrl))}" target="_blank" rel="noopener noreferrer" class="doc-link-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          ${escapeHtml(link.text)}
        </a>`).join('');
      const refChip = renderGroupRef(entry.groupRef);
      const footer = (linkChips || refChip) ? `<div class="timeline-links">${refChip}${linkChips}</div>` : '';

      return `
        <div class="timeline-item">
          <div class="timeline-marker group-${escapeHtml(groupLower)}"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <div class="entry-tags">
                ${groupBadge(entry.group)}
                ${personHtml}
              </div>
              <span class="date-pill">${escapeHtml(entry.displayDate || entry.date)}</span>
            </div>
            <div class="timeline-summary">${formatInlineMarkdown(entry.summary)}</div>
            ${footer}
          </div>
        </div>`;
    }).join('');
  }

  function render() {
    renderPeopleGrid();
    renderTimeline();
  }

  function selectFromHash() {
    const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    selectedSlug = people.some(p => p.slug === slug) ? slug : '';
  }

  /**
   * Initial render from the data compiled at build time (data/people-log.js)
   */
  function loadPreloaded() {
    if (window.ACTIVITY_LOG_DATA) setGroupEntries(window.ACTIVITY_LOG_DATA.entries);
    if (window.PEOPLE_LOG_DATA && Array.isArray(window.PEOPLE_LOG_DATA.people)) {
      people = window.PEOPLE_LOG_DATA.people;
      const synced = window.PEOPLE_LOG_DATA.syncedAt ? new Date(window.PEOPLE_LOG_DATA.syncedAt).toLocaleString() : 'unknown';
      updateStatusBanner('ok', `${people.length} people`, `Source: compiled repository data · Built ${synced}`);
    }
    selectFromHash();
    render();
  }

  async function fetchText(url) {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  }

  /**
   * Fetch people/README.md, every personal log, and the group log directly —
   * from the dev server when local, from raw.githubusercontent.com otherwise.
   */
  async function fetchLive(isManual = false) {
    if (isManual) {
      updateStatusBanner('syncing', 'Checking repository...', 'Fetching people/ and README.md');
      if (btnRefresh) btnRefresh.disabled = true;
    }

    const repo = getRepoDetails();
    const local = isLocalhost();
    const base = local ? '' : repo.rawBaseUrl;
    const parser = window.LogParser;

    try {
      const index = parser.parsePeopleIndex(await fetchText(`${base}/people/README.md`));
      if (index.length === 0) throw new Error('people/README.md has no people table');

      const peopleBaseUrl = `${repo.repoBaseUrl}/people`;
      const [readmeText, ...logTexts] = await Promise.all([
        fetchText(`${base}/README.md`).catch(() => null),
        ...index.map(p => fetchText(`${base}/people/${p.file}`).catch(() => ''))
      ]);

      if (readmeText) setGroupEntries(parser.parseActivityLogs(readmeText, { repoBaseUrl: repo.repoBaseUrl }));
      people = index.map((p, i) => ({ ...p, entries: parser.parseActivityLogs(logTexts[i], { repoBaseUrl: peopleBaseUrl }) }));

      selectFromHash();
      render();
      const source = local ? 'Local workspace' : `GitHub (${repo.owner}/${repo.repo})`;
      updateStatusBanner('ok', `${people.length} people`, `Source: ${source} · Updated at ${new Date().toLocaleTimeString()}`);
      if (isManual && window.showToast) window.showToast('Personal logs are up to date.');
    } catch (err) {
      console.warn('[People] Live fetch failed:', err);
      if (people.length) {
        updateStatusBanner('error', 'Live check offline or rate limited', `Showing compiled data for ${people.length} people`);
      } else {
        updateStatusBanner('error', 'Could not load personal logs', err.message);
      }
      if (isManual && window.showToast) window.showToast('Could not reach the repository; showing cached logs.');
    } finally {
      if (btnRefresh) btnRefresh.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadPreloaded();
    setTimeout(() => fetchLive(false), 300);

    if (peopleGrid) {
      peopleGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.person-card');
        if (!card) return;
        const slug = card.getAttribute('data-slug');
        history.replaceState(null, '', slug ? `#${slug}` : window.location.pathname);
        selectedSlug = slug;
        render();
      });
    }

    window.addEventListener('hashchange', () => {
      selectFromHash();
      render();
      window.scrollTo({ top: peopleGrid ? peopleGrid.offsetTop - 80 : 0, behavior: 'smooth' });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderTimeline();
      });
    }

    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => fetchLive(true));
    }
  });
})();
