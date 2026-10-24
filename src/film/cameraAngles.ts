import {CONTACT_X, RIM_Y, cupAt} from './alan';
import {f} from './timeline';

/** Absolute times: every camera observes the same event clock. */
export const INCIDENT_SHOTS = [
  {id: 'street', start: 6, end: 8.6},
  {id: 'overhead', start: 8.6, end: 10.2},
  {id: 'impact', start: 10.2, end: 11.2},
  {id: 'aftermath', start: 11.2, end: 12.264},
] as const;
export const UPWARD_LOCAL = 1.3;
export const SHOULDER_LOCAL = {start: 2, end: 3} as const;
export const shotAtFrame = (frame: number) => INCIDENT_SHOTS.find(s => frame >= f(s.start) && frame < f(s.end));

/** Calibrated to the front-right basket rim in the 1672x941 plate, normalized to 1080p. */
export const IMPACT_CAMERA = {x: 1294, y: 513, scale: 4.8} as const;
export const macroCupAt = (t: number) => {
  const c = cupAt(t);
  return {...c, x: IMPACT_CAMERA.x + (c.x-CONTACT_X)*IMPACT_CAMERA.scale,
    y: IMPACT_CAMERA.y + (c.y-RIM_Y)*IMPACT_CAMERA.scale, scale: c.scale*IMPACT_CAMERA.scale};
};

/** Project a rectangular screen into an arbitrary clockwise four-corner camera plane. */
export type Point = {x: number; y: number};
export const planeMatrix = (p: readonly Point[], width: number, height: number): string => {
  const [a,b,c,d] = p;
  const dx1=b.x-c.x, dx2=d.x-c.x, dx3=a.x-b.x+c.x-d.x;
  const dy1=b.y-c.y, dy2=d.y-c.y, dy3=a.y-b.y+c.y-d.y;
  const det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det;
  const h=(dx1*dy3-dx3*dy1)/det;
  return `matrix3d(${(b.x-a.x+g*b.x)/width},${(b.y-a.y+g*b.y)/width},0,${g/width},${(d.x-a.x+h*d.x)/height},${(d.y-a.y+h*d.y)/height},0,${h/height},0,0,1,0,${a.x},${a.y},0,1)`;
};
export const PHONE_PLANE = [{x:1073,y:272},{x:1254,y:278},{x:1223,y:630},{x:1055,y:619}] as const;
