// SIMULAK Entertainment — Express 서버
// 정적 프론트엔드(AngularJS) 서빙 + 콘텐츠 API + OG 메타 동적 치환 + 방문자 추적
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require('cookie-parser');
const content = require("./data/content");
const contentEn = require("./data/content-en");

// === Telegram Notification ===
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '5618667954';
const visitThrottle = {};

async function sendTg(msg) {
  if (!TG_TOKEN) { console.log('[TG] No token, skipping'); return; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'HTML', disable_notification: false })
    });
    const data = await r.json();
    if (!data.ok) console.error('[TG] API error:', data.description);
    else console.log('[TG] Sent ok');
  } catch(e) { console.error('[TG] Error:', e.message); }
}

async function getGeoInfo(ip) {
  try {
    const cleanIp = ip.replace('::ffff:', '');
    if (cleanIp === '127.0.0.1' || cleanIp === '::1') return { country: 'Local', city: 'localhost', org: '-' };
    const r = await fetch(`http://ip-api.com/json/${cleanIp}?fields=country,city,regionName,org,isp&lang=ko`, { signal: AbortSignal.timeout(3000) });
    return await r.json();
  } catch { return { country: '?', city: '?', org: '?' }; }
}

const Database = require('better-sqlite3');
const analyticsDb = new Database(path.join(__dirname, 'data', 'analytics.db'));

// === Contacts table ===
analyticsDb.exec(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read INTEGER NOT NULL DEFAULT 0
)`);

// === Bug Reports table ===
analyticsDb.exec(`CREATE TABLE IF NOT EXISTS bug_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'bug',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  page_url TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  screen_size TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  country TEXT DEFAULT '',
  admin_note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

