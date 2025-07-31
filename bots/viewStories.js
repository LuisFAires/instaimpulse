import loadLoggedInPage from './loadLoggedInPage.js'
import getRandomBetween from './getRandomBetween.js'

const args = process.argv.slice(2)
const cookies = JSON.parse(args[0])
const minSkip = parseInt(args[1]) * 1000
const maxSkip = parseInt(args[2]) * 1000

const page = await loadLoggedInPage(cookies)
const skipButtonSelector = 'path[d="M12.005.503a11.5 11.5 0 1 0 11.5 11.5 11.513 11.513 0 0 0-11.5-11.5Zm3.707 12.22-4.5 4.488A1 1 0 0 1 9.8 15.795l3.792-3.783L9.798 8.21a1 1 0 1 1 1.416-1.412l4.5 4.511a1 1 0 0 1-.002 1.414Z"]'

while (true) {
  try {
    console.log(new Date().toLocaleTimeString(), 'Loading stories')
    await page.goto('https://www.instagram.com/')

    let randomIndex = getRandomBetween(0, 6)
    await page.waitForSelector('._acaz', { visible: true })
    let elements = await page.$$('._acaz', { visible: true })
    await elements[randomIndex].click()
    await page.waitForSelector(skipButtonSelector, { timeout: 5000 })
    console.log(new Date().toLocaleTimeString(), 'Stories playing')
    let continueLoop = true
    while (continueLoop) {
      await new Promise((r) => {
        let mainInterval = setInterval(async () => {
          try{
            let pageContentBeforeClick = await page.content()
            //Check for the skip button to ensure it's a story and not a live
            await page.waitForSelector(skipButtonSelector, { timeout: 3000 })
            await page.click(skipButtonSelector)
            console.log(new Date().toLocaleTimeString(), 'Skip button clicked')
            let pageContentAfterClick = await page.content()
            if (pageContentBeforeClick != pageContentAfterClick) {
              console.log(new Date().toLocaleTimeString(), 'Stories still playing')
            } else {
              throw new error(new Date().toLocaleTimeString(), 'Stories stopped playing')
            }
          }catch (error) {
            console.error(error)
            clearInterval(mainInterval)
            continueLoop = false
            console.log(new Date().toLocaleTimeString(), 'ERROR: Something went wrong, restarting script')
            r()
          }
        }, getRandomBetween(minSkip, maxSkip))
      })
    }

  } catch (error) {
    console.log(new Date().toLocaleTimeString(), 'ERROR: Something went wrong, Restarting...')
    //console.error(error)
  }
}