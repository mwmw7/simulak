// SIMULAK Entertainment — Express 서버
// 정적 프론트엔드(AngularJS) 서빙 + 콘텐츠 API + OG 메타 동적 치환
const path = require("path");
const fs = require("fs");
const express = require("express");
const content = require("./data/content");

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

// index.html은 OG 치환을 위해 커스텀 렌더 (정적 서빙보다 우선)
app.get(["/", "/index.html"], renderIndex);

// 정적 자산 (CSS, JS, 이미지, 비디오 등). index.html 자동 서빙은 끔.
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// AngularJS가 소비하는 콘텐츠 API
app.get("/api/content", (req, res) => res.json(content));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", brand: content.brand.name, time: new Date().toISOString() })
);

// SPA fallback — 알 수 없는 경로는 (OG 치환된) index.html로
app.get("*", renderIndex);

app.listen(PORT, () => {
  console.log(`\n  ◈ SIMULAK ENTERTAINMENT`);
  console.log(`  ◈ 사람 없는 완벽함이 http://localhost:${PORT} 에서 가동 중\n`);
});
