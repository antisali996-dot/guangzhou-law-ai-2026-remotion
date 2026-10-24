// Render isolated QA frames with the still API (no sparse-frame audio mixing).
const fs = require('node:fs');
const path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {openBrowser, selectComposition, renderStill} = require('@remotion/renderer');
const root = path.resolve(__dirname, '../..');

async function main() {
  const output = path.resolve(root, process.argv[2]);
  const frames = process.argv.slice(3).map(Number);
  if (!frames.length || frames.some((n) => !Number.isInteger(n) || n < 0 || n >= 5040)) {
    throw new Error('Provide an output directory and valid Film frame numbers');
  }
  fs.mkdirSync(output, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'),
    outDir: path.join(output, 'bundle'), enableCaching: false});
  const logs = [];
  const onBrowserLog = (entry) => {
    if (entry.text.includes('[film-fonts]')) logs.push(entry.text);
  };
  const browser = await openBrowser('chrome', {
    browserExecutable: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    logLevel: 'error',
  });
  try {
    const composition = await selectComposition({serveUrl, id: 'Film',
      puppeteerInstance: browser, onBrowserLog, logLevel: 'error'});
    for (const frame of frames) {
      await renderStill({serveUrl, composition, frame, scale: 0.5,
        output: path.join(output, `frame-${frame}.png`), imageFormat: 'png',
        puppeteerInstance: browser, onBrowserLog, logLevel: 'error'});
    }
    if (!logs.length) throw new Error('Font loader readiness was not observed in the rendered browser');
    fs.writeFileSync(path.join(output, 'fonts-ready.json'), JSON.stringify({frames, logs}, null, 2));
    console.log(`Rendered ${frames.length} stills; local font loading confirmed.`);
  } finally {
    await browser.close({silent: true});
  }
}
main().catch((error) => {console.error(error); process.exitCode = 1;});
