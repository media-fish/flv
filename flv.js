import {reader, writer} from '@mediafish/buffer-operator';
import {FLVFile, FLVHeader, FLVTag, Audio, AAC, Video, AVC} from './types.js';

let options = {};

function throwError(err) {
  if (!options.strictMode) {
    console.error(err.stack);
    return err;
  }
  throw err;
}

function setOptions(newOptions = {}) {
  options = Object.assign(options, newOptions);
  const {strictMode} = options;
  reader.setOptions({strictMode});
}

function getOptions() {
  return Object.assign({}, options);
}

function readFile(buffer, offset) {
  // console.log(`readFile(buffer.length=${buffer.length}, offset=${offset})`);
  let header = null, tag = null;
  const tags = [];
  [offset, header] = readHeader(buffer, offset);
  [offset] = reader.readNumber(buffer, offset, 4); // Skip 4 bytes
  while (offset < buffer.length) {
    [offset, tag] = readTag(buffer, offset);
    tags.push(tag);
    [offset] = reader.readNumber(buffer, offset, 4); // Skip 4 bytes
  }
  return [offset, new FLVFile(header, tags)];
}

function readHeader(buffer, offset) {
  // console.log(`readHeader(buffer.length=${buffer.length}, offset=${offset})`);
  let value = '';
  [offset, value] = reader.readString(buffer, offset, 3);
  if (value !== 'FLV') {
    return [buffer.length, throwError(new Error('No FLV header'))];
  }
  let version = 0, bitOffset = 0, hasAudio = false, hasVideo = false, nextOffset = 0;
  [offset, version] = reader.readNumber(buffer, offset, 1);
  bitOffset = offset * 8;
  [bitOffset] = reader.readBits(buffer, bitOffset, 5); // Skip 5 bits
  [bitOffset, hasAudio] = reader.readBits(buffer, bitOffset, 1);
  [bitOffset] = reader.readBits(buffer, bitOffset, 1); // Skip 1 bits
  [bitOffset, hasVideo] = reader.readBits(buffer, bitOffset, 1);
  offset++;
  [offset, nextOffset] = reader.readNumber(buffer, offset, 4);
  return [nextOffset, new FLVHeader({version, hasAudio: Boolean(hasAudio), hasVideo: Boolean(hasVideo)})];
}

function readTag(buffer, offset) {
  // console.log(`readTag(buffer.length=${buffer.length}, offset=${offset})`);
  let type = 0, length = 0, lower24bits = 0, upper8bits = 0, timestamp = 0, data = null;
  [offset, type] = reader.readNumber(buffer, offset, 1);
  [offset, length] = reader.readNumber(buffer, offset, 3);
  [offset, lower24bits] = reader.readNumber(buffer, offset, 3);
  [offset, upper8bits] = reader.readNumber(buffer, offset, 1);
  timestamp = upper8bits << 24 | lower24bits;
  [offset] = reader.readNumber(buffer, offset, 3); // Skip 3 bytes
  if (type === FLVTag.TagType.audio) {
    [offset, data] = readAudio(buffer, offset, length);
  } else if (type === FLVTag.TagType.video) {
    [offset, data] = readVideo(buffer, offset, length);
  } else {
    return [offset + length, throwError(new Error(`Unsupported tag type: ${type}`))];
  }
  return [offset, new FLVTag({type, timestamp, data})];
}

function readAudio(buffer, offset, length) {
  // console.log(`readAudio(buffer.length=${buffer.length}, offset=${offset}, length=${length})`);
  const end = offset + length;
  let format = 0, sampleRate = 0, size = 0, isStereo = false;
  let bitOffset = offset * 8;
  [bitOffset, format] = reader.readBits(buffer, bitOffset, 4);
  [bitOffset, sampleRate] = reader.readBits(buffer, bitOffset, 2);
  [bitOffset, size] = reader.readBits(buffer, bitOffset, 1);
  [bitOffset, isStereo] = reader.readBits(buffer, bitOffset, 1);
  offset++;

  if (format !== Audio.SoundFormat.AAC) {
    return [end, throwError(new Error(`Unsupported sound format: ${format}`))];
  }

  let packetType = 0, data = null;
  [offset, packetType] = reader.readNumber(buffer, offset, 1);
  data = reader.subBuffer(buffer, offset, length - 2);
  // console.log(`\tdata.length=${data.length}`);
  return [end, new AAC({format, sampleRate, size, isStereo, packetType, data})];
}

function readVideo(buffer, offset, length) {
  // console.log(`readVideo(buffer.length=${buffer.length}, offset=${offset}, length=${length})`);
  const end = offset + length;
  let frameType = 0, codec = 0;
  let bitOffset = offset * 8;
  [bitOffset, frameType] = reader.readBits(buffer, bitOffset, 4);
  [bitOffset, codec] = reader.readBits(buffer, bitOffset, 4);
  offset++;

  if (codec !== Video.Codec.AVC) {
    return [end, throwError(new Error(`Unsupported video codec: ${codec}`))];
  }

  let packetType = 0, compositionTimeOffset = 0, data = null;
  [offset, packetType] = reader.readNumber(buffer, offset, 1);
  [offset, compositionTimeOffset] = reader.readNumber(buffer, offset, 3, true);
  data = reader.subBuffer(buffer, offset, length - 5);
  // console.log(`data.length=${data.length}`);
  return [end, new AVC({frameType, codec, packetType, compositionTimeOffset, data})];
}

