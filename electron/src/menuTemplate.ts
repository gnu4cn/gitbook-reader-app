import 'electron';

export function createMenuTemplate(app: Electron.App, webContents?: Electron.webContents) {
    const menuTemplate = [
        {
            label: '文件',
            submenu: [
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click() {
                        app.quit();
                    }
                }
            ],
        }
    ];

    return menuTemplate;
}
