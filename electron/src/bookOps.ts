const Git = require('nodegit');

import { remove } from 'fs-extra';
import { resolve } from 'path';

import { WebContents } from "electron";
import { updateItem } from './crud';

import { IBookDownloading } from './vendor';
import { Book } from './models';
import { escapeFileNames } from './fsOps';

export const bookClone = async (book: Book, web: WebContents) => {
    const repoDir = `../app/assets/${book.website.uri}/${book.writer.name}/${book.name}`;
    const bookPath = resolve(__dirname, repoDir);

    const bookUri = `https://${book.website.uri}/${book.writer.name}/${book.name}.git`; 

    let bookCommit = '';
    let _percent:number = 0;
    const opts = {
        fetchOpts: {
            callbacks: {
                transferProgress: progress => {
                    // 发送消息给 downloading-queue 组件
                    const total = progress.totalObjects();
                    const received = progress.receivedObjects();
                    const percent = Math.round(received/total*100);

                    if(_percent !== percent){
                        book.downloaded = percent;
                        web.send('new-downloading-progress', {_book: book, downloaded: percent});
                        _percent = percent;
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

    await remove(bookPath).then(async () => {
        Git.Clone.clone(bookUri, bookPath, opts)
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
                // 更新数据库
                await escapeFileNames(bookPath);

                book.downloaded = 100;
                book.desc = bookDesc;
                book.commit = bookCommit;
                updateItem({table: 'Book', item: book});

                web.send('new-downloading-progress', {_book: book, downloaded: 100});
            })
            .catch(err => { console.log(err); });
    });
}
