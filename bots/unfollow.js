import * as utils from './utils.js';

utils.setupStopHandlers()
const settings = utils.loadSettings()
const username = settings.username
const minunfollow = settings.minunfollow * 1000
const maxunfollow = settings.maxunfollow * 1000
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

const browser = await utils.newBrowserInstance()
const page = await browser.newPage()
await page.setViewport(null)
let profilePage

while (!utils.hasReceivedStopMessage()) {
  try {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Loading profile list⌛')
    await page.goto('https://www.instagram.com/' + username)
    await page.waitForSelector(selectors.followers)
    await page.click(selectors.followers)
    await page.waitForSelector(selectors.window)
    let i = 0
    while (!utils.hasReceivedStopMessage()) {
      loadedProfiles = await page.$$(selectors.profiles)
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), loadedProfiles.length, 'profiles found🔍')
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
              console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Next profile:', userName, '👀🤖🔜🎯')
              await utils.simulateInteraction(minunfollow, maxunfollow, profilePage)
              await profilePage.waitForSelector(selectors.windowButtons)
              await profilePage.evaluate((selector) => {
                let buttons = document.querySelectorAll(selector)
                buttons[buttons.length - 1].click()
              }, selectors.windowButtons)
              unfollowedCount++
              console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'unfollowed✅')
              await utils.delay(3000, 5000);
            } else {
              console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'already requested⛔')
              alreadyRequested++
              await utils.simulateInteraction(5000, 15000, profilePage)
            }
            await profilePage.close()
          } catch {
            await profilePage.close()
            console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'invalid profile⛔')
            invalidProfiles++
            i++ //don't know why invalid profiles are duplicated
          }
        } else {
          console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Profile', i + 1, 'of', loadedProfiles.length, userName, 'already not following⛔')
        }
      }
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Updating profile list🔄')
      await page.evaluate((selector) => {
        const followersWindow = document.querySelector(selector)
        followersWindow.scrollTop = followersWindow.scrollHeight
      }, selectors.window)
      await utils.delay(15000, 30000);
      try {
        await page.waitForFunction((selector, count) => {
          return document.querySelectorAll(selector).length > count
        }, { timeout: 15000 }, selectors.profiles, loadedProfiles.length)
      } catch {
        utils.setStopMessage(true)
      }
    }
  } catch (e) {
    utils.handleErrors(e, utils.hasReceivedStopMessage(), [profilePage])
  }
}
console.log('ℹ️Unfollowed count:', unfollowedCount)
console.log('ℹ️Already requested count:', alreadyRequested)
console.log('ℹ️Invalid profiles count:', invalidProfiles)
console.log('Script finished✅✅✅')
utils.stopBot();