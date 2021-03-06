import { 
    app, 
    Menu, 
    BrowserWindow, 
    ipcMain, 
    session 
} from "electron";

import { createCapacitorElectronApp } from "@capacitor-community/electron";
import { fork, ChildProcess } from 'child_process';
import { remove } from 'fs-extra';

import { join } from 'path';

import { 
    IItem, 
    IQuery,
    IFind,
    IBookWithPath,
    IQueryResult
} from './vendor';
import { Book } from './models';

import { CRUD } from './crud';
import { BookBackend } from './book.backend';

import { loadingWindow } from './window.children';
//import { createMenuTemplate } from './menu_template';

// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()
export default class Main {
    static application: Electron.App;


    static myCapacitorApp = createCapacitorElectronApp({});
    static winChildren: Array<Electron.BrowserWindow> = [];
    static processChildren: Array<ChildProcess> = [];
    static booksDir = join(app.getPath('appData'), 'gbr_books'); 
    static crud = new CRUD(Main.booksDir);

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some Electron APIs can only be used after Main event occurs.
    private static onReady = () => {
        const filter = {
            urls: [
                'http://localhost:10080/*', 
            ]
        };

        const request = session.defaultSession.webRequest;

        request.onBeforeSendHeaders(
            filter,
            (details, callback) => {
                //console.log(details);
                details.requestHeaders['Origin'] = 'capacitor-electron://-';
                details.requestHeaders['Access-Control-Allow-Origin'] = "capacitor-electron://-",
                details.requestHeaders["Access-Control-Allow-Methods"] = "GET,HEAD,OPTIONS,POST,PUT";
                details.requestHeaders["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers";
                callback({ requestHeaders: details.requestHeaders });
            }
        );

        request.onHeadersReceived(
            filter,
            (details, callback) => {
                details.responseHeaders['Access-Control-Allow-Origin'] = ['capacitor-electron://-'];
                callback({ responseHeaders: details.responseHeaders });
            }
        );

        Main.myCapacitorApp.init();

        const serverProcess: ChildProcess = fork(join(__dirname, 'server.js'), ['-d', Main.booksDir]);
        Main.processChildren.push(serverProcess);

        const mainWindow = Main.myCapacitorApp.getMainWindow();
        const webContents = mainWindow.webContents;

        mainWindow.setMinimumSize(1024, 720);

        let loadingWin: Electron.BrowserWindow;
        loadingWindow(mainWindow, (win) => { 
            Main.winChildren.push(win);
            loadingWin = win;
            loadingWin.hide();
        });

        ipcMain.on('book-list-loading', () =>{
            loadingWin.show();
        });

        webContents.once('did-finish-load', () => {
            loadingWin.hide();
        });

        ipcMain.on('open-book', (event, book: Book) => {
            const _book = new BookBackend(Main.crud, Main.booksDir, book, mainWindow, loadingWin)
            _book.open(w => Main.winChildren.push(w));
        });

        ipcMain.on('open-book-with-path', (event, msg: IBookWithPath) => {
            const book = new BookBackend(Main.crud, Main.booksDir, msg.book, mainWindow, loadingWin, msg.path)
            book.open(w => Main.winChildren.push(w));
        });

        ipcMain.on('download-book', (event, book: Book) => {
            const _book = new BookBackend(Main.crud, Main.booksDir, book, mainWindow, loadingWin);
            _book.download(cp => Main.processChildren.push(cp));
        });

        ipcMain.on('add-item', async (event, query: IQuery) =>{
            let res: IQueryResult;
            await Main.crud.addItem(query).then(_ => res = _);
            event.returnValue = res;
        });

        ipcMain.on('get-item', async (event, query: IFind) =>{
            let res: IQueryResult;
            await Main.crud.getItem(query).then(_ => res = _);
            event.returnValue = res;
        });

        // Define any IPC or other custom functionality below here
        ipcMain.on('delete-item', async (event, query: IQuery) =>{
            let res: IQueryResult;
            await Main.crud.deleteItem(query).then(_ => res = _);

            if(query.table === 'Book'){
                const book = query.item as Book;
                const bookDir = join(Main.booksDir, book.website.uri, book.writer.name, book.name);
                await remove(bookDir)
                    .then(() => res.message.push('，已成功从文件系统移除'))
                    .catch((e: Error) => res.message.push(e.message));
            }

            event.returnValue = res;
        });


        ipcMain.on('update-item', async (event, query) =>{
            let item: IQueryResult;
            await Main.crud.updateItem(query).then(_ => item = _);
            event.returnValue = item;
        });

        ipcMain.on('get-items', async (event, getParam) => {
            let res: IQueryResult;
            await Main.crud.getItems(getParam).then(_ => res = _);
            event.returnValue = res;
        });

        //const menuTemplate = createMenuTemplate(app);
        Menu.setApplicationMenu(null);
    }

    // Quit when all windows are closed.
    private static onClosed = async () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") {
            if(Main.crud.conn.isConnected){
                await Main.crud.conn.close();
            }
            if(Main.winChildren.length > 0){
                Main.winChildren.map(w => w =null);
            }
            if(Main.processChildren.length > 0){
                Main.processChildren.map(p => {
                    try {
                        // 后续加入 Git clone 正在进行
                        p.kill('SIGINT');
                    }catch(e){
                        console.log(e);
                    }
                });
            }
            app.quit();
        }
        return 0
    }


    private static onActivate = () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (Main.myCapacitorApp.getMainWindow().isDestroyed()) Main.myCapacitorApp.init();
    }

    static main(app: Electron.App) {
        Main.application = app;
        Main.application.on('ready', Main.onReady);
        Main.application.on('window-all-closed', Main.onClosed)
        Main.application.on('activate', Main.onActivate)
    }
}

Main.main(app);
