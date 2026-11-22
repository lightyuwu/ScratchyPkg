(() => {
    const STORAGE_KEY = 'scratchypkg-theme';
    const root = document.documentElement;
    const stylesheet = document.getElementById('theme-stylesheet');
    const toggle = document.querySelector('.theme-toggle');

    if (!stylesheet || !toggle) return;

    function apply(theme) {
        root.dataset.theme = theme;
        stylesheet.href = `styles/${theme}.css`;

        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (_) {
            // Storage may be unavailable; the theme still applies for this page.
        }
    }

    let saved = 'light';
    try {
        saved = localStorage.getItem(STORAGE_KEY) || 'light';
    } catch (_) {
        // Ignore unreadable storage.
    }

    apply(saved === 'dark' ? 'dark' : 'light');

    toggle.addEventListener('click', () => {
        apply(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
})();
