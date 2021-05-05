"use strict";
var CryptoJS = require("crypto-js");
var p2p_1 = require("./P2P");


// in seconds
var BLOCK_GENERATION_INTERVAL = 10; //Kaç saniye de bir blok oluşturulacak
// in blocks
var DIFFICULTY_ADJUSTMENT_INTERVAL = 2; // Kaç blokta bir zorluk değişecek

class Block {
    constructor(index, previousHash, timestamp, data, hash,difficulty,nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }

}

var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data,block.difficulty,block.nonce);
};

var calculateHash = (index, previousHash, timestamp, data,difficulty,nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data +difficulty + nonce).toString();
};

var getLatestBlock = () => {
    return blockchain[blockchain.length - 1];
}
var getGenesisBlock = () => {
    return new Block(0, "0", 1465154705, "my genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",0,0);
}

var getBlockChain = () => {
    return blockchain;
}
var getDifficulty = (aBlockchain) =>{
    var latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    }
    else {
        return latestBlock.difficulty;
    }
};
var getAdjustedDifficulty =(latestBlock, aBlockchain) =>{
    var prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    var timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    var timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock.difficulty + 1;
    }
    else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    }
    else {
        return prevAdjustmentBlock.difficulty;
    }
};


var addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
}
var generateNextBlock = (blockData) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var difficulty = getDifficulty(getBlockChain());
    console.log('difficulty: ' + difficulty);
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var newBlock = mineBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);    
    addBlock(newBlock);
    p2p_1.broadcastLatest();
    return newBlock;
};

var mineBlock = (index, previousHash, timestamp, data, difficulty) =>{
    var nonce = 0;
    while (true) {
        var hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (hashMatchesDifficulty(hash, difficulty)) {
            console.log("--Mineddddddd --" + "Difficulty: "+ difficulty+ " Nonce:" +nonce +  " Hash : "+hash);
            return new Block(index, previousHash, timestamp, data,hash, difficulty, nonce);
        }
        nonce++;
        console.log("....Mining..."+ "Difficulty: "+ difficulty+ " Nonce:" +nonce +  " Hash : "+hash);
    }
    
};

var hasValidHash = (block) =>{
    if (!hashMatchesBlockContent(block)) {
        console.log('invalid hash, got:' + block.hash);
        return false;
    }
    if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
        console.log('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
    }
    return true;
};
var hashMatchesBlockContent = (block) =>{
    var blockHash = calculateHashForBlock(block);
    return blockHash === block.hash;
};
var hashMatchesDifficulty =  (hash, difficulty)=> {
    var requiredPrefix = '0'.repeat(difficulty);
    return hash.toString().startsWith(requiredPrefix);
};
var getAccumulatedDifficulty = function (aBlockchain) {
    return aBlockchain
        .map(function (block) { return block.difficulty; })
        .map(function (difficulty) { return Math.pow(2, difficulty); })
        .reduce(function (a, b) { return a + b; });
};

var addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;
    }
    return false;
};

var isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    var tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        } else {
            return false;
        }
    }
    return true;
}

var isValidBlockStructure = function (block) {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

var isValidNewBlock = (newBlock, previousBlock) => {
    /*if (!isValidBlockStructure(newBlock)) {
        console.log('invalid structure');
        return false;
    }*/
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        // console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + '' + newBlock.hash);
        return false;
    }
    else if (!hasValidHash(newBlock)) {
        return false;
    }
    return true;
}

var replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockChain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        p2p_1.broadcastLatest();
    }
    else {
        console.log('Received blockchain invalid');
    }
};




var blockchain = [getGenesisBlock()];



// nexport;
exports.Block = Block;
exports.getLatestBlock = getLatestBlock;
exports.getBlockchain = getBlockChain;
exports.generateNextBlock = generateNextBlock;
exports.isValidBlockStructure = isValidBlockStructure;
exports.addBlockToChain = addBlockToChain;
exports.replaceChain = replaceChain;

