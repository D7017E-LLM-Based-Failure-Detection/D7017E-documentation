/**
 * Activity Log Controller
 * Manages fetching, caching, filtering, searching, and rendering of activity logs.
 */

(function () {
  'use strict';

  // State
  let allEntries = [];
  let currentGroupFilter = 'ALL';
  let searchQuery = '';
  let sortOrder = 'desc'; // 'desc' (newest first) or 'asc' (oldest first)
  let lastSyncedTime = null;
  let syncSource = 'Cached data (activity-log.json)';

  const LOCAL_DATA_URL = './data/activity-log.json';

  // Dynamic repository details resolver
  function getRepoDetails() {
    let owner = 'D7017E-LLM-Based-Failure-Detection';
    let repo = 'D7017E-documentation';
    let branch = 'main';

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname.endsWith('.github.io')) {
        owner = hostname.replace('.github.io', '');
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          repo = pathParts[0];
        }
      }
    }

    return {
      owner,
      repo,
      branch,
      rawReadmeUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
      rawContributingUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/CONTRIBUTING.md`,
      repoBaseUrl: `https://github.com/${owner}/${repo}/blob/${branch}`
    };
  }

  // DOM Elements
  const timelineContainer = document.getElementById('timeline-container');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const groupFiltersContainer = document.getElementById('group-filters');
  const syncStatusDot = document.getElementById('sync-dot');
  const syncTitle = document.getElementById('sync-title');
  const syncSubtitle = document.getElementById('sync-subtitle');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnCopyTemplate = document.getElementById('btn-copy-template');
  const totalCountEl = document.getElementById('total-count');

  /**
   * Helper: Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Helper: Format basic inline markdown (bold, italics, code, and links)
   */
  function formatInlineMarkdown(text) {
    if (!text) return '';
    const repoDetails = getRepoDetails();
    let formatted = escapeHtml(text);

    // Bold: **text**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (excluding bold delimiters)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Code: `text`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Markdown link: [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const resolved = (window.LogParser && typeof window.LogParser.resolveRepoUrl === 'function')
        ? window.LogParser.resolveRepoUrl(url, repoDetails.repoBaseUrl)
        : url;
      return `<a href="${escapeHtml(resolved)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });

    return formatted;
  }

  /**
   * Render the filtered and sorted log entries
   */
  function renderLogs() {
    if (!timelineContainer) return;

    let filtered = allEntries.filter(entry => {
      // Group filter
      if (currentGroupFilter !== 'ALL' && entry.group !== currentGroupFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const inSummary = (entry.summary || '').toLowerCase().includes(query);
        const inAuthor = (entry.author || '').toLowerCase().includes(query);
        const inGroup = (entry.group || '').toLowerCase().includes(query);
        const inDate = (entry.date || '').toLowerCase().includes(query) || (entry.displayDate || '').toLowerCase().includes(query);
        const inLinks = (entry.links || []).some(l => (l.text + ' ' + l.url).toLowerCase().includes(query));
        return inSummary || inAuthor || inGroup || inDate || inLinks;
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0);
      }
      return b.date > a.date ? 1 : (b.date < a.date ? -1 : 0);
    });

    if (totalCountEl) {
      totalCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`;
    }

    if (filtered.length === 0) {
      timelineContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    timelineContainer.innerHTML = filtered.map(entry => {
      const groupLower = (entry.group || 'all').toLowerCase();
      const groupClass = `badge-${groupLower}`;
      const markerClass = `group-${groupLower}`;

      const authorHtml = entry.author
        ? `<span class="author-pill" title="Contributor">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             ${escapeHtml(entry.author)}
           </span>`
        : '';

      const linksHtml = (entry.links && entry.links.length > 0)
        ? `<div class="timeline-links">
             ${entry.links.map(link => `
               <a href="${escapeHtml(link.githubUrl)}" target="_blank" rel="noopener noreferrer" class="doc-link-chip" title="View ${escapeHtml(link.text)} on GitHub">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 ${escapeHtml(link.text)}
                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
               </a>
             `).join('')}
           </div>`
        : '';

      return `
        <div class="timeline-item" id="${escapeHtml(entry.id)}">
          <div class="timeline-marker ${markerClass}"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <div class="entry-tags">
                <span class="badge ${groupClass}">${escapeHtml(entry.group)}</span>
                ${authorHtml}
              </div>
              <span class="date-pill">${escapeHtml(entry.displayDate || entry.date)}</span>
            </div>
            <div class="timeline-summary">${formatInlineMarkdown(entry.summary)}</div>
            ${linksHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update Group Filter counts in the UI
   */
  function updateGroupCounts() {
    const stats = { ALL: allEntries.length, G1: 0, G2: 0, G3: 0 };
    allEntries.forEach(e => {
      if (stats[e.group] !== undefined) {
        stats[e.group]++;
      }
    });

    const pills = groupFiltersContainer ? groupFiltersContainer.querySelectorAll('.filter-pill') : [];
    pills.forEach(pill => {
      const grp = pill.getAttribute('data-group');
      const countEl = pill.querySelector('.pill-count');
      if (countEl && stats[grp] !== undefined) {
        countEl.textContent = stats[grp];
      }
    });
  }

  /**
   * Update Status Banner details
   */
  function updateStatusBanner(status, title, subtitle) {
    if (syncStatusDot) {
      syncStatusDot.className = 'sync-dot';
      if (status === 'syncing') syncStatusDot.classList.add('syncing');
      if (status === 'error') syncStatusDot.classList.add('error');
    }
    if (syncTitle) syncTitle.textContent = title;
    if (syncSubtitle) syncSubtitle.textContent = subtitle;
  }

  /**
   * Load data from local activity-log.json
   */
  /**
   * Load data from local activity-log.json and local README.md
   */
  async function loadCachedLogs() {
    let localEntries = [];
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname === '[::1]' ||
      !window.location.hostname.endsWith('.github.io')
    );

    // Try reading local README.md directly so unpushed changes display immediately
    if (isLocal && window.LogParser) {
      const candidates = ['../README.md', './README.md', '/README.md', './data/README.md', '/data/README.md'];
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate + '?t=' + Date.now());
          if (res.ok) {
            const text = await res.text();
            if (text.includes('Activity log') || /-\s*\d{4}[-/.Post]/.test(text)) {
              const parsed = window.LogParser.parseActivityLogs(text);
              if (parsed && parsed.length > 0) {
                localEntries = parsed;
                syncSource = 'Local workspace (' + candidate + ')';
                break;
              }
            }
          }
        } catch (e) {}
      }
    }

    if (localEntries.length > 0) {
      allEntries = localEntries;
      lastSyncedTime = new Date().toLocaleTimeString();
    } else {
      try {
        const response = await fetch(LOCAL_DATA_URL + '?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          allEntries = data.entries || [];
          syncSource = 'Synced repository data';
          lastSyncedTime = data.syncedAt ? new Date(data.syncedAt).toLocaleTimeString() : new Date().toLocaleTimeString();
        } else if (window.ACTIVITY_LOG_DATA && window.ACTIVITY_LOG_DATA.entries) {
          allEntries = window.ACTIVITY_LOG_DATA.entries;
          syncSource = 'Preloaded repository data';
          lastSyncedTime = new Date().toLocaleTimeString();
        }
      } catch (err) {
        if (window.ACTIVITY_LOG_DATA && window.ACTIVITY_LOG_DATA.entries) {
          allEntries = window.ACTIVITY_LOG_DATA.entries;
          syncSource = 'Preloaded repository data';
          lastSyncedTime = new Date().toLocaleTimeString();
        }
      }
    }

    if (allEntries.length > 0) {
      updateGroupCounts();
      renderLogs();
      updateStatusBanner('ok', `Synced (${allEntries.length} entries)`, `Source: ${syncSource} · Last updated ${lastSyncedTime}`);
    }

    // Background sync check
    setTimeout(() => {
      fetchLiveFromGitHub(false);
    }, 500);
  }

  /**
   * Fetch live from README.md (local workspace or GitHub raw)
   */
  async function fetchLiveFromGitHub(isManual = false) {
    if (isManual) {
      updateStatusBanner('syncing', 'Checking repository...', 'Fetching latest entries from README');
      if (btnRefresh) btnRefresh.disabled = true;
    }

    const repoDetails = getRepoDetails();
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname === '[::1]' ||
      !window.location.hostname.endsWith('.github.io')
    );

    try {
      let combinedEntries = [];
      let fetchedSource = '';

      // 1. If running locally, check local files first
      if (isLocalhost) {
        const localCandidates = ['../README.md', './README.md', '/README.md', './data/README.md', '/data/README.md'];
        for (const candidate of localCandidates) {
          try {
            const localReadmeRes = await fetch(candidate + '?t=' + Date.now());
            if (localReadmeRes.ok) {
              const readmeText = await localReadmeRes.text();
              if (readmeText.includes('Activity log') || /-\s*\d{4}[-/.Post]/.test(readmeText)) {
                if (window.LogParser) {
                  const parsed = window.LogParser.parseActivityLogs(readmeText, { repoBaseUrl: repoDetails.repoBaseUrl });
                  if (parsed && parsed.length > 0) {
                    combinedEntries = parsed;
                    fetchedSource = 'Local workspace (' + candidate + ')';
                    break;
                  }
                }
              }
            }
          } catch (e) {}
        }
      }

      // 2. Fetch from GitHub raw endpoints (only if not on localhost with entries found, or if manual refresh requested)
      if (combinedEntries.length === 0 && !isLocalhost) {
        try {
          const ghRes = await fetch(repoDetails.rawReadmeUrl + '?t=' + Date.now(), { cache: 'no-store' });
          if (ghRes.ok) {
            const readmeText = await ghRes.text();
            if (window.LogParser) {
              const parsed = window.LogParser.parseActivityLogs(readmeText, { repoBaseUrl: repoDetails.repoBaseUrl });
              if (parsed && parsed.length > 0) {
                combinedEntries = parsed;
                fetchedSource = `GitHub (${repoDetails.owner}/${repoDetails.repo})`;
              }
            }
          }
        } catch (e) {
          console.warn('[Activity] GitHub raw README fetch failed:', e);
        }

        // Also check CONTRIBUTING.md for any additional entries
        try {
          const contribRes = await fetch(repoDetails.rawContributingUrl + '?t=' + Date.now(), { cache: 'no-store' });
          if (contribRes.ok) {
            const contribText = await contribRes.text();
            if (window.LogParser) {
              const parsedContrib = window.LogParser.parseActivityLogs(contribText, { repoBaseUrl: repoDetails.repoBaseUrl });
              if (parsedContrib && parsedContrib.length > 0) {
                combinedEntries = window.LogParser.mergeLogEntries(combinedEntries, parsedContrib);
              }
            }
          }
        } catch (e) {}
      }

      // 3. Update allEntries with latest fetched entries
      if (combinedEntries.length > 0) {
        const hasChange = JSON.stringify(combinedEntries) !== JSON.stringify(allEntries);

        allEntries = combinedEntries;
        lastSyncedTime = new Date().toLocaleTimeString();
        syncSource = fetchedSource || syncSource || 'Live Synced';
        updateGroupCounts();
        renderLogs();
        updateStatusBanner('ok', `Synced (${allEntries.length} entries)`, `Source: ${syncSource} · Updated at ${lastSyncedTime}`);

        if (isManual && window.showToast) {
          window.showToast(`Fetched ${allEntries.length} log entries (${syncSource})`);
        } else if (hasChange && window.showToast) {
          window.showToast(`Activity log updated: ${allEntries.length} entries.`);
        }
        return;
      }

      if (isManual) {
        updateStatusBanner('ok', `Synced (${allEntries.length} entries)`, `Already up to date · ${new Date().toLocaleTimeString()}`);
        if (window.showToast) {
          window.showToast('Activity log is up to date.');
        }
      }
    } catch (err) {
      console.error('[Activity] Error fetching live logs:', err);
      updateStatusBanner('error', 'Live check offline or rate limited', `Using existing ${allEntries.length} cached entries`);
      if (isManual && window.showToast) {
        window.showToast('Could not reach GitHub live; displaying cached entries.');
      }
    } finally {
      if (btnRefresh) btnRefresh.disabled = false;
    }
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Initial load: render cached instantly, then check live in background
    loadCachedLogs();

    // Group filter clicks
    if (groupFiltersContainer) {
      groupFiltersContainer.addEventListener('click', e => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        groupFiltersContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentGroupFilter = pill.getAttribute('data-group') || 'ALL';
        renderLogs();
      });
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        renderLogs();
      });
    }

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        sortOrder = e.target.value;
        renderLogs();
      });
    }

    // Refresh button
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        fetchLiveFromGitHub(true);
      });
    }

    // Copy template button
    if (btnCopyTemplate) {
      btnCopyTemplate.addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        const template = `- ${today} — ALL (name) — Brief description of milestone or working session. → [CONTRIBUTING.md](CONTRIBUTING.md)`;
        navigator.clipboard.writeText(template).then(() => {
          if (window.showToast) {
            window.showToast('Copied log entry template to clipboard!');
          }
        }).catch(err => {
          console.error('Failed to copy template:', err);
        });
      });
    }

    // Clear filters button in empty state
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        currentGroupFilter = 'ALL';
        if (groupFiltersContainer) {
          groupFiltersContainer.querySelectorAll('.filter-pill').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-group') === 'ALL');
          });
        }
        renderLogs();
      });
    }
  });
})();
