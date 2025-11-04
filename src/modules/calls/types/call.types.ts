export type SignalOfferPayload = {
    roomId: string;
    sdp: RTCSessionDescriptionInit
};

export type SignalAnswerPayload = {
    toSocketId: string;
    sdp: RTCSessionDescriptionInit
};

export type SignalIcePayload = {
    roomId: string;
    candidate: RTCIceCandidateInit
};