const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const { exec } = require("child_process");

let win;
let lastMode = null;

const ACTIVITY_FILE = "/tmp/anthony-last-activity";

function getLastActivitySecondsAgo() {
  try {
    const last = parseInt(fs.readFileSync(ACTIVITY_FILE, "utf8").trim(), 10);
    const now = Math.floor(Date.now() / 1000);
    return now - last;
  } catch {
    return 999;
  }
}

function setBrightness(value) {
  exec(`
curl -s -X PUT \
-H "Content-Type: application/json" \
-H "Govee-API-Key: ${process.env.GOVEE_API_KEY}" \
-d '{
  "device":"43:9F:C7:38:30:33:53:8B",
  "model":"H6076",
  "cmd":{
    "name":"brightness",
    "value":${value}
  }
}' \
https://developer-api.govee.com/v1/devices/control
`);
}

function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 300,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("index.html");

  setInterval(() => {
    const idleSeconds = getLastActivitySecondsAgo();
    const mode = idleSeconds >= 10 ? "chill" : "work";

    if (mode !== lastMode) {
      lastMode = mode;

      if (mode === "work") {
        console.log("WORK MODE → brightness 80");
        setBrightness(80);
      } else {
        console.log("CHILL MODE → brightness 20");
        setBrightness(20);
      }
    }

    win.webContents.send("status", {
      mode,
      idleSeconds
    });
  }, 500);
}

app.whenReady().then(createWindow);