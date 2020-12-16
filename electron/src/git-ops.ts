const Git = require('nodegit');
import { remove, ensureDirSync } from 'fs-extra';
import * as yargs from 'yargs';

import { escapeFileNames } from './fs-ops';
import { IIpcMessage, IBookDownloaded } from './vendor';

export const clone = async (bookDir: string, bookUri: string) => {
    let bookCommit = '';
    let progress: number = 0;
    const opts = {
        fetchOpts: {
            callbacks: {
                transferProgress: progress => {
                    const total = progress.totalObjects();
                    const received = progress.receivedObjects();
                    const indexed = progress.indexedObjects();
                    const percent = Math.round(received/total*100);

                    if ( progress !== percent ){
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
            .then(repo => {
                return repo.getMasterCommit();
            })
            .then(commit => {
                bookCommit = commit.sha();
                return commit.getEntry("README.md");
            })
            .then(entry => {
                return entry.getBlob();
            })
            .then(async (blob) => {
                //const firstTenLines = blob.toString().split('\n').slice(0, 10).join('\n');
                const bookDesc = blob.toString().split('\n').slice(0, 10).join('\n');

                // 处理文件、目录中的特殊字符
                await escapeFileNames(bookDir);

                // 发送消息给父进程
                const msg: IBookDownloaded = {
                    desc: bookDesc,
                    commit: bookCommit
                }
                if(process.send){
                    const message: IIpcMessage = {title: 'book-downloaded', data: msg};
                    process.send(message);
                }
            })
            .catch(err => { 
                // 发送消息给父进程
                if(process.send){
                    const message: IIpcMessage = {title: 'error-occured', data: err};
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
