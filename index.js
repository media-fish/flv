const {readFile, readVideo, readAudio, writeData, setOptions, getOptions} = require('./flv');
const type = require('./types');
const print = require('./print');

module.exports = {readFile, readVideo, readAudio, writeData, setOptions, getOptions, type, print};
