import {CUP_FLIGHT_DURATION, T_CONTACT, alanAt, cupAt, ip, smooth} from './alan';

export const CCTV_RELEASE = 1.6;
export const CCTV_CONTACT = CCTV_RELEASE + CUP_FLIGHT_DURATION;
export const CCTV_FREEZE = CCTV_CONTACT + 1.45;

/** Replay uses the same impact, bounce and resting pose as the street shot. */
export const cctvCupAt = (local: number) => {
  const reach = ip(local, [1.15, CCTV_RELEASE], [0, 1], smooth);
  if (local <= CCTV_RELEASE) return {
    x: 1352 + 38 * reach + 7, y: 431 + 30 * reach + 15,
    rotate: 6, residue: 0.62, drips: 0, straw: true, scale: 0.56,
  };
  return cupAt(T_CONTACT + local - CCTV_CONTACT);
};

/** Pause only once the cup settles; the subsequent zoom annotates that still. */
export const cctvAt = (local: number) => {
  const footageTime = Math.min(CCTV_FREEZE, Math.max(0, local));
  const eventTime = T_CONTACT + footageTime - CCTV_CONTACT;
  const seconds = 5 + footageTime;
  const clock = `20:41:${String(Math.floor(seconds)).padStart(2, '0')}.${String(Math.floor((seconds % 1) * 1000)).padStart(3, '0')}`;
  return {local: footageTime, eventTime, clock, frozen: local >= CCTV_FREEZE,
    cup: cctvCupAt(footageTime), actor: alanAt(eventTime)};
};
