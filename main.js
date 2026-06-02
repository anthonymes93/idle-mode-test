require("dotenv").config();
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const { spawn, exec } = require("child_process");
let win;
let lastMode = null;

const ACTIVITY_FILE = "/tmp/anthony-last-activity";
const path = require("path");

let helperProcess = null;

function startActivityHelper() {
  const helperPath = path.join(__dirname, "activity-helper.sh");

  console.log("Starting helper:", helperPath);

helperProcess = spawn("pkexec", ["bash", helperPath], {
  cwd: __dirname,
  stdio: "inherit",
  detached: false
});

  helperProcess.on("error", (err) => {
    console.error("Failed to start helper:", err);
  });

  helperProcess.on("exit", (code) => {
    console.log("Helper exited with code:", code);
  });
}
function getLastActivitySecondsAgo() {
  try {
    const last = parseInt(fs.readFileSync(ACTIVITY_FILE, "utf8").trim(), 10);
    const now = Math.floor(Date.now() / 1000);
    return now - last;
  } catch {
    return 999;
  }
}

function sendGoveeCommand(name, value) {
  const cmd = `
curl -s -X PUT \
-H "Content-Type: application/json" \
-H "Govee-API-Key: ${process.env.GOVEE_API_KEY}" \
-d '{
  "device":"43:9F:C7:38:30:33:53:8B",
  "model":"H6076",
  "cmd":{
    "name":"${name}",
    "value":${value}
  }
}' \
https://developer-api.govee.com/v1/devices/control
`;

  exec(cmd, (error, stdout, stderr) => {
    console.log("Govee command:", name, value);
    if (error) console.error("Govee error:", error.message);
    if (stderr) console.error("Govee stderr:", stderr);
    if (stdout) console.log("Govee response:", stdout);
  });
}

function setLightMode(mode) {
  if (mode === "work") {
    console.log("WORK MODE → 80%, 5000K");
    sendGoveeCommand("brightness", 80);
    setTimeout(() => sendGoveeCommand("colorTem", 5000), 1200);
  } else {
    console.log("CHILL MODE → 20%, 2700K");
    sendGoveeCommand("brightness", 20);
    setTimeout(() => sendGoveeCommand("colorTem", 2700), 1200);
  }
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
      setLightMode(mode);
    }

    win.webContents.send("status", {
      mode,
      idleSeconds
    });
  }, 500);
}

app.whenReady().then(() => {
  /*startActivityHelper();*/
  createWindow();
});
app.on("before-quit", () => {
  if (helperProcess) {
    helperProcess.kill();
  }
});