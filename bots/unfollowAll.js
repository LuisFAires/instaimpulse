import * as utils from './utils.js';

utils.setupStopHandlers()
const settings = utils.loadSettings()
const username = settings.username
const minunfollow = settings.minunfollow * 1000
const maxunfollow = settings.minunfollow * 1000
let skippingDone = false
const selectors = {
  following: 'ul > li:nth-child(3)',
  window: 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]',
  buttons: 'button[class=" _aswp _aswr _aswv _asw_ _asx2"]',
  profiles: 'div[class="x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]',
  confirm: 'button[class="_a9-- _ap36 _a9-_"]',
}

const browser = await utils.newBrowserInstance()
const page = await browser.newPage()
await page.setViewport(null)
let profilePage

let profileList = []
async function loadMoreProfiles() {
  if (skippingDone) {
    try {
      await page.waitForFunction((selector, count) => {
        return document.querySelectorAll(selector).length > count
      }, { timeout: 15000 }, selectors.profiles, profileList.length)
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profiles loaded automatically✅')
      profileList = await page.$$(selectors.profiles)
      return true
    } catch (e) { }
  }
  await page.evaluate((selector) => {
    const followersWindow = document.querySelector(selector)
    followersWindow.scrollTop = followersWindow.scrollHeight
  }, selectors.window)
  try {
    await page.waitForFunction((selector, count) => {
      return document.querySelectorAll(selector).length > count
    }, { timeout: 15000 }, selectors.profiles, profileList.length)
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profiles loaded after scrolling✅')
    profileList = await page.$$(selectors.profiles)
    return true
  } catch (e) {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Error during profiles loading ❌❌❌')
    console.error(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), e)
    return false
  }
}

while (!utils.hasReceivedStopMessage()) {
  try {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Loading profile list⌛')
    await page.goto('https://www.instagram.com/' + username)
    await page.waitForSelector(selectors.following)
    await page.click(selectors.following)
    await page.waitForSelector(selectors.window)
    const profileSkipAmount = utils.getRandomBetween(50, 100) //every 4 is 1 hour in default settings
    while (!utils.hasReceivedStopMessage()) {
      let buttons = await page.$$(selectors.buttons)
      profileList = await page.$$(selectors.profiles)
      if (buttons[profileSkipAmount]) {
        let userToUnfollow = await page.evaluate((buttonsSelector, profileSkipAmount) => {
          return document.querySelectorAll(buttonsSelector)[profileSkipAmount].parentNode.parentNode.parentNode.children[1].children[0].children[0].children[0].innerText
        }, selectors.buttons, profileSkipAmount)
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Next profile:', userToUnfollow, '👀🤖🔜🎯')
        let profilePage = await browser.newPage()
        await profilePage.setViewport(null)
        await profilePage.goto('https://www.instagram.com/' + userToUnfollow)
        await utils.simulateInteraction(minunfollow, maxunfollow, profilePage)
        await profilePage.close()
        await buttons[profileSkipAmount].click()
        await page.waitForSelector(selectors.confirm)
        await page.click(selectors.confirm)
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Unfollowed✅')
        skippingDone = true
      } else if (!skippingDone) {
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Skipping recently followed profiles⏭️')
        let loaded = await loadMoreProfiles()
        utils.setStopMessage(!loaded)
      } else {
        let loaded = await loadMoreProfiles()
        utils.setStopMessage(!loaded)
      }
    }
  } catch (e) {
    utils.handleErrors(e, utils.hasReceivedStopMessage(), [profilePage])
  }
}
console.log('Script finished✅')
utils.stopBot();