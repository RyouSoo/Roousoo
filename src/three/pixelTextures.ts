import * as THREE from 'three';

function createPixelCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function finalizePixelTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 4,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export interface PixelTextureAtlas {
  grass: THREE.CanvasTexture;
  cobble: THREE.CanvasTexture;
  dirtPath: THREE.CanvasTexture;
  water: THREE.CanvasTexture;
  plasterWall: THREE.CanvasTexture;
  brickWall: THREE.CanvasTexture;
  woodPlank: THREE.CanvasTexture;
  roofRed: THREE.CanvasTexture;
  roofTeal: THREE.CanvasTexture;
  roofAmber: THREE.CanvasTexture;
  windowGlow: THREE.CanvasTexture;
  leaves: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  awningStripe: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  questExclaim: THREE.CanvasTexture;
  questDone: THREE.CanvasTexture;
  dispose: () => void;
}

export function createPixelFaceTexture(
  skinHex: number,
  hairHex: number,
  eyeHex = 0x2c1810,
  hasBlush = true,
  hasGlasses = false,
): THREE.CanvasTexture {
  const [canvas, ctx] = createPixelCanvas(16, 16);
  const skin = `#${skinHex.toString(16).padStart(6, '0')}`;
  const hair = `#${hairHex.toString(16).padStart(6, '0')}`;
  const eye = `#${eyeHex.toString(16).padStart(6, '0')}`;

  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, 16, 16);

  // Top pixel bangs
  ctx.fillStyle = hair;
  ctx.fillRect(0, 0, 16, 4);
  ctx.fillRect(0, 4, 2, 2);
  ctx.fillRect(14, 4, 2, 2);
  ctx.fillRect(5, 4, 2, 1);

  // Eyes (bright pixel highlights)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, 7, 3, 3);
  ctx.fillRect(10, 7, 3, 3);

  ctx.fillStyle = eye;
  ctx.fillRect(4, 7, 2, 3);
  ctx.fillRect(10, 7, 2, 3);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(4, 7, 1, 1);
  ctx.fillRect(10, 7, 1, 1);

  if (hasGlasses) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(2, 6, 5, 1);
    ctx.fillRect(9, 6, 5, 1);
    ctx.fillRect(7, 7, 2, 1);
    ctx.fillRect(2, 10, 5, 1);
    ctx.fillRect(9, 10, 5, 1);
    ctx.fillRect(2, 6, 1, 5);
    ctx.fillRect(6, 6, 1, 5);
    ctx.fillRect(9, 6, 1, 5);
    ctx.fillRect(13, 6, 1, 5);
  }

  // Warm rosy pixel cheeks
  if (hasBlush) {
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(2, 10, 2, 2);
    ctx.fillRect(12, 10, 2, 2);
  }

  // Smile
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(6, 12, 4, 1);
  ctx.fillRect(5, 11, 1, 1);
  ctx.fillRect(10, 11, 1, 1);

  return finalizePixelTexture(canvas, 1, 1, 1);
}

export function createPixelTextureAtlas(maxAnisotropy: number): PixelTextureAtlas {
  const textures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // 1. Warm sunny pixel grass
  const [grassC, gCtx] = createPixelCanvas(16, 16);
  gCtx.fillStyle = '#86cf57';
  gCtx.fillRect(0, 0, 16, 16);
  const grassPalette = ['#7ac34d', '#93db63', '#6db542'];
  const grassDots = [
    [1, 2, 0], [5, 1, 1], [11, 3, 0], [14, 0, 2],
    [3, 7, 1], [8, 6, 0], [13, 8, 1], [0, 11, 2],
    [6, 12, 0], [10, 14, 1], [14, 13, 0], [2, 14, 1],
  ];
  for (const [x, y, c] of grassDots) {
    gCtx.fillStyle = grassPalette[c];
    gCtx.fillRect(x, y, 2, 1);
  }
  // Tiny pixel clover flower
  gCtx.fillStyle = '#fef08a';
  gCtx.fillRect(9, 10, 1, 1);
  const grass = track(finalizePixelTexture(grassC, 42, 42, maxAnisotropy));

  // 2. Warm cobblestone plaza
  const [cobbleC, cCtx] = createPixelCanvas(16, 16);
  cCtx.fillStyle = '#d6c3a5';
  cCtx.fillRect(0, 0, 16, 16);
  const stones = [
    [1, 1, 6, 6, '#efe3ce'],
    [8, 1, 7, 5, '#e5d5ba'],
    [1, 8, 5, 7, '#e7d8be'],
    [7, 7, 8, 8, '#f3e9d6'],
  ] as const;
  for (const [x, y, w, h, col] of stones) {
    cCtx.fillStyle = col;
    cCtx.fillRect(x, y, w, h);
    cCtx.fillStyle = '#fffaf0';
    cCtx.fillRect(x, y, w, 1);
    cCtx.fillStyle = '#bfa888';
    cCtx.fillRect(x, y + h - 1, w, 1);
  }
  const cobble = track(finalizePixelTexture(cobbleC, 8, 8, maxAnisotropy));

  // 3. Sandy warm footpath
  const [dirtC, dCtx] = createPixelCanvas(16, 16);
  dCtx.fillStyle = '#ebd4a7';
  dCtx.fillRect(0, 0, 16, 16);
  dCtx.fillStyle = '#dec08e';
  dCtx.fillRect(2, 2, 3, 2);
  dCtx.fillRect(10, 5, 3, 2);
  dCtx.fillRect(5, 11, 4, 2);
  dCtx.fillStyle = '#f6e7c8';
  dCtx.fillRect(8, 1, 2, 2);
  dCtx.fillRect(1, 9, 2, 2);
  dCtx.fillRect(12, 12, 3, 2);
  const dirtPath = track(finalizePixelTexture(dirtC, 2, 12, maxAnisotropy));

  // 4. Sparkling pixel water
  const [waterC, wCtx] = createPixelCanvas(16, 16);
  wCtx.fillStyle = '#38bdf8';
  wCtx.fillRect(0, 0, 16, 16);
  wCtx.fillStyle = '#0ea5e9';
  wCtx.fillRect(0, 4, 16, 2);
  wCtx.fillRect(0, 12, 16, 2);
  wCtx.fillStyle = '#bae6fd';
  wCtx.fillRect(2, 2, 4, 1);
  wCtx.fillRect(9, 7, 5, 1);
  wCtx.fillRect(4, 10, 3, 1);
  wCtx.fillRect(11, 14, 3, 1);
  const water = track(finalizePixelTexture(waterC, 2, 16, maxAnisotropy));

  // 5. Cream plaster wall with timber corners
  const [plasterC, pCtx] = createPixelCanvas(16, 16);
  pCtx.fillStyle = '#fef6e4';
  pCtx.fillRect(0, 0, 16, 16);
  pCtx.fillStyle = '#f3e5cb';
  pCtx.fillRect(3, 3, 2, 1);
  pCtx.fillRect(10, 9, 3, 1);
  pCtx.fillRect(5, 13, 2, 1);
  pCtx.fillStyle = '#92400e';
  pCtx.fillRect(0, 0, 16, 1);
  pCtx.fillRect(0, 15, 16, 1);
  const plasterWall = track(finalizePixelTexture(plasterC, 2, 2, maxAnisotropy));

  // 6. Warm brick wall
  const [brickC, bCtx] = createPixelCanvas(16, 16);
  bCtx.fillStyle = '#e7d5be';
  bCtx.fillRect(0, 0, 16, 16);
  for (let row = 0; row < 4; row++) {
    const y = row * 4;
    const offset = row % 2 === 0 ? 0 : 4;
    for (let col = -1; col < 3; col++) {
      const x = col * 8 + offset;
      bCtx.fillStyle = (row + col) % 2 === 0 ? '#dc6b4a' : '#c9593b';
      bCtx.fillRect(x + 1, y + 1, 6, 3);
      bCtx.fillStyle = '#ef8b6d';
      bCtx.fillRect(x + 1, y + 1, 6, 1);
    }
  }
  const brickWall = track(finalizePixelTexture(brickC, 2, 2, maxAnisotropy));

  // 7. Warm wood planks
  const [woodC, wdCtx] = createPixelCanvas(16, 16);
  wdCtx.fillStyle = '#b46936';
  wdCtx.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 4; i++) {
    wdCtx.fillStyle = i % 2 === 0 ? '#c47944' : '#a95e2c';
    wdCtx.fillRect(0, i * 4, 16, 3);
    wdCtx.fillStyle = '#78350f';
    wdCtx.fillRect(0, i * 4 + 3, 16, 1);
  }
  const woodPlank = track(finalizePixelTexture(woodC, 2, 2, maxAnisotropy));

  // 8. Pixel roof shingles helper
  const makeRoof = (c1: string, c2: string, highlight: string, shadow: string) => {
    const [rc, rCtx] = createPixelCanvas(16, 16);
    rCtx.fillStyle = c1;
    rCtx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) {
      const shift = (y / 4) % 2 === 0 ? 0 : 2;
      for (let x = -2; x < 16; x += 4) {
        rCtx.fillStyle = (x + y) % 8 === 0 ? c1 : c2;
        rCtx.fillRect(x + shift, y, 4, 3);
        rCtx.fillStyle = highlight;
        rCtx.fillRect(x + shift, y, 4, 1);
      }
      rCtx.fillStyle = shadow;
      rCtx.fillRect(0, y + 3, 16, 1);
    }
    return track(finalizePixelTexture(rc, 3, 2, maxAnisotropy));
  };
  const roofRed = makeRoof('#ef4444', '#dc2626', '#fca5a5', '#991b1b');
  const roofTeal = makeRoof('#14b8a6', '#0d9488', '#5eead4', '#115e59');
  const roofAmber = makeRoof('#f59e0b', '#d97706', '#fde68a', '#92400e');

  // 9. Cozy glowing pixel window
  const [winC, winCtx] = createPixelCanvas(16, 16);
  winCtx.fillStyle = '#78350f';
  winCtx.fillRect(0, 0, 16, 16);
  winCtx.fillStyle = '#fef08a';
  winCtx.fillRect(2, 2, 5, 5);
  winCtx.fillRect(9, 2, 5, 5);
  winCtx.fillRect(2, 9, 5, 5);
  winCtx.fillRect(9, 9, 5, 5);
  winCtx.fillStyle = '#ffffff';
  winCtx.fillRect(3, 3, 2, 2);
  winCtx.fillRect(10, 3, 2, 2);
  const windowGlow = track(finalizePixelTexture(winC, 1, 1, maxAnisotropy));

  // 10. Pixel tree leaves
  const [leafC, lCtx] = createPixelCanvas(16, 16);
  lCtx.fillStyle = '#22c55e';
  lCtx.fillRect(0, 0, 16, 16);
  const leafSpots = [
    [1, 1, '#4ade80'], [6, 2, '#16a34a'], [11, 1, '#4ade80'],
    [2, 6, '#15803d'], [8, 7, '#4ade80'], [13, 6, '#16a34a'],
    [0, 11, '#4ade80'], [5, 12, '#16a34a'], [10, 11, '#86efac'],
    [13, 13, '#15803d'],
  ] as const;
  for (const [x, y, col] of leafSpots) {
    lCtx.fillStyle = col;
    lCtx.fillRect(x, y, 3, 3);
  }
  const leaves = track(finalizePixelTexture(leafC, 2, 2, maxAnisotropy));

  // 11. Pixel bark
  const [barkC, bkCtx] = createPixelCanvas(16, 16);
  bkCtx.fillStyle = '#854d0e';
  bkCtx.fillRect(0, 0, 16, 16);
  bkCtx.fillStyle = '#713f12';
  bkCtx.fillRect(2, 0, 2, 16);
  bkCtx.fillRect(9, 2, 2, 10);
  bkCtx.fillStyle = '#a16207';
  bkCtx.fillRect(5, 3, 2, 8);
  bkCtx.fillRect(13, 0, 2, 14);
  const bark = track(finalizePixelTexture(barkC, 1, 2, maxAnisotropy));

  // 12. Market awning stripe
  const [awnC, aCtx] = createPixelCanvas(16, 16);
  aCtx.fillStyle = '#fffbeb';
  aCtx.fillRect(0, 0, 16, 16);
  aCtx.fillStyle = '#f97316';
  aCtx.fillRect(0, 0, 8, 16);
  const awningStripe = track(finalizePixelTexture(awnC, 3, 1, maxAnisotropy));

  // 13. Soft radial contact shadow
  const [shadC, sCtx] = createPixelCanvas(64, 64);
  const grad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(45, 22, 6, 0.45)');
  grad.addColorStop(0.65, 'rgba(45, 22, 6, 0.18)');
  grad.addColorStop(1, 'rgba(45, 22, 6, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 64, 64);
  const contactShadow = new THREE.CanvasTexture(shadC);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;
  textures.push(contactShadow);

  // 14. Quest exclamation pixel badge
  const [exC, exCtx] = createPixelCanvas(16, 16);
  exCtx.fillStyle = '#451a03';
  exCtx.fillRect(2, 1, 12, 14);
  exCtx.fillRect(1, 2, 14, 12);
  exCtx.fillStyle = '#facc15';
  exCtx.fillRect(3, 2, 10, 12);
  exCtx.fillStyle = '#fef9c3';
  exCtx.fillRect(3, 2, 10, 2);
  exCtx.fillStyle = '#7c2d12';
  exCtx.fillRect(7, 4, 2, 5);
  exCtx.fillRect(7, 10, 2, 2);
  const questExclaim = track(finalizePixelTexture(exC, 1, 1, 1));

  // 15. Quest completed checkmark pixel badge
  const [dnC, dnCtx] = createPixelCanvas(16, 16);
  dnCtx.fillStyle = '#14532d';
  dnCtx.fillRect(2, 1, 12, 14);
  dnCtx.fillRect(1, 2, 14, 12);
  dnCtx.fillStyle = '#4ade80';
  dnCtx.fillRect(3, 2, 10, 12);
  dnCtx.fillStyle = '#ffffff';
  dnCtx.fillRect(4, 8, 2, 2);
  dnCtx.fillRect(6, 10, 2, 2);
  dnCtx.fillRect(8, 8, 2, 2);
  dnCtx.fillRect(10, 6, 2, 2);
  const questDone = track(finalizePixelTexture(dnC, 1, 1, 1));

  return {
    grass,
    cobble,
    dirtPath,
    water,
    plasterWall,
    brickWall,
    woodPlank,
    roofRed,
    roofTeal,
    roofAmber,
    windowGlow,
    leaves,
    bark,
    awningStripe,
    contactShadow,
    questExclaim,
    questDone,
    dispose: () => {
      textures.forEach((t) => t.dispose());
    },
  };
}
