import {FLVFile, FLVHeader, FLVTag, Audio, AAC, Video, AVC} from './types.js';

export function print(data) {
  let obj = null;
  if (data instanceof FLVFile) {
    obj = printFile(data);
  } else if (data instanceof FLVHeader) {
    obj = printHeader(data);
  } else if (data instanceof FLVTag) {
    obj = printTag(data);
  } else if (data instanceof Audio) {
    obj = printAudio(data);
  } else if (data instanceof Video) {
    obj = printVideo(data);
  } else {
    obj = 'Unknown data type';
  }
  console.log(JSON.stringify(obj, null, 4));
}

function printFile({header, body}) {
  const headerObj = printHeader(header);
  const bodyObj = [];
  for (const tag of body) {
    bodyObj.push(printTag(tag));
  }
  return {FLVFile: {FLVHeader: headerObj, body: bodyObj}};
}

function printHeader(header) {
  return {FLVHeader: header};
}

function printTag({type, timestamp, data}) {
  let dataObj = null;
  if (type === FLVTag.TagType.audio) {
    dataObj = printAudio(data);
  } else if (type === FLVTag.TagType.video) {
    dataObj = printVideo(data);
  } else {
    dataObj = {UnknownTag: `Unsupported tag type: ${type}`};
  }
  return {FLVTag: {timestamp, dataObj}};
}

function printAudio({format, sampleRate, size, isStereo, packetType, data}) {
  const obj = {
    format: printSoundFormat(format),
    sampleRate: printSampleRate(sampleRate),
    size: printSampleLength(size),
    isStereo,
    data: printBuffer(data),
  };
  if (format === Audio.SoundFormat.AAC) {
    obj.packetType = printAACPacketType(packetType);
    return {AAC: obj};
  }
  return {Audio: obj};
}

function printSoundFormat(format) {
  switch (format) {
    case Audio.SoundFormat.LinearPCM:
      return 'Linear PCM';
    case Audio.SoundFormat.ADPCM:
      return 'ADPCM';
    case Audio.SoundFormat.MP3:
      return 'MP3';
    case Audio.SoundFormat.LinearPCMLE:
      return 'Linear PCM Little Endian';
    case Audio.SoundFormat.Nellymoser16Mono:
      return 'Nellymoser 16 bit Mono';
    case Audio.SoundFormat.Nellymoser8Mono:
      return 'Nellymoser 8 bit Mono';
    case Audio.SoundFormat.Nellymoser:
      return 'Nellymoser';
    case Audio.SoundFormat.G711Alaw:
      return 'G-711 A-law';
    case Audio.SoundFormat.G711Mulaw:
      return 'G-711 Mu-law';
    case Audio.SoundFormat.AAC:
      return 'AAC';
    case Audio.SoundFormat.Speex:
      return 'Speex';
    case Audio.SoundFormat.MP38kHz:
      return 'MP3 8kHz';
    case Audio.SoundFormat.DeviceSpecific:
      return 'Device Specific';
    default:
      return 'Unknown sound format';
  }
}

function printSampleRate(sampleRate) {
  switch (sampleRate) {
    case Audio.SampleRate._5kHz:
      return '5.5kHz';
    case Audio.SampleRate._11kHz:
      return '11kHz';
    case Audio.SampleRate._22kHz:
      return '22kHz';
    case Audio.SampleRate._44kHz:
      return '44kHz';
    default:
      return 'Unknown sample rate';
  }
}

function printSampleLength(size) {
  switch (size) {
    case Audio.SampleLength._8Bit:
      return '8 bits per sample';
    case Audio.SampleLength._16Bit:
      return '16 bits per sample';
    default:
      return 'Unknown sample length';
  }
}

function printAACPacketType(size) {
  switch (size) {
    case AAC.PacketType.SequenceHeader:
      return 'AAC sequence header';
    case AAC.PacketType.Raw:
      return 'AAC raw data';
    default:
      return 'Unknown packet type';
  }
}

function printBuffer(buf) {
  if (buf) {
    return `<Buffer length=${buf.length} >`;
  }
  return 'Empty buffer';
}

function printVideo({frameType, codec, packetType, compositionTimeOffset, data}) {
  const obj = {
    frameType: printFrameType(frameType),
    sampleRate: printVideoCodec(codec),
    data: printBuffer(data),
  };
  if (codec === Video.Codec.AVC) {
    obj.packetType = printAVCPacketType(packetType);
    obj.compositionTimeOffset = compositionTimeOffset;
    return {AVC: obj};
  }
  return {Video: obj};
}

function printFrameType(frameType) {
  switch (frameType) {
    case Video.FrameType.keyframe:
      return 'keyframe';
    case Video.FrameType.interframe:
      return 'inter frame';
    case Video.FrameType.disposable:
      return 'disposable inter frame';
    case Video.FrameType.generated:
      return 'generated keyframe';
    case Video.FrameType.command:
      return 'video info/command frame';
    default:
      return 'Unknown frame type';
  }
}

function printVideoCodec(codec) {
  switch (codec) {
    case Video.Codec.JPEG:
      return 'JPEG';
    case Video.Codec.Sorenson:
      return 'Sorenson H.263';
    case Video.Codec.ScreenVideo:
      return 'Screen video';
    case Video.Codec.On2VP6:
      return 'On2 VP6';
    case Video.Codec.On2VP6WithAlpha:
      return 'On2 VP6 with alpha channel';
    case Video.Codec.ScreenVideo2:
      return 'Screen video version 2';
    case Video.Codec.AVC:
      return 'AVC';
    default:
      return 'Unknown video codec';
  }
}

function printAVCPacketType(packetType) {
  switch (packetType) {
    case AVC.PacketType.SequenceHeader:
      return 'AVC sequence header';
    case AVC.PacketType.NALU:
      return 'AVC NAL unit';
    case AVC.PacketType.EndOfSequence:
      return 'AVC end of sequence';
    default:
      return 'Unknown packet type';
  }
}