function saveBugReport(data) {
  const info = analyticsDb.prepare(`INSERT INTO bug_reports (user_id, username, title, description, category, page_url, browser, os, screen_size, ip, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.userId || null, data.username || '', data.title, data.description,
    data.category || 'bug', data.pageUrl || '', data.browser || '', data.os || '',
    data.screenSize || '', data.ip || '', data.country || ''
  );
  return info.lastInsertRowid;
}

function getBugReports(opts) {
  const { status, limit, offset } = opts || {};
  let sql = 'SELECT * FROM bug_reports';
  const params = [];
  if (status && status !== 'all') {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit || 50, offset || 0);
  return analyticsDb.prepare(sql).all(...params);
}

function getBugReportStats() {
  const total = analyticsDb.prepare('SELECT COUNT(*) as c FROM bug_reports').get().c;
  const open = analyticsDb.prepare("SELECT COUNT(*) as c FROM bug_reports WHERE status = 'open'").get().c;
  const investigating = analyticsDb.prepare("SELECT COUNT(*) as c FROM bug_reports WHERE status = 'investigating'").get().c;
  const resolved = analyticsDb.prepare("SELECT COUNT(*) as c FROM bug_reports WHERE status = 'resolved'").get().c;
  const closed = analyticsDb.prepare("SELECT COUNT(*) as c FROM bug_reports WHERE status = 'closed'").get().c;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recent7d = analyticsDb.prepare('SELECT COUNT(*) as c FROM bug_reports WHERE created_at >= ?').get(sevenDaysAgo).c;
  return { total, open, investigating, resolved, closed, recent7d };
}

function updateBugReport(id, data) {
  const sets = [];
  const params = [];
  if (data.status) { sets.push('status = ?'); params.push(data.status); }
  if (data.adminNote !== undefined) { sets.push('admin_note = ?'); params.push(data.adminNote); }
  if (data.priority) { sets.push('priority = ?'); params.push(data.priority); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  analyticsDb.prepare('UPDATE bug_reports SET ' + sets.join(', ') + ' WHERE id = ?').run(...params);
}

// === Migrate analytics columns ===
(function migrateAnalytics() {
  const cols = analyticsDb.pragma('table_info(analytics)').map(c => c.name);
  const additions = [
    ['session_id', 'TEXT', "''"],
    ['browser', 'TEXT', "''"],
    ['os', 'TEXT', "''"],
    ['is_bot', 'INTEGER', '0'],
    ['screen_size', 'TEXT', "''"],
    ['language', 'TEXT', "''"],
    ['duration_ms', 'INTEGER', '0']
  ];
  for (const [name, type, def] of additions) {
    if (!cols.includes(name)) {
      analyticsDb.exec(`ALTER TABLE analytics ADD COLUMN ${name} ${type} DEFAULT ${def}`);
      console.log(`[DB] Added column: ${name}`);
    }
  }
  // index for session queries
  try { analyticsDb.exec('CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id)'); } catch(e){}
})();

// === UA Parsing (no deps) ===
function parseUA(ua) {
  ua = ua || '';
  let browser = 'Other', os = 'Other', isBot = 0;
  // Bot detection
  if (/bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|googlebot|yandex|baidu|duckduck|semrush|ahref|bytespider|gptbot|claudebot/i.test(ua)) {
    isBot = 1;
  }
  // Browser
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE';
  // OS
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  return { browser, os, isBot };
}

const app = express();
const PORT = process.env.PORT || 3000;
const INDEX_FILE = path.join(__dirname, "public", "index.html");
const indexTemplate = fs.readFileSync(INDEX_FILE, "utf8");

// 자산 캐시 버스팅: app.js/styles.css 의 최신 수정시각으로 버전 토큰 생성.
// HTML 은 항상 동적으로 내려가므로, 파일이 바뀌면 ?v= 가 바뀌어 브라우저가 새 파일을 강제로 받음.
function assetVersion() {
  try {
    const files = ["js/app.js", "css/styles.css"].map((f) =>
      fs.statSync(path.join(__dirname, "public", f)).mtimeMs
    );
    return Math.floor(Math.max(...files)).toString(36);
  } catch (e) {
    return "1";
  }
}
const ASSET_VERSION = assetVersion();

app.enable("trust proxy"); // cloudflared/프록시 뒤에서 올바른 protocol/host 인식

// 요청 호스트 기준으로 절대 URL 베이스 계산 → OG 태그가 어떤 도메인에서도 정확
function baseUrl(req) {
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0].trim();
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function renderIndex(req, res) {
  const html = indexTemplate
    .replace(/__BASE__/g, baseUrl(req))
    .replace(/__V__/g, ASSET_VERSION);
  res.type("html").send(html);
}

// === Visitor tracking middleware ===
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    const now = Date.now();
    // Throttle: same IP once per 5 minutes
    if (!visitThrottle[ip] || now - visitThrottle[ip] > 300000) {
      visitThrottle[ip] = now;
      const ua = req.headers['user-agent'] || '';
      const device = /Mobile|Android|iPhone/i.test(ua) ? '📱 모바일' : '💻 데스크톱';
      const lang = (req.headers['accept-language'] || '').split(',')[0] || '?';
      const referer = req.headers['referer'] || '직접 접속';
      // Save to analytics + send telegram
      const deviceType = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
      const { browser: bName, os: osName, isBot } = parseUA(ua);
      const language = lang;
      getGeoInfo(ip).then(geo => {
        try { analyticsDb.prepare('INSERT INTO analytics (event_type,label,detail,ip,country,city,device,user_agent,referer,path,browser,os,is_bot,language) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('pageview','','',ip,geo.country||'',geo.city||'',deviceType,ua,referer,req.path,bName,osName,isBot,language); } catch(e){}
        sendTg(`🎬 <b>Simulak</b> 방문자!\n\n${device}\n🌍 <b>${geo.country || '?'}</b> ${geo.city || ''} ${geo.regionName || ''}\n🏢 ${geo.org || geo.isp || '-'}\n🌐 언어: ${lang}\n🔗 유입: ${referer.length > 60 ? referer.slice(0,60)+'...' : referer}\n📍 IP: <code>${ip}</code>`);
      });
    }
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// ─── Analytics Auth ────────────────────────────────────────────────────────
const ANALYTICS_CREDS = { username: 'mwmw7', password: '040201mM~!' };

app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ANALYTICS_CREDS.username && password === ANALYTICS_CREDS.password) {
    res.cookie('analytics_session', 'simulak_authed_2026', { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
});

app.get('/api/admin/auth/check', (req, res) => {
  res.json({ authenticated: req.cookies?.analytics_session === 'simulak_authed_2026' });
});

app.post('/api/admin/auth/logout', (req, res) => {
  res.clearCookie('analytics_session');
  res.json({ ok: true });
});

// === Menu click tracking API ===
app.post('/api/track', async (req, res) => {
  const { action, label, detail, session_id, screen, duration_ms } = req.body || {};
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
  const ua = req.headers['user-agent'] || '';
  const deviceType = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  const device = deviceType === 'mobile' ? '📱' : '💻';
  const { browser: bName, os: osName, isBot } = parseUA(ua);
  const lang = (req.headers['accept-language'] || '').split(',')[0] || '';
  try {
    analyticsDb.prepare('INSERT INTO analytics (event_type,label,detail,ip,device,user_agent,session_id,screen_size,duration_ms,browser,os,is_bot,language) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(action||'click', label||'', detail||'', ip, deviceType, ua, session_id||'', screen||'', parseInt(duration_ms)||0, bName, osName, isBot, lang);
  } catch(e){}
  
  const actionEmoji = {
    'menu_click': '👆',
    'section_view': '👀',
    'cta_click': '🔥',
    'scroll_depth': '📜',
    'video_play': '🎬',
    'contact_click': '📧',
  };
  const emoji = actionEmoji[action] || '📌';
  
  // DB only, no telegram for click events
  
  res.json({ ok: true });
});

// index.html은 OG 치환을 위해 커스텀 렌더 (정적 서빙보다 우선)
app.get(["/", "/index.html"], renderIndex);

// Favicon 강제 캐시 무효화
app.get(['/favicon.ico', '/favicon-16x16.png', '/favicon-32x32.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png', '/manifest.json'], (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// 정적 자산 (CSS, JS, 이미지, 비디오 등). index.html 자동 서빙은 끔.
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// === Analytics API & Dashboard ===
app.get('/api/admin/analytics', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const total = analyticsDb.prepare(`SELECT COUNT(*) as c FROM analytics WHERE created_at >= ?`).get(since).c;
  const byType = analyticsDb.prepare(`SELECT event_type, COUNT(*) as c FROM analytics WHERE created_at >= ? GROUP BY event_type ORDER BY c DESC`).all(since);
  const byCountry = analyticsDb.prepare(`SELECT country, COUNT(*) as c FROM analytics WHERE created_at >= ? AND country != '' GROUP BY country ORDER BY c DESC LIMIT 10`).all(since);
  const byDevice = analyticsDb.prepare(`SELECT device, COUNT(*) as c FROM analytics WHERE created_at >= ? AND device != '' GROUP BY device ORDER BY c DESC`).all(since);
  const byDay = analyticsDb.prepare(`SELECT date(created_at) as day, COUNT(*) as c FROM analytics WHERE created_at >= ? GROUP BY date(created_at) ORDER BY day`).all(since);
  const byLabel = analyticsDb.prepare(`SELECT label, COUNT(*) as c FROM analytics WHERE created_at >= ? AND event_type IN ('menu_click','cta_click','contact_click') AND label != '' GROUP BY label ORDER BY c DESC LIMIT 20`).all(since);
  const topPages = analyticsDb.prepare(`SELECT path, COUNT(*) as c FROM analytics WHERE created_at >= ? AND event_type = 'pageview' GROUP BY path ORDER BY c DESC LIMIT 10`).all(since);
  const recentVisitors = analyticsDb.prepare(`SELECT ip, country, city, device, browser, os, referer, created_at FROM analytics WHERE created_at >= ? AND event_type = 'pageview' ORDER BY id DESC LIMIT 30`).all(since);
  const uniqueIps = analyticsDb.prepare(`SELECT COUNT(DISTINCT ip) as c FROM analytics WHERE created_at >= ? AND event_type = 'pageview'`).get(since).c;

  // --- New analytics data ---
  // By hour (0-23)
  const byHour = analyticsDb.prepare(`SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as c FROM analytics WHERE created_at >= ? GROUP BY hour ORDER BY hour`).all(since);

  // By browser
  const byBrowser = analyticsDb.prepare(`SELECT browser, COUNT(*) as c FROM analytics WHERE created_at >= ? AND browser != '' GROUP BY browser ORDER BY c DESC LIMIT 10`).all(since);

  // By OS
  const byOS = analyticsDb.prepare(`SELECT os, COUNT(*) as c FROM analytics WHERE created_at >= ? AND os != '' GROUP BY os ORDER BY c DESC LIMIT 10`).all(since);

  // Referrer by domain
  const rawRefs = analyticsDb.prepare(`SELECT referer, COUNT(*) as c FROM analytics WHERE created_at >= ? AND event_type = 'pageview' GROUP BY referer ORDER BY c DESC`).all(since);
  const refDomainMap = {};
  for (const r of rawRefs) {
    let domain = 'Direct';
    try {
      if (r.referer && r.referer !== '직접 접속' && r.referer.startsWith('http')) {
        domain = new URL(r.referer).hostname.replace(/^www\./, '');
      }
    } catch(e) {}
    refDomainMap[domain] = (refDomainMap[domain] || 0) + r.c;
  }
  const byRefDomain = Object.entries(refDomainMap).map(([domain, c]) => ({ domain, c })).sort((a, b) => b.c - a.c).slice(0, 15);

  // New vs Returning (by IP within period)
  const ipVisitCounts = analyticsDb.prepare(`SELECT ip, COUNT(*) as c FROM analytics WHERE created_at >= ? AND event_type = 'pageview' GROUP BY ip`).all(since);
  let newV = 0, retV = 0;
  for (const row of ipVisitCounts) {
    if (row.c === 1) newV++; else retV++;
  }
  const newVsReturn = { new: newV, returning: retV };

  // Bounce rate: sessions with only 1 pageview / total sessions
  // Avg pages per session: total pageviews / unique sessions
  const sessionStats = analyticsDb.prepare(`SELECT session_id, COUNT(*) as pv FROM analytics WHERE created_at >= ? AND event_type = 'pageview' AND session_id != '' GROUP BY session_id`).all(since);
  // Also count IPs without session_id as individual sessions
  const noSessionPvs = analyticsDb.prepare(`SELECT ip, COUNT(*) as pv FROM analytics WHERE created_at >= ? AND event_type = 'pageview' AND (session_id = '' OR session_id IS NULL) GROUP BY ip`).all(since);
  const allSessions = [...sessionStats, ...noSessionPvs];
  const totalSessions = allSessions.length || 1;
  const bounces = allSessions.filter(s => s.pv === 1).length;
  const bounceRate = Math.round((bounces / totalSessions) * 10000) / 100;
  const totalPVsForAvg = allSessions.reduce((s, r) => s + r.pv, 0);
  const avgPagesPerVisit = Math.round((totalPVsForAvg / totalSessions) * 100) / 100;

  // Avg duration from time_on_page events
  const durRow = analyticsDb.prepare(`SELECT AVG(duration_ms) as avg_dur FROM analytics WHERE created_at >= ? AND event_type = 'time_on_page' AND duration_ms > 0`).get(since);
  const avgDuration = Math.round(durRow.avg_dur || 0);

  // Scroll depth distribution
  const byScrollDepth = analyticsDb.prepare(`SELECT label, COUNT(*) as c FROM analytics WHERE created_at >= ? AND event_type = 'scroll_depth' GROUP BY label ORDER BY label`).all(since);

  // Realtime: unique IPs in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
  const realtime = analyticsDb.prepare(`SELECT COUNT(DISTINCT ip) as c FROM analytics WHERE created_at >= ?`).get(fiveMinAgo).c;

  // Daily UV for chart
  const byDayUV = analyticsDb.prepare(`SELECT date(created_at) as day, COUNT(DISTINCT ip) as c FROM analytics WHERE created_at >= ? AND event_type = 'pageview' GROUP BY date(created_at) ORDER BY day`).all(since);

  // Hourly heatmap: day-of-week x hour
  const byDayHour = analyticsDb.prepare(`SELECT CAST(strftime('%w', created_at) AS INTEGER) as dow, CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as c FROM analytics WHERE created_at >= ? GROUP BY dow, hour`).all(since);

  res.json({
    total, uniqueIps, byType, byCountry, byDevice, byDay, byDayUV, byLabel, topPages, recentVisitors, days,
    byHour, byBrowser, byOS, byRefDomain, newVsReturn, bounceRate, avgPagesPerVisit, avgDuration,
    byScrollDepth, realtime, byDayHour
  });
});

app.get('/admin/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// AngularJS가 소비하는 콘텐츠 API (언어 지원)
app.get("/api/content", (req, res) => {
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'ko';
  res.json(lang === 'en' ? contentEn : content);
});
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", brand: content.brand.name, time: new Date().toISOString() })
);

// === Contact Form API ===
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
  try {
    const info = analyticsDb.prepare('INSERT INTO contacts (name, email, phone, message, ip) VALUES (?, ?, ?, ?, ?)').run(name, email, phone || '', message || '', ip);
    const id = info.lastInsertRowid;
    sendTg(`📩 <b>Simulak 문의</b>\n\n👤 ${name}\n📧 ${email}\n📞 ${phone || '-'}\n💬 ${message || '-'}\n\n#${id}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Contact] Error:', e.message);
    res.status(500).json({ error: 'internal error' });
  }
});

