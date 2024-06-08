document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const resultsDiv = document.getElementById('results');

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        resultsDiv.innerHTML = '';

        if (query) {
            searchTabs(query);
            searchBookmarks(query);
        }
    });

    function searchTabs(query) {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(tab => {
                if (tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)) {
                    addResult(tab.title, tab.url);
                }
            });
        });
    }

    function searchBookmarks(query) {
        chrome.bookmarks.search(query, function (bookmarks) {
            bookmarks.forEach(bookmark => {
                if (bookmark.title.toLowerCase().includes(query) || (bookmark.url && bookmark.url.toLowerCase().includes(query))) {
                    addResult(bookmark.title, bookmark.url);
                }
            });
        });
    }

    function addResult(title, url) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result';
        const link = document.createElement('a');
        link.href = url;
        link.textContent = title;
        link.target = '_blank';
        resultDiv.appendChild(link);
        resultsDiv.appendChild(resultDiv);
    }
});
