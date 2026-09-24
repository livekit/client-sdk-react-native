import { fromByteArray, toByteArray } from 'base64-js';
import type { TelemetryStorage } from 'livekit-client';
import { NativeModules } from 'react-native';

/**
 * The write-ahead cache `livekit-client`'s pipeline stores batches in, backed by a directory of
 * files — the same shape the Rust core's `FileCache` has, so a React Native app keeps the caching
 * semantics an iOS or Android app gets: a batch survives the process and is removed only once the
 * collector has taken it.
 *
 * The calls are synchronous blocking bridge calls because the pipeline's queue path has no await
 * in it, and base64 because the bridge does not carry bytes. That is also why this is native code
 * in this package rather than one of the filesystem packages on npm — all of those are async.
 */
export function nativeBatchStore(): TelemetryStorage | undefined {
  const native = NativeModules.LivekitReactNativeModule;
  // An app on an older native build simply keeps its batches in memory.
  if (!native?.batchStorePut) {
    return undefined;
  }
  return {
    put: (id: string, body: Uint8Array) =>
      native.batchStorePut(id, fromByteArray(body)) ?? [],
    pending: () => native.batchStorePending() ?? [],
    read: (id: string) => {
      const body = native.batchStoreRead(id);
      return body ? toByteArray(body) : undefined;
    },
    remove: (id: string) => {
      native.batchStoreRemove(id);
    },
    clear: () => {
      native.batchStoreClear();
    },
  };
}
