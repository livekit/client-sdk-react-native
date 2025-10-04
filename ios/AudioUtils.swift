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

import AVFoundation

public class AudioUtils {
    public static func audioSessionModeFromString(_ mode: String) -> AVAudioSession.Mode {
        let retMode: AVAudioSession.Mode = switch mode {
        case "default_":
            .default
        case "voicePrompt":
            if #available(iOS 12.0, *) {
                .voicePrompt
            } else {
                .default
            }
        case "videoRecording":
            .videoRecording
        case "videoChat":
            .videoChat
        case "voiceChat":
            .voiceChat
        case "gameChat":
            .gameChat
        case "measurement":
            .measurement
        case "moviePlayback":
            .moviePlayback
        case "spokenAudio":
            .spokenAudio
        default:
            .default
        }
        return retMode
    }

    public static func audioSessionCategoryFromString(_ category: String) -> AVAudioSession.Category {
        let retCategory: AVAudioSession.Category = switch category {
        case "ambient":
            .ambient
        case "soloAmbient":
            .soloAmbient
        case "playback":
            .playback
        case "record":
            .record
        case "playAndRecord":
            .playAndRecord
        case "multiRoute":
            .multiRoute
        default:
            .soloAmbient
        }
        return retCategory
    }

    public static func audioSessionCategoryOptionsFromStrings(_ options: [String]) -> AVAudioSession.CategoryOptions {
        var categoryOptions: AVAudioSession.CategoryOptions = []
        for option in options {
            switch option {
            case "mixWithOthers":
                categoryOptions.insert(.mixWithOthers)
            case "duckOthers":
                categoryOptions.insert(.duckOthers)
            case "allowBluetooth":
                categoryOptions.insert(.allowBluetooth)
            case "allowBluetoothA2DP":
                categoryOptions.insert(.allowBluetoothA2DP)
            case "allowAirPlay":
                categoryOptions.insert(.allowAirPlay)
            case "defaultToSpeaker":
                categoryOptions.insert(.defaultToSpeaker)
            case "interruptSpokenAudioAndMixWithOthers":
                if #available(iOS 13.0, *) {
                    categoryOptions.insert(.interruptSpokenAudioAndMixWithOthers)
                }
            case "overrideMutedMicrophoneInterruption":
                if #available(iOS 14.5, *) {
                    categoryOptions.insert(.overrideMutedMicrophoneInterruption)
                }
            default:
                break
            }
        }
        return categoryOptions
    }
}
