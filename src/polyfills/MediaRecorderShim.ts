import { MediaRecorder } from "../audio/MediaRecorder";

function shimMediaRecorder() {
  // @ts-expect-error
  if(!global.MediaRecorder) {
    // @ts-expect-error
    global.MediaRecorder = MediaRecorder
  }
  MediaRecorder
}

shimMediaRecorder();