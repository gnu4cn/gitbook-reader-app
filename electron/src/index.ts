import { app, Menu, BrowserWindow, ipcMain, session } from "electron";
import { createCapacitorElectronApp } from "@capacitor-community/electron";
import { fork, ChildProcess } from 'child_process';

import { join } from 'path';

import { TableName, 
    IpcChannel, 
    ItemType, 
    IWhereItem,
    IItem,
    IFindStatement,
    IFindCondition, } from './vendor';

import { conn, addItem, updateItem, getItems } from './crud';

import { loadingWindow, bookWindow } from './window.children';
import { bookClone } from './bookOps';
//import { createMenuTemplate } from './menu_template';

// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()

const myCapacitorApp = createCapacitorElectronApp();

const winChildren: Array<Electron.BrowserWindow> = [];
const processChildren: Array<ChildProcess> = [];

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some Electron APIs can only be used after this event occurs.
app.on("ready", () => {

    const filter = {
        urls: [
            'http://localhost:10080/*',
        ]
    };

    session.defaultSession.webRequest.onBeforeSendHeaders(
        filter,
        (details, callback) => {
            console.log(details);
            details.requestHeaders['Origin'] = 'http://localhost:10080';
            callback({ requestHeaders: details.requestHeaders });
        }
    );

    session.defaultSession.webRequest.onHeadersReceived(
        filter,
        (details, callback) => {
            console.log(details);
            details.responseHeaders['Access-Control-Allow-Origin'] = [
                'capacitor-electron://-'
            ];
            callback({ responseHeaders: details.responseHeaders });
        }
    );

    myCapacitorApp.init();

    const booksDir = join(app.getPath('appData'), 'gbr_books'); 
    const serverProcess: ChildProcess = fork(join(__dirname, 'server.js'), ['-d', booksDir]);
    processChildren.push(serverProcess);

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
        bookWindow(mainWindow, loadingWin, book, booksDir, (win) => {
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
        if(processChildren.length > 0){
            processChildren.map(p => {
                p.kill('SIGINT');
            });
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
ipcMain.on('add-item', async (event, item) =>{
    const table = item.table;
    let _item: ItemType;
    await addItem(item).then(_ => _item = _);

    event.returnValue = _item;
});

ipcMain.on('update-item', async (event, _item) =>{
    const table = _item.table;

    let item: ItemType;
    await updateItem(_item).then(_ => item = _);

    event.returnValue = item;
});

ipcMain.on('get-items', async (event, getParam) => {
    const table = getParam.table;

    let items: Array<ItemType>;
    await getItems(getParam).then(_ => items = _);
    event.returnValue = items;
});
