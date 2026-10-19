// Resolves to `Uint8Array<ArrayBuffer>` on TS 5.7+ and plain `Uint8Array` on
// older versions. Matches the alias livekit-client uses for its e2ee types.
export type NonSharedUint8Array = ReturnType<typeof Uint8Array.from>;
