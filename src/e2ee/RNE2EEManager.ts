import {
  RTCFrameCryptorAlgorithm,
  RTCFrameCryptorFactory,
  RTCRtpReceiver,
  type RTCFrameCryptor,
  type RTCRtpSender,
} from '@livekit/react-native-webrtc';
import {
  LocalParticipant,
  LocalTrackPublication,
  ParticipantEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RoomEvent,
  type Room,
  type BaseE2EEManager,
  type E2EEManagerCallbacks,
  EncryptionEvent,
} from 'livekit-client';
import type RNKeyProvider from './RNKeyProvider';
import type RTCEngine from 'livekit-client/dist/src/room/RTCEngine';
import EventEmitter from 'events';
import type TypedEventEmitter from 'typed-emitter';

/**
 * @experimental
 */
export default class RNE2EEManager
  extends (EventEmitter as new () => TypedEventEmitter<E2EEManagerCallbacks>)
  implements BaseE2EEManager
{
  private room?: Room;
  private frameCryptors: Map<string, RTCFrameCryptor> = new Map();
  private keyProvider: RNKeyProvider;
  private algorithm: RTCFrameCryptorAlgorithm =
    RTCFrameCryptorAlgorithm.kAesGcm;

  private encryptionEnabled: boolean = false;

  constructor(keyProvider: RNKeyProvider) {
    super();
    this.keyProvider = keyProvider;
    this.encryptionEnabled = false;
  }

  setup(room: Room) {
    if (this.room !== room) {
      this.room = room;
      this.setupEventListeners(room);
    }
  }

  private setupEventListeners(room: Room) {
    room.localParticipant
      .on(ParticipantEvent.LocalTrackPublished, async (publication) => {
        this.setupE2EESender(publication, room.localParticipant);
      })
      .on(ParticipantEvent.LocalTrackUnpublished, async (publication) => {
        let frameCryptor = this.findTrackCryptor(publication.trackSid);
        if (frameCryptor) {
          this.frameCryptors.delete(publication.trackSid);
          await frameCryptor.setEnabled(false);
          await frameCryptor.dispose();
        }
      });

    room
      .on(RoomEvent.TrackSubscribed, (_track, pub, participant) => {
        this.setupE2EEReceiver(pub, participant);
      })
      .on(
        RoomEvent.TrackUnsubscribed,
        async (_track, publication, _participant) => {
          let frameCryptor = this.findTrackCryptor(publication.trackSid);
          if (frameCryptor) {
            this.frameCryptors.delete(publication.trackSid);
            await frameCryptor.setEnabled(false);
            await frameCryptor.dispose();
          }
        }
      );
  }

  private async setupE2EESender(
    publication: LocalTrackPublication,
    participant: LocalParticipant
  ) {
    if (!publication.isEncrypted) {
      return;
    }

    var frameCryptor = this.findTrackCryptor(publication.trackSid);

    if (!frameCryptor) {
      frameCryptor = this.createFrameCryptorForSender(
        publication.track!.sender,
        participant.identity
      );

      this.frameCryptors.set(publication.trackSid, frameCryptor);
      frameCryptor.setEnabled(true);
      frameCryptor.setKeyIndex(
        this.keyProvider.getLatestKeyIndex(participant.identity)
      );
    }
  }

  private async setupE2EEReceiver(
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) {
    if (!publication.isEncrypted) {
      return;
    }

    var frameCryptor = this.findTrackCryptor(publication.trackSid);

    if (!frameCryptor) {
      frameCryptor = this.createFrameCryptorForReceiver(
        publication.track!.receiver,
        participant.identity
      );

      this.frameCryptors.set(publication.trackSid, frameCryptor);
      frameCryptor.setEnabled(true);
      frameCryptor.setKeyIndex(
        this.keyProvider.getLatestKeyIndex(participant.identity)
      );
    }
  }

  setSifTrailer(trailer: Uint8Array): void {
    this.keyProvider.setSifTrailer(trailer);
  }

  // Utility methods
  //////////////////////

  private findTrackCryptor(trackId: string): RTCFrameCryptor | undefined {
    return this.frameCryptors.get(trackId);
  }

  private createFrameCryptorForSender(
    sender: RTCRtpSender,
    participantId: string
  ): RTCFrameCryptor {
    return RTCFrameCryptorFactory.createFrameCryptorForRtpSender(
      participantId,
      sender,
      this.algorithm,
      this.keyProvider.rtcKeyProvider
    );
  }

  private createFrameCryptorForReceiver(
    receiver: RTCRtpReceiver,
    participantId: string
  ): RTCFrameCryptor {
    return RTCFrameCryptorFactory.createFrameCryptorForRtpReceiver(
      participantId,
      receiver,
      this.algorithm,
      this.keyProvider.rtcKeyProvider
    );
  }

  setupEngine(_engine: RTCEngine): void {
    // No-op
  }
  setParticipantCryptorEnabled(
    enabled: boolean,
    participantIdentity: string
  ): void {
    if (
      this.encryptionEnabled !== enabled &&
      participantIdentity === this.room?.localParticipant.identity
    ) {
      this.encryptionEnabled = enabled;
      this.emit(
        EncryptionEvent.ParticipantEncryptionStatusChanged,
        enabled,
        this.room!.localParticipant
      );
    } else {
      const participant =
        this.room?.getParticipantByIdentity(participantIdentity);
      if (!participant) {
        throw TypeError(
          `couldn't set encryption status, participant not found ${participantIdentity}`
        );
      }
      this.emit(
        EncryptionEvent.ParticipantEncryptionStatusChanged,
        enabled,
        participant
      );
    }
  }
}
