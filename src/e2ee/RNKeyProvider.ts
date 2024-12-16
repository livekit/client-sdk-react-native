import { BaseKeyProvider, type KeyProviderOptions } from 'livekit-client';
import {
  RTCFrameCryptorFactory,
  RTCKeyProvider,
  type RTCKeyProviderOptions,
} from '@livekit/react-native-webrtc';

const defaultRatchetSalt = 'LKFrameEncryptionKey';
const defaultMagicBytes = 'LK-ROCKS';
const defaultRatchetWindowSize = 16;
const defaultFailureTolerance = -1;
const defaultKeyRingSize = 16;
const defaultDiscardFrameWhenCryptorNotReady = false;

/**
 * Options for construction an RNKeyProvider
 */
export type RNKeyProviderOptions = KeyProviderOptions & {
  uncryptedMagicBytes?: string | Uint8Array;
};

/**
 * @experimental
 */
export default class RNKeyProvider extends BaseKeyProvider {
  private latestSetIndex: Map<string, number> = new Map();
  private nativeKeyProvider: RTCKeyProvider;

  constructor(options: Partial<RNKeyProviderOptions>) {
    const opts: RTCKeyProviderOptions & KeyProviderOptions = {
      sharedKey: options.sharedKey ?? true,
      ratchetSalt: options.ratchetSalt ?? defaultRatchetSalt,
      ratchetWindowSize: options.ratchetWindowSize ?? defaultRatchetWindowSize,
      failureTolerance: options.failureTolerance ?? defaultFailureTolerance,
      keyRingSize: options.keyringSize ?? defaultKeyRingSize,
      keyringSize: options.keyringSize ?? defaultKeyRingSize,
      discardFrameWhenCryptorNotReady: defaultDiscardFrameWhenCryptorNotReady,
    };

    let magicBytes = options.uncryptedMagicBytes ?? defaultMagicBytes;
    if (typeof magicBytes === 'string') {
      magicBytes = new TextEncoder().encode(magicBytes);
    }
    opts.uncryptedMagicBytes = magicBytes;

    super(opts);

    this.nativeKeyProvider =
      RTCFrameCryptorFactory.createDefaultKeyProvider(opts);
  }

  getLatestKeyIndex(participantId: string) {
    return this.latestSetIndex.get(participantId) ?? 0;
  }

  /**
   * Accepts a passphrase that's used to create the crypto keys.
   * @param key
   */
  async setSharedKey(key: string | Uint8Array, keyIndex?: number) {
    return this.nativeKeyProvider.setSharedKey(key, keyIndex);
  }

  async ratchetSharedKey(keyIndex?: number) {
    this.nativeKeyProvider.ratchetSharedKey(keyIndex);
  }

  /**
   * Accepts a passphrase that's used to create the crypto keys for a participant's stream.
   * @param key
   */
  async setKey(
    participantId: string,
    key: string | Uint8Array,
    keyIndex?: number
  ) {
    if (this.getOptions().sharedKey) {
      return this.setSharedKey(key, keyIndex);
    }

    this.latestSetIndex.set(participantId, keyIndex ?? 0);
    return this.nativeKeyProvider.setKey(participantId, key, keyIndex);
  }

  override async ratchetKey(participantIdentity?: string, keyIndex?: number) {
    if (!this.getOptions().sharedKey && participantIdentity) {
      this.nativeKeyProvider.ratchetKey(participantIdentity, keyIndex);
    } else {
      this.ratchetSharedKey(keyIndex);
    }
  }

  async setSifTrailer(trailer: Uint8Array) {
    return this.nativeKeyProvider.setSifTrailer(trailer);
  }

  /**
   * @internal
   */
  get rtcKeyProvider() {
    return this.nativeKeyProvider;
  }

  dispose() {
    this.nativeKeyProvider.dispose();
  }
}

// /**
//  * Define the `onxxx` event handlers.
//  */
// const proto = RNExternalE2EEKeyProvider.prototype;

// defineEventAttribute(proto, KeyProviderEvent.SetKey);
// defineEventAttribute(proto, KeyProviderEvent.RatchetRequest);
// defineEventAttribute(proto, KeyProviderEvent.KeyRatcheted);
