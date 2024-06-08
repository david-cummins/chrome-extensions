document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const resultsTable = document.querySelector('.table');
    const urlMap = {};

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        clearResults();
        Object.keys(urlMap).forEach(key => delete urlMap[key]);

        if (query) {
            searchTabs(query);
            searchBookmarks(query);
            searchHistory(query);
        }
    });

    function clearResults() {
        const rows = resultsTable.querySelectorAll('.table-row:not(.table-header)');
        rows.forEach(row => row.remove());
    }

    function searchTabs(query) {
        chrome.tabs.query({}, function (tabs) {
            tabs
                .filter(tab => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query))
                .sort(compareResults)
                .forEach(tab => {
                    updateResult(tab.title, tab.url, 'tab');
                });
        });
    }

    function searchBookmarks(query) {
        chrome.bookmarks.search(query, function (bookmarks) {
            bookmarks
                .filter(bookmark => bookmark.title.toLowerCase().includes(query) || (bookmark.url && bookmark.url.toLowerCase().includes(query)))
                .sort(compareResults)
                .forEach(bookmark => {
                    updateResult(bookmark.title, bookmark.url, 'bookmark');
                });
        });
    }

    function searchHistory(query) {
        chrome.history.search({ text: query, maxResults: 100 }, function (historyItems) {
            historyItems
                .filter(item => item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query))
                .sort(compareResults)
                .forEach(item => {
                    updateResult(item.title, item.url, 'history');
                });
        });
    }

    function updateResult(title, url, source) {
        if (!urlMap[url]) {
            urlMap[url] = { title: title, sources: new Set() };
            urlMap[url].sources.add(source);
            addResult(title, url, urlMap[url].sources);
        } else {
            urlMap[url].sources.add(source);
            updateIcons(url, urlMap[url].sources);
        }
    }

    function addResult(title, url, sources) {
        const resultRow = document.createElement('div');
        resultRow.className = 'table-row result';

        const domainCell = document.createElement('div');
        domainCell.className = 'table-cell domain';
        domainCell.textContent = (new URL(url)).hostname;

        const titleCell = document.createElement('div');
        titleCell.className = 'table-cell title';
        titleCell.textContent = title;
        titleCell.title = url; // Show full URL on mouseover

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.appendChild(titleCell);

        const iconsCell = document.createElement('div');
        iconsCell.className = 'table-cell icons';
        updateIconsContent(iconsCell, sources);

        resultRow.appendChild(domainCell);
        resultRow.appendChild(link);
        resultRow.appendChild(iconsCell);
        resultsTable.appendChild(resultRow);
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
});
