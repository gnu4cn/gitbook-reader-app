import { BrowserWindow, ipcMain } from 'electron';
import * as url from 'url';
import { join } from 'path';

import { Book } from './models';
import { getList } from './fsOps';

export function bookWindow(parentWin: Electron.BrowserWindow, 
    loadingWin: Electron.BrowserWindow, 
    book: Book, 
    booksDir: string,
    cb) {
    let bookWindow: Electron.BrowserWindow;

    bookWindow = new BrowserWindow({ 
        width: 1366,
        height: 768,
        center: true,
        darkTheme: true,
        resizable: true,
        backgroundColor: '#2e2c29',
        fullscreen: true,
        fullscreenable: true,
        parent: parentWin,
        webPreferences: { nodeIntegration: true }
    });

    const webContents = bookWindow.webContents;

    // capacitor-electron://-/#/home

    const bookUrl = `capacitor-electron://-/#/${book.website.uri}/${book.writer.name}/${book.name}?commit=${book.commit}`; 
    bookWindow.loadURL(bookUrl);

    webContents.openDevTools();

    ipcMain.on('book-loading', () =>{
        loadingWin.show();
    });

    ipcMain.on('summary-request', async (event, bookPath) => {
        const bookDir = join(booksDir, bookPath); 
        event.returnValue = getList(bookDir); 
    })

    webContents.on('did-finish-load', () => {
        loadingWin.hide();
        cb(bookWindow);
    });

    // set to null
    bookWindow.on('close', () => {
        bookWindow = null;
        loadingWin.hide();
    });

    // set to null
    bookWindow.on('closed', () => {
        bookWindow = null;
    });
}

export function loadingWindow(parentWin, cb) {
    let loadingWindow: Electron.BrowserWindow;

    loadingWindow = new BrowserWindow({ 
        width: 360, 
        height: 360, 
        frame: false, 
        parent: parentWin, 
        title: "Loading...",
        modal: true,
    });

    loadingWindow.loadURL(url.format({
        pathname: join(__dirname, 'resources/loading.html'), // important
        protocol: 'file:',
        slashes: true,
        // baseUrl: 'dist'
    }));

    //loadingWindow.webContents.openDevTools();

    const loadingWinWebContents = loadingWindow.webContents;
    loadingWinWebContents.on('did-finish-load', function () {
        if (typeof cb === 'function') {
            cb(loadingWindow);
        }
    });
}
