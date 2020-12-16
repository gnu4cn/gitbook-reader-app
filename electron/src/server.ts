import * as yargs from 'yargs';

import { Server } from 'node-static';
import { createServer } from 'http';

const createMiniWebServer = (booksDir: string, _port: number) => {
    const file = new Server(booksDir);

    createServer((req, res) => {
        req.addListener('end', () => {
            file.serve(req, res);
        }).resume();

    }).listen({
        port: _port,
        host: 'localhost'
    });
} 

const argv = yargs
    .options({
        dir: {
            alias: 'd',
            type: 'string',
            demandOption: true,
            description: 'Mini web服务器根目录'
        },
        port: {
            alias: 'p',
            type: 'number',
            default: 10080,
            description: 'Mini web服务器端口'
        }
    })
    .help()
    .argv;

createMiniWebServer(argv.dir, argv.port);
