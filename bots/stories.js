import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'

const args = process.argv.slice(2)
const settings = JSON.parse(args[0])
const minskip = settings.minskip * 1000
const maxskip = settings.maxskip * 1000

const page = await loadLoggedInPage()
const storiesSelector = 'li[class="_acaz"]'
const skipButtonSelector = 'path[d="M12.005.503a11.5 11.5 0 1 0 11.5 11.5 11.513 11.513 0 0 0-11.5-11.5Zm3.707 12.22-4.5 4.488A1 1 0 0 1 9.8 15.795l3.792-3.783L9.798 8.21a1 1 0 1 1 1.416-1.412l4.5 4.511a1 1 0 0 1-.002 1.414Z"]'

while (true) {
  try {
    console.log(new Date().toLocaleTimeString(), 'Loading stories⌛')
    await page.goto('https://www.instagram.com/')
    await page.waitForSelector(storiesSelector, { visible: true })
    let elements = await page.$$(storiesSelector, { visible: true })
    let randomIndex = getRandomBetween(0, elements.length - 1)
    await elements[randomIndex].click()
    await page.waitForSelector(skipButtonSelector, { timeout: 5000 })
    await new Promise(resolve => setTimeout(resolve, getRandomBetween(1000, 4000)))
    let pageContentBeforeClick = await page.content()
    while (true) {
      //Check for the skip button to ensure it's a story and not a live
      await page.waitForSelector(skipButtonSelector, { timeout: 3000 })
      console.log(new Date().toLocaleTimeString(), 'Stories playing✅')
      await new Promise(resolve => setTimeout(resolve, getRandomBetween(minskip, maxskip)))
      await page.click(skipButtonSelector)
      console.log(new Date().toLocaleTimeString(), 'Skip button clicked⏩🖱️✅')
      await new Promise((r) => { setTimeout(r, getRandomBetween(1000, 4000)) })
      let pageContentAfterClick = await page.content()
      if (pageContentBeforeClick != pageContentAfterClick) {
        console.log(new Date().toLocaleTimeString(), 'Content changed after clicking skip button✅')
      } else {
        console.log(new Date().toLocaleTimeString(), 'Page content  is not changing❌')
        break
      }
    }

  } catch (error) {
    console.log(new Date().toLocaleTimeString(), 'ERROR: Something went wrong, Restarting...❌❌❌')
    console.error(error)
  }
}