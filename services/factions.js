import fs from 'fs/promises';
import { parse } from 'node-html-parser';

const CACHE_PATH = './cache/factions_cache.html';
const WIKI_URL = 'https://total-war-warhammer.fandom.com/wiki/Factions';
const CACHE_TTL = 3600 * 1000; // 1 Stunde

// Cache laden oder aktualisieren
async function loadCacheOrFetch() {
  try {
    const stats = await fs.stat(CACHE_PATH);
    const age = Date.now() - stats.mtimeMs;
    if (age < CACHE_TTL) {
      const cached = await fs.readFile(CACHE_PATH, 'utf-8');
      global.log.info('[CACHE] Cache loaded');
      return cached;
    }
  } catch {}
  const res = await fetch(WIKI_URL);
  const html = await res.text();
  await fs.mkdir('./cache', { recursive: true });
  await fs.writeFile(CACHE_PATH, html, 'utf-8');
  global.log.info('[FETCH] Website reloaded and cache updated');
  return html;
}

// Fraktionen aus dem Cache parsen und in DB speichern
export async function updateFactions(db) {
  const html = await loadCacheOrFetch();
  const root = parse(html);

  const content =
    root.querySelector('#mw-content-text') ||
    root.querySelector('.mw-parser-output') ||
    root.querySelector('article') ||
    root;

  const tables = content.querySelectorAll('table');
  let totalLeaders = 0;

  for (const table of tables) {
    let factionName =
      table.querySelector('thead th')?.text?.trim() ||
      table.querySelector('tr th[colspan]')?.text?.trim() ||
      '';

    if (!factionName || /warhammer factions/i.test(factionName)) {
      let prev = table.previousElementSibling;
      while (prev && !/^H[23]$/.test(prev.tagName || '')) {
        prev = prev.previousElementSibling;
      }
      const headingText = (prev?.text || '').replace(/\[[^\]]+\]/g, '').trim();
      if (headingText) factionName = headingText;
    }

    if (!factionName) factionName = 'Unbekannt';

    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length - 1; i++) {
      const imgRow = rows[i];
      const nameRow = rows[i + 1];

      const imgCells = imgRow.querySelectorAll('td, th');
      const nameCells = nameRow?.querySelectorAll('td, th') || [];

      const imgsInRow = imgRow.querySelectorAll('img');
      if (!imgsInRow.length || !nameCells.length) continue;

      for (let col = 0; col < Math.min(imgCells.length, nameCells.length); col++) {
        const imgTag = imgCells[col]?.querySelector('img');
        if (!imgTag) continue;

        const bannerUrl =
          imgTag.getAttribute('data-src') ||
          imgTag.getAttribute('src') ||
          '';

        const link = nameCells[col]?.querySelector('a, span.new');
        const leaderName =
          (link?.text || '').trim() ||
          (nameCells[col]?.text || '').trim();

        if (!leaderName || !bannerUrl) continue;

        try {
          const exists = await db`
            SELECT 1 FROM leader WHERE leader_name = ${leaderName} AND banner = ${bannerUrl} LIMIT 1
          `;
          if (exists.length === 0) {
            await db`
              INSERT INTO leader (leader_name, faction, banner)
              VALUES (${leaderName}, ${factionName}, ${bannerUrl})
            `;
            totalLeaders++;
            global.log.info(`[DB] New: ${leaderName} (${factionName})`);
          }
        } catch (err) {
          global.log.error('[DB] Error during insert:', err);
        }
      }

      i++;
    }
  }

  if(totalLeaders === 0) {
    global.log.write('[INFO] Leaders are up to date.');
  } else {
    global.log.write(`[INFO] Total new leaders added: ${totalLeaders}`);
  }
}
