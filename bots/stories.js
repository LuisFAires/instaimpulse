import * as utils from './utils.js';

utils.setupStopHandlers()
const settings = utils.loadSettings()
const minskip = settings.minskip * 1000
const maxskip = settings.maxskip * 1000
const storiesSelector = 'li[class="_acaz"]'
const skipButtonSelector = 'path[d="M12.005.503a11.5 11.5 0 1 0 11.5 11.5 11.513 11.513 0 0 0-11.5-11.5Zm3.707 12.22-4.5 4.488A1 1 0 0 1 9.8 15.795l3.792-3.783L9.798 8.21a1 1 0 1 1 1.416-1.412l4.5 4.511a1 1 0 0 1-.002 1.414Z"]'

const browser = await utils.newBrowserInstance()
const page = await browser.newPage()
await page.setViewport(null)

while (!utils.hasReceivedStopMessage()) {
  try {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Loading stories⌛')
    await page.goto('https://www.instagram.com/')
    await page.waitForSelector(storiesSelector, { visible: true })
    let elements = await page.$$(storiesSelector, { visible: true })
    let randomIndex = utils.getRandomBetween(0, elements.length - 1)
    await elements[randomIndex].click()
    while (true) {
      //Check for the skip button to ensure it's a story and not a live
      await page.waitForSelector(skipButtonSelector, { timeout: 5000 })
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Stories playing✅')
      await utils.delay(minskip, maxskip)
      let pageContentBeforeClick = await page.content()
      await page.click(skipButtonSelector)
      console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Skip button clicked⏩🖱️✅')
      await utils.delay(1000, 4000)
      let pageContentAfterClick = await page.content()
      if (pageContentBeforeClick != pageContentAfterClick) {
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Content changed after clicking skip button✅')
      } else {
        console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), 'Page content  is not changing❌')
        break
      }
    }
  } catch (e) {
    utils.handleErrors(e, utils.hasReceivedStopMessage(), [])
  }
}
utils.stopBot();