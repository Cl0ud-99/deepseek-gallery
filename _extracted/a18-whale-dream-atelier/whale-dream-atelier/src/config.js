// Shared dimensions for the atelier.  Local origin is the top of the
// whale-back wooden deck, with +Z facing the front doors.

export const A = {
  W: 4.60,          // width  (x)
  D: 3.70,          // depth  (z)
  wallT: 0.105,

  groundBase: 0.14,
  groundH: 1.68,    // opens from 0.14 to 1.82

  slabY: 1.78,
  slabT: 0.15,

  upperFloorY: 1.93,
  upperH: 1.37,     // upper walls until roof plate 3.30
  upperWallBase: 1.93,
  wallTop: 3.30,

  roofBaseY: 3.30,
  ridgeY: 4.66,
  eaveY: 3.58,
  eaveZ: 2.36,
  roofHalfW: 2.88,

  tower: {
    x: 1.92,
    z: -1.24,
    r: 0.64,
    bodyTop: 4.15,
    lanternTop: 5.25,
    coneTop: 6.22,
    vaneTop: 6.98,
  },
};
