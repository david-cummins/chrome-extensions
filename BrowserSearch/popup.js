document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const resultsTable = document.getElementById('resultsTable');
    const noResultsMessage = document.createElement('tr');
    noResultsMessage.innerHTML = '<td colspan="3" style="text-align: center;">No results found</td>';
    const urlMap = {};
    const historyMap = {};

    let debounceTimeout;

    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const query = searchInput.value.toLowerCase();
            clearResults();
            Object.keys(urlMap).forEach(key => delete urlMap[key]);
            Object.keys(historyMap).forEach(key => delete historyMap[key]);

            if (query) {
                searchTabs(query);
                searchBookmarks(query);
                searchHistory(query);
            }
        }, 300); // Adjust debounce delay as needed
    });

    function clearResults() {
        resultsTable.innerHTML = '';
    }

    function searchTabs(query) {
        chrome.tabs.query({}, function (tabs) {
            const results = tabs
                .filter(tab => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query))
                .sort(compareResults);

            if (results.length === 0) {
                resultsTable.appendChild(noResultsMessage);
            } else {
                results.forEach(tab => updateResult(tab.title, tab.url, 'tab', query));
            }
        });
    }

    function searchBookmarks(query) {
        chrome.bookmarks.search(query, function (bookmarks) {
            const results = bookmarks
                .filter(bookmark => bookmark.title.toLowerCase().includes(query) || (bookmark.url && bookmark.url.toLowerCase().includes(query)))
                .sort(compareResults);

            if (results.length === 0) {
                resultsTable.appendChild(noResultsMessage);
            } else {
                results.forEach(bookmark => updateResult(bookmark.title, bookmark.url, 'bookmark', query));
            }
        });
    }

    function searchHistory(query) {
        chrome.history.search({ text: query, maxResults: 100 }, function (historyItems) {
            const results = historyItems
                .filter(item => item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query))
                .forEach(item => {
                    const score = calculateScore(item.visitCount, item.lastVisitTime);
                    const key = `${(new URL(item.url)).hostname}|${item.title.toLowerCase()}`;
                    if (!historyMap[key] || historyMap[key].score < score) {
                        historyMap[key] = { ...item, score: score };
                    }
                });

            const sortedResults = Object.values(historyMap).sort(compareResults);

            if (sortedResults.length === 0) {
                resultsTable.appendChild(noResultsMessage);
            } else {
                sortedResults.forEach(item => updateResult(item.title, item.url, 'history', query));
            }
        });
    }

    function calculateScore(visitCount, lastVisitTime) {
        const daysSinceLastVisit = (Date.now() - lastVisitTime) / (1000 * 60 * 60 * 24);
        return visitCount - daysSinceLastVisit;
    }

    function updateResult(title, url, source, query) {
        if (!urlMap[url]) {
            urlMap[url] = { title: title, sources: new Set() };
            urlMap[url].sources.add(source);
            addResult(title, url, urlMap[url].sources, query);
        } else {
            urlMap[url].sources.add(source);
            updateIcons(url, urlMap[url].sources);
        }
    }

    function addResult(title, url, sources, query) {
        const resultRow = document.createElement('tr');
        resultRow.className = 'result';

        const domainCell = document.createElement('td');
        domainCell.className = 'domain';
        domainCell.textContent = (new URL(url)).hostname;

        const titleCell = document.createElement('td');
        titleCell.className = 'title';
        titleCell.innerHTML = highlightQuery(title, query);
        titleCell.title = url; // Show full URL on mouseover

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.appendChild(titleCell);

        const iconsCell = document.createElement('td');
        iconsCell.className = 'icons';
        updateIconsContent(iconsCell, sources);

        resultRow.appendChild(domainCell);
        resultRow.appendChild(link);
        resultRow.appendChild(iconsCell);
        resultsTable.appendChild(resultRow);
    }

    function highlightQuery(text, query) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        return text.substring(0, index) + '<span class="highlight">' + text.substring(index, index + query.length) + '</span>' + text.substring(index + query.length);
    }

    function updateIcons(url, sources) {
        const results = Array.from(resultsTable.getElementsByClassName('result'));
        results.forEach(result => {
            const link = result.querySelector('a');
            if (link.href === url) {
                const iconsCell = result.querySelector('.icons');
                updateIconsContent(iconsCell, sources);
            }
        });
    }

    function updateIconsContent(iconsCell, sources) {
        iconsCell.innerHTML = '';
        if (sources.has('tab')) {
            const tabIcon = document.createElement('i');
            tabIcon.className = 'fas fa-window-maximize'; // FontAwesome icon for tabs
            iconsCell.appendChild(tabIcon);
        }
        if (sources.has('bookmark')) {
            const bookmarkIcon = document.createElement('i');
            bookmarkIcon.className = 'fas fa-bookmark'; // FontAwesome icon for bookmarks
            iconsCell.appendChild(bookmarkIcon);
        }
        if (sources.has('history')) {
            const historyIcon = document.createElement('i');
            historyIcon.className = 'fas fa-history'; // FontAwesome icon for history
            iconsCell.appendChild(historyIcon);
        }
    }

    function compareResults(a, b) {
        const domainA = (new URL(a.url)).hostname.toLowerCase();
        const domainB = (new URL(b.url)).hostname.toLowerCase();

        if (domainA < domainB) return -1;
        if (domainA > domainB) return 1;
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
    }

    document.addEventListener('keydown', function (event) {
        const activeElement = document.activeElement;
        if (event.key === 'ArrowDown') {
            if (activeElement.tagName === 'INPUT') {
                const firstResult = resultsTable.querySelector('.result a');
                if (firstResult) firstResult.focus();
            } else {
                const nextElement = activeElement.closest('tr').nextElementSibling;
                if (nextElement) nextElement.querySelector('a').focus();
            }
        } else if (event.key === 'ArrowUp') {
            if (activeElement.tagName === 'A') {
                const prevElement = activeElement.closest('tr').previousElementSibling;
                if (prevElement) {
                    prevElement.querySelector('a').focus();
                } else {
                    searchInput.focus();
                }
            }
        } else if (event.key === 'Enter' && activeElement.tagName === 'A') {
            activeElement.click();
        }
    });
});
