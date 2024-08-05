import { setJSExceptionHandler } from 'react-native-exception-handler';
// @ts-ignore
import {
  observe as observeLogBoxLogs,
  symbolicateLogNow,
} from 'react-native/Libraries/LogBox/Data/LogBoxData';

// Log errors

export function setupErrorLogHandler() {
  setJSExceptionHandler((error) => {
    console.log('error:', error, error.stack);
  }, true);

  // LogBox keeps all logs that you have not viewed yet.
  // When a new log comes in, we only want to print out the new ones.
  let lastCount = 0;

  // @ts-ignore
  observeLogBoxLogs((data) => {
    const logs = Array.from(data.logs);

    // @ts-ignore
    const symbolicatedLogs = logs.filter(
      (log) => log.symbolicated.stack?.length
    );
    for (let i = lastCount; i < symbolicatedLogs.length; i++) {
      // use log instead of warn/error to prevent resending error to LogBox
      console.log(formatLog(symbolicatedLogs[i]));
    }
    lastCount = symbolicatedLogs.length;

    // Trigger symbolication on remaining logs because
    // logs do not symbolicate until you click on LogBox

    // @ts-ignore
    logs
      .filter((log) => log.symbolicated.status === 'NONE')
      .forEach((log) => symbolicateLogNow(log));
  });
}

// @ts-ignore
function formatLog(log) {
  const stackLines = (log.symbolicated.stack || [])
    // @ts-ignore
    .filter((line) => !line.collapse)
    // @ts-ignore
    .map(
      (line) =>
        `    at ${line.methodName} (${line.file}:${line.lineNumber}:${line.column})`
    )
    .join('\n');
  return `Error has been symbolicated\nError: ${log.message.content}\n${stackLines}`;
}
