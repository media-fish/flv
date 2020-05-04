[![Build Status](https://travis-ci.org/media-fish/flv.svg?branch=master)](https://travis-ci.org/media-fish/flv)
[![Coverage Status](https://coveralls.io/repos/github/media-fish/flv/badge.svg?branch=master)](https://coveralls.io/github/media-fish/flv?branch=master)
[![Dependency Status](https://david-dm.org/media-fish/flv.svg)](https://david-dm.org/media-fish/flv)
[![Development Dependency Status](https://david-dm.org/media-fish/flv/dev-status.svg)](https://david-dm.org/media-fish/flv#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/media-fish/flv/badge.svg)](https://snyk.io/test/github/media-fish/flv)
[![npm Downloads](https://img.shields.io/npm/dw/@mediafish/flv.svg?style=flat-square)](https://npmjs.com/@mediafish/flv)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# flv

A library to read/write Flash Video file format (only supports AAC/AVC)

## Install
[![NPM](https://nodei.co/npm/@mediafish/flv.png?mini=true)](https://nodei.co/npm/@mediafish/flv/)

## Usage

### Example of reading FLV file
```js
const {readFile, print} = require('@mediafish/flv');

const buf = fs.readFileSync('test.flv');
const [offset, flv] = readFile(buf, offset);
print(flv);
/*
FLVFile {
  FLVHeader: {
    version: 1,
    hasAudio: true,
    hasVideo: true
  },
  body: [
    FLVTag: {
      timestamp: 0,
      AVC: {
        frameType: 'keyframe',
        codec: 'AVC',
        packetType: 'NALU',
        data: <Buffer length=1024 >
      }
    },
    FLVTag: {
      timestamp: 0,
      AAC: {
        format: 'AAC',
        sampleRate: '44kHz',
        size: '16Bit',
        isStereo: true,
        packetType: 'raw',
        data: <Buffer length=1024 >
      }
    },
    ...
  ]
}
*/
```

### Example of reading Video and Audio

```js
const {readVideo, readAudio, print} = require('@mediafish/flv');

const [offset, video] = readVideo(buf1, offset);
print(video);
/*
AVC: {
  frameType: 'keyframe',
  codec: 'AVC',
  packetType: 'NALU',
  data: <Buffer length=1024 >
}
*/

const [offset, audio] = readAudio(buf2, offset);
print(audio);
/*
AAC: {
  format: 'AAC',
  sampleRate: '44kHz',
  size: '16Bit',
  isStereo: true,
  packetType: 'raw',
  data: <Buffer length=1024 >
}
*/
```

### Example of writing FLV

```js
const {writeData, type: {Video, AVC, Audio, AAC, FLVFile, FLVHeader, FLVTag}} = require('@mediafish/flv');

const video = new AVC({
  frameType: Video.FrameType.keyframe,
  codec: Video.Codec.AVC,
  packetType: AVC.PacketType.NALU,
  compositionTimeOffset: 0,
  data: buf1
});


const audio = new AAC({
  format: Audio.SoundFormat.AAC,
  sampleRate: Audio.SampleRate._44kHz,
  size: Audio.SampleLength._16Bit,
  isStereo: true,
  packetType: AAC.PacketType.Raw,
  data: buf2
});

const header = new FLVHeader({version: 1, hasAudio: true, hasVideo: true});

const tags = [
  new FLVTag({type: FLVTag.TagType.audio, timestamp: 0, data: audio}),
  new FLVTag({type: FLVTag.TagType.video, timestamp: 0, data: video})
];

const flv = new FLVFile(header, tags);

// First, pass null instead of a buffer to detect how many bytes are needed
const byteLength = writeData(flv, null, 0);
// And then alloc a buff
const buffer = Buffer.alloc(byteLength);
// Finally, write the data actually to the buffer
writeData(flv, buffer, 0);
```

### Example of writing Video and Audio

```js
const {writeData, type: {Video, AVC, Audio, AAC}} = require('@mediafish/flv');

const video = new AVC({
  frameType: Video.FrameType.keyframe,
  codec: Video.Codec.AVC,
  packetType: AVC.PacketType.NALU,
  compositionTimeOffset: 0,
  data: buf1
});


const audio = new AAC({
  format: Audio.SoundFormat.AAC,
  sampleRate: Audio.SampleRate._44kHz,
  size: Audio.SampleLength._16Bit,
  isStereo: true,
  packetType: AAC.PacketType.Raw,
  data: buf2
});

// First, pass null instead of a buffer to detect how many bytes are needed
const videoLength = writeData(video, null, 0);
const audioLength = writeData(audio, null, 0);
// And then alloc a buff
const buffer = Buffer.alloc(videoLength + audioLength);
// Finally, write the data actually to the buffer
let offset = 0;
offset = writeData(video, buffer, offset);
offset = writeData(audio, buffer, offset);
```

## API

### `readFile(buffer, offset)`
Read FLV file from the buffer

#### params
| Name     | Type    | Required | Default | Description   |
| -------- | ------- | -------- | ------- | ------------- |
| `buffer` | `Buffer` or `Uint8Array` | Yes | N/A | The buffer from which the data is read |
| `offset` | number  | Yes      | N/A     | An integer to specify the position within the buffer |

#### return value
An array containing the following pair of values

| Index | Type   | Description  |
| ----- | ------ | ------------ |
| [0]   | number | An integer to indicate the position from which the next data should be read |
| [1]   | FLVFile | The read data (See `Data format`) |

### `readVideo(buffer, offset, length)`
Read video data from the buffer

#### params
| Name     | Type    | Required | Default | Description   |
| -------- | ------- | -------- | ------- | ------------- |
| `buffer` | `Buffer` or `Uint8Array` | Yes | N/A | The buffer from which the data is read |
| `offset` | number  | Yes      | N/A     | An integer to specify the position within the buffer |
| `length` | number  | Yes      | N/A     | An integer to specify how many bytes to read |

#### return value
An array containing the following pair of values

| Index | Type   | Description  |
| ----- | ------ | ------------ |
| [0]   | number | An integer to indicate the position from which the next data should be read |
| [1]   | AVC    | The read data (See `Data format`) |

### `readAudio(buffer, offset)`
Read audio data from the buffer

#### params
| Name     | Type    | Required | Default | Description   |
| -------- | ------- | -------- | ------- | ------------- |
| `buffer` | `Buffer` or `Uint8Array` | Yes | N/A | The buffer from which the data is read |
| `offset` | number  | Yes      | N/A     | An integer to specify the position within the buffer |
| `length` | number  | Yes      | N/A     | An integer to specify how many bytes to read |

#### return value
An array containing the following pair of values

| Index | Type   | Description  |
| ----- | ------ | ------------ |
| [0]   | number | An integer to indicate the position from which the next data should be read |
| [1]   | AAC    | The read data (See `Data format`) |

### `writeData(data, buffer, offset)`
Write data to the buffer

#### params
| Name     | Type    | Required | Default | Description   |
| -------- | ------- | -------- | ------- | ------------- |
| `data`  | AVC/AAC/FLVHeader/FLVTag/FLVFile | Yes      | N/A     | The data to be written to the buffer |
| `buffer` | `Buffer` | No | null | The buffer to which the data is written. If null, only the necessary buffer size is calculated |
| `offset` | number  | Yes      | N/A     | An integer to specify the position within the buffer |

#### return value
An integer to indicate the position from which the next data should be read

## Data format
This section describes the structure of the data that can be read / written using `readFile`/`readAudio`/`readVideo`

### `FLVFile`
| Property | Type        | Description   |
| -------- | ----------- | ------------- |
| `header` | `FLVHeader` | An instance of `FLVHeader` |
| `body`   | [`FLVTag`]  | An array of `FLVTag`       |

### `FLVHeader`
| Property   | Type    | Description   |
| ---------- | ------- | ------------- |
| `version`  | number  | FLV version |
| `hasAudio` | boolean | Audio tags are present |
| `hasVideo` | boolean | Video tags are present |

### `FLVTag`
| Property    | Type                  | Description   |
| ----------- | --------------------- | ------------- |
| `type`      | enum `FLVTag.TagType` | Type of this tag |
| `timestamp` | number                | Time in milliseconds at which the data in this tag applies |
| `data`      | `Audio` or `Video`    | An instance of `Audio` / `Video` |

### `Audio`
| Property     | Type                      | Description   |
| ------------ | ------------------------- | ------------- |
| `format`     | enum `Audio.SoundFormat`  | Type of this tag. Only `AAC` is supported. |
| `sampleRate` | enum `Audio.SampleRate`   | sample rate |
| `size`       | enum `Audio.SampleLength` | bits per sample |
| `isStereo`   | boolean                   | mono / stereo |
| `data`       | `Buffer` or `Uint8Array`  | Format specific data. |

### `AAC` extends `Audio`
| Property     | Type                  | Description     |
| ------------ | --------------------- | --------------- |
| `packetType` | enum `AAC.PacketType` | AAC packet type |

### `Video`
| Property    | Type                     | Description   |
| ----------- | ------------------------ | ------------- |
| `frameType` | enum `Video.FrameType`   | Type of the frame included in this tag |
| `codec`     | enum `Video.Codec`       | Type of codec used to compress the frame. Only `AVC` is supported. |
| `data`      | `Buffer` or `Uint8Array` | Codec specific data. |

### `AVC` extends `Video`
| Property                | Type                  | Description     |
| ----------------------- | --------------------- | --------------- |
| `packetType`            | enum `AVC.PacketType` | AVC packet type |
| `compositionTimeOffset` | number | Composition time offset |
