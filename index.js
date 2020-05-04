const {readFile, readVideo, readAudio, writeData} = require('./flv');
const type = require('./types');
const print = require('./print');

module.exports = {readFile, readVideo, readAudio, writeData, type, print};
