import { BrowserWindow, ipcMain } from 'electron';
import * as url from 'url';
import * as path from 'path';

import { Book } from './models';

export function bookWindow(parentWin: Electron.BrowserWindow, loadingWin: Electron.BrowserWindow, book: Book, cb) {
    let bookWindow: Electron.BrowserWindow;

    bookWindow = new BrowserWindow({ 
        minWidth: 800,
        minHeight: 600,
        center: true,
        darkTheme: true,
        parent: parentWin,
        webPreferences: { nodeIntegration: true }
    });

    bookWindow.fullScreenable = true;
    bookWindow.maximizable = true;

    const webContents = bookWindow.webContents;

    // capacitor-electron://-/#/home

    const bookUrl = `capacitor-electron://-/#/${book.website.uri}/${book.writer.name}/${book.name}?commit=${book.commit}`; 
    bookWindow.loadURL(bookUrl);

    webContents.openDevTools();

    ipcMain.on('book-loading', () =>{
        loadingWin.show();
    });

    webContents.on('did-finish-load', () => {
        loadingWin.hide();
        cb(bookWindow);
    });

    // set to null
    bookWindow.on('close', () => {
        bookWindow = null;
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
        pathname: path.join(__dirname, 'resources/loading.html'), // important
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
