import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const browser = await chromium.launch();
const page    = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5199');
await page.waitForTimeout(1200);

// Screenshot 1: initial load
await page.screenshot({ path: '/tmp/ts-01-initial.png', fullPage: true });

// Gather layout info
const info = await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && el.offsetWidth > 0;
  });

  const sections = [...document.querySelectorAll('header, section, footer, svg, button, label')].map(el => ({
    tag:    el.tagName,
    text:   el.innerText?.slice(0, 60).replace(/\n/g, ' '),
    w:      el.offsetWidth,
    h:      el.offsetHeight,
    top:    el.getBoundingClientRect().top,
    left:   el.getBoundingClientRect().left,
  }));

  return {
    title:    document.title,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    sections,
    fonts: [...new Set(all.map(e => getComputedStyle(e).fontFamily).filter(Boolean))].slice(0, 6),
    colors: [...new Set(all.map(e => getComputedStyle(e).color).filter(Boolean))].slice(0, 8),
    scrollHeight: document.body.scrollHeight,
  };
});

writeFileSync('/tmp/ts-layout.json', JSON.stringify(info, null, 2));

// Interact: drag a feel control
const svgs = page.locator('section svg[style*="cursor: ew-resize"]');
const count = await svgs.count();

let dragInfo = `Found ${count} draggable feel controls.\n`;

if (count > 0) {
  const first = svgs.nth(0);
  const box   = await first.boundingBox();
  if (box) {
    // drag from center-left to center-right
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/ts-02-after-drag.png', fullPage: true });
    dragInfo += `Dragged first control from 30% → 75%.`;
  }
}

// Click A/B checkbox
const ab = page.locator('label', { hasText: 'A/B' });
if (await ab.count() > 0) {
  await ab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ts-03-ab.png', fullPage: true });
}

// Click save state
const saveBtn = page.locator('button', { hasText: '+ save state' }).first();
if (await saveBtn.count() > 0) {
  await saveBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ts-04-saved.png', fullPage: true });
}

console.log('=== LAYOUT REPORT ===');
console.log('Viewport:', info.viewport);
console.log('Scroll height:', info.scrollHeight);
console.log('Fonts detected:', info.fonts.join(', '));
console.log('\nElement inventory:');
info.sections.forEach(s => {
  console.log(`  [${s.tag}] ${s.w}×${s.h} @ (${Math.round(s.left)},${Math.round(s.top)}) — "${s.text}"`);
});
console.log('\n' + dragInfo);
console.log('Screenshots saved to /tmp/');

await browser.close();
