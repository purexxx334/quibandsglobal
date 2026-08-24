import { chromium } from 'playwright';

async function testMobile() {
  console.log('Launching browser with mobile emulation (iPhone 13)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR]: ${err.message}`));

  console.log('Navigating to http://localhost:5173 or building preview...');
  // Let's test with https://quibandsglobal.com directly!
  await page.goto('https://quibandsglobal.com', { waitUntil: 'networkidle', timeout: 30000 });

  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      id: f.id,
      src: f.src,
      style: f.getAttribute('style'),
      rect: f.getBoundingClientRect()
    }));
  });
  
  console.log('Found iframes:', JSON.stringify(iframes, null, 2));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      id: b.id,
      style: b.getAttribute('style'),
      text: b.innerText,
      rect: b.getBoundingClientRect()
    }));
  });
  console.log('Found buttons:', buttons.filter(b => b.id.includes('chat') || b.id.includes('smartsupp')));

  console.log('Console logs:', logs);

  console.log('Clicking the chat button...');
  await page.evaluate(() => {
    const btn = document.getElementById('smartsupp-launch-btn') || document.querySelector('button[aria-label="Open Live Chat"]');
    if (btn) (btn as HTMLElement).click();
  });

  await page.waitForTimeout(3000);

  const iframesAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      id: f.id,
      src: f.src,
      style: f.getAttribute('style'),
      rect: f.getBoundingClientRect()
    }));
  });
  console.log('Iframes after click:', JSON.stringify(iframesAfter, null, 2));

  await browser.close();
}

testMobile();
