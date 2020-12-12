import { app, Menu, BrowserWindow, ipcMain } from "electron";
import { createCapacitorElectronApp } from "@capacitor-community/electron";

import { join } from 'path';

import { loadingWindow, bookWindow } from './window.children';
import { bookClone } from './bookOps';
//import { createMenuTemplate } from './menu_template';
import { conn } from './crud';
import { onGetItems, onAddItem, } from './ipc';
// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()

const myCapacitorApp = createCapacitorElectronApp();
const winChildren: Array<Electron.BrowserWindow> = [];
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some Electron APIs can only be used after this event occurs.
app.on("ready", () => {

    myCapacitorApp.init();

    const booksDir = join(app.getPath('appData'), 'gbr_books'); 

    const mainWindow = myCapacitorApp.getMainWindow();
    const webContents = mainWindow.webContents;

    let loadingWin: Electron.BrowserWindow;
    loadingWindow(mainWindow, (win) => { 
        winChildren.push(win);
        loadingWin = win;
        loadingWin.hide();
    });

    ipcMain.on('book-list-loading', () =>{
        loadingWin.show();
    });

    webContents.once('did-finish-load', () => {
        loadingWin.hide();
    });

    ipcMain.on('open-book', (event, book) => {
        bookWindow(mainWindow, loadingWin, book, (win) => {
            winChildren.push(win);
        })
    });

    ipcMain.on('download-book', (event, book) => {
        bookClone(book, webContents, booksDir);
    });

    //const menuTemplate = createMenuTemplate(app);
    Menu.setApplicationMenu(null);

});

// Quit when all windows are closed.
app.on("window-all-closed", async () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        if(conn.isConnected){
            await conn.close();
        }
        if(winChildren.length > 0){
            winChildren.map(w => w =null);
        }
        app.quit();
    }
    return 0
});


app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (myCapacitorApp.getMainWindow().isDestroyed()) myCapacitorApp.init();
});

// Define any IPC or other custom functionality below here
onGetItems;
onAddItem;
