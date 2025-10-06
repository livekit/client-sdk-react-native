/*
 * Copyright 2025 LiveKit
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React
import livekit_react_native_webrtc

@objc
public class VolumeAudioRenderer: BaseVolumeAudioRenderer {
  private let eventEmitter: RCTEventEmitter

  @objc
  public var reactTag: String?

  @objc
  public init(intervalMs: Double, eventEmitter: RCTEventEmitter) {
    self.eventEmitter = eventEmitter
    super.init(intervalMs: intervalMs)
  }

  override public func onVolumeCalculated(_ audioLevels: [AudioLevel]) {
    guard let rmsAvg = audioLevels.combine()?.average,
      let reactTag
    else { return }
    eventEmitter.sendEvent(
      withName: LKEvents.kEventVolumeProcessed,
      body: [
        "volume": rmsAvg,
        "id": reactTag,
      ])
  }
}

public class BaseVolumeAudioRenderer: NSObject, RTCAudioRenderer {
  private let frameInterval: Int
  private var skippedFrames = 0
  public init(intervalMs: Double = 30) {
    frameInterval = Int((intervalMs / 10.0).rounded())
  }

  public func render(pcmBuffer: AVAudioPCMBuffer) {
    if skippedFrames < frameInterval - 1 {
      skippedFrames += 1
      return
    }

    skippedFrames = 0
    guard let pcmBuffer = pcmBuffer.convert(toCommonFormat: .pcmFormatFloat32) else { return }
    let audioLevels = pcmBuffer.audioLevels()
    onVolumeCalculated(audioLevels)
  }

  public func onVolumeCalculated(_: [AudioLevel]) {}
}
