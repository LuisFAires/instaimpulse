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

const bots = ['follow', 'unfollow', 'unfollowAll', 'stories']
let processes = {}

for (const bot of bots) {
  processes[bot] = null
  ipcMain.on(`toggle-${bot}`, (event, shouldStart) => {
    if (shouldStart) {
      processes[bot] = spawn('node', [path.join(app.getAppPath(), `bots/${bot}.js`), JSON.stringify(cookies), JSON.stringify(settings)])
      processes[bot].stdout.on('data', (data) => {
        mainWindow.webContents.send(`update-${bot}`, data.toString())
      })
      processes[bot].stderr.on('data', (data) => {
        //win.webContents.send(`update-${bot}`, data.toString())
        console.error(`${bot}err: ${data}`)
      })
      processes[bot].on('close', () => {
        mainWindow.webContents.send(`${bot}-closed`)
      })
    } else {
      if (processes[bot]) {
        processes[bot].kill()
        processes[bot] = null
      }
    }
  })
}