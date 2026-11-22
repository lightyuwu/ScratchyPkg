(() => {
    function upgrade(pkg) {
        if (pkg.dataset.pkgUpgraded === 'true') return;
        pkg.dataset.pkgUpgraded = 'true';

        const id = pkg.getAttribute('id') || '';
        const image = pkg.getAttribute('img') || '';
        const text = pkg.getAttribute('text') || '';
        const author = pkg.getAttribute('author') || '';

        const link = document.createElement('a');
        link.className = 'pkg-link';
        link.href = id
            ? `package.html?package_id=${encodeURIComponent(id)}`
            : '#';

        const thumbnail = document.createElement('img');
        thumbnail.className = 'pkg-image';
        thumbnail.src = image;
        thumbnail.alt = text;
        thumbnail.width = 146;
        thumbnail.height = 110;

        const title = document.createElement('span');
        title.className = 'pkg-text';
        title.textContent = text;

        const creator = document.createElement('span');
        creator.className = 'pkg-author';
        creator.textContent = author;

        link.append(thumbnail, title, creator);
        pkg.append(link);
    }

    document.querySelectorAll('pkg').forEach(upgrade);

    // Also upgrade <pkg> elements added later by other scripts.
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;

                if (node.tagName.toLowerCase() === 'pkg') upgrade(node);
                node.querySelectorAll?.('pkg').forEach(upgrade);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
