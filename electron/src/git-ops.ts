const Git = require('nodegit');
import { remove, ensureDirSync } from 'fs-extra';
import * as yargs from 'yargs';

import { IIpcMessage, IBookDownloaded } from './vendor';

export const clone = async (bookDir: string, bookUri: string) => {
    let progress = 1;
    const opts = {
        fetchOpts: {
            callbacks: {
                transferProgress: progress => {
                    const total = progress.totalObjects();
                    const received = progress.receivedObjects();
                    const indexed = progress.indexedObjects();
                    const percent = Math.round(received/total*100);
                    if ( progress !== percent){
                        if(process.send){
                            const message: IIpcMessage = {title: 'new-downloading-progress', data: percent}; 
                            process.send(message);
                        }
                        progress = percent;
                    }
                },
                certificateCheck: () => {
                    // github will fail cert check on some OSX machines
                    // this overrides that check
                    return 0;
                }
            }
        }
    };

    await remove(bookDir).then(async () => {
        await ensureDirSync(bookDir);

        Git.Clone.clone(bookUri, bookDir, opts)
            .then((repo) => {
                return repo.getHeadCommit();
            })
            .then(commit => {
                return commit.sha();
                //                return commit.getEntry("README.md");
                //            })
                //            .then(entry => {
                //                return entry.getBlob();
                //            })
                //            .then(async (blob) => {
                //                //const firstTenLines = blob.toString().split('\n').slice(0, 10).join('\n');
                //                const bookDesc = blob.toString().split('\n').slice(0, 10).join('\n');
                //  可能不需要做这个处理
                // 处理文件、目录中的特殊字符
                //await escapeFileNames(bookDir);

                // 发送消息给父进程
            })
            .then((bookCommit) => {
                const msg: IBookDownloaded = {
                    commit: bookCommit
                }
                if(process.send){
                    const message: IIpcMessage = {title: 'book-downloaded', data: msg};
                    process.send(message);
                }
            })
            .catch(error => { 
                // 发送消息给父进程
                if(process.send){
                    const message: IIpcMessage = {
                        title: 'error-occured', 
                        data: {message: error.message, err: error}
                    };
                    process.send(message);
                }
            });
    });
}

const argv = yargs
    .options({
        bookDir: {
            alias: 'd',
            type: 'string',
            demandOption: true,
            description: 'Git clone所到目录'
        },
        bookUri: {
            alias: 's',
            type: 'string',
            demandOption: true,
            description: 'Git repo地址'
        },
    })
    .help()
    .argv;

clone(argv.bookDir, argv.bookUri);
