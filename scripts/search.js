(() => {
    const { loadDatabase, createCard } = window.ScratchyPkg;

    const params = new URLSearchParams(location.search);
    const query = (params.get('query') || '').trim();
    const mainEl = document.querySelector('main');
    const searchInput = document.querySelector('#query');

    if (searchInput) searchInput.value = query;
    document.title = query
        ? `Search: ${query} - ScratchyPkg`
        : 'Search - ScratchyPkg';

    function matches(pkg, term) {
        return [pkg.id, pkg.name, pkg.author, pkg.github_project, pkg.git_project]
            .some((value) => {
                if (Array.isArray(value)) {
                    return value.some((item) => String(item).toLowerCase().includes(term));
                }
                return String(value || '').toLowerCase().includes(term);
            });
    }

    function render(title, packages) {
        const container = document.createElement('div');
        container.className = 'container search-results span-full';

        const heading = document.createElement('h4');
        heading.textContent = title;

        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = `${packages.length} ${packages.length === 1 ? 'package' : 'packages'}`;
        heading.append(count);

        const content = document.createElement('div');
        content.className = 'content';

        if (packages.length) {
            packages.forEach((pkg) => content.append(createCard(pkg)));
        } else {
            const message = document.createElement('p');
            message.textContent = 'No packages matched your search.';
            content.append(message);
        }

        container.append(heading, content);
        mainEl.replaceChildren(container);
    }

    async function main() {
        mainEl.replaceChildren();

        let database;
        try {
            database = await loadDatabase();
        } catch (error) {
            console.error('Could not load the package database.', error);
            render('Search results', []);
            return;
        }

        const term = query.toLowerCase();
        const results = term ? database.filter((pkg) => matches(pkg, term)) : database;

        render(term ? `Search results for “${query}”` : 'All packages', results);
    }

    main();
})();
