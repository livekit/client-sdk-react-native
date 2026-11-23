import type { TelemetryHost } from 'livekit-client';

/** What a `livekit-client` with the host seam exports, as far as this package reads it. */
const currentClient = () => ({
  configureTelemetryHost: jest.fn(),
  disableTelemetry: jest.fn(),
  getLogger: jest.fn((name: string) => require('loglevel').getLogger(name)),
  setLogLevel: jest.fn(),
});

/** A fresh module registry per test: `registerTelemetry` wires once per process. */
function load(client: object = currentClient()) {
  jest.resetModules();
  jest.doMock('livekit-client', () => client);
  const {
    AppState,
    DeviceEventEmitter,
    NativeModules,
  } = require('react-native');
  const { Platform } = require('react-native');
  const { configureTelemetryHost, getLogger } = require('livekit-client');
  const { registerTelemetry, disableTelemetry } = require('../telemetry');
  const { log } = require('../logger');
  AppState.currentState = 'active';
  jest.spyOn(log, 'warn').mockImplementation(() => {});
  jest.spyOn(log, 'debug').mockImplementation(() => {});
  jest.spyOn(log, 'error').mockImplementation(() => {});
  return {
    AppState,
    DeviceEventEmitter,
    NativeModules,
    Platform,
    configureTelemetryHost,
    getLogger,
    registerTelemetry,
    disableTelemetry,
    log,
  };
}

describe('the package logger', () => {
  it('is the instance livekit-client registers, and still takes every argument', () => {
    const { log, getLogger } = load();
    expect(getLogger).toHaveBeenCalledWith('lk-react-native');
    expect(log).toBe(getLogger.mock.results[0].value);
    expect(log.getLevel()).toBe(log.levels.WARN);
    const warn = jest.spyOn(log, 'warn').mockImplementation(() => {});
    log.warn('audio session', { reason: 'busy' }, 3);
    expect(warn).toHaveBeenCalledWith('audio session', { reason: 'busy' }, 3);
  });
});

/** The native module as the bridge presents it, with every answer under the test's control. */
function mockNative(NativeModules: any) {
  const native = {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    startDeviceStateUpdates: jest.fn().mockResolvedValue({
      thermal: 'nominal',
      lowPower: false,
    }),
    batchStorePut: jest.fn().mockReturnValue([]),
    batchStorePending: jest.fn().mockReturnValue([]),
    batchStoreRead: jest.fn().mockReturnValue(null),
    batchStoreRemove: jest.fn(),
    batchStoreClear: jest.fn(),
  };
  NativeModules.LivekitReactNativeModule = native;
  return native;
}

const hostOf = (configureTelemetryHost: jest.Mock): TelemetryHost =>
  configureTelemetryHost.mock.calls[0][0];

describe('registerTelemetry', () => {
  it('wires the host once, naming this platform', () => {
    const { registerTelemetry, configureTelemetryHost, NativeModules } = load();
    mockNative(NativeModules);
    registerTelemetry();
    registerTelemetry();
    expect(configureTelemetryHost).toHaveBeenCalledTimes(1);
    const host = hostOf(configureTelemetryHost);
    expect(host.sdk).toMatchObject({
      name: 'react-native',
      version: require('../../package.json').version,
      os: 'ios',
    });
    expect(host.storage).toBeDefined();
    expect(host.observeDevice).toBeDefined();
    expect(host.endpoint).toBeUndefined();
  });

  it('still configures without native modules: no cache, app state only', () => {
    const { registerTelemetry, configureTelemetryHost, NativeModules } = load();
    delete NativeModules.LivekitReactNativeModule;
    registerTelemetry();
    const host = hostOf(configureTelemetryHost);
    expect(host.storage).toBeUndefined();
    const report = jest.fn();
    const stop = host.observeDevice!(report, jest.fn());
    expect(report).toHaveBeenCalledWith({ appState: 'foreground' });
    expect(() => stop?.()).not.toThrow();
  });

  it('degrades to no telemetry on a livekit-client without the host seam', () => {
    const { registerTelemetry, disableTelemetry, log } = load({
      getLogger: currentClient().getLogger,
      setLogLevel: jest.fn(),
    });
    expect(() => registerTelemetry()).not.toThrow();
    expect(() => disableTelemetry()).not.toThrow();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('forwards disableTelemetry to livekit-client', () => {
    const client = currentClient();
    load(client).disableTelemetry();
    expect(client.disableTelemetry).toHaveBeenCalledTimes(1);
  });

  it('reports a failing hook once at debug, outside the captured warn path', () => {
    const { registerTelemetry, configureTelemetryHost, log } = load();
    configureTelemetryHost.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => registerTelemetry()).not.toThrow();
    registerTelemetry();
    expect(configureTelemetryHost).toHaveBeenCalledTimes(1);
    expect(log.debug).toHaveBeenCalledTimes(1);
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });
});

describe('the host storage', () => {
  it('carries bytes as base64 and evicted ids back', () => {
    const { registerTelemetry, configureTelemetryHost, NativeModules } = load();
    const native = mockNative(NativeModules);
    native.batchStorePut.mockReturnValue(['000-old']);
    native.batchStorePending.mockReturnValue(['000-old', '001-new']);
    native.batchStoreRead.mockImplementation((id: string) =>
      id === '001-new' ? 'AQID' : null
    );
    registerTelemetry();
    const store = hostOf(configureTelemetryHost).storage!;

    expect(store.put('001-new', new Uint8Array([1, 2, 3]))).toEqual([
      '000-old',
    ]);
    expect(native.batchStorePut).toHaveBeenCalledWith('001-new', 'AQID');
    expect(store.pending()).toEqual(['000-old', '001-new']);
    expect(store.read('001-new')).toEqual(new Uint8Array([1, 2, 3]));
    expect(store.read('nope')).toBeUndefined();
    store.remove('000-old');
    store.clear();
    expect(native.batchStoreRemove).toHaveBeenCalledWith('000-old');
    expect(native.batchStoreClear).toHaveBeenCalled();
  });

  it('turns a native write failure into a throw, so the pipeline counts the loss', () => {
    const { registerTelemetry, configureTelemetryHost, NativeModules } = load();
    mockNative(NativeModules).batchStorePut.mockReturnValue(null);
    registerTelemetry();
    const store = hostOf(configureTelemetryHost).storage!;
    // What the pipeline does: a put that throws is a counted loss; one that returns is stored.
    let lost = 0;
    try {
      store.put('001', new Uint8Array([1]));
    } catch {
      lost += 1;
    }
    expect(lost).toBe(1);
  });
});

describe('the host device observer', () => {
  it('reports app state, the native snapshot, then each change, until stopped', async () => {
    const {
      registerTelemetry,
      configureTelemetryHost,
      NativeModules,
      AppState,
      DeviceEventEmitter,
    } = load();
    mockNative(NativeModules);
    registerTelemetry();
    const report = jest.fn();
    const stop = hostOf(configureTelemetryHost).observeDevice!(
      report,
      jest.fn()
    );
    await Promise.resolve();
    expect(report.mock.calls.map((c) => c[0])).toEqual([
      { appState: 'foreground' },
      { thermal: 'nominal', lowPower: false },
    ]);

    DeviceEventEmitter.emit('LK_DEVICE_STATE', { memory: 'critical' });
    const onAppState = AppState.addEventListener.mock.calls[0][1];
    onAppState('background');
    onAppState('inactive');
    expect(report.mock.calls.slice(2).map((c) => c[0])).toEqual([
      { memory: 'critical' },
      { appState: 'background' },
      { appState: 'foreground' },
    ]);

    stop?.();
    DeviceEventEmitter.emit('LK_DEVICE_STATE', { thermal: 'serious' });
    expect(report).toHaveBeenCalledTimes(5);
    expect(
      AppState.addEventListener.mock.results[0].value.remove
    ).toHaveBeenCalled();
  });

  it('counts Android memory as normal again when the app returns to the foreground', () => {
    const {
      registerTelemetry,
      configureTelemetryHost,
      NativeModules,
      AppState,
      Platform,
    } = load();
    mockNative(NativeModules);
    registerTelemetry();
    jest.replaceProperty(Platform, 'OS', 'android');
    const report = jest.fn();
    hostOf(configureTelemetryHost).observeDevice!(report, jest.fn());
    const onAppState = AppState.addEventListener.mock.calls[0][1];
    onAppState('background');
    expect(report).toHaveBeenLastCalledWith({ appState: 'background' });
    onAppState('active');
    expect(report).toHaveBeenLastCalledWith({
      appState: 'foreground',
      memory: 'normal',
    });
  });

  it('drops a native snapshot that lands after stop', async () => {
    const { registerTelemetry, configureTelemetryHost, NativeModules } = load();
    mockNative(NativeModules);
    registerTelemetry();
    const report = jest.fn();
    hostOf(configureTelemetryHost).observeDevice!(report, jest.fn())?.();
    await Promise.resolve();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith({ appState: 'foreground' });
  });
});
