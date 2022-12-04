import test from 'ava';
import flv from '../../index.js';

test('symbols', t => {
  t.is(typeof flv, 'object');
  t.truthy(flv);
  const {
    readFile,
    readVideo,
    readAudio,
    writeData,
    setOptions,
    getOptions,
    type,
    print,
  } = flv;
  t.is(typeof readFile, 'function');
  t.is(typeof readVideo, 'function');
  t.is(typeof readAudio, 'function');
  t.is(typeof writeData, 'function');
  t.is(typeof setOptions, 'function');
  t.is(typeof getOptions, 'function');
  t.is(typeof print, 'function');
  const {
    FLVFile,
    FLVHeader,
    FLVTag,
    Audio,
    Video,
    // AAC,
    AVC,
  } = type;
  t.is(typeof FLVFile, 'function');
  t.is(typeof FLVHeader, 'function');
  t.is(typeof FLVTag, 'function');
  t.is(typeof Audio, 'function');
  t.is(typeof Video, 'function');
  // t.is(typeof AAC, 'function');
  t.is(typeof AVC, 'function');
});

