import type { MediaStream } from '@livekit/react-native-webrtc';
import { addListener } from '../events/EventEmitter';
import {
  EventTarget,
  Event,
  defineEventAttribute,
} from 'event-target-shim/index';
import { toByteArray } from 'base64-js';
import LiveKitModule from '../LKNativeModule';
import { log } from '../logger';

// typeof MediaRecorder
// const Tester = (stream: MediaStream) => {
//   return new AudioRecorder(stream) satisfies MediaRecorder;
// };

type MediaRecorderState = 'inactive' | 'recording' | 'paused';
type MediaRecorderEventMap = {
  dataavailable: BlobEvent<'dataavailable'>;
  error: Event<'error'>;
  pause: Event<'pause'>;
  resume: Event<'resume'>;
  start: Event<'start'>;
  stop: Event<'stop'>;
};

/**
 * A MediaRecord implementation only meant for recording audio streams.
 *
 * @private
 */
export class MediaRecorder extends EventTarget<MediaRecorderEventMap> {
  mimeType: String = 'audio/pcm';
  audioBitsPerSecond: number = 0; // TODO?
  state: MediaRecorderState = 'inactive';
  stream: MediaStream;
  videoBitsPerSecond: number = 0; // TODO?
  audioBitrateMode = 'constant';

  _reactTag: string | undefined = undefined;
  _parts: string[] = [];
  constructor(stream: MediaStream) {
    super();
    this.stream = stream;
  }

  registerListener() {
    let audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length !== 1) {
      return;
    }
    const mediaStreamTrack = audioTracks[0];
    const peerConnectionId = mediaStreamTrack._peerConnectionId ?? -1;
    const mediaStreamTrackId = mediaStreamTrack?.id;
    this._reactTag = LiveKitModule.createAudioSinkListener(
      peerConnectionId,
      mediaStreamTrackId
    );
    addListener(this, 'LK_AUDIO_DATA', (event: any) => {
      if (
        this._reactTag &&
        event.id === this._reactTag &&
        this.state === 'recording'
      ) {
        let str = event.data as string;
        this._parts.push(str);
      }
    });
  }

  unregisterListener() {
    if (this._reactTag) {
      let audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length !== 1) {
        log.error("couldn't find any audio tracks to record from!");
        return;
      }
      const mediaStreamTrack = audioTracks[0];
      const peerConnectionId = mediaStreamTrack._peerConnectionId ?? -1;
      const mediaStreamTrackId = mediaStreamTrack?.id;

      LiveKitModule.deleteAudioSinkListener(
        this._reactTag,
        peerConnectionId,
        mediaStreamTrackId
      );
    }
  }

  pause() {
    this.state = 'paused';
    this.dispatchEvent(new Event('pause'));
  }

  resume() {
    this.state = 'recording';
    this.dispatchEvent(new Event('resume'));
  }

  start() {
    this.registerListener();
    this.state = 'recording';
    this.dispatchEvent(new Event('start'));
  }

  stop() {
    // dispatch data must come before stopping.
    this.dispatchData();

    this.unregisterListener();
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }

  requestData() {
    this.dispatchData();
  }
  dispatchData() {
    let combinedStr = this._parts.reduce((sum, cur) => sum + cur, '');
    let data = toByteArray(combinedStr);
    this._parts = [];
    this.dispatchEvent(
      new BlobEvent('dataavailable', { data: { byteArray: data } })
    );
  }
}

/**
 * @eventClass
 * This event is fired whenever the Track is changed in PeerConnection.
 * @param {TRACK_EVENTS} type - The type of event.
 * @param {IRTCTrackEventInitDict} eventInitDict - The event init properties.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/track_event MDN} for details.
 */
class BlobEvent<TEventType extends string> extends Event<TEventType> {
  /** @eventProperty */
  readonly data: { byteArray: Uint8Array };

  constructor(
    type: TEventType,
    eventInitDict: { data: { byteArray: Uint8Array } } & Event.EventInit
  ) {
    super(type, eventInitDict);
    this.data = eventInitDict.data;
  }
}

/**
 * Define the `onxxx` event handlers.
 */
const proto = MediaRecorder.prototype;

defineEventAttribute(proto, 'dataavailable');
defineEventAttribute(proto, 'error');
defineEventAttribute(proto, 'pause');
defineEventAttribute(proto, 'resume');
defineEventAttribute(proto, 'start');
defineEventAttribute(proto, 'stop');
