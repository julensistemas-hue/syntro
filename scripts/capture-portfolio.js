const { chromium } = require('playwright');
const path = require('path');

const PORTFOLIO_SITES = [
  { name: 'juabera', url: 'https://juabera-es.vercel.app/' },
  { name: 'aisecurity', url: 'https://aisecurity.es' }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'portfolio');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport for nice screenshots
  await page.setViewportSize({ width: 1400, height: 900 });

  for (const site of PORTFOLIO_SITES) {
    console.log('Capturing ' + site.name + ' from ' + site.url + '...');

    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for animations

      // Take screenshot
      const outputPath = path.join(OUTPUT_DIR, site.name + '.png');
      await page.screenshot({
        path: outputPath,
        clip: { x: 0, y: 0, width: 1400, height: 900 }
      });

      console.log('Saved ' + site.name + '.png to ' + outputPath);
    } catch (error) {
      console.error('Error capturing ' + site.name + ': ' + error.message);
    }
  }

  await browser.close();
  console.log('All screenshots captured!');
})();
