/*
npm install
HTTP_PORT=3001 P2P_PORT=6001 npm start
HTTP_PORT=3002 P2P_PORT=6002 npm start
curl -H "Content-type:application/json" --data '{"peer" : "ws://localhost:6001"}' http://localhost:3002/addPeer

curl -H "Content-type:application/json" --data '{"data" : "Some data to the first block"}' http://localhost:3001/mineBlock

*/ 

"use strict";
var express = require("express");
var bodyParser = require('body-parser');

var blockchain_1 = require("./BlockChain");
var p2p_1 = require("./P2P");
var httpPort = parseInt(process.env.HTTP_PORT) || 3001;
var p2pPort = parseInt(process.env.P2P_PORT) || 6001;

var initHttpServer = (myHttpPort) => {
    var app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain_1.getBlockchain())));
    app.post('/mineBlock', (req, res) => {
        var newBlock = blockchain_1.generateNextBlock(req.body.data);
        res.send(newBlock);
    });
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        p2p_1.connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(myHttpPort, () => console.log('Listening http on port: ' + myHttpPort));
};
initHttpServer(httpPort);
p2p_1.initP2PServer(p2pPort);
