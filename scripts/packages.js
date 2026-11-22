(() => {
    const { getJson, loadDatabase, repoSlug, createCard } = window.ScratchyPkg;

    const CACHE_PREFIX = 'scratchypkg:github:';
    const CACHE_LIFETIME = 60 * 60 * 1000;

    async function githubInfo(slug) {
        if (!slug) return { stars: 0, createdAt: null };

        const cacheKey = CACHE_PREFIX + slug;
        try {
            const cached = JSON.parse(sessionStorage.getItem(cacheKey));
            if (cached && Date.now() - cached.time < CACHE_LIFETIME) {
                return { stars: cached.stars, createdAt: cached.createdAt };
            }
        } catch (_) {
            // Ignore unreadable cache entries.
        }

        try {
            const info = await getJson(`https://api.github.com/repos/${slug}`);
            const result = {
                stars: info.stargazers_count || 0,
                createdAt: info.created_at || null,
                defaultBranch: info.default_branch || null
            };

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), ...result }));
            } catch (_) {
                // Storage may be unavailable; the data is still usable.
            }

            return result;
        } catch (_) {
            return { stars: 0, createdAt: null, defaultBranch: null };
        }
    }

    async function mapLimited(items, limit, worker) {
        const results = new Array(items.length);
        let next = 0;

        await Promise.all(
            Array.from({ length: Math.min(limit, items.length) }, async () => {
                while (next < items.length) {
                    const index = next++;
                    results[index] = await worker(items[index]);
                }
            })
        );

        return results;
    }

    function render(selector, packages) {
        const container = document.querySelector(selector);
        if (!container) return;

        container.replaceChildren();

        if (!packages.length) {
            const empty = document.createElement('p');
            empty.textContent = 'No packages yet.';
            container.append(empty);
            return;
        }

        packages.forEach((pkg) => container.append(createCard(pkg)));
    }

    function showCount(count) {
        document.querySelectorAll('[data-package-count]').forEach((element) => {
            element.textContent = count;
        });
    }

    async function main() {
        let database;
        try {
            database = await loadDatabase();
            showCount(database.length);
        } catch (error) {
            console.error('Could not load the package database.', error);
            showCount('?');
            render('.container.popular .content', []);
            render('.container.new .content', []);
            return;
        }

        const packages = await mapLimited(database, 5, async (pkg) => {
            const slug = repoSlug(pkg.github_project || pkg.git_project || pkg.root_path);
            const info = await githubInfo(slug);

            return { ...pkg, stars: info.stars, createdAt: info.createdAt };
        });

        const popular = [...packages].sort(
            (a, b) => b.stars - a.stars || String(a.name).localeCompare(String(b.name))
        );

        const newest = [...packages].sort((a, b) => {
            const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
            const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
            return bTime - aTime || String(a.name).localeCompare(String(b.name));
        });

        render('.container.popular .content', popular);
        render('.container.new .content', newest);
    }

    main();
})();
