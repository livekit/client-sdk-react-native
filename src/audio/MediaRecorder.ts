import type { MediaStream } from '@livekit/react-native-webrtc';
import { addListener } from '../events/EventEmitter';
import { EventTarget, Event, defineEventAttribute } from 'event-target-shim';
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

type MediaRecorderOptions = {
  mimeType?: string;
};

/**
 * A MediaRecord implementation only meant for recording audio streams.
 *
 * @private
 */
export class MediaRecorder extends EventTarget<MediaRecorderEventMap> {
  static isTypeSupported(mimeType: string): boolean {
    return mimeType === 'video/mp4';
  }

  mimeType: string;
  audioBitsPerSecond: number = 0; // TODO?
  state: MediaRecorderState = 'inactive';
  stream: MediaStream;
  videoBitsPerSecond: number = 0; // TODO?
  audioBitrateMode = 'constant';

  _reactTag: string | undefined = undefined;
  _parts: string[] = [];
  _hasLoggedFirstChunk = false;
  _hasLoggedFirstDispatch = false;

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    super();
    this.stream = stream;
    this.mimeType =
      options?.mimeType && MediaRecorder.isTypeSupported(options.mimeType)
        ? options.mimeType
        : 'audio/pcm';
  }

  emitDebugLog(stage: string, extra: Record<string, unknown> = {}) {
    console.log(
      'lk-rn-media-recorder-debug',
      JSON.stringify({
        timestampMs: Date.now(),
        stage,
        mimeType: this.mimeType,
        reactTag: this._reactTag,
        state: this.state,
        ...extra,
      })
    );
  }

  registerListener() {
    let audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length !== 1) {
      this.emitDebugLog('create_audio_sink_listener_skipped', {
        audioTrackCount: audioTracks.length,
      });
      return;
    }
    const mediaStreamTrack = audioTracks[0]!!;
    const peerConnectionId = mediaStreamTrack._peerConnectionId ?? -1;
    const mediaStreamTrackId = mediaStreamTrack?.id;
    this.emitDebugLog('create_audio_sink_listener_requested', {
      peerConnectionId,
      trackId: mediaStreamTrackId,
    });
    this._reactTag = LiveKitModule.createAudioSinkListener(
      peerConnectionId,
      mediaStreamTrackId
    );
    this.emitDebugLog('create_audio_sink_listener_completed', {
      peerConnectionId,
      trackId: mediaStreamTrackId,
    });
    addListener(this, 'LK_AUDIO_DATA', (event: any) => {
      if (
        this._reactTag &&
        event.id === this._reactTag &&
        this.state === 'recording'
      ) {
        let str = event.data as string;
        if (!this._hasLoggedFirstChunk) {
          this._hasLoggedFirstChunk = true;
          this.emitDebugLog('first_audio_chunk_received', {
            base64Length: str.length,
          });
        }
        this._parts.push(str);
      }
    });
    addListener(this, 'LK_PRECONNECT_DEBUG', (event: any) => {
      if (this._reactTag && event.id === this._reactTag) {
        console.log(
          'lk-rn-native-preconnect-debug',
          JSON.stringify({
            timestampMs: Date.now(),
            mimeType: this.mimeType,
            reactTag: this._reactTag,
            state: this.state,
            ...event,
          })
        );
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
      const mediaStreamTrack = audioTracks[0]!!;
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
    this.emitDebugLog('start_entered');
    this.registerListener();
    this.state = 'recording';
    this.dispatchEvent(new Event('start'));
    this.emitDebugLog('start_completed');
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
    if (!this._hasLoggedFirstDispatch) {
      this._hasLoggedFirstDispatch = true;
      this.emitDebugLog('first_data_dispatched', {
        byteLength: data.length,
      });
    }
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
