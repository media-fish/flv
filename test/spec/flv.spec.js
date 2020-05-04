const fs = require('fs');
const path = require('path');
const test = require('ava');
const flv = require('../..');

test('readFile', t => {
  const {readFile, print} = flv;

  const buf = fs.readFileSync(path.join(__dirname, '../fixture/sample.flv'));
  const [offset, file] = readFile(buf, 0);
  print(file);
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
