import RNE2EEManager from '../e2ee/RNE2EEManager';
import { log, RNKeyProvider } from '..';
import { useEffect, useState } from 'react';
import type { RNKeyProviderOptions } from '../e2ee/RNKeyProvider';

export type UseRNE2EEManagerOptions = {
  keyProviderOptions?: RNKeyProviderOptions;
  sharedKey: string | Uint8Array;
};

export interface RNE2EEManagerState {
  keyProvider: RNKeyProvider;
  e2eeManager: RNE2EEManager;
}

/**
 * @experimental
 */
export function useRNE2EEManager(
  options: UseRNE2EEManagerOptions
): RNE2EEManagerState {
  let [keyProvider] = useState(
    () => new RNKeyProvider(options.keyProviderOptions ?? {})
  );
  let [e2eeManager] = useState(() => new RNE2EEManager(keyProvider));

  useEffect(() => {
    let setup = async () => {
      try {
        await keyProvider.setSharedKey(options.sharedKey);
      } catch (error) {
        log.warn('unable to set shared key', error);
      }
    };
    setup();
    return () => {};
  }, [keyProvider, options.sharedKey]);

  useEffect(() => {
    return () => {
      keyProvider.dispose();
    };
  }, [keyProvider]);

  return {
    keyProvider,
    e2eeManager,
  };
}
