import { fromByteArray, toByteArray } from 'base64-js';
import { NativeModules } from 'react-native';

/**
 * The write-ahead cache `livekit-client`'s pipeline stores batches in: the shape the Rust core's
 * `FileCache` has, so a React Native app keeps the caching semantics an iOS or Android app gets.
 * A batch survives the process and is removed only once the collector has taken it.
 *
 * TODO(phase 2): replace with the type `livekit-client` exports once its storage hook lands.
 */
export interface TelemetryStorage {
  /**
   * Stores a batch and returns the ids evicted to stay inside the budgets. Throws when the batch
   * could not be written, so the pipeline counts the loss instead of believing it stored.
   */
  put(id: string, body: Uint8Array): string[];
  /** Ids of the stored batches, oldest first. */
  pending(): string[];
  read(id: string): Uint8Array | undefined;
  remove(id: string): void;
  clear(): void;
}

/**
 * The native file cache, or `undefined` on a native build that predates it — such an app simply
 * keeps its batches in memory.
 *
 * The calls are synchronous blocking bridge calls because the pipeline's queue path has no await
 * in it, and base64 because the bridge does not carry bytes. That is also why this is native code
 * in this package rather than one of the filesystem packages on npm — all of those are async.
 */
export function nativeBatchStore(): TelemetryStorage | undefined {
  const native = NativeModules.LivekitReactNativeModule;
  if (!native?.batchStorePut) {
    return undefined;
  }
  return {
    put: (id, body) => {
      // The native store answers null, never an empty list, when it could not write the batch.
      const evicted: string[] | null = native.batchStorePut(
        id,
        fromByteArray(body)
      );
      if (!evicted) {
        throw new Error(`telemetry cache could not write batch ${id}`);
      }
      return evicted;
    },
    pending: () => native.batchStorePending() ?? [],
    read: (id) => {
      const body = native.batchStoreRead(id);
      return body ? toByteArray(body) : undefined;
    },
    remove: (id) => {
      native.batchStoreRemove(id);
    },
    clear: () => {
      native.batchStoreClear();
    },
  };
}
