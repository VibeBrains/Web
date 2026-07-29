/*
 * Подставляет в site/index.html прямые ссылки на последние сборки каждой платформы.
 *
 * Зачем: релизы у нас ПОПЛАТФОРМЕННЫЕ — mac-only фикс делает `releases/latest` маковским,
 * и «универсальная» ссылка releases/latest/download/VibeIDESetup.exe отдаёт 404 (проверено
 * 2026-07-29 на v1.9.1). Поэтому статические ссылки в разметке — не «latest», а конкретные
 * URL последней сборки ПОД КАЖДУЮ платформу; app.js потом обновляет их на клиенте, если
 * с момента выката вышел новый релиз.
 *
 *   node scripts/refresh-links.mjs           # переписать index.html
 *   node scripts/refresh-links.mjs --check   # только проверить, ничего не писать (для CI/дифа)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'site/index.html');
const API = 'https://api.github.com/repos/VibeBrains/VibeIDE/releases?per_page=20';

const checkOnly = process.argv.includes('--check');

const platformOf = name => {
	if (/\.exe$/i.test(name)) { return { os: 'windows', rank: 0 }; }
	if (/win32.*\.zip$/i.test(name)) { return { os: 'windows', rank: 1 }; }
	if (/\.dmg$/i.test(name)) { return { os: 'macos', rank: 0 }; }
	if (/darwin.*\.zip$/i.test(name)) { return { os: 'macos', rank: 1 }; }
	return null;
};

const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
if (!res.ok) {
	console.error(`[refresh-links] GitHub API: HTTP ${res.status} — index.html не тронут.`);
	process.exit(1);
}

const releases = (await res.json()).filter(r => /^v\d+\.\d+\.\d+$/.test(r.tag_name) && !r.draft);

const newestFor = os => {
	for (const release of releases) {
		const candidates = (release.assets || [])
			.map(a => ({ asset: a, platform: platformOf(a.name) }))
			.filter(x => x.platform && x.platform.os === os)
			.sort((a, b) => a.platform.rank - b.platform.rank);
		if (candidates.length) { return { release, asset: candidates[0].asset }; }
	}
	return null;
};

const labelOf = { windows: 'установщик .exe', macos: 'Apple Silicon, .dmg' };

let html = readFileSync(htmlPath, 'utf8');
const before = html;
const report = [];

for (const os of ['windows', 'macos']) {
	const found = newestFor(os);
	if (!found) {
		console.error(`[refresh-links] нет ни одной сборки для ${os} — оставляю как было.`);
		continue;
	}
	const url = found.asset.browser_download_url;
	const mb = (found.asset.size / 1024 / 1024).toFixed(0);
	const sub = `${labelOf[os]} · ${found.release.tag_name} · ${mb} МБ`;

	html = html.replace(
		new RegExp(`(data-dl="${os}"\\s+href=")[^"]*(")`, 'g'),
		`$1${url}$2`
	);
	html = html.replace(
		new RegExp(`(<span class="btn-sub" data-dl-sub="${os}">)[^<]*(</span>)`, 'g'),
		`$1${sub}$2`
	);
	report.push(`${os}: ${found.release.tag_name} → ${found.asset.name} (${mb} МБ)`);
}

// Версия и дата в шапке-бейдже — по самому свежему релизу любой платформы.
if (releases.length) {
	const latest = releases[0];
	const date = new Date(latest.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
	html = html.replace(/(<strong id="latest-version">)[^<]*(<\/strong>)/, `$1${latest.tag_name}$2`);
	html = html.replace(/(<span id="latest-date">)[^<]*(<\/span>)/, `$1от ${date}$2`);
	report.push(`бейдж: ${latest.tag_name} от ${date}`);
}

report.forEach(line => console.log(`[refresh-links] ${line}`));

if (html === before) {
	console.log('[refresh-links] ссылки уже актуальны.');
	process.exit(0);
}

if (checkOnly) {
	console.error('[refresh-links] ссылки устарели — прогоните `node scripts/refresh-links.mjs`.');
	process.exit(1);
}

writeFileSync(htmlPath, html);
console.log('[refresh-links] index.html обновлён.');
