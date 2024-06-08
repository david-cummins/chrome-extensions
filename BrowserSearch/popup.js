document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const resultsDiv = document.getElementById('results');
    const urlMap = {};

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        resultsDiv.innerHTML = '';
        Object.keys(urlMap).forEach(key => delete urlMap[key]);

        if (query) {
            searchTabs(query);
            searchBookmarks(query);
            searchHistory(query);
        }
    });

    function searchTabs(query) {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(tab => {
                if (tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)) {
                    updateResult(tab.title, tab.url, 'tab');
                }
            });
        });
    }

    function searchBookmarks(query) {
        chrome.bookmarks.search(query, function (bookmarks) {
            bookmarks.forEach(bookmark => {
                if (bookmark.title.toLowerCase().includes(query) || (bookmark.url && bookmark.url.toLowerCase().includes(query))) {
                    updateResult(bookmark.title, bookmark.url, 'bookmark');
                }
            });
        });
    }

    function searchHistory(query) {
        chrome.history.search({ text: query, maxResults: 100 }, function (historyItems) {
            historyItems.forEach(item => {
                if (item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query)) {
                    updateResult(item.title, item.url, 'history');
                }
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
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result';
        const link = document.createElement('a');
        link.href = url;
        link.textContent = title;
        link.target = '_blank';

        const iconsDiv = document.createElement('div');
        iconsDiv.className = 'icons';
        updateIconsContent(iconsDiv, sources);

        resultDiv.appendChild(link);
        resultDiv.appendChild(iconsDiv);
        resultsDiv.appendChild(resultDiv);
    }

    function updateIcons(url, sources) {
        const results = Array.from(resultsDiv.getElementsByClassName('result'));
        results.forEach(result => {
            const link = result.querySelector('a');
            if (link.href === url) {
                const iconsDiv = result.querySelector('.icons');
                updateIconsContent(iconsDiv, sources);
            }
        });
    }

    function updateIconsContent(iconsDiv, sources) {
        iconsDiv.innerHTML = '';
        if (sources.has('tab')) {
            const tabIcon = document.createElement('i');
            tabIcon.className = 'fas fa-window-maximize'; // FontAwesome icon for tabs
            iconsDiv.appendChild(tabIcon);
        }
        if (sources.has('bookmark')) {
            const bookmarkIcon = document.createElement('i');
            bookmarkIcon.className = 'fas fa-bookmark'; // FontAwesome icon for bookmarks
            iconsDiv.appendChild(bookmarkIcon);
        }
        if (sources.has('history')) {
            const historyIcon = document.createElement('i');
            historyIcon.className = 'fas fa-history'; // FontAwesome icon for history
            iconsDiv.appendChild(historyIcon);
        }
    }
});
