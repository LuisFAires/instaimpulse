import * as utils from './utils.js';

utils.setupStopHandlers()
const settings = utils.loadSettings()
const similarPagesString = settings.similarpages
const minfollow = settings.minfollow * 1000
const maxfollow = settings.maxfollow * 1000
const minskippage = settings.minskippage * 1000
const maxskippage = settings.maxskippage * 1000
let cleanString = similarPagesString.replace(/\s+/g, "")
const originalSimilarPages = [...new Set(cleanString.split(","))]
let similarPages = structuredClone(originalSimilarPages)
let keepCurrentPage
const selectors = {}
selectors.followers = ' ul > li:nth-child(2)'
selectors.followersWindow = 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]'
selectors.sugestionsWindow = 'div[class="html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x9f619 xjbqb8w x78zum5 x15mokao x1ga7v0g x16uus16 xbiv7yw x1n2onr6 x6ikm8r x1rife3k x1iyjqo2 x2lwn1j xeuugli xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1"]'
selectors.profile = 'div[class="x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]'
selectors.followButton = 'div[class="_ap3a _aaco _aacw _aad6 _aade"]'
selectors.buttons = 'button[class=" _aswp _aswr _aswu _asw_ _asx2"]'

const browser = await utils.newBrowserInstance()
const page = await browser.newPage()
await page.setViewport(null)
let profilePage

if (similarPages.length == 0) {
  console.log('No similar pages provided, exiting script ‼️❌')
  await browser.close()
  process.exit(0)
}

while (!utils.hasReceivedStopMessage()) {
  try {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Pages left to be target:', similarPages.length, '⚙️🔜🎯')
    if (similarPages.length == 0) {
      similarPages = structuredClone(originalSimilarPages)
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'No pages left, original list recovered. Pages found:', similarPages.length, '♻️')
    }
    let randomIndex = utils.getRandomBetween(0, similarPages.length - 1)
    let currentPage = similarPages[randomIndex]
    similarPages.splice(randomIndex, 1)
    let skipCount = 0
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Loading target page:', currentPage, '⌛')
    await page.goto('https://www.instagram.com/' + currentPage)
    await page.waitForSelector(selectors.followers)
    await page.click(selectors.followers)
    selectors.window = await Promise.race([
      page.waitForSelector(selectors.followersWindow).then(() => selectors.followersWindow),
      page.waitForSelector(selectors.sugestionsWindow).then(() => selectors.sugestionsWindow)
    ]);
    if (minskippage != 0 || maxskippage != 0) {
      setTimeout(() => {
        keepCurrentPage = false
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Skipping page:', currentPage, '⏩⏩⏩')
      }, utils.getRandomBetween(minskippage, maxskippage))
    }
    keepCurrentPage = true
    while (keepCurrentPage) {
      let buttons = await page.$$(selectors.window + ' ' + selectors.buttons)
      let loadedProfiles = await page.$$(selectors.profile)
      if (buttons.length != skipCount) {
        let userName = await page.evaluate((buttonsSelector, skipCount) => {
          return document.querySelectorAll(buttonsSelector)[skipCount].parentNode.parentNode.parentNode.children[1].children[0].children[0].children[0].innerText
        }, (selectors.window + ' ' + selectors.buttons), skipCount)
        let profilePage = await browser.newPage()
        await profilePage.setViewport(null)
        await profilePage.goto('https://www.instagram.com/' + userName)
        await profilePage.waitForSelector(selectors.followButton)
        let status = await profilePage.evaluate((optionsButtonSelector) => document.querySelector(optionsButtonSelector).innerText, selectors.followButton)
        if (status == 'Follow Back') {
          console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Already follows you, skipped:', userName, '⏩')
          await utils.simulateInteraction(5000, 15000, profilePage)
        } else {
          console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Next profile:', userName, '👀🤖🔜🎯')
          await utils.simulateInteraction(minfollow, maxfollow, profilePage)
          await profilePage.click(selectors.buttons)
          console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Follow request sent ✅')
          await utils.delay(3000, 5000);
        }
        skipCount++
        await profilePage.close()
      } else {
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Updating profile list 🔄')
        await page.evaluate((selector) => {
          const followersWindow = document.querySelector(selector)
          followersWindow.scrollTop = followersWindow.scrollHeight
        }, selectors.window)
        try {
          await page.waitForFunction((selector, count) => {
            return document.querySelectorAll(selector).length > count
          }, { timeout: 15000 }, selectors.profile, loadedProfiles.length)
        } catch {
          console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'No more profiles found at this page 🔀🆕✅')
          keepCurrentPage = false
        }
      }
    }
  } catch (e) {
    utils.handleErrors(e, utils.hasReceivedStopMessage(), [profilePage])
  }
}
utils.stopBot();