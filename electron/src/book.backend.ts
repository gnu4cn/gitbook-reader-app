import { ipcMain, BrowserWindow, shell } from 'electron';
import { resolve, join } from 'path';
import { fork, ChildProcess } from 'child_process';

import { escapeFileNames, getMdList } from './fs-ops';
import { CRUD } from './crud';
import { 
    IError, 
    IIpcMessage, 
    IFind,
    IItem, 
    IReadingProgress,
    IQueryResult,
    IQuery, 
    join as _join, 
    IBookDownloaded, 
    IProgressMessage
} from './vendor';
import { Book, Record } from './models';

export class BookBackend {
    constructor (
        private crud: CRUD,
        private booksDir: string, 
        private book: Book, 
        private insideWindow: BrowserWindow, 
        private loadingWin: BrowserWindow,
        private path?: string
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
        const url = this.path ? 
            _join(this.bookPath, `${this.path}?bookCommit=${this.book.commit}&defaultBranch=${this.book.defaultBranch}`)
            : `${this.bookPath}?bookCommit=${this.book.commit}&defaultBranch=${this.book.defaultBranch}`;

        return _join('capacitor-electron://-/#/', url); 
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

        bookWindow.setMaximizable(true);
        bookWindow.setMinimizable(true);
        bookWindow.setMinimumSize(1024, 600);
        const webContents = bookWindow.webContents;
        //webContents.openDevTools();

        bookWindow.loadURL(this.bookUrl);

        ipcMain.on('book-loading', () =>{
            this.loadingWin.show();
        });

        ipcMain.on('summary-request', (event, bookPath) => {
            const bookDir = join(this.booksDir, bookPath);
            event.returnValue = getMdList(bookDir); 
        })

        webContents.on('did-finish-load', () => {
            this.loadingWin.hide();
            cb(bookWindow);
        });

        // 这里调用外部浏览器打开外部链接
        webContents.on("new-window", (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        // set to null
        bookWindow.on('close', async () => {
            webContents.send('request-reading-progress');

            await ipcMain.once('reply-reading-progress', (ev, msg: IReadingProgress) => {
                let query: IFind | IQuery;
                let message: Array<string|object> = [];

                query = {
                    table: 'Book',
                    condition: {field: 'commit', value: msg.bookCommit}
                }

                try {
                    this.crud.getItem(query).then(res => {
                        const book = res.data as Book;
                        message = [...message, ...res.message];

                        const record = new Record();
                        record.chapterTitle = msg.title;
                        record.sectionAnchor = msg.sections[1] ? msg.sections[1] : '';
                        record.path = msg.url;
                        record.book = book;

                        query = {
                            table: 'Record',
                            item: record
                        }

                        try {
                            this.crud.addItem(query).then(res => {
                                message = [...message, ...res.message];
                                book.recordList.push(res.data as Record);

                                const msg: IQueryResult = {
                                    message: message,
                                    data: book
                                }
                                this.insideWindow.webContents.send('book-updated', msg);
                            });
                        }catch(e){console.log(e)}
                    });
                }catch(e){console.log(e)}
            });

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
            let progressMessage: IProgressMessage;
            switch(title){
                case 'new-downloading-progress':
                    if(msg.data < 100){
                        progressMessage = {
                            book: this.book,
                            progress: msg.data as number
                        }
                        this.insideWindow.webContents.send(title, progressMessage);
                    }
                    break;
                case 'book-downloaded':
                    this.book.downloaded = true;
                    
                    this.book.commit = (msg.data as IBookDownloaded).commit;

                    query = {
                        table: 'Book',
                        item: this.book
                    }
                    await this.crud.updateItem(query);

                    progressMessage = {
                        book: this.book,
                        progress: 100
                    }

                    this.insideWindow.webContents.send(title, progressMessage);

                    child.kill('SIGINT');
                    break;
                case 'error-occured':
                    const err: IError = msg.data as IError;

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
