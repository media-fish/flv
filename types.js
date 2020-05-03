class FLVFile {
  constructor(header, tags) {
    this.header = header; // FLVHeader
    this.body = tags; // An array of FLVTag
  }
}

class FLVHeader {
  constructor({version, hasAudio, hasVideo}) {
    this.version = version;
    this.hasAudio = hasAudio;
    this.hasVideo = hasVideo;
  }
}

class FLVTag {
  constructor({type, timestamp, data}) {
    this.type = type; // FLVTag.TagType
    this.timestamp = timestamp;
    this.data = data; // FLVData
  }
}

FLVTag.TagType = {
  audio: 8,
  video: 9
};

class FLVData {
  constructor(type) {
    this.type = type; // 'audio' or 'video' or 'data'
  }
}

class Audio extends FLVData {
  constructor({format, sampleRate, size, isStereo, data}) {
    super('audio');
    this.format = format; // Audio.SoundFormat
    this.sampleRate = sampleRate; // Audio.SampleRate
    this.size = size; // Audio.SampleLength
    this.isStereo = isStereo;
    this.data = data; // Format specific data
  }
}

Audio.SoundFormat = {
  LinearPCM: 0,
  ADPCM: 1,
  MP3: 2,
  LinearPCMLE: 3,
  Nellymoser16Mono: 4,
  Nellymoser8Mono: 5,
  Nellymoser: 6,
  G711Alaw: 7,
  G711Mulaw: 8,
  AAC: 10,
  Speex: 11,
  MP38kHz: 14,
  DeviceSpecific: 15
};

Audio.SampleRate = {
  _5kHz: 0,
  _11kHz: 1,
  _22kHz: 2,
  _44kHz: 3
};

Audio.SampleLength = {
  _8Bit: 0,
  _16Bit: 1
};

class AAC extends Audio {
  constructor({format, sampleRate, size, isStereo, packetType, data}) {
    super({format, sampleRate, size, isStereo, data});
    this.packetType = packetType; // AAC.PacketType
  }
}

AAC.PacketType = {
  SequenceHeader: 0,
  Raw: 1
};

class Video extends FLVData {
  constructor({frameType, codec, data}) {
    super('video');
    this.frameType = frameType; // Video.FrameType
    this.codec = codec; // Video.Codec
    this.data = data; // Codec specific data
  }
}

Video.FrameType = {
  keyframe: 1,
  interframe: 2,
  disposable: 3,
  generated: 4,
  command: 5
};

Video.Codec = {
  JPEG: 1,
  Sorenson: 2,
  ScreenVideo: 3,
  On2VP6: 4,
  On2VP6WithAlpha: 5,
  ScreenVideo2: 6,
  AVC: 7
};

class AVC extends Video {
  constructor({frameType, codec, packetType, compositionTimeOffset, data}) {
    super({frameType, codec, data});
    this.packetType = packetType;
    this.compositionTimeOffset = compositionTimeOffset;
  }
}

AVC.PacketType = {
  SequenceHeader: 0,
  NALU: 1,
  EndOfSequence: 2
};

module.exports = {
  FLVFile,
  FLVHeader,
  FLVTag,
  Audio,
  Video,
  AAC,
  AVC
};
