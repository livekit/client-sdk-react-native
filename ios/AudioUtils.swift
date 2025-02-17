import AVFoundation

public class AudioUtils {
    public static func audioSessionModeFromString(_ mode: String) -> AVAudioSession.Mode {
        let retMode: AVAudioSession.Mode = switch mode {
        case "default_":
            .default
        case "voicePrompt":
            .voicePrompt
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
            .ambient
        }
        return retCategory
    }
}
