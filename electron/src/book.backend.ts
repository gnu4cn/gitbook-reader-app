import { ipcMain, BrowserWindow, shell } from 'electron';
import { resolve, join } from 'path';
import { fork, ChildProcess } from 'child_process';

import { escapeFileNames, getMdList } from './fs-ops';
import { CRUD } from './crud';
import { IIpcMessage, IItem, join as _join, IBookDownloading, IBookDownloaded } from './vendor';
import { Book } from './models';

export class BookBackend {
    crud = new CRUD();

    constructor (
        private booksDir: string, 
        private book: Book, 
        private insideWindow: BrowserWindow, 
        private loadingWin: BrowserWindow
    ) {}

    get bookPath () {
        return join(this.book.website.uri, this.book.writer.name, this.book.name);
    }

    get bookDir () {
        return join(this.booksDir, this.bookPath);
    }

    get bookUri () {
        return _join('https://', `${this.bookPath}.git`);
    }

    get bookUrl () {
        // capacitor-electron://-/#/home
        return _join('capacitor-electron://-/#/', 
            join(this.book.website.uri, this.book.writer.name, `${this.book.name}?commit=${this.book.commit}`)); 
    }

    open = async (cb) => {
        let bookWindow = new BrowserWindow({ 
            width: 1366,
            height: 768,
            center: true,
            darkTheme: true,
            resizable: true,
            backgroundColor: '#2e2c29',
            fullscreen: true,
            fullscreenable: true,
            parent: this.insideWindow,
            webPreferences: { nodeIntegration: true }
        });

        const webContents = bookWindow.webContents;

        bookWindow.loadURL(this.bookUrl);

        webContents.openDevTools();

        ipcMain.on('book-loading', () =>{
            this.loadingWin.show();
        });

        ipcMain.on('summary-request', async (event, bookPath) => {
            const bookDir = join(this.booksDir, bookPath);
            event.returnValue = getMdList(bookDir); 
        })

        webContents.on('did-finish-load', () => {
            this.loadingWin.hide();
            cb(bookWindow);
        });

        webContents.on("new-window", (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        // set to null
        bookWindow.on('close', () => {
            bookWindow = null;
            this.loadingWin.hide();
        });

        // set to null
        bookWindow.on('closed', () => {
            bookWindow = null;
        });
    }

    download = async (cb) => {
        const params = ['-d', this.bookDir, '-s', this.bookUri];
        const child = fork(resolve(__dirname, 'git-ops.js'), params, {stdio: ['ipc']});
        cb(child);
        child.on('message', async (msg: IIpcMessage) => {
            const title = msg.title;
            let message: IBookDownloading;
            let item: IItem;
            switch(title){
                case 'new-downloading-progress':
                    this.book.downloaded = msg.data as number;

                    message = {
                        percent: msg.data as number,
                        _book: this.book,
                    }

                    this.insideWindow.webContents.send(title, message);
                    break;
                case 'book-downloaded':
                    this.book.downloaded = 100;
                    const data: IBookDownloaded = msg.data as IBookDownloaded;
                    this.book.commit = data.commit;
                    this.book.desc = data.desc;

                     item = {
                        table: 'Book',
                        item: this.book
                    }
                    await this.crud.updateItem(item);

                    message = {
                        percent: msg.data as number,
                        _book: this.book,
                    }
                    this.insideWindow.webContents.send('new-downloading-progress', message);

                    child.kill('SIGINT');
                    break;
                case 'error-occured':
                    const err: Error = msg.data as Error;
                    this.book.errMsg = err.message;

                    item = {
                        table: 'Book',
                        item: this.book
                    }
                    await this.crud.updateItem(item);

                    message = {
                        percent: 0,
                        _book: this.book,
                    }
                    this.insideWindow.webContents.send('new-downloading-progress', message);

                    child.kill('SIGINT');
                    break;
            }
        });
    }
}
