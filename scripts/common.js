(() => {
    const DATABASE_URL = 'https://raw.githubusercontent.com/lightyuwu/scratchypkg_db/refs/heads/main/database.json';
    const LOCAL_DATABASE_URL = '../ScratchyPkgDB/database.json';
    const PLACEHOLDER_IMAGE = 'res/placeholder.png';

    async function getJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return response.json();
    }

    async function loadDatabase() {
        try {
            return await getJson(DATABASE_URL);
        } catch (_) {
            return await getJson(LOCAL_DATABASE_URL);
        }
    }

    function repoSlug(url) {
        if (!url) return null;

        const match = url.trim()
            .replace(/\.git$/, '')
            .match(/(?:github\.com|githubusercontent\.com)[:/]([^/]+)\/([^/]+)/i);

        return match ? `${match[1]}/${match[2]}` : null;
    }

    function joinUrl(base, file) {
        return `${String(base).replace(/\/+$/, '')}/${String(file).replace(/^\/+/, '')}`;
    }

    function basePath(pkg) {
        return String(pkg.root_path || '').replace(/\/+$/, '');
    }

    function imageUrl(pkg) {
        const image = String(pkg.image || '');

        if (!image || image.split('/').pop().toLowerCase() === 'placeholder.png') {
            return PLACEHOLDER_IMAGE;
        }
        if (/^https?:\/\//i.test(image)) return image;

        return joinUrl(basePath(pkg), image);
    }

    function authorName(author) {
        if (Array.isArray(author)) return author[0] || '';
        return author || '';
    }

    function createCard(pkg) {
        const card = document.createElement('pkg');
        card.id = pkg.id;
        card.setAttribute('img', imageUrl(pkg));
        card.setAttribute('text', pkg.name);
        card.setAttribute('author', authorName(pkg.author));
        return card;
    }

    window.ScratchyPkg = {
        DATABASE_URL,
        LOCAL_DATABASE_URL,
        PLACEHOLDER_IMAGE,
        getJson,
        loadDatabase,
        repoSlug,
        joinUrl,
        basePath,
        imageUrl,
        authorName,
        createCard
    };
})();
