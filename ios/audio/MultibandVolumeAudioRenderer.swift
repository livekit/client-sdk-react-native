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
public class MultibandVolumeAudioRenderer: BaseMultibandVolumeAudioRenderer {
  private let eventEmitter: RCTEventEmitter

  @objc
  public var reactTag: String?

  @objc
  public init(
    bands: Int,
    minFrequency: Float,
    maxFrequency: Float,
    intervalMs: Float,
    eventEmitter: RCTEventEmitter
  ) {
    self.eventEmitter = eventEmitter
    super.init(
      bands: bands,
      minFrequency: minFrequency,
      maxFrequency: maxFrequency,
      intervalMs: intervalMs)
  }

  override func onMagnitudesCalculated(_ magnitudes: [Float]) {
    guard !magnitudes.isEmpty, let reactTag
    else { return }
    eventEmitter.sendEvent(
      withName: LKEvents.kEventMultibandProcessed,
      body: [
        "magnitudes": magnitudes,
        "id": reactTag,
      ])
  }
}

public class BaseMultibandVolumeAudioRenderer: NSObject, RTCAudioRenderer {
  private let frameInterval: Int
  private var skippedFrames = 0
  private let audioProcessor: AudioVisualizeProcessor

  init(
    bands: Int,
    minFrequency: Float,
    maxFrequency: Float,
    intervalMs: Float
  ) {
    frameInterval = Int((intervalMs / 10.0).rounded())
    audioProcessor = AudioVisualizeProcessor(minFrequency: minFrequency, maxFrequency: maxFrequency, bandsCount: bands)
  }

  public func render(pcmBuffer: AVAudioPCMBuffer) {
    if skippedFrames < frameInterval - 1 {
      skippedFrames += 1
      return
    }

    skippedFrames = 0
    guard let magnitudes = audioProcessor.process(pcmBuffer: pcmBuffer)
    else {
      return
    }
    onMagnitudesCalculated(magnitudes)
  }

  func onMagnitudesCalculated(_: [Float]) {}
}
