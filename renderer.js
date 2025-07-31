const { ipcRenderer } = require('electron')

async function updateLoginStatus() {
  const status = await ipcRenderer.invoke('cookies-loaded')
  if (status) {
    document.getElementById('login-status').innerText = 'Already logged in✅, log in again only in case of errors'
    document.getElementById('login-status').classList.remove("blinking-text")
  } else {
    document.getElementById('login-status').innerText = 'No cookies found, login needed❌'
    document.getElementById('login-status').classList.add("blinking-text")
  }
}

function updateSettingsStatus(status) {
  if (status) {
    document.getElementById('settings-status').innerText = 'Settings saved✅'
    document.getElementById('settings-status').classList.remove("blinking-text")
  } else {
    document.getElementById('settings-status').innerText = 'Settings not saved❌'
    document.getElementById('settings-status').classList.add("blinking-text")
  }
}

async function beforeStartCheck() {
  if (!navigator.onLine) {
    alert('Check your internet connection')
    return false
  }
  const cookiesLoaded = await ipcRenderer.invoke('cookies-loaded')
  if (!cookiesLoaded) {
    alert('Please log in first')
    return false
  }
  return true
}

function updateInterfaceStatusByButton(button, status) {
  button.innerText = status ? 'Stop ⏹️' : 'Start ▶️'
  let element = document.getElementById(button.id + '-output')
  status ? element.classList.add('pulsing-glow') : element.classList.remove('pulsing-glow')
}

function setupOutputListener(channel, outputId) {
  ipcRenderer.on(channel, (event, data) => {
    const output = document.getElementById(outputId)
    output.value += data
    output.scrollTop = output.scrollHeight
  })
}

async function toggleBot(bot) {
  let checkup = await beforeStartCheck()
  if (!checkup) return
  isRunning[bot] = !isRunning[bot]
  ipcRenderer.send(`toggle-${bot}`, isRunning[bot], bot == 'unfollow' ? document.querySelector('input[name="unfollow-type"]:checked').value : null)
  updateInterfaceStatusByButton(document.getElementById(bot), isRunning[bot])
}

let isRunning = {
  follow: false,
  unfollow: false,
  stories: false
}

const followScriptButton = document.getElementById('follow')
const unfollowScriptButton = document.getElementById('unfollow')
const storiesScriptButton = document.getElementById('stories')

window.addEventListener('DOMContentLoaded', async () => {

  const formData = await ipcRenderer.invoke('load-settings')
  if (formData) {
    const form = document.getElementById('settings-form')
    for (const [key, value] of Object.entries(formData)) {
      form.querySelector(`[name="${key}"]`).value = value
    }
    updateSettingsStatus(true)
  } else {
    updateSettingsStatus(false)
  }


  document.getElementById('settings-form').addEventListener('keydown', function (event) {
    // Check if the Enter key was pressed and the target is an input (excluding textarea for new lines)
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
      event.preventDefault() // Stop the default action (form submission)
      console.log('Enter key pressed within an input, form submission prevented.')
    }
  })
})

document.getElementById('login').addEventListener('click', async () => {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  document.getElementById('login').innerText = 'PLEASE WAIT...⏳'
  const logged = await ipcRenderer.invoke('login-form', username, password)
  updateLoginStatus(logged)
  document.getElementById('login').innerText = 'Login'
})

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = document.getElementById('settings-form')
  const formData = new FormData(form)
  const formObject = Object.fromEntries(formData.entries())
  await ipcRenderer.invoke('save-settings', formObject)
  updateSettingsStatus(true)
})

document.getElementById('settings-form').addEventListener('input', (e) => {
  updateSettingsStatus(false)
})

followScriptButton.addEventListener('click', async () => {
  toggleBot('follow')
})
unfollowScriptButton.addEventListener('click', async () => {
  toggleBot('unfollow')
})
storiesScriptButton.addEventListener('click', async () => {
  toggleBot('stories')
})

updateLoginStatus()
setupOutputListener('update-follow', 'follow-output')
setupOutputListener('update-unfollow', 'unfollow-output')
setupOutputListener('update-stories', 'stories-output')
ipcRenderer.on('follow-closed', () => updateInterfaceStatusByButton(followScriptButton, false))
ipcRenderer.on('unfollow-closed', () => updateInterfaceStatusByButton(unfollowScriptButton, false))
ipcRenderer.on('stories-closed', () => updateInterfaceStatusByButton(storiesScriptButton, false))