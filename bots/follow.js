import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'

const args = process.argv.slice(2)
const cookies = JSON.parse(args[0])
const similarPagesString = args[1]
const minfollow = args[2] * 1000
const maxfollow = args[3] * 1000
let cleanString = similarPagesString.replace(/\s+/g, "")
const originalSimilarPages = cleanString.split(",")
let similarPages = structuredClone(originalSimilarPages)

let keepCurrentPage = true

const selectors = {}
selectors.followers = ' ul > li:nth-child(2)'
selectors.window = 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]'
selectors.profile = 'div[class="x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]'
selectors.followButton = '._ap3a._aaco._aacw._aad6._aade'
selectors.buttons = selectors.window + ' button[class=" _aswp _aswr _aswu _asw_ _asx2"]'

const page = await loadLoggedInPage(cookies)
const browser = await page.browser()

if(similarPages.length == 0) {
  console.log('No similar pages provided, exiting script')
  await browser.close()
  process.exit(0)
}

while (true) {
  try {
    if (similarPages.length == 0) {
      similarPages = structuredClone(originalSimilarPages)
    }
    let randomIndex = getRandomBetween(0, similarPages.length)

    console.log(new Date().toLocaleTimeString(), 'Loading target page:', similarPages[randomIndex])
    await page.goto('https://www.instagram.com/' + similarPages[randomIndex])
    let skipCount = 0
    similarPages.splice(randomIndex, 1)
    
    await page.waitForSelector(selectors.followers)
    await page.click(selectors.followers)
    await page.waitForSelector(selectors.window)

    keepCurrentPage = true
    while (keepCurrentPage) {
      let buttons = await page.$$(selectors.buttons)
      let loadedProfiles = await page.$$(selectors.profile)
      if (buttons.length != skipCount) {
        let userName = await page.evaluate((buttonsSelector, skipCount) => {
          return document.querySelectorAll(buttonsSelector)[skipCount].parentNode.parentNode.parentNode.children[1].children[0].children[0].children[0].innerText
        }, selectors.buttons, skipCount)
        let profilePage = await browser.newPage()
        await page.setViewport(null)
        await profilePage.goto('https://www.instagram.com/' + userName)
        await profilePage.setViewport(null)
        await profilePage.waitForSelector(selectors.followButton)
        let status = await profilePage.evaluate((optionsButtonSelector) => document.querySelector(optionsButtonSelector).innerText, selectors.followButton)
        await profilePage.close()
        if (status == 'Follow Back') {
          console.log(new Date().toLocaleTimeString(), 'Already following you, profile skiped:', userName)
          skipCount++
        } else {
          await buttons[skipCount].click()
          console.log(new Date().toLocaleTimeString(), 'Follow request sent:', userName)
          await new Promise((r) => { setTimeout(r, getRandomBetween(minfollow, maxfollow)) })
        }
      } else {
        console.log(new Date().toLocaleTimeString(), 'Updating profile list')
        await page.evaluate((selector) => {
          const followersWindow = document.querySelector(selector)
          followersWindow.scrollTop = followersWindow.scrollHeight
        }, selectors.window)
        try {
          await page.waitForFunction((selector, count) => {
            return document.querySelectorAll(selector).length > count
          }, { timeout: 15000 }, selectors.profile, loadedProfiles.length)
        } catch {
          keepCurrentPage = false
        }
      }
    }

  } catch (e) {
    console.log(new Date().toLocaleTimeString(), 'ERROR: Something went wrong, restarting script')
    console.error(e)
  }
}