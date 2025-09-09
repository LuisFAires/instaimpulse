import getRandomBetween from "./getRandomBetween.js";
export default async function simulateInteraction(page, hoverSelector = 'canvas, button, div[class="_aagw"]') {
  if (!page || typeof page.isClosed !== 'function') return;
  while (!page.isClosed()) {
    try {
      const height = await page.evaluate(() => window.innerHeight);
      const elements = await page.$$(hoverSelector);
      if (elements.length === 0) continue;
      const element = elements[getRandomBetween(0, elements.length - 1)];
      const box = await element.boundingBox();
      if (!box) continue;
      const scrollAmount = box.y - getRandomBetween(height * 0.2, height * 0.8);
      await page.evaluate(y => window.scrollBy(0, y), scrollAmount);
      await new Promise((r) => { setTimeout(r, getRandomBetween(1000, 3000)) })
      await element.hover();
      await new Promise((r) => { setTimeout(r, getRandomBetween(1500, 3000)) })
    } catch (err) {
      return; // Exit needed otherwise unwanted CPU usage
      //errors here are ignored cause sometimes it can try to interact when the page is already closed
    }
  }
}