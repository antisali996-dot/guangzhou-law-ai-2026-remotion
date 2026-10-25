const unit = (value: number) => Math.min(1, Math.max(0, value));

/** Bounded expression controls: the brow and eye geometry never follows an overshoot. */
export const faceState = ({yaw=0, mood=0.25, surprise=0, blink=0}: {
  yaw?:number; mood?:number; surprise?:number; blink?:number;
} = {}) => {
  const concern=unit(-mood), smile=unit(mood), startle=unit(surprise), closed=unit(blink);
  return {
    shift:Math.max(-1,Math.min(1,yaw))*2.6,
    concern, smile, startle, closed,
    eyeOpen:Math.max(.025,1-closed),
    browLift:1.7*startle+.4*concern,
    mouthCurve:.6*smile-.7*concern,
  };
};
