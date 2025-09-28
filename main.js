import { dialog, ipcMain, app, BrowserWindow } from 'electron'
import fs from 'fs'
import { fork } from 'child_process'
import login from './bots/login.js'
import { loadCookies, loadSettings } from './bots/utils.js'
let cookies = loadCookies()
let settings = loadSettings()

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
    icon: './icon.png',
    show: false
  })
  //mainWindow.webContents.openDevTools() 
  mainWindow.maximize()
  mainWindow.loadFile('index.html')
  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()
  mainWindow.show()
}

app.whenReady().then(() => {
  createWindow()
})

ipcMain.handle('load-settings', async () => {
  if (typeof settings == 'object') {
    return settings
  } else {
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
      fs.writeFileSync('./bots/cookies.json', JSON.stringify(newCookies, null, 2))
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
  fs.writeFileSync('./bots/settings.json', JSON.stringify(data, null, 2))
  settings = data
})

const bots = ['follow', 'unfollow', 'unfollowAll', 'stories']
let processes = {}

for (const bot of bots) {
  processes[bot] = null
  ipcMain.on(`toggle-${bot}`, (event, shouldStart) => {
    if (shouldStart) {
      processes[bot] = fork(`./bots/${bot}.js`, { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })
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
        processes[bot].send({ type: 'stop' });
        processes[bot].once('exit', () => {
          processes[bot] = null;
          mainWindow.webContents.send(`${bot}-closed`);
        });
      }
    }
  })
}