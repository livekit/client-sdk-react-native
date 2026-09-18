// Runs the telemetry module under the real Hermes VM (no bridge, no simulator) with fetch stubbed:
// proves the protobuf/JSON encoders execute on Hermes and what they hand the transport.
import {ping} from './src/telemetry';

globalThis.fetch = async (url, init) => {
  console.log(`POST ${url} ${init.headers['Content-Type']} ${init.body.byteLength} bytes keepalive=${init.keepalive}`);
  return {status: 200, headers: {get: () => null}};
};

const options = {
  endpoint: 'http://127.0.0.1:4320/v1/logs',
  resource: {'service.name': 'livekit-client-react-native', 'os.name': 'ios'},
};
ping(options, 1)
  .then(d => console.log('protobuf delivery', JSON.stringify(d)))
  .then(() => ping({...options, encoding: 'json'}, 2))
  .then(d => console.log('json delivery', JSON.stringify(d)))
  .catch(e => console.log('FAILED', String(e)));
