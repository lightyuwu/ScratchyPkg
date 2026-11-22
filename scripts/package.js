(() => {
    const { loadDatabase, getJson, repoSlug, basePath, joinUrl, authorName } = window.ScratchyPkg;

    const packageId = new URLSearchParams(location.search).get('package_id');
    const mainEl = document.querySelector('main');

    function makeContainer(className, title) {
        const element = document.createElement('div');
        element.className = `container ${className}`;

        const heading = document.createElement('h4');
        heading.textContent = title;

        const content = document.createElement('div');
        content.className = 'content';

        element.append(heading, content);
        return { element, content };
    }

    function paragraph(text, className) {
        const element = document.createElement('p');
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function heading(text) {
        const element = document.createElement('h2');
        element.textContent = text;
        return element;
    }

    function detail(label, value, href) {
        const element = document.createElement('p');

        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        element.append(strong);

        if (href) {
            const link = document.createElement('a');
            link.textContent = value;
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            element.append(link);
        } else {
            element.append(document.createTextNode(value));
        }

        return element;
    }

    function safeUrl(url) {
        return /^https?:\/\//i.test(String(url || '')) ? url : '#';
    }

    function fileList(items, base, asLinks) {
        const list = document.createElement('ul');
        list.className = 'file-list';

        if (!items || !items.length) {
            const entry = document.createElement('li');
            entry.className = 'muted';
            entry.textContent = 'None';
            list.append(entry);
            return list;
        }

        items.forEach((item) => {
            const entry = document.createElement('li');
            if (asLinks) {
                const link = document.createElement('a');
                link.textContent = String(item);
                link.href = safeUrl(joinUrl(base, item));
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                entry.append(link);
            } else {
                entry.textContent = String(item);
            }
            list.append(entry);
        });

        return list;
    }

    async function resolveManifest(pkg) {
        const slug = repoSlug(pkg.github_project || pkg.git_project || pkg.root_path);
        const bases = [basePath(pkg)];
        let repoInfo = null;

        if (slug) {
            try {
                repoInfo = await getJson(`https://api.github.com/repos/${slug}`);
                const branch = repoInfo.default_branch || 'main';
                const lastSegment = basePath(pkg).split('/').pop();

                bases.push(joinUrl(`https://raw.githubusercontent.com/${slug}/${branch}`, lastSegment));
                bases.push(`https://raw.githubusercontent.com/${slug}/${branch}`);
            } catch (_) {
                // GitHub metadata is optional.
            }
        }

        for (const base of bases) {
            if (!base) continue;

            try {
                const manifest = await getJson(joinUrl(base, 'manifest.json'));
                return { manifest, base, repoInfo };
            } catch (_) {
                // Try the next possible location.
            }
        }

        return { manifest: null, base: basePath(pkg), repoInfo };
    }

    function renderMissing(title, message) {
        const { element, content } = makeContainer('span-full', title);
        content.append(paragraph(message));

        const home = document.createElement('a');
        home.textContent = 'Back to ScratchyPkg';
        home.href = 'index.html';
        content.append(home);

        mainEl.replaceChildren(element);
    }

    async function main() {
        mainEl.replaceChildren();

        let database;
        try {
            database = await loadDatabase();
        } catch (error) {
            console.error('Could not load the package database.', error);
            renderMissing('Package unavailable', 'The package database could not be loaded.');
            return;
        }

        const pkg = database.find((item) => item.id === packageId);
        if (!pkg) {
            renderMissing('Package not found', `No package with the ID “${packageId || ''}” exists.`);
            return;
        }

        const { manifest, base, repoInfo } = await resolveManifest(pkg);
        const name = manifest?.name || pkg.name || pkg.id;
        const author = manifest?.author || authorName(pkg.author);
        const sprites = manifest?.sprites || [];
        const blocks = manifest?.blocks || [];
        const source = pkg.github_project || pkg.git_project || (repoInfo ? repoInfo.html_url : '');

        document.title = `${name} - ScratchyPkg`;

        const about = makeContainer('span-6', name);
        about.content.append(paragraph(manifest?.description || 'No description provided.'));
        if (author) about.content.append(paragraph(`by ${author}`, 'muted'));
        if (!manifest) about.content.append(paragraph('Could not load manifest.json for this package.', 'muted'));

        const install = makeContainer('span-4', 'How to insert');
        install.content.append(
            paragraph('With our Browser Extension'),
            heading('TODO: Add Browser Extension'),
            paragraph('Or our UserScript'),
            heading('TODO: Add Userscript')
        );

        const details = makeContainer('span-full', 'Package details');
        const detailsGrid = document.createElement('div');
        detailsGrid.className = 'content-grid';

        const left = document.createElement('div');
        left.append(
            detail('Version', manifest?.version || 'Unknown'),
            detail('Sprites', String(sprites.length)),
            detail('Blocks', String(blocks.length)),
            detail('Package ID', pkg.id)
        );

        const right = document.createElement('div');
        right.append(
            detail('Author', author || 'Unknown'),
            detail('Created', repoInfo?.created_at ? repoInfo.created_at.slice(0, 10) : 'Unknown'),
            detail('Source', source || 'Unknown', source ? safeUrl(source) : null),
            detail('Manifest', 'manifest.json', safeUrl(joinUrl(base, 'manifest.json')))
        );

        detailsGrid.append(left, right);
        details.content.append(detailsGrid);

        const contents = makeContainer('span-full', 'Contents');
        const contentsGrid = document.createElement('div');
        contentsGrid.className = 'content-grid';

        const spriteColumn = document.createElement('div');
        spriteColumn.append(paragraph('Sprites'), fileList(sprites, base, true));

        const blockColumn = document.createElement('div');
        blockColumn.append(paragraph('Blocks'), fileList(blocks, base, false));

        contentsGrid.append(spriteColumn, blockColumn);
        contents.content.append(contentsGrid);

        mainEl.append(about.element, install.element, details.element, contents.element);
    }

    main();
})();
