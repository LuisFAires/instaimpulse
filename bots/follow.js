import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'

const args = process.argv.slice(2)
const settings = JSON.parse(args[0])
const similarPagesString = settings.similarpages
const minfollow = settings.minfollow * 1000
const maxfollow = settings.maxfollow * 1000
const minskippage = settings.minskippage * 1000
const maxskippage = settings.maxskippage * 1000
let cleanString = similarPagesString.replace(/\s+/g, "")
const originalSimilarPages = cleanString.split(",")
let similarPages = structuredClone(originalSimilarPages)

let keepCurrentPage = true

const selectors = {}
selectors.followers = ' ul > li:nth-child(2)'
selectors.followersWindow = 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]'
selectors.sugestionsWindow = 'div[class="html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x9f619 xjbqb8w x78zum5 x15mokao x1ga7v0g x16uus16 xbiv7yw x1n2onr6 x6ikm8r x1rife3k x1iyjqo2 x2lwn1j xeuugli xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1"]'
selectors.profile = 'div[class="x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]'
selectors.followButton = 'div[class="_ap3a _aaco _aacw _aad6 _aade"]'
selectors.buttons = 'button[class=" _aswp _aswr _aswu _asw_ _asx2"]'

const page = await loadLoggedInPage()
const browser = await page.browser()

if (similarPages.length == 0) {
  console.log('No similar pages provided, exiting script')
  await browser.close()
  process.exit(0)
}

while (true) {
  try {
    if (similarPages.length == 0) {
      similarPages = structuredClone(originalSimilarPages)
    }
    let randomIndex = getRandomBetween(0, similarPages.length - 1)
    let currentPage = similarPages[randomIndex]
    console.log(new Date().toLocaleTimeString(), 'Loading target page:', currentPage)
    await page.goto('https://www.instagram.com/' + currentPage)
    let skipCount = 0
    similarPages.splice(randomIndex, 1)
    await page.waitForSelector(selectors.followers)
    await page.click(selectors.followers)
    selectors.window = await Promise.race([
      page.waitForSelector(selectors.followersWindow).then(() => selectors.followersWindow),
      page.waitForSelector(selectors.sugestionsWindow).then(() => selectors.sugestionsWindow)
    ]);
    if (minskippage != 0 || maxskippage != 0) {
      setTimeout(() => {
        keepCurrentPage = false
        console.log(new Date().toLocaleTimeString(), 'Skipping page:', currentPage)
      }, getRandomBetween(minskippage, maxskippage))
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
        await page.setViewport(null)
        await profilePage.goto('https://www.instagram.com/' + userName)
        await profilePage.setViewport(null)
        await profilePage.waitForSelector(selectors.followButton)
        let status = await profilePage.evaluate((optionsButtonSelector) => document.querySelector(optionsButtonSelector).innerText, selectors.followButton)
        if (status == 'Follow Back') {
          console.log(new Date().toLocaleTimeString(), 'Already following you, profile skiped:', userName)
          await new Promise((r) => { setTimeout(r, 10000) })
        } else {
          await profilePage.click(selectors.buttons)
          console.log(new Date().toLocaleTimeString(), 'Follow request sent:', userName)
          await new Promise((r) => { setTimeout(r, getRandomBetween(minfollow, maxfollow)) })
        }
        skipCount++
        await profilePage.close()
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

    let pages = await browser.pages()
    while (pages.length > 1) {
      await pages[pages.length - 1].close()
      pages = await browser.pages()
    }
  }
}