import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'

const args = process.argv.slice(2)
const settings = JSON.parse(args[0])
const username = settings.username
const minunfollow = settings.minunfollow * 1000
const maxunfollow = settings.minunfollow * 1000

let continueScript = true

const selectors = {
  following: 'ul > li:nth-child(3)',
  window: 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]',
  buttons: 'button[class=" _aswp _aswr _aswv _asw_ _asx2"]',
  profiles: 'div[class="x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]',
  confirm: 'button[class="_a9-- _ap36 _a9-_"]',
}

const page = await loadLoggedInPage()

while (continueScript) {
  try {
    console.log(new Date().toLocaleTimeString(), 'Loading profile list')
    await page.goto('https://www.instagram.com/' + username)
    await page.waitForSelector(selectors.following)
    await page.click(selectors.following)
    await page.waitForSelector(selectors.window)

    while (continueScript) {
      let buttons = await page.$$(selectors.buttons)
      let loadedProfiles = await page.$$(selectors.profiles)
      if (buttons.length != 0) {
        let userName = await page.evaluate((buttonsSelector) => {
          return document.querySelector(buttonsSelector).parentNode.parentNode.parentNode.children[1].children[0].children[0].children[0].innerText
        }, selectors.buttons)
        await page.click(selectors.buttons)
        await page.waitForSelector(selectors.confirm)
        await page.click(selectors.confirm)
        console.log(new Date().toLocaleTimeString(), 'Unfollowing profile:', userName)
        await new Promise((r) => { setTimeout(r, getRandomBetween(minunfollow, maxunfollow)) })
      } else {
        console.log(new Date().toLocaleTimeString(), 'Updating profile list')
        await page.evaluate((selector) => {
          const followersWindow = document.querySelector(selector)
          followersWindow.scrollTop = followersWindow.scrollHeight
        }, selectors.window)
        try {
          await page.waitForFunction((selector, count) => {
            return document.querySelectorAll(selector).length > count
          }, { timeout: 15000 }, selectors.profiles, loadedProfiles.length)
        } catch {
          continueScript = false
        }
      }
    }
  } catch (e) {
    console.log(new Date().toLocaleTimeString(), 'ERROR: Something went wrong, restarting script')
    console.error(e)
  }
}
const browser = await page.browser()
await browser.close()
console.log('Script finished')