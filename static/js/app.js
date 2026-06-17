/**
 * BigQuery Release Hub - Frontend Controller
 * Implements real-time fetching, parsing, caching, searching, and filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        title: 'BigQuery Release Notes',
        lastUpdated: '',
        rawEntries: [],     // Raw entries from API
        parsedEntries: [],  // Grouped and parsed entries
        activeFilter: 'all',
        searchQuery: '',
        theme: 'dark'
    };

    // DOM Elements
    const elements = {
        themeToggle: document.getElementById('theme-toggle'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        refreshBtn: document.getElementById('refresh-btn'),
        retryBtn: document.getElementById('retry-btn'),
        resetFiltersBtn: document.getElementById('reset-filters-btn'),
        searchInput: document.getElementById('search-input'),
        clearSearch: document.getElementById('clear-search'),
        filterChips: document.getElementById('filter-chips'),
        releaseList: document.getElementById('release-list'),
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        errorMessage: document.getElementById('error-message'),
        emptyState: document.getElementById('empty-state'),
        feedCacheStatus: document.getElementById('feed-cache-status'),
        
        // Stats
        statFeatures: document.getElementById('stat-features'),
        statAnnouncements: document.getElementById('stat-announcements'),
        statIssues: document.getElementById('stat-issues'),
        statLastSync: document.getElementById('stat-last-sync')
    };

    // SVG Icons Map for badges and actions
    const icons = {
        feature: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        announcement: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
        issue: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        deprecation: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
        change: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        general: `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2005/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        success: `<svg xmlns="http://www.w3.org/2005/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        link: `<svg xmlns="http://www.w3.org/2005/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        linkCopy: `<svg xmlns="http://www.w3.org/2005/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    };

    /* ==========================================================================
       Initializations
       ========================================================================== */
    function init() {
        initTheme();
        registerEvents();
        fetchReleases(false);
    }

    /* ==========================================================================
       Theme Configuration (Light/Dark)
       ========================================================================== */
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            state.theme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.theme = prefersDark ? 'dark' : 'light';
        }
        applyTheme();
    }

    function applyTheme() {
        if (state.theme === 'dark') {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
        localStorage.setItem('theme', state.theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
    }

    /* ==========================================================================
       Data Fetching & Parsing
       ========================================================================== */
    async function fetchReleases(forceRefresh = false) {
        showLoading(true);
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Server returned an error');
            }
            
            const data = await response.json();
            
            state.rawEntries = data.entries || [];
            state.lastUpdated = data.updated || '';
            
            processEntries();
            updateStats();
            renderFeed();
            
            // Show cache status
            if (data.cached_at) {
                const cacheDate = new Date(data.cached_at * 1000);
                elements.feedCacheStatus.textContent = `Synced: ${cacheDate.toLocaleTimeString()}`;
            }
            
            showLoading(false);
            showError(null);
        } catch (error) {
            console.error('Fetch Error:', error);
            showLoading(false);
            showError(error.message);
        }
    }

    /**
     * Parse entry HTML content into structural segments grouped by category
     */
    function processEntries() {
        state.parsedEntries = state.rawEntries.map(entry => {
            const updates = parseHtmlContent(entry.content);
            return {
                id: entry.id,
                title: entry.title, // Date (e.g. June 16, 2026)
                updated: entry.updated,
                link: entry.link,
                updates: updates
            };
        });
    }

    function parseHtmlContent(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const updates = [];
        
        let currentCategory = null;
        let currentHTMLBuffer = [];

        // Loop through children in body
        for (const child of doc.body.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName === 'H3') {
                    // Save previous category buffer
                    if (currentCategory && currentHTMLBuffer.length > 0) {
                        updates.push({
                            category: normalizeCategory(currentCategory),
                            originalCategoryName: currentCategory,
                            html: currentHTMLBuffer.join('').trim()
                        });
                    }
                    currentCategory = child.textContent.trim();
                    currentHTMLBuffer = [];
                } else {
                    currentHTMLBuffer.push(child.outerHTML);
                }
            }
        }

        // Add last section in buffer
        if (currentCategory && currentHTMLBuffer.length > 0) {
            updates.push({
                category: normalizeCategory(currentCategory),
                originalCategoryName: currentCategory,
                html: currentHTMLBuffer.join('').trim()
            });
        }

        // Default handling if the feed isn't structured with H3
        if (updates.length === 0 && htmlContent.trim() !== '') {
            updates.push({
                category: 'general',
                originalCategoryName: 'Update',
                html: htmlContent.trim()
            });
        }

        return updates;
    }

    function normalizeCategory(categoryName) {
        const cat = categoryName.toLowerCase().trim();
        if (cat.includes('feature')) return 'feature';
        if (cat.includes('announcement')) return 'announcement';
        if (cat.includes('issue')) return 'issue';
        if (cat.includes('deprecation')) return 'deprecation';
        if (cat.includes('change')) return 'change';
        return 'general';
    }

    /* ==========================================================================
       Stats Management
       ========================================================================== */
    function updateStats() {
        let featureCount = 0;
        let announcementCount = 0;
        let issueCount = 0;

        state.parsedEntries.forEach(entry => {
            entry.updates.forEach(upd => {
                if (upd.category === 'feature') featureCount++;
                else if (upd.category === 'announcement') announcementCount++;
                else if (upd.category === 'issue') issueCount++;
            });
        });

        // Animate counter values
        animateCounter(elements.statFeatures, featureCount);
        animateCounter(elements.statAnnouncements, announcementCount);
        animateCounter(elements.statIssues, issueCount);

        // Update Last Checked Time
        const now = new Date();
        elements.statLastSync.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function animateCounter(element, targetValue) {
        let currentValue = parseInt(element.textContent) || 0;
        const duration = 800; // ms
        const steps = 40;
        const increment = (targetValue - currentValue) / steps;
        let step = 0;

        const timer = setInterval(() => {
            currentValue += increment;
            step++;
            if (step >= steps) {
                clearInterval(timer);
                element.textContent = targetValue;
            } else {
                element.textContent = Math.round(currentValue);
            }
        }, duration / steps);
    }

    /* ==========================================================================
       Real-time Searching & Filtering Logic
       ========================================================================== */
    function renderFeed() {
        const filtered = getFilteredData();
        
        if (filtered.length === 0) {
            elements.releaseList.classList.add('hidden');
            elements.emptyState.classList.remove('hidden');
            return;
        }

        elements.emptyState.classList.add('hidden');
        elements.releaseList.innerHTML = '';
        
        filtered.forEach(entry => {
            const card = createReleaseCard(entry);
            elements.releaseList.appendChild(card);
        });

        elements.releaseList.classList.remove('hidden');
    }

    function getFilteredData() {
        const searchTerms = state.searchQuery.toLowerCase().trim().split(/\s+/);
        
        return state.parsedEntries.map(entry => {
            // Clone entry structure
            const filteredUpdates = entry.updates.filter(upd => {
                // Filter by active category
                if (state.activeFilter !== 'all' && upd.category !== state.activeFilter) {
                    return false;
                }

                // Filter by search text
                if (searchTerms.length > 0 && searchTerms[0] !== '') {
                    const combinedText = `${upd.originalCategoryName} ${upd.html} ${entry.title}`.toLowerCase();
                    return searchTerms.every(term => combinedText.includes(term));
                }

                return true;
            });

            return {
                ...entry,
                updates: filteredUpdates
            };
        }).filter(entry => entry.updates.length > 0);
    }

    /* ==========================================================================
       Card Component Generation
       ========================================================================== */
    function createReleaseCard(entry) {
        const card = document.createElement('article');
        card.className = 'release-card';
        card.setAttribute('data-id', entry.id);

        // Create Card Header
        const header = document.createElement('div');
        header.className = 'release-header';
        
        const dateContainer = document.createElement('div');
        dateContainer.className = 'release-date-container';
        
        const calendarIconBg = document.createElement('div');
        calendarIconBg.className = 'calendar-icon-bg';
        calendarIconBg.innerHTML = `<svg xmlns="http://www.w3.org/2005/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        
        const h2 = document.createElement('h2');
        h2.textContent = entry.title; // e.g., June 16, 2026
        
        dateContainer.appendChild(calendarIconBg);
        dateContainer.appendChild(h2);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        // Copy Link button (chain link icon)
        const copyLinkBtn = document.createElement('button');
        copyLinkBtn.className = 'card-action-btn tooltip';
        copyLinkBtn.setAttribute('data-tooltip', 'Copy Direct Link');
        copyLinkBtn.innerHTML = icons.linkCopy;
        copyLinkBtn.addEventListener('click', () => {
            copyToClipboard(entry.link, copyLinkBtn, 'link');
        });

        // Copy Content button (clipboard/document copy icon)
        const copyContentBtn = document.createElement('button');
        copyContentBtn.className = 'card-action-btn tooltip';
        copyContentBtn.setAttribute('data-tooltip', 'Copy Release Text');
        copyContentBtn.innerHTML = icons.copy;
        copyContentBtn.addEventListener('click', () => {
            const textToCopy = getCardTextContent(entry);
            copyToClipboard(textToCopy, copyContentBtn, 'content');
        });

        // Open original link
        const linkBtn = document.createElement('a');
        linkBtn.className = 'card-action-btn tooltip';
        linkBtn.setAttribute('data-tooltip', 'Open Google Cloud Docs');
        linkBtn.setAttribute('href', entry.link);
        linkBtn.setAttribute('target', '_blank');
        linkBtn.setAttribute('rel', 'noopener noreferrer');
        linkBtn.innerHTML = icons.link;

        actions.appendChild(copyLinkBtn);
        actions.appendChild(copyContentBtn);
        actions.appendChild(linkBtn);
        
        header.appendChild(dateContainer);
        header.appendChild(actions);
        card.appendChild(header);

        // Create Card Content (Render child updates)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'release-body';

        entry.updates.forEach(upd => {
            const item = document.createElement('div');
            item.className = 'update-item';

            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'badge-container';

            const iconMarkup = icons[upd.category] || icons.general;
            const badge = document.createElement('span');
            badge.className = `badge ${upd.category}`;
            badge.innerHTML = `${iconMarkup} ${upd.originalCategoryName}`;

            badgeContainer.appendChild(badge);
            item.appendChild(badgeContainer);

            const content = document.createElement('div');
            content.className = 'update-content';
            content.innerHTML = upd.html;
            
            // Adjust external links inside parsed HTML to open in new tab
            const innerLinks = content.querySelectorAll('a');
            innerLinks.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });

            item.appendChild(content);
            contentContainer.appendChild(item);
        });

        card.appendChild(contentContainer);
        return card;
    }

    async function copyToClipboard(text, buttonElement, type) {
        try {
            await navigator.clipboard.writeText(text);
            buttonElement.innerHTML = icons.success;
            buttonElement.setAttribute('data-tooltip', 'Copied!');
            buttonElement.classList.add('success-state');
            
            setTimeout(() => {
                if (type === 'link') {
                    buttonElement.innerHTML = icons.linkCopy;
                    buttonElement.setAttribute('data-tooltip', 'Copy Direct Link');
                } else {
                    buttonElement.innerHTML = icons.copy;
                    buttonElement.setAttribute('data-tooltip', 'Copy Release Text');
                }
                buttonElement.classList.remove('success-state');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    /* ==========================================================================
       UI Controls & Feedback States
       ========================================================================== */
    function showLoading(isLoading) {
        if (isLoading) {
            elements.refreshBtn.classList.add('refreshing');
            elements.refreshBtn.disabled = true;
            elements.loadingState.classList.remove('hidden');
            elements.releaseList.classList.add('hidden');
            elements.errorState.classList.add('hidden');
            elements.emptyState.classList.add('hidden');
        } else {
            elements.refreshBtn.classList.remove('refreshing');
            elements.refreshBtn.disabled = false;
            elements.loadingState.classList.add('hidden');
        }
    }

    function showError(errMessage) {
        if (errMessage) {
            elements.errorState.classList.remove('hidden');
            elements.errorMessage.textContent = errMessage;
            elements.releaseList.classList.add('hidden');
            elements.emptyState.classList.add('hidden');
        } else {
            elements.errorState.classList.add('hidden');
        }
    }

    /* ==========================================================================
       Event Listeners & Event Handlers
       ========================================================================== */
    function registerEvents() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Export CSV button
        if (elements.exportCsvBtn) {
            elements.exportCsvBtn.addEventListener('click', exportFilteredCSV);
        }

        // Refresh buttons
        elements.refreshBtn.addEventListener('click', () => fetchReleases(true));
        elements.retryBtn.addEventListener('click', () => fetchReleases(true));

        // Search inputs
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            if (state.searchQuery.length > 0) {
                elements.clearSearch.classList.remove('hidden');
            } else {
                elements.clearSearch.classList.add('hidden');
            }
            renderFeed();
        });

        // Clear search button
        elements.clearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.clearSearch.classList.add('hidden');
            elements.searchInput.focus();
            renderFeed();
        });

        // Filter chips click events
        elements.filterChips.addEventListener('click', (e) => {
            const clickedChip = e.target.closest('.chip');
            if (!clickedChip) return;

            // Remove active from all chips, add to selected
            elements.filterChips.querySelectorAll('.chip').forEach(chip => {
                chip.classList.remove('active');
            });
            clickedChip.classList.add('active');

            // Apply filter
            state.activeFilter = clickedChip.getAttribute('data-filter');
            renderFeed();
        });

        // Reset filter/empty state buttons
        elements.resetFiltersBtn.addEventListener('click', resetFilters);
        elements.resetFiltersBtn.addEventListener('click', resetFilters);
    }

    function resetFilters() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearch.classList.add('hidden');
        
        elements.filterChips.querySelectorAll('.chip').forEach(chip => {
            chip.classList.remove('active');
            if (chip.getAttribute('data-filter') === 'all') {
                chip.classList.add('active');
            }
        });
        
        state.activeFilter = 'all';
        renderFeed();
    }

    /* ==========================================================================
       Utility & Export Helpers
       ========================================================================== */
    function htmlToPlainText(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
    }

    function getCardTextContent(entry) {
        let text = `BigQuery Release Notes - ${entry.title}\n`;
        text += '='.repeat(entry.title.length) + '\n\n';
        
        entry.updates.forEach(upd => {
            const cleanContent = htmlToPlainText(upd.html);
            text += `[${upd.originalCategoryName.toUpperCase()}]\n`;
            text += `${cleanContent}\n\n`;
        });
        
        text += `Source Documentation: ${entry.link}\n`;
        return text;
    }

    function exportFilteredCSV() {
        const filteredData = getFilteredData();
        if (filteredData.length === 0) {
            alert('No data to export.');
            return;
        }

        const csvRows = [];
        // Header Row
        csvRows.push(['Date', 'Category', 'Description', 'Link'].map(val => `"${val.replace(/"/g, '""')}"`).join(','));

        // Data Rows
        filteredData.forEach(entry => {
            entry.updates.forEach(upd => {
                const cleanDesc = htmlToPlainText(upd.html)
                    .replace(/\s+/g, ' ')
                    .trim();
                
                const row = [
                    entry.title,
                    upd.originalCategoryName,
                    cleanDesc,
                    entry.link
                ];

                csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
            });
        });

        // Generate download
        const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `bigquery_release_notes_${timestamp}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Run app!
    init();
});
