# Ionic, Capacitor, Angular 应用构建 Starter

## 命令

## 建立 Ionic 项目

- `ionic start ionic-cap-ng-app-starter blank --type=angular --capacitor`

## 安装依赖

- `npm i ngx-electron @capacitor-community/electron electron`

> 这里同时安装了 Capacitor 社区版与官方的 `electron`，是因为 Capacitor 要求使用社区版，而 `ngx-electron` 以来官方的 `electron`。

## 修改根目录下的 `package.json`

在 `scripts` 下，加入 `"electron:start": "ionic build && npx cap copy && npx cap open @capacitor-community/electron"` 启动脚本。

## 修改 `electron/package.json`

加入 `dist:win` 与 `dist:linux`，实现应用自动化构建。

## 使用方法

1. 克隆到本地

`git clone git@github.com:gnu4cn/ionic-cap-ng-app-starter`

2. 运行 `npm init`、`ionic init`

3. 删除 `.git` 目录，运行 `git init` 并添加自己的 Git 代码仓库

## Gitbook 阅读器开发日志

+ 2020-12-10

    - 重写 `loadSummary` 方法，由后端提供书籍的全部 `.md` 文件，提升加载速度。后期将 `summary-toc` 与 `search-index`在数据库中持久化，以进一步提升加载速度 
    - 正在解决 `toc-pagination.component.ts` 不能正常显示的问题


+ 2020-12-08(2)

    - 解决了在Electron中打开新窗口，加载Angular的路由问题!!!
    - Electron 应用的协议 `electron://-/`（`capacitor-electron://-/`） 表示根路径，其他路径都是 `capacitor-electron://-/#/home`这样的
    - 要在 `app.module.ts`中使用`HashLocationStrategy` 


+ 2020-12-08

    - 为了能在Electron的新窗口中打开Angular的路由，修改 `app-routing.module.ts`与`app.module.ts`，将`LocationStrategy`从`PathLocationStrategy`修改为`HashLocationStratedy`，以及一些其他修改
    - 修正了`book/services/location.service.ts`中判断是否为`shared` MD文件的方法，以及`shared`MD文件`vfile.data.gbr.url`生成的方式
    - 在修改了`LocationStrategy`后，由于路径中已经有了`#`符号，导致`toc`无法展开，现修改代码，解决`toc`展开的问题
    + `toc`展开机制：
        - `sectionScrollSpy` 指令获取到当前`article`在屏幕中的那些小节，发射输出到`read.page.ts`中
        - 两个`aside` 的 `listCollapse` 指令，从`read.page.ts`中获取到`sectionScrollSpy`生成的`active sections` 集合（`set`），对两个`aside`元素中的清单进行操作
        - 在变更了 `LocationStrategy` 后，原来的 `book/directives/list-collapse.directive.ts` 已经失效，需要进行修改


+ 2020-12-07
    
    - 前段界面已经优化的很不错了，阅读页面稳定，Home 页面简化成熟
    - 加入了NodeGit和Sqlite3两个原生模块，其中NodeGit用于克隆Markdown书籍，Sqlite3用于维护本地书籍数据
    - 两个原生模块都需要为当前Electron版本进行重新构建，为此要使用命令`npm i electron-rebuild --save-dev`安装`electron-rebuild`
    - 重新构建就是为当前特定版本的Electron重新编译模块的二进制版本，而不是使用该模块的预先构建版本
    - 模块的二进制发布，是一个二进制文件，包含了所有该模块的API接口，可供JavaScript, Python等语言进行调用，可以看着是一个`dll`文件
    - `node_module/.bin/`目录下，有很多到`node_module/xxx`模块命令的软连接(其中就有`electron`)，这个目录没有加入到系统的`$PATH`环境变量，只在本地`npm`环境下有效
    - `electron-rebuild`命令默认将重新编译所有的原生（native）模块，可使用其命令参数`-w --which`编译指定的模块

+ 2020-11-30

    - 已经支持多本书
    - 解决 github.io 部署时，`assets`下的 `.md` 文件 `404` 错误问题

+ 2020-11-21

    - 解决了打印问题、搜索问题，阅读器完全可用
    - 下一步着重开发Electron部分

+ 2020-11-21

    - 解决打印问题

+ 2020-11-20

    - 点击页面连接，页面没有更新，`RouterService`没有传入正确的 `changes`
    - 目录清单没有正确展开，`list-collapse.directive`没有正确工作
    - `section-spy.directive`有正确传出，但`list-collapse.directive`没有正确处理


