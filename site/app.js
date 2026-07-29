/*
 * VibeIDE landing — progressive enhancement only.
 * Everything here is optional: with JS disabled the page still shows working download
 * links (they point at GitHub's stable `releases/latest/download/...` endpoints).
 */

(function () {
	'use strict';

	// ---------- theme ----------

	const THEME_KEY = 'vibeide-theme';
	const root = document.documentElement;

	const applyTheme = theme => {
		root.dataset.theme = theme;
		const icon = document.querySelector('[data-theme-icon]');
		if (icon) { icon.textContent = theme === 'dark' ? '☾' : '☀'; }
	};

	const stored = (() => {
		try { return localStorage.getItem(THEME_KEY); } catch { return null; }
	})();

	if (stored === 'light' || stored === 'dark') {
		applyTheme(stored);
	} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
		applyTheme('light');
	}

	const toggle = document.querySelector('.theme-toggle');
	if (toggle) {
		toggle.addEventListener('click', () => {
			const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
			applyTheme(next);
			try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode — theme just won't persist */ }
		});
	}

	// ---------- copy-to-clipboard ----------

	document.querySelectorAll('[data-copy]').forEach(el => {
		const copy = async () => {
			try {
				await navigator.clipboard.writeText(el.dataset.copy);
				el.classList.add('copied');
				setTimeout(() => el.classList.remove('copied'), 1600);
			} catch { /* clipboard blocked — the text is selectable anyway */ }
		};
		el.addEventListener('click', copy);
		el.addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
		});
	});

	// ---------- releases ----------

	const REPO = 'VibeBrains/VibeIDE';
	const API = `https://api.github.com/repos/${REPO}/releases?per_page=10`;

	const statusEl = document.querySelector('[data-releases-status]');
	const listEl = document.querySelector('[data-releases-list]');

	const fmtDate = iso => {
		const d = new Date(iso);
		return isNaN(d) ? '' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
	};

	const fmtSize = bytes => `${(bytes / 1024 / 1024).toFixed(0)} МБ`;

	/** Only real app builds — helper releases (models, video tools) are not downloads for users. */
	const isAppRelease = release => /^v\d+\.\d+\.\d+$/.test(release.tag_name);

	const platformOf = name => {
		if (/\.exe$/i.test(name)) { return { os: 'windows', label: 'Windows · установщик' }; }
		if (/win32.*\.zip$/i.test(name)) { return { os: 'windows', label: 'Windows · portable' }; }
		if (/\.dmg$/i.test(name)) { return { os: 'macos', label: 'macOS · DMG' }; }
		if (/darwin.*\.zip$/i.test(name)) { return { os: 'macos', label: 'macOS · ZIP' }; }
		return null;
	};

	const setHeroVersion = release => {
		const v = document.getElementById('latest-version');
		const d = document.getElementById('latest-date');
		if (v) { v.textContent = release.tag_name; }
		if (d) { d.textContent = `от ${fmtDate(release.published_at)}`; }
	};

	/**
	 * Points each download button at the newest build that actually exists FOR THAT PLATFORM.
	 * Releases are per-platform here (a macOS-only fix release is normal), so "latest release"
	 * and "latest Windows build" are not the same thing — sending Windows users to a macOS-only
	 * tag would hand them a 404 on the main call to action.
	 */
	const wireDownloadButtons = releases => {
		const newestFor = os => {
			for (const release of releases) {
				const asset = (release.assets || []).find(a => {
					const p = platformOf(a.name);
					return p && p.os === os && !/portable|win32.*\.zip/i.test(a.name);
				}) || (release.assets || []).find(a => {
					const p = platformOf(a.name);
					return p && p.os === os;
				});
				if (asset) { return { release, asset }; }
			}
			return null;
		};

		['windows', 'macos'].forEach(os => {
			const found = newestFor(os);
			if (!found) { return; }
			document.querySelectorAll(`[data-dl="${os}"]`).forEach(btn => {
				btn.href = found.asset.browser_download_url;
			});
			document.querySelectorAll(`[data-dl-sub="${os}"]`).forEach(sub => {
				const label = os === 'windows' ? 'установщик .exe' : 'Apple Silicon, .dmg';
				sub.textContent = `${label} · ${found.release.tag_name} · ${fmtSize(found.asset.size)}`;
			});
		});
	};

	const renderReleases = releases => {
		if (!listEl) { return; }
		listEl.innerHTML = '';

		releases.slice(0, 3).forEach(release => {
			const li = document.createElement('li');

			const tag = document.createElement('span');
			tag.className = 'release-tag';
			tag.textContent = release.tag_name;
			li.appendChild(tag);

			const date = document.createElement('span');
			date.className = 'release-date';
			date.textContent = fmtDate(release.published_at);
			li.appendChild(date);

			const assets = document.createElement('span');
			assets.className = 'release-assets';
			(release.assets || []).forEach(asset => {
				const platform = platformOf(asset.name);
				if (!platform) { return; }
				const a = document.createElement('a');
				a.href = asset.browser_download_url;
				a.rel = 'noopener';
				a.textContent = `${platform.label} · ${fmtSize(asset.size)}`;
				assets.appendChild(a);
			});
			if (assets.childElementCount) { li.appendChild(assets); }

			listEl.appendChild(li);
		});

		listEl.hidden = false;
		if (statusEl) { statusEl.hidden = true; }
	};

	fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
		.then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
		.then(all => {
			const releases = all.filter(r => isAppRelease(r) && !r.draft);
			if (!releases.length) { throw new Error('no app releases'); }
			setHeroVersion(releases[0]);
			wireDownloadButtons(releases);
			renderReleases(releases);
		})
		.catch(() => {
			// Rate-limited or offline: the static links in the markup stay as they are.
			if (statusEl) {
				statusEl.textContent = 'Список релизов сейчас недоступен — ссылки ниже ведут на GitHub.';
			}
		});
})();