app.get('/api/admin/contacts', (req, res) => {
  const rows = analyticsDb.prepare('SELECT * FROM contacts ORDER BY id DESC').all();
  res.json(rows);
});

app.patch('/api/admin/contacts/:id/read', (req, res) => {
  analyticsDb.prepare('UPDATE contacts SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/contacts/:id', (req, res) => {
  analyticsDb.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// === Bug Reports API ===
app.post('/api/bug-report', async (req, res) => {
  try {
    const { title, description, category, page_url, screen_size } = req.body || {};
    if (!title || !description) return res.status(400).json({ error: '제목과 설명을 입력해주세요' });
    if (title.length > 200) return res.status(400).json({ error: '제목은 200자 이내로 작성해주세요' });
    if (description.length > 2000) return res.status(400).json({ error: '설명은 2000자 이내로 작성해주세요' });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    const ua = req.headers['user-agent'] || '';
    const { browser, os } = parseUA(ua);

    getGeoInfo(ip).then(function(geo) {
      const id = saveBugReport({
        title: title.trim(),
        description: description.trim(),
        category: category || 'bug',
        pageUrl: page_url || '',
        browser: browser, os: os,
        screenSize: screen_size || '',
        ip: ip, country: geo ? geo.country || '' : '',
      });
      sendTg('🐛 <b>Simulak 버그리포트</b>\n\n📌 ' + title.trim() + '\n📂 ' + (category || 'bug') + '\n\n#' + id);
      res.status(201).json({ success: true, id: id });
    }).catch(function() {
      const id = saveBugReport({
        title: title.trim(),
        description: description.trim(),
        category: category || 'bug',
        pageUrl: page_url || '',
        browser: browser, os: os,
        screenSize: screen_size || '',
        ip: ip, country: '',
      });
      sendTg('🐛 <b>Simulak 버그리포트</b>\n\n📌 ' + title.trim() + '\n📂 ' + (category || 'bug') + '\n\n#' + id);
      res.status(201).json({ success: true, id: id });
    });
  } catch (e) {
    console.error('[BugReport]', e.message);
    res.status(500).json({ error: '리포트 제출 실패' });
  }
});

app.get('/api/admin/bug-reports', function(req, res) {
  try {
    const { status, limit, offset } = req.query;
    const reports = getBugReports({ status: status, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 });
    const stats = getBugReportStats();
    res.json({ reports: reports, stats: stats });
  } catch (e) {
    console.error('[BugReport]', e.message);
    res.status(500).json({ error: 'bug reports fetch error' });
  }
});

app.patch('/api/admin/bug-reports/:id', function(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { status, admin_note, priority } = req.body || {};
    updateBugReport(id, { status: status, adminNote: admin_note, priority: priority });
    res.json({ success: true });
  } catch (e) {
    console.error('[BugReport]', e.message);
    res.status(500).json({ error: 'update error' });
  }
});

// SPA fallback — 알 수 없는 경로는 (OG 치환된) index.html로
app.get("*", renderIndex);

app.listen(PORT, () => {
  console.log(`\n  ◈ SIMULAK ENTERTAINMENT`);
  console.log(`  ◈ 사람 없는 완벽함이 http://localhost:${PORT} 에서 가동 중\n`);
});