function writeData(data, buffer, offset) {
  // console.log(`writeData(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  if (data instanceof FLVFile) {
    return writeFile(data, buffer, offset);
  }
  if (data instanceof FLVHeader) {
    return writeHeader(data, buffer, offset);
  }
  if (data instanceof FLVTag) {
    return writeTag(data, buffer, offset);
  }
  if (data instanceof Audio) {
    return writeAudio(data, buffer, offset);
  }
  if (data instanceof Video) {
    return writeVideo(data, buffer, offset);
  }
  throwError(new Error('Unable to write unknown data type'));
  return offset;
}

function writeFile({header, body}, buffer, offset) {
  // console.log(`writeFile(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  offset = writeHeader(header, buffer, offset);
  offset = writer.writeNumber(0, buffer, offset, 4);
  for (const tag of body) {
    const base = writeTag(tag, buffer, offset);
    offset = writer.writeNumber(base - offset, buffer, base, 4);
  }
  return offset;
}

function writeHeader({version, hasAudio, hasVideo}, buffer, offset) {
  // console.log(`writeHeader(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  offset = writer.writeString('FLV', buffer, offset);
  offset = writer.writeNumber(version, buffer, offset, 1);
  let bitOffset = offset * 8;
  bitOffset = writer.writeBits(0, buffer, bitOffset, 5);
  bitOffset = writer.writeBits(hasAudio ? 1 : 0, buffer, bitOffset, 1);
  bitOffset = writer.writeBits(0, buffer, bitOffset, 1);
  bitOffset = writer.writeBits(hasVideo ? 1 : 0, buffer, bitOffset, 1);
  offset++;
  offset = writer.writeNumber(9, buffer, offset, 4);
  return offset;
}

function writeTag({type, timestamp, data}, buffer, offset) {
  // console.log(`writeTag(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  let length = 0;
  if (type === FLVTag.TagType.audio) {
    length = writeAudio(data, null, 0);
  } else if (type === FLVTag.TagType.video) {
    length = writeVideo(data, null, 0);
  } else {
    throwError(new Error(`Unsupported tag type: ${type}`));
    return offset;
  }
  offset = writer.writeNumber(type, buffer, offset, 1);
  offset = writer.writeNumber(length, buffer, offset, 3);
  offset = writer.writeNumber(timestamp & 0xFF_FF_FF, buffer, offset, 3);
  offset = writer.writeNumber(timestamp >>> 24 & 0xFF, buffer, offset, 1);
  offset = writer.writeNumber(0, buffer, offset, 3);
  if (type === FLVTag.TagType.audio) {
    offset = writeAudio(data, buffer, offset);
  } else if (type === FLVTag.TagType.video) {
    offset = writeVideo(data, buffer, offset);
  }
  return offset;
}

function writeAudio({format, sampleRate, size, isStereo, packetType, data}, buffer, offset) {
  // console.log(`writeAudio(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  if (format !== Audio.SoundFormat.AAC) {
    throwError(new Error(`Unsupported sound format: ${format}`));
    return offset;
  }
  let bitOffset = offset * 8;
  bitOffset = writer.writeBits(format, buffer, bitOffset, 4);
  bitOffset = writer.writeBits(sampleRate, buffer, bitOffset, 2);
  bitOffset = writer.writeBits(size, buffer, bitOffset, 1);
  bitOffset = writer.writeBits(isStereo ? 1 : 0, buffer, bitOffset, 1);
  offset++;
  offset = writer.writeNumber(packetType, buffer, offset, 1);
  offset = writer.copyBuffer(data, 0, buffer, offset, data.length);
  return offset;
}

function writeVideo({frameType, codec, packetType, compositionTimeOffset, data}, buffer, offset) {
  // console.log(`writeVideo(buffer.length=${buffer ? buffer.length : 0}, offset=${offset})`);
  if (codec !== Video.Codec.AVC) {
    throwError(new Error(`Unsupported video codec: ${codec}`));
    return offset;
  }
  let bitOffset = offset * 8;
  bitOffset = writer.writeBits(frameType, buffer, bitOffset, 4);
  bitOffset = writer.writeBits(codec, buffer, bitOffset, 4);
  offset++;
  offset = writer.writeNumber(packetType, buffer, offset, 1);
  offset = writer.writeNumber(compositionTimeOffset, buffer, offset, 3);
  offset = writer.copyBuffer(data, 0, buffer, offset, data.length);
  return offset;
}

export {
  readFile,
  readVideo,
  readAudio,
  writeData,
  setOptions,
  getOptions,
};
