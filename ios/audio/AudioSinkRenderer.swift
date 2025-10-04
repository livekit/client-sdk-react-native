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
import React

@objc
public class AudioSinkRenderer: BaseAudioSinkRenderer {
    private let eventEmitter: RCTEventEmitter

    @objc
    public var reactTag: String?

    @objc
    public init(eventEmitter: RCTEventEmitter) {
        self.eventEmitter = eventEmitter
        super.init()
    }

    override public func onData(_ pcmBuffer: AVAudioPCMBuffer) {
        guard pcmBuffer.format.commonFormat == .pcmFormatInt16,
              let channelData = pcmBuffer.int16ChannelData
        else {
            return
        }
        let channelCount = Int(pcmBuffer.format.channelCount)
        let channels = UnsafeBufferPointer(start: channelData, count: channelCount)
        let length = Int(pcmBuffer.frameCapacity * pcmBuffer.format.streamDescription.pointee.mBytesPerFrame)
        let data = NSData(bytes: channels[0], length: length)
        let base64 = data.base64EncodedString()
        NSLog("AUDIO DATA!!!!")
        NSLog("\(data.length)")
        NSLog(base64)
        NSLog("\(base64.count)")
        NSLog("\(length)")
        eventEmitter.sendEvent(withName: LKEvents.kEventAudioData, body: [
            "data": base64,
            "id": reactTag,
        ])
    }
}

public class BaseAudioSinkRenderer: NSObject, RTCAudioRenderer {
    override public init() {
        super.init()
    }

    public func render(pcmBuffer: AVAudioPCMBuffer) {
        onData(pcmBuffer)
    }

    public func onData(_: AVAudioPCMBuffer) {}
}
