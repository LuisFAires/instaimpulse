<h1>InstaImpulse</h1>
<p align="center">
  <img src="https://raw.githubusercontent.com/LuisFAires/instaimpulse/refs/heads/main/icon.png" alt="logo" height="200">
</p>
InstaImpulse is a desktop automation tool for Instagram, built with Electron and Puppeteer. It automates actions like following users, unfollowing, and viewing stories, in set intervals to reduce detection risk.
<img width="100%" alt="127 0 0 1_5500_" src="https://github.com/user-attachments/assets/bed557c9-a45e-47bc-8991-387b167d1a0b" />

## Features

- **Auto-Follow:** Follows users from competitor or similar pages.
- **Auto-Unfollow:** Unfollows users who follow you or unfollows everyone.
- **Story Viewer:** Automatically views Instagram stories.
- **Settings Panel:** Configure intervals, target pages, and credentials.
- **Cookie Management:** Stores login cookies for persistent sessions.

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/LuisFAires/instaimpulse.git
   cd instaimpulse
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Start the application**
   ```sh
   npm start
   ```

### Usage

1. **Login:** Enter your Instagram username and password, then click "Log In".
2. **Configure Settings:** Set target pages, intervals, and other preferences.
3. **Save Settings:** Click "Save Settings" to store your configuration.
4. **Start Automation:** Use the side panel to start or stop auto-follow, unfollow, or story viewing.

## Project Structure

- `main.js` — Electron main process (window creation, IPC)
- `renderer.js` — Renderer process (UI and user interactions)
- `/bots` — Automation scripts:
  - `follow.js` — Follows followers from similar pages
  - `unfollowAll.js` — Unfollows all users
  - `unfollow.js` — Unfollows users who follow you
  - `stories.js` — Views Instagram stories
  - `login.js` — Handles Instagram login and cookie retrieval
  - `loadLoggedInPage.js` — Loads Puppeteer page with cookies
  - `getRandomBetween.js` — Utility for random intervals

## Assets

- `icon.png`, `icon.ico` — Application icons
- `start.bat`, `InstaImpulse.vbs` — Startup scripts
- `index.html` — User interface

## Notes

- For educational and personal use only. Please respect Instagram’s terms of service.
- Credentials and cookies are stored locally in the app directory.

---

For issues or contributions, please open an issue or pull request
