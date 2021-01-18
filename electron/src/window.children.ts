import { BrowserWindow } from 'electron';
import {format} from 'url';
import { join } from 'path';

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

    loadingWindow.loadURL(format({
        pathname: join(__dirname, '../assets/loading.html'), // important
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
