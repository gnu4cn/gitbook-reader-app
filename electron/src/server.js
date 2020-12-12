"use strict";
exports.__esModule = true;
var yargs = require("yargs");
var node_static_1 = require("node-static");
var http_1 = require("http");
var createMiniWebServer = function (booksDir, _port) {
    console.log(booksDir, _port);
    var file = new node_static_1.Server(booksDir);
    http_1.createServer(function (req, res) {
        req.addListener('end', function () {
            file.serve(req, res);
        }).resume();
    }).listen({
        port: _port,
        host: 'localhost'
    });
};
var argv = yargs
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
        "default": 10080,
        description: 'Mini web服务器端口'
    }
})
    .help()
    .argv;
createMiniWebServer(argv.dir, argv.port);
console.log(argv);
