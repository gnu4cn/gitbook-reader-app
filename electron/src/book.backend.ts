import { ipcMain, BrowserWindow, shell } from 'electron';
import { resolve, join } from 'path';
import { fork, ChildProcess } from 'child_process';

import { escapeFileNames, getMdList } from './fs-ops';
import { CRUD } from './crud';
import { 
    IError, 
    IIpcMessage, 
    IItem, 
    IQuery, 
    join as _join, 
    IBookDownloaded, 
    IProgressMessage
} from './vendor';
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
        webContents.openDevTools();

        bookWindow.loadURL(this.bookUrl);


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
        // 这里书籍下载已经进程化，可多线程下载书籍
        const params = ['-d', this.bookDir, '-s', this.bookUri];
        const child = fork(resolve(__dirname, 'git-ops.js'), params, {stdio: ['ipc']});
        cb(child);

        child.on('message', async (msg: IIpcMessage) => {
            const title = msg.title;
            let query: IQuery;
            switch(title){
                case 'new-downloading-progress':
                    const progressMessage: IProgressMessage = {
                        book: this.book,
                        progress: msg.data as number
                    }
                    this.insideWindow.webContents.send(title, progressMessage);
                    break;
                case 'book-downloaded':
                    this.book.downloaded = true;
                    const data: IBookDownloaded = msg.data as IBookDownloaded;
                    this.book.commit = data.commit;

                    query = {
                        table: 'Book',
                        item: this.book
                    }
                    await this.crud.updateItem(query);

                    this.insideWindow.webContents.send(title, this.book);

                    child.kill('SIGINT');
                    break;
                case 'error-occured':
                    const err: IError = msg.data as IError;

                    this.book.downloaded = false;
                    this.book.downloadable = false;
                    this.book.errMsg = err.message;

                    query = {
                        table: 'Book',
                        item: this.book
                    }
                    await this.crud.updateItem(query);

                    this.insideWindow.webContents.send(title, this.book);

                    child.kill('SIGINT');
                    break;
            }
        });
    }
}
