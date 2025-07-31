import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
puppeteer.use(StealthPlugin())

export default async function loadLoggedInPage(cookies) {

	const browser = await puppeteer.launch({
		//headless: false,
		protocolTimeout: 0,
		args: ['--start-maximized'],
	})

	await browser.setCookie(...cookies)

	const page = await browser.newPage()
	await page.setViewport(null)
	return page
}