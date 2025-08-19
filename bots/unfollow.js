import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'
import simulateInteraction from './simulateInteraction.js'

const args = process.argv.slice(2)
const settings = JSON.parse(args[0])
const username = settings.username
const minunfollow = settings.minunfollow * 1000
const maxunfollow = settings.minunfollow * 1000
let continueScript = true
let loadedProfiles = []
let unfollowedCount = 0
let alreadyRequested = 0
let invalidProfiles = 0
const selectors = {
  followers: 'ul > li:nth-child(2)',
  window: 'div[class="x6nl9eh x1a5l9x9 x7vuprf x1mg3h75 x1lliihq x1iyjqo2 xs83m0k xz65tgg x1rife3k x1n2onr6"]',
  profiles: 'div[class="html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x9f619 xjbqb8w x78zum5 x15mokao x1ga7v0g x16uus16 xbiv7yw x1uhb9sk x1plvlek xryxfnj x1c4vz4f x2lah0s x1q0g3np xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1"]',
  openOptionsButton: 'div[class="_ap3a _aaco _aacw _aad6 _aade"]',
  windowButtons: 'div[class="x1i10hfl x1qjc9v5 xjbqb8w xjqpnuy xc5r6h4 xqeqjp1 x1phubyo x13fuv20 x18b5jzi x1q0q8m5 x1t7ytsu x972fbf x10w94by x1qhh985 x14e42zd x9f619 x1ypdohk xdl72j9 x2lah0s x3ct3a4 xdj266r x14z9mp xat24cr x1lziwak x2lwn1j xeuugli xexx8yu xyri2b x18d9i69 x1c1uobl x1n2onr6 x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x87ps6o x1lku1pv x1a2a7pz x1qnrgzn x1cek8b2 xb10e19 x19rwo8q x1lliihq x193iq5w xh8yej3"]',
}
const page = await loadLoggedInPage()
const browser = await page.browser()

while (continueScript) {
  try {
    console.log(new Date().toLocaleTimeString(), 'Loading profile list')
    await page.goto('https://www.instagram.com/' + username)
    await page.waitForSelector(selectors.followers)
    await page.click(selectors.followers)
    await page.waitForSelector(selectors.window)
    let i = 0
    while (continueScript) {
      loadedProfiles = await page.$$(selectors.profiles)
      console.log(new Date().toLocaleTimeString(), loadedProfiles.length, 'profiles found')
      for (; i < loadedProfiles.length; i++) {
        let status
        let nodesLength = await page.evaluate(el => el.childNodes.length == 1, loadedProfiles[i])
        //nodesLength == 1 means that the profile is being followed or was already requested
        let userName = await page.evaluate(el => el.childNodes[0].innerText, loadedProfiles[i])
        if (nodesLength) {
          let profilePage = await browser.newPage()
          try {
            await profilePage.goto('https://www.instagram.com/' + userName)
            await profilePage.setViewport(null)
            await profilePage.waitForSelector(selectors.openOptionsButton)
            status = await profilePage.evaluate((openOptionsButtonSelector) => document.querySelector(openOptionsButtonSelector).innerText, selectors.openOptionsButton)
            await profilePage.click(selectors.openOptionsButton)
            if (status == 'Following') {
              await profilePage.waitForSelector(selectors.windowButtons)
              await profilePage.evaluate((selector) => {
                let buttons = document.querySelectorAll(selector)
                buttons[buttons.length - 1].click()
              }, selectors.windowButtons)
              console.log(new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'unfollowed')
              unfollowedCount++
              simulateInteraction(profilePage)
              await new Promise((r) => { setTimeout(r, getRandomBetween(minunfollow, maxunfollow)) })
            } else {
              console.log(new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'already requested')
              alreadyRequested++
              simulateInteraction(profilePage)
              await new Promise((r) => { setTimeout(r, getRandomBetween(5000, 15000)) })
            }
            await profilePage.close()
          } catch {
            await profilePage.close()
            console.log(new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'invalid profile')
            invalidProfiles++
            i++ //don't know why invalid profiles are duplicated
          }
        } else {
          console.log(new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'already not following')
        }
      }
      console.log(new Date().toLocaleTimeString(), 'Updating profile list')
      await page.evaluate((selector) => {
        const followersWindow = document.querySelector(selector)
        followersWindow.scrollTop = followersWindow.scrollHeight
      }, selectors.window)
      await new Promise((r) => { setTimeout(r, getRandomBetween(15000, 30000)) })
      try {
        await page.waitForFunction((selector, count) => {
          return document.querySelectorAll(selector).length > count
        }, { timeout: 15000 }, selectors.profiles, loadedProfiles.length)
      } catch {
        continueScript = false
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
console.log('Unfollowed count:', unfollowedCount)
console.log('Already requested count:', alreadyRequested)
console.log('Invalid profiles count:', invalidProfiles)
await browser.close()
console.log('Script finished')