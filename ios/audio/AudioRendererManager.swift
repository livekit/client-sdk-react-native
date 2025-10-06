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

import livekit_react_native_webrtc

@objc
public class AudioRendererManager: NSObject {
  private let bridge: RCTBridge
  public private(set) var renderers: [String: RTCAudioRenderer] = [:]

  init(bridge: RCTBridge) {
    self.bridge = bridge
  }

  @objc
  public func registerRenderer(_ audioRenderer: RTCAudioRenderer) -> String {
    let reactTag = NSUUID().uuidString
    renderers[reactTag] = audioRenderer
    return reactTag
  }

  @objc
  public func unregisterRenderer(forReactTag: String) {
    renderers.removeValue(forKey: forReactTag)
  }

  @objc
  public func unregisterRenderer(_ audioRenderer: RTCAudioRenderer) {
    renderers = renderers.filter { $0.value !== audioRenderer }
  }

  @objc
  public func attach(renderer: RTCAudioRenderer, pcId: NSNumber, trackId: String) {
    let webrtcModule = bridge.module(for: WebRTCModule.self) as! WebRTCModule
    guard let track = webrtcModule.track(forId: trackId, pcId: pcId) as? RTCAudioTrack
    else {
      lklog("couldn't find audio track: pcId: \(pcId), trackId: \(trackId)")
      return
    }

    if pcId == -1 {
      LKAudioProcessingManager.sharedInstance().addLocalAudioRenderer(renderer)
    } else {
      track.add(renderer)
    }
  }

  @objc
  public func detach(rendererByTag reactTag: String, pcId: NSNumber, trackId: String) {
    guard let renderer = renderers[reactTag]
    else {
      lklog("couldn't find renderer: tag: \(reactTag)")
      return
    }

    detach(renderer: renderer, pcId: pcId, trackId: trackId)
  }

  @objc
  public func detach(renderer: RTCAudioRenderer, pcId: NSNumber, trackId: String) {
    let webrtcModule = bridge.module(for: WebRTCModule.self) as! WebRTCModule
    guard let track = webrtcModule.track(forId: trackId, pcId: pcId) as? RTCAudioTrack
    else {
      lklog("couldn't find audio track: pcId: \(pcId), trackId: \(trackId)")
      return
    }

    if pcId == -1 {
      LKAudioProcessingManager.sharedInstance().removeLocalAudioRenderer(renderer)
    } else {
      track.remove(renderer)
    }
  }
}
