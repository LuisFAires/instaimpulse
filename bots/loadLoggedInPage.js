import fs from 'fs'
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
puppeteer.use(StealthPlugin())

export default async function loadLoggedInPage() {

	const browser = await puppeteer.launch({
		//headless: false,
		protocolTimeout: 0,
		args: ['--start-maximized'],
	})

	let cookies
	const cookiesPath = './cookies.json'
	if (fs.existsSync(cookiesPath)) {
	  const data = fs.readFileSync(cookiesPath)
	  cookies = JSON.parse(data)
	}

	await browser.setCookie(...cookies)

	const pages = await browser.pages()
	const page = pages[0]
	await page.setViewport(null)
	return page
}