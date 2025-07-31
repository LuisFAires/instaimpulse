
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

export default async function login(username, password) {

  const browser = await puppeteer.launch({ /* headless: false  */ })
  const page = await browser.newPage()
  await page.setViewport(null)

  await page.goto('https://instagram.com/')
  await page.waitForSelector('input[name="username"]', { visible: true })
  await page.type('input[name="username"]', username, { delay: 10 })
  await page.waitForSelector('input[name="password"]', { visible: true })
  await page.type('input[name="password"]', password, { delay: 10 })
  await page.waitForSelector('button[type="submit"]', { visible: true })
  await page.click('button[type="submit"]')
  await page.waitForNavigation()
  await page.waitForSelector('._aswp._aswr._aswu._asw_._asx2', { visible: true })
  await page.click('._aswp._aswr._aswu._asw_._asx2')
  await page.waitForNavigation()

  let cookies = await browser.cookies()
  await browser.close()
  return cookies
}