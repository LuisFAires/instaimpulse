import crypto from 'crypto';
import fs from 'fs'
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
puppeteer.use(StealthPlugin())

export async function newBrowserInstance() {
  const browser = await puppeteer.launch({
    //headless: false,
    protocolTimeout: 0,
    args: ['--start-maximized'],
  })
  await browser.setCookie(...loadCookies())
  let endpoint = await browser.wsEndpoint()
  console.log('Browser WS endpoint:\n\n', endpoint, '\n')
  return browser
}

export function getRandomBetween(min, max) {
  min = parseInt(min)
  max = parseInt(max)
  return crypto.randomInt(min, max + 1)
}

export async function delay(min, max) {
  return new Promise(resolve => setTimeout(resolve, getRandomBetween(min, max)));
}

export async function simulateInteraction(minTime, maxTime, page, hoverSelector = 'canvas, button, div[class="_aagw"]') {
  if (!page || typeof page.isClosed !== 'function') return
  const endTime = Date.now() + getRandomBetween(minTime, maxTime);
  while (Date.now() < endTime) {
    try {
      const height = await page.evaluate(() => window.innerHeight)
      const elements = await page.$$(hoverSelector)
      if (elements.length === 0) continue
      const element = elements[getRandomBetween(0, elements.length - 1)]
      const box = await element.boundingBox()
      if (!box) continue
      const scrollAmount = box.y - getRandomBetween(height * 0.2, height * 0.8)
      await page.evaluate(y => window.scrollBy(0, y), scrollAmount);
      await delay(1000, 3000);
      await element.hover();
      await delay(1500, 3000);
    } catch (err) {
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Error during interaction simulation, exiting interaction loop❌❌❌');
      console.error(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), err);
      return
    }
  }
}

export function loadCookies() {
  let cookies
  const cookiesPath = path.join(__dirname, 'cookies.json')
  if (fs.existsSync(cookiesPath)) {
    const data = fs.readFileSync(cookiesPath)
    cookies = JSON.parse(data)
  }
  return cookies
}

export function loadSettings() {
  let settings = {}
  const settingsPath = path.join(__dirname, 'settings.json')
  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath)
    settings = JSON.parse(data)
  }
  return settings
}

let stopMessage = false;

export function hasReceivedStopMessage() {
  return stopMessage;
}

export function setStopMessage(value) {
  stopMessage = value;
}


export function stopBot() {
  console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Bot stopped✋🏻🛑');
  process.exit(0);
}

export function setupStopHandlers() {
  process.on('message', async msg => {
    if (msg.type === 'stop') {
      stopMessage = true;
      stopBot();
    }
  });
  process.on('SIGINT', async () => {
    stopMessage = true;
    stopBot();
  });
}

export async function handleErrors(err, stopMessage, pagesToClose = []) {
  if (stopMessage) return;
  console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'ERROR: Something went wrong, restarting script❌❌❌')
  console.error(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), err);
  for (const page of pagesToClose) {
    if (page && typeof page.isClosed === 'function' && !page.isClosed()) {
      await page.close();
    }
  }
}