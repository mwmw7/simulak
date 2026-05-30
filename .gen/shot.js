const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"]
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  // Full page (reveal hook on) at desktop width
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:4173/?reveal=all", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: "/home/branden/simula_entertainment/.gen/full-desktop.png", fullPage: true });

  // Hero viewport (real reveal behavior, no hook)
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: "/home/branden/simula_entertainment/.gen/hero.png" });

  // Mobile full page
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto("http://localhost:4173/?reveal=all", { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: "/home/branden/simula_entertainment/.gen/full-mobile.png", fullPage: true });

  await browser.close();
  console.log("CONSOLE_ERRORS:" + JSON.stringify(errors));
})().catch(e => { console.error("SHOT_FAILED", e); process.exit(1); });
