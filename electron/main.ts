import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false
    },
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  ipcMain.handle("getFileContent",(_event, str: string)=> {
    str = str.replace("\\", '/')
    let error 
    let fileContent
    try{
      fileContent = fs.readFileSync(str, 'utf-8');
    }catch(e){
      if (typeof e === "string") {
          error = e.toUpperCase()
      } else if (e instanceof Error) {
          error = e.message
      }
    }
    return error ? "programmNodeFsError" : fileContent;
  })
  ipcMain.handle("writeFileContent",(_event, str: string, fileContent: string)=> {
    str = str.replace("\\", '/')
    let error 
    try{
      fs.writeFileSync(str, fileContent, 'utf-8');
    }catch(e){
      if (typeof e === "string") {
          error = e.toUpperCase()
      } else if (e instanceof Error) {
          error = e.message
      }
    }
    return error? "programmNodeFsError" : "success";
  })
  ipcMain.handle("getFolderContent",(_event, str: string) => {
    str = str.replace("\\", '/')
    let error 
    let folderContent: { path: string, isFile: boolean }[] = []
    try{
      const temp: string[] = fs.readdirSync(str);
      for(let pathName of temp){
        const stats = fs.statSync(path.join(str, pathName))
        folderContent.push({ path: pathName, isFile: stats.isFile() })
      }
    }catch(e){
      if (typeof e === "string") {
          error = e.toUpperCase()
      } else if (e instanceof Error) {
          error = e.message
      }
    }
    return error ? "programmNodeFsError" + error : folderContent;
  })
  // ipcMain.handle("deleteFileOrDir", (_event, str: string, isFile: boolean) => {
  //   str = str.replace("\\", '/')
  //   let error 
  //   try{
  //     if(isFile){
  //       fs.unlinkSync(str);
  //     }else{
  //       fs.rmdirSync(str, { recursive: true });
  //     }
  //   }catch(e){
  //     if (typeof e === "string") {
  //         error = e.toUpperCase()
  //     } else if (e instanceof Error) {
  //         error = e.message
  //     }
  //   }
  //   return error? "programmNodeFsError" : "success";
  // })
  // ipcMain.handle("renameFileOrDir", (_event, previousPath: string, nextPath: string) => {
  //   let error: string = "";
  //   try{
  //     fs.renameSync(previousPath, nextPath);
  //   }catch(e){
  //     if (typeof e === "string") {
  //       error = e.toUpperCase()
  //     } else if (e instanceof Error) {
  //       error = e.message
  //     }
  //   }
  //   return error? "programmNodeFsError" : "success";
  // })
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
