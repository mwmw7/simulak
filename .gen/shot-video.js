const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"]
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:4173/?reveal=all", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // report video readiness
  const vids = await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll("video"), v => ({
    src: (v.currentSrc || v.getAttribute("src") || "").split("/").pop(),
    rs: v.readyState, w: v.videoWidth, h: v.videoHeight, paused: v.paused, t: +v.currentTime.toFixed(2)
  })));
  console.log("VIDEOS:" + JSON.stringify(vids));
  console.log("ERRORS:" + JSON.stringify(errors));

  await page.screenshot({ path: "/home/branden/simula_entertainment/.gen/video-hero.png" });
  await browser.close();
})().catch(e => { console.error("FAILED", e); process.exit(1); });
