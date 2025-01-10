import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      webSecurity: false
    },
    titleBarStyle: "hidden",
    ...process.platform !== "darwin" ? { titleBarOverlay: true } : {}
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  ipcMain.handle("getFileContent", (_event, str) => {
    str = str.replace("\\", "/");
    let error;
    let fileContent;
    try {
      fileContent = fs.readFileSync(str, "utf-8");
    } catch (e) {
      if (typeof e === "string") {
        error = e.toUpperCase();
      } else if (e instanceof Error) {
        error = e.message;
      }
    }
    return error ? "programmNodeFsError" : fileContent;
  });
  ipcMain.handle("writeFileContent", (_event, str, fileContent) => {
    str = str.replace("\\", "/");
    let error;
    try {
      fs.writeFileSync(str, fileContent, "utf-8");
    } catch (e) {
      if (typeof e === "string") {
        error = e.toUpperCase();
      } else if (e instanceof Error) {
        error = e.message;
      }
    }
    return error ? "programmNodeFsError" : "success";
  });
  ipcMain.handle("getFolderContent", (_event, str) => {
    str = str.replace("\\", "/");
    let error;
    let folderContent = [];
    try {
      const temp = fs.readdirSync(str);
      for (let pathName of temp) {
        const stats = fs.statSync(path.join(str, pathName));
        folderContent.push({ path: pathName, isFile: stats.isFile() });
      }
    } catch (e) {
      if (typeof e === "string") {
        error = e.toUpperCase();
      } else if (e instanceof Error) {
        error = e.message;
      }
    }
    return error ? "programmNodeFsError" + error : folderContent;
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
