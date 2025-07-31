import { dialog, ipcMain, app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import login from './bots/login.js'

let settings
let cookies
const cookiesPath = path.join(app.getPath('userData'), 'cookies.json')
if (fs.existsSync(cookiesPath)) {
  const data = fs.readFileSync(cookiesPath)
  cookies = JSON.parse(data)
}

let followProcess = null
let unfollowProcess = null
let storiesProcess = null

let mainWindow
const createWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    width: 1400,
    height: 1000,
    icon: path.join(app.getAppPath() + '/icon.png')
  })
  //mainWindow.webContents.openDevTools()
  mainWindow.loadFile('index.html')
  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()
}

app.whenReady().then(() => {
  createWindow()
})

ipcMain.handle('load-settings', async () => {
  try {
    const filePath = path.join(app.getPath('userData'), 'settings.json')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath)
      settings = JSON.parse(data)
      return settings
    }
    return null
  } catch (error) {
    console.error('unable to load settings')
  }
})

ipcMain.handle('cookies-loaded', async () => {
  return typeof cookies == 'object' ? true : false
})

ipcMain.handle('login-form', async (event, username, password) => {
  try {
    const newCookies = await login(username, password)
    if (newCookies) {
      fs.writeFileSync(path.join(app.getPath('userData'), 'cookies.json'), JSON.stringify(newCookies, null, 2))
      cookies = newCookies
      dialog.showMessageBox({
        type: 'info',
        title: 'Login Successful',
        message: 'You have successfully logged in to Instagram. Cookies have been saved.',
        buttons: ['OK']
      })
      return true
    } else {
      throw new Error('Login failed, no cookies returned')
    }
  } catch (error) {
    dialog.showErrorBox('Oops!', 'Something went wrong. Please try again.')
    console.error('Login failed:', error)
    return false
  }
})

ipcMain.handle('save-settings', (event, data) => {
  const filePath = path.join(app.getPath('userData'), 'settings.json')
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  settings = data
})

ipcMain.on('toggle-follow', (event, shouldStart) => {
  if (shouldStart) {
    StartFollow()
  } else if (followProcess) {
    killfollow()
  }
  function StartFollow() {
    followProcess = spawn('node', [path.join(app.getAppPath(), 'bots/follow.js'), JSON.stringify(cookies), settings['similar-pages'], settings.minfollow, settings.maxfollow])
    followProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('update-follow', data.toString())
    })
    followProcess.stderr.on('data', (data) => {
      //win.webContents.send('update-follow', data.toString())
      console.error(`followerr: ${data}`)
    })
    followProcess.on('close', () => {
      mainWindow.webContents.send('follow-closed')
    })
  }
  function killfollow() {
    followProcess.kill()
    followProcess = null
  }
})

ipcMain.on('toggle-unfollow', (event, shouldStart, script) => {
  if (shouldStart) {
    startUnfollow(script)
  } else if (unfollowProcess) {
    killUnfollow()
  }
  function startUnfollow(script) {
    if (script === 'all') {
      unfollowProcess = spawn('node', [path.join(app.getAppPath(), 'bots/unfollowAll.js'), JSON.stringify(cookies), settings.username, settings.minunfollow, settings.maxunfollow])
    } else {
      unfollowProcess = spawn('node', [path.join(app.getAppPath(), 'bots/unfollowFollowing.js'), JSON.stringify(cookies), settings.username, settings.minunfollow, settings.maxunfollow])
    }
    unfollowProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('update-unfollow', data.toString())
    })
    unfollowProcess.stderr.on('data', (data) => {
      //win.webContents.send('update-unfollow', data.toString())
      console.error(`unfollowerr: ${data}`)
    })
    unfollowProcess.on('close', () => {
      mainWindow.webContents.send('unfollow-closed')
    })
  }
  function killUnfollow() {
    unfollowProcess.kill()
    unfollowProcess = null
  }
})

ipcMain.on('toggle-stories', (event, shouldStart) => {
  if (shouldStart) {
    startStories()
  } else {
    killStories()
  }
  function startStories() {
    storiesProcess = spawn('node', [path.join(app.getAppPath(), 'bots/viewStories.js'), JSON.stringify(cookies), settings.minskip, settings.maxskip])
    storiesProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('update-stories', data.toString())
    })
    storiesProcess.stderr.on('data', (data) => {
      //win.webContents.send('update-stories', data.toString())
      console.error(`storieserr: ${data}`)
    })
    storiesProcess.on('close', () => {
      mainWindow.webContents.send('stories-closed')
    })
  }
  function killStories() {
    storiesProcess.kill()
    storiesProcess = null
  }
})