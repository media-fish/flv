const fs = require('fs');
const path = require('path');
const test = require('ava');
const rewire = require('rewire');
const sinon = require('sinon');
const flv = require('../..');

test('readFile', t => {
  const {readFile} = flv;

  const buf = fs.readFileSync(path.join(__dirname, '../fixture/sample.flv'));
  const [offset, file] = readFile(buf, 0);
  t.is(offset, buf.length);
  t.is(file.header.version, 1);
  t.is(file.body.length, 4542);
});

test('writeFile', t => {
  const {writeData, type: {Video, AVC, Audio, AAC, FLVFile, FLVHeader, FLVTag}} = flv;

  const dummyBuf = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A]);

  const video = new AVC({
    frameType: Video.FrameType.keyframe,
    codec: Video.Codec.AVC,
    packetType: AVC.PacketType.NALU,
    compositionTimeOffset: 0,
    data: dummyBuf
  });

  const audio = new AAC({
    format: Audio.SoundFormat.AAC,
    sampleRate: Audio.SampleRate._44kHz,
    size: Audio.SampleLength._16Bit,
    isStereo: true,
    packetType: AAC.PacketType.Raw,
    data: dummyBuf
  });

  const header = new FLVHeader({version: 1, hasAudio: true, hasVideo: true});

  const tags = [
    new FLVTag({type: FLVTag.TagType.audio, timestamp: 0, data: audio}),
    new FLVTag({type: FLVTag.TagType.video, timestamp: 0, data: video})
  ];

  const file = new FLVFile(header, tags);

  // First, pass null instead of a buffer to detect how many bytes are needed
  const byteLength = writeData(file, null, 0);
  // And then alloc a buff
  const buffer = Buffer.alloc(byteLength);
  // Finally, write the data actually to the buffer
  writeData(file, buffer, 0);

  const expected = Buffer.from([
    0x46, 0x4C, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09,
    0x00, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xAF, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
    0x00, 0x00, 0x00, 0x17,
    0x09, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x17, 0x01, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
    0x00, 0x00, 0x00, 0x1A
  ]);
  t.true(buffer.equals(expected));
});

function testRead(t, enabled, invalidBuffer) {
  const {readFile} = flv;
  if (enabled) {
    try {
      readFile(invalidBuffer, 0);
      t.fail('An error should be thrown when strictMode is enabled');
    } catch (e) {
      t.truthy(e);
    }
  } else {
    try {
      const [offset, value] = readFile(invalidBuffer, 0);
      t.is(offset, invalidBuffer.length);
    } catch {
      t.fail('An error should not be thrown when strictMode is disabled');
    }
  }
}

test('strictMode - Read', t => {
  const unsupportedHeader = Buffer.from([
    0xFF, 0xFF, 0xFF // Unsupported header
  ]);
  const unsupportedTagType = Buffer.from([
    0x46, 0x4C, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09,
    0x00, 0x00, 0x00, 0x00,
    0x0A, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // Unsupported tag type
  ]);
  const unsupportedAudioCodec = Buffer.from([
    0x46, 0x4C, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09,
    0x00, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xBF, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A // Unsupported Audio Codec
  ]);
  const unsupportedVideoCodec = Buffer.from([
    0x46, 0x4C, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09,
    0x00, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xAF, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
    0x00, 0x00, 0x00, 0x17,
    0x09, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x18, 0x01, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A // Unsupported Video Codec
  ]);
  testRead(t, false, unsupportedHeader);
  testRead(t, false, unsupportedTagType);
  testRead(t, false, unsupportedAudioCodec);
  testRead(t, false, unsupportedVideoCodec);

  flv.setOptions({strictMode: true});
  let opt = flv.getOptions();
  t.true(opt.strictMode);

  testRead(t, true, unsupportedHeader);
  testRead(t, true, unsupportedTagType);
  testRead(t, true, unsupportedAudioCodec);
  testRead(t, true, unsupportedVideoCodec);

  flv.setOptions({strictMode: false});
  opt = flv.getOptions();
  t.false(opt.strictMode);

  testRead(t, false, unsupportedHeader);
  testRead(t, false, unsupportedTagType);
  testRead(t, false, unsupportedAudioCodec);
  testRead(t, false, unsupportedVideoCodec);

  t.pass();
});

function testWrite(t, enabled, invalidData) {
  const {writeData} = flv;
  if (enabled) {
    try {
      writeData(invalidData, null, 100);
      t.fail('An error should be thrown when strictMode is enabled');
    } catch (e) {
      t.truthy(e);
    }
  } else {
    try {
      const offset = writeData(invalidData, null, 100);
      t.is(offset, 100);
    } catch {
      t.fail('An error should not be thrown when strictMode is disabled');
    }
  }
}

test('strictMode - Write', t => {
  const {type: {FLVTag, Audio, Video}} = flv;
  const unknowDataType = {}; // Unknown data type
  const unknowTag = new FLVTag({type: 10}); // Unknown tag type
  const unknownAudioCodec = new Audio({format: Audio.SoundFormat.Speex}); // Unknown audio codec
  const unknownVideoCodec = new Video({frameType: Video.FrameType.keyframe, codec: Video.Codec.On2VP6}); // Unknown video codec

  testWrite(t, false, unknowDataType);
  testWrite(t, false, unknowTag);
  testWrite(t, false, unknownAudioCodec);
  testWrite(t, false, unknownVideoCodec);

  flv.setOptions({strictMode: true});
  let opt = flv.getOptions();
  t.true(opt.strictMode);

  testWrite(t, true, unknowDataType);
  testWrite(t, true, unknowTag);
  testWrite(t, true, unknownAudioCodec);
  testWrite(t, true, unknownVideoCodec);

  flv.setOptions({strictMode: false});
  opt = flv.getOptions();
  t.false(opt.strictMode);

  testWrite(t, false, unknowDataType);
  testWrite(t, false, unknowTag);
  testWrite(t, false, unknownAudioCodec);
  testWrite(t, false, unknownVideoCodec);
});

test('strictMode - Propagation', t => {
  const reader = {
    setOptions() {}
  };
  const flv = rewire('../../flv');
  flv.__set__('reader', reader);

  let mock = sinon.mock(reader);
  let options = {strictMode: true};
  mock.expects('setOptions').once().withExactArgs(options);
  flv.setOptions(options);
  mock.verify();

  mock.restore();

  mock = sinon.mock(reader);
  options = {strictMode: false};
  sinon.mock(reader).expects('setOptions').once().withExactArgs(options);
  flv.setOptions(options);
  mock.verify();

  t.pass();
});
