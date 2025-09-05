import getRandomBetween from "./getRandomBetween.js";
export default async function simulateInteraction(page, hoverSelector = 'canvas, button, div[class="_aagw"]') {
  while (!page.isClosed()) {
    try {
      const height = await page.evaluate(() => window.innerHeight);
      const elements = await page.$$(hoverSelector);
      const element = elements[getRandomBetween(0, elements.length - 1)];
      const { y } = await element.boundingBox();
      const scrollAmount = y - getRandomBetween(height * 0.2, height * 0.8);
      await page.evaluate(y => window.scrollBy(0, y), scrollAmount);
      await new Promise((r) => { setTimeout(r, getRandomBetween(1000, 3000)) })
      await element.hover();
      await new Promise((r) => { setTimeout(r, getRandomBetween(1500, 3000)) })
    } catch (err) {
      //errors here are ignored cause sometimes it can try to interact when the page is already closed
    }
  }
}
