import * as THREE from 'three';
import type { PixelTextureAtlas } from './pixelTextures';

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface VillageWorld {
  group: THREE.Group;
  obstacles: ObstacleBox[];
  windmillBlades: THREE.Group;
  waterTexture: THREE.Texture;
  dispose: () => void;
}

export function buildVillageScene(atlas: PixelTextureAtlas): VillageWorld {
  const group = new THREE.Group();
  const obstacles: ObstacleBox[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  const addBoxObstacle = (cx: number, cz: number, width: number, depth: number, padding = 0.4) => {
    obstacles.push({
      minX: cx - width / 2 - padding,
      maxX: cx + width / 2 + padding,
      minZ: cz - depth / 2 - padding,
      maxZ: cz + depth / 2 + padding,
    });
  };

  // Shared PBR Materials with varied roughness/metalness
  const grassMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.grass, roughness: 0.95 }));
  const cobbleMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.cobble, roughness: 0.85 }));
  const dirtMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.dirtPath, roughness: 0.92 }));
  const waterMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: atlas.water,
      roughness: 0.18,
      metalness: 0.1,
    }),
  );
  const plasterMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.plasterWall, roughness: 0.88 }));
  const brickMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.brickWall, roughness: 0.86 }));
  const woodMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.woodPlank, roughness: 0.82 }));
  const darkWoodMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x5c2d0c, roughness: 0.78 }));
  const stoneMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.72 }));
  const stoneLightMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.65 }));
  const windowMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: atlas.windowGlow,
      emissive: 0xfde047,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    }),
  );
  const awningMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.awningStripe, roughness: 0.85 }));
  const metalLanternMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 }),
  );
  const lanternGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    }),
  );

  // 1. Expansive Ground Terrain (extends well beyond playable area to prevent void edges)
  const ground = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(180, 180)), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);

  // Gentle stepped pixel hills around outer perimeter
  const hillColors = [0x74c147, 0x67b33c, 0x82cc54];
  const hillSpecs = [
    [-46, -42, 26, 4.5, 20, 0],
    [0, -48, 38, 5.2, 18, 1],
    [45, -40, 28, 4.2, 22, 2],
    [-48, 4, 18, 4.8, 34, 1],
    [-45, 42, 26, 4.0, 20, 0],
    [48, 40, 26, 4.4, 24, 2],
    [0, 48, 36, 3.8, 18, 1],
  ] as const;

  hillSpecs.forEach(([x, z, w, h, d, cIdx]) => {
    const hillMat = trackMat(new THREE.MeshStandardMaterial({ color: hillColors[cIdx], roughness: 0.95 }));
    const tier1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h * 0.55, d)), hillMat);
    tier1.position.set(x, h * 0.275, z);
    tier1.receiveShadow = true;
    const tier2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w * 0.65, h * 0.45, d * 0.65)), hillMat);
    tier2.position.set(x, h * 0.72, z);
    tier2.receiveShadow = true;
    group.add(tier1, tier2);
  });

  // 2. Central Cobblestone Plaza (offset +0.02 on Y to prevent Z-fighting)
  const plaza = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8.2, 8.4, 0.08, 16)), cobbleMat);
  plaza.position.set(0, 0.04, 0);
  plaza.receiveShadow = true;
  group.add(plaza);

  // Radiating Village Footpaths (offset +0.025 on Y)
  const addPath = (x: number, z: number, w: number, d: number, rotY = 0) => {
    const path = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 0.05, d)), dirtMat);
    path.position.set(x, 0.025, z);
    path.rotation.y = rotY;
    path.receiveShadow = true;
    group.add(path);
  };
  // North-South & East-West main roads
  addPath(0, -10.5, 3.2, 13);
  addPath(0, 11.5, 3.2, 15);
  addPath(-11.5, 2.5, 16, 2.8);
  addPath(11.5, 1.5, 15, 2.8);
  // Diagonal / spur paths to outer landmarks
  addPath(-11, -7.5, 9, 2.4, 0.35);
  addPath(11.5, -9, 10, 2.4, -0.45);
  addPath(-7.5, 12.5, 9, 2.4, -0.4);
  addPath(8.5, 7.5, 7, 2.2, 0.4);

  // 3. Central Stone Fountain (multi-part composite)
  const fountain = new THREE.Group();
  fountain.position.set(0, 0, 0);
  const fBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.5, 2.7, 0.45, 8)), stoneMat);
  fBase.position.y = 0.225;
  fBase.castShadow = true;
  fBase.receiveShadow = true;
  const fRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.35, 0.22, 6, 8)), stoneLightMat);
  fRim.rotation.x = Math.PI / 2;
  fRim.position.y = 0.48;
  fRim.castShadow = true;
  const fWater = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.2, 2.2, 0.08, 8)), waterMat);
  fWater.position.y = 0.42;
  const fPillar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 1.7, 0.75)), stoneLightMat);
  fPillar.position.y = 1.05;
  fPillar.castShadow = true;
  const fBowl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.15, 0.5, 0.35, 8)), stoneMat);
  fBowl.position.y = 1.85;
  fBowl.castShadow = true;
  const fSpire = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 0.5, 0.4)), waterMat);
  fSpire.position.y = 2.25;
  fountain.add(fBase, fRim, fWater, fPillar, fBowl, fSpire);
  group.add(fountain);
  addBoxObstacle(0, 0, 4.6, 4.6, 0.3);

  // 4. Sparkling Pixel Brook & Arched Wooden Bridge on the East side
  const brook = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 0.06, 85)), waterMat);
  brook.position.set(20.5, 0.03, 0);
  brook.receiveShadow = true;
  group.add(brook);

  // Brook stone banks
  for (let z = -34; z <= 34; z += 4) {
    if (z >= -2 && z <= 6) continue; // leave opening for bridge!
    const bankL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 0.28, 3.6)), stoneMat);
    bankL.position.set(18.1, 0.14, z);
    bankL.receiveShadow = true;
    const bankR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 0.28, 3.6)), stoneMat);
    bankR.position.set(22.9, 0.14, z);
    bankR.receiveShadow = true;
    group.add(bankL, bankR);
  }
  // Colliders for brook north & south of bridge
  addBoxObstacle(20.5, -18.5, 4.4, 30, 0.2);
  addBoxObstacle(20.5, 19.5, 4.4, 30, 0.2);

  // Multi-part Wooden Bridge at z = 2
  const bridge = new THREE.Group();
  bridge.position.set(20.5, 0, 2);
  const deck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.4, 0.22, 3.6)), woodMat);
  deck.position.y = 0.22;
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);
  for (const zOff of [-1.65, 1.65]) {
    const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.2, 0.16, 0.16)), darkWoodMat);
    rail.position.set(0, 0.9, zOff);
    rail.castShadow = true;
    bridge.add(rail);
    for (const xOff of [-2.8, 0, 2.8]) {
      const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.85, 0.22)), darkWoodMat);
      post.position.set(xOff, 0.56, zOff);
      post.castShadow = true;
      bridge.add(post);
    }
  }
  group.add(bridge);

  // 5. Helper to build detailed multi-part Pixel Cottages & Landmarks
  const buildHouse = (opts: {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    wallMat: THREE.Material;
    roofMat: THREE.Material;
    rotY?: number;
    hasChimney?: boolean;
    hasAwning?: boolean;
    hasSign?: boolean;
    signColor?: number;
  }) => {
    const house = new THREE.Group();
    house.position.set(opts.x, 0, opts.z);
    house.rotation.y = opts.rotY ?? 0;

    // Stone foundation
    const foundation = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(opts.w + 0.4, 0.45, opts.d + 0.4)),
      stoneMat,
    );
    foundation.position.y = 0.225;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    house.add(foundation);

    // Main wall body
    const walls = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(opts.w, opts.h, opts.d)), opts.wallMat);
    walls.position.y = 0.45 + opts.h / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Corner timber beams
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const beam = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.28, opts.h + 0.05, 0.28)),
          darkWoodMat,
        );
        beam.position.set(sx * (opts.w / 2), 0.45 + opts.h / 2, sz * (opts.d / 2));
        beam.castShadow = true;
        house.add(beam);
      }
    }

    // Stepped pixel pitched roof (2 layers for chunky voxel silhouette)
    const roof1 = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(opts.w + 1.0, 0.7, opts.d + 1.0)),
      opts.roofMat,
    );
    roof1.position.y = 0.45 + opts.h + 0.35;
    roof1.castShadow = true;
    roof1.receiveShadow = true;

    const roof2 = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(opts.w * 0.72, 0.75, opts.d * 0.72)),
      opts.roofMat,
    );
    roof2.position.y = 0.45 + opts.h + 1.05;
    roof2.castShadow = true;

    const roofCap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(opts.w * 0.4, 0.45, opts.d * 0.4)),
      opts.roofMat,
    );
    roofCap.position.y = 0.45 + opts.h + 1.62;
    roofCap.castShadow = true;
    house.add(roof1, roof2, roofCap);

    // Front wooden door
    const door = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 1.85, 0.16)), darkWoodMat);
    door.position.set(0, 0.45 + 0.92, opts.d / 2 + 0.05);
    house.add(door);

    // Glowing front & side windows
    const winGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.95, 0.14));
    const winL = new THREE.Mesh(winGeo, windowMat);
    winL.position.set(-opts.w * 0.28, 0.45 + opts.h * 0.55, opts.d / 2 + 0.06);
    const winR = new THREE.Mesh(winGeo, windowMat);
    winR.position.set(opts.w * 0.28, 0.45 + opts.h * 0.55, opts.d / 2 + 0.06);
    house.add(winL, winR);

    // Flower boxes under front windows
    const boxGeo = trackGeo(new THREE.BoxGeometry(1.05, 0.28, 0.35));
    const flowerMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.75 }));
    for (const wx of [-opts.w * 0.28, opts.w * 0.28]) {
      const fbox = new THREE.Mesh(boxGeo, woodMat);
      fbox.position.set(wx, 0.45 + opts.h * 0.55 - 0.62, opts.d / 2 + 0.2);
      const bloom = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 0.2, 0.24)), flowerMat);
      bloom.position.set(wx, 0.45 + opts.h * 0.55 - 0.4, opts.d / 2 + 0.2);
      house.add(fbox, bloom);
    }

    if (opts.hasChimney) {
      const chim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 1.8, 0.75)), brickMat);
      chim.position.set(opts.w * 0.28, 0.45 + opts.h + 1.4, -opts.d * 0.2);
      chim.castShadow = true;
      house.add(chim);
    }

    if (opts.hasAwning) {
      const awn = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(opts.w * 0.78, 0.18, 1.4)), awningMat);
      awn.position.set(0, 0.45 + 2.05, opts.d / 2 + 0.7);
      awn.rotation.x = 0.22;
      awn.castShadow = true;
      house.add(awn);
    }

    if (opts.hasSign) {
      const signMat = trackMat(
        new THREE.MeshStandardMaterial({ color: opts.signColor ?? 0xf59e0b, roughness: 0.6 }),
      );
      const signBoard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.5, 0.65, 0.18)), signMat);
      signBoard.position.set(0, 0.45 + opts.h - 0.2, opts.d / 2 + 0.16);
      house.add(signBoard);
    }

    group.add(house);

    // Axis-aligned collision approximation
    const isRotated90 = Math.abs(Math.sin(opts.rotY ?? 0)) > 0.7;
    const colW = isRotated90 ? opts.d : opts.w;
    const colD = isRotated90 ? opts.w : opts.d;
    addBoxObstacle(opts.x, opts.z, colW + 0.6, colD + 0.6, 0.35);
  };

  // Place our 7 colorful pixel-art village buildings!
  // 1. Bakery (West of plaza)
  buildHouse({
    x: -13.5,
    z: 4.5,
    w: 5.4,
    h: 3.4,
    d: 4.8,
    wallMat: brickMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofAmber, roughness: 0.8 })),
    rotY: Math.PI / 2,
    hasChimney: true,
    hasAwning: true,
    hasSign: true,
    signColor: 0xfbbf24,
  });

  // 2. Village Library / Schoolhouse (North of plaza)
  buildHouse({
    x: 0,
    z: -19.0,
    w: 7.4,
    h: 4.0,
    d: 5.2,
    wallMat: plasterMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofTeal, roughness: 0.8 })),
    rotY: 0,
    hasChimney: false,
    hasSign: true,
    signColor: 0x0ea5e9,
  });

  // 3. Woodshop (Northwest)
  buildHouse({
    x: -17.5,
    z: -11.5,
    w: 5.0,
    h: 3.2,
    d: 4.6,
    wallMat: woodMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofRed, roughness: 0.8 })),
    rotY: Math.PI * 0.22,
    hasChimney: true,
  });

  // 4. Post Office (Southwest)
  buildHouse({
    x: -13.5,
    z: 17.5,
    w: 5.0,
    h: 3.2,
    d: 4.6,
    wallMat: plasterMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofRed, roughness: 0.8 })),
    rotY: Math.PI * 0.78,
    hasAwning: true,
    hasSign: true,
    signColor: 0xef4444,
  });
  // Cute red pixel mailbox beside post office
  const mailbox = new THREE.Group();
  mailbox.position.set(-10.2, 0, 15.2);
  const mbPost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.9, 0.22)), darkWoodMat);
  mbPost.position.y = 0.45;
  const mbBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.55, 0.65, 0.55)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 })),
  );
  mbBox.position.y = 1.1;
  mbBox.castShadow = true;
  mailbox.add(mbPost, mbBox);
  group.add(mailbox);

  // 5. Art Studio (Northeast)
  buildHouse({
    x: 13.5,
    z: -15.5,
    w: 5.2,
    h: 3.3,
    d: 4.6,
    wallMat: plasterMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofAmber, roughness: 0.8 })),
    rotY: -Math.PI * 0.25,
    hasAwning: true,
  });

  // 6. Cozy East Cottage (across bridge!)
  buildHouse({
    x: 26.5,
    z: -4.0,
    w: 4.8,
    h: 3.1,
    d: 4.4,
    wallMat: brickMat,
    roofMat: trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofTeal, roughness: 0.8 })),
    rotY: -Math.PI / 2,
    hasChimney: true,
  });

  // 7. Hill Windmill (Far West) with rotating pixel blades
  const windmill = new THREE.Group();
  windmill.position.set(-23.5, 0, 2.8);
  const wmBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.0, 1.4, 4.0)), stoneMat);
  wmBase.position.y = 0.7;
  wmBase.castShadow = true;
  const wmTower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 5.2, 3.2)), plasterMat);
  wmTower.position.y = 4.0;
  wmTower.castShadow = true;
  const wmRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.6, 1.4, 3.6)),
    trackMat(new THREE.MeshStandardMaterial({ map: atlas.roofRed, roughness: 0.8 })),
  );
  wmRoof.position.y = 7.3;
  wmRoof.castShadow = true;

  const windmillBlades = new THREE.Group();
  windmillBlades.position.set(1.75, 5.6, 0);
  const hub = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.45, 0.45)), darkWoodMat);
  windmillBlades.add(hub);
  const sailMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 }));
  for (let i = 0; i < 4; i++) {
    const armGroup = new THREE.Group();
    armGroup.rotation.x = (i * Math.PI) / 2;
    const spar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 3.3, 0.14)), darkWoodMat);
    spar.position.y = 1.65;
    const sail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 2.4, 0.85)), sailMat);
    sail.position.set(0.04, 1.9, 0.42);
    sail.castShadow = true;
    armGroup.add(spar, sail);
    windmillBlades.add(armGroup);
  }
  windmill.add(wmBase, wmTower, wmRoof, windmillBlades);
  group.add(windmill);
  addBoxObstacle(-23.5, 2.8, 4.2, 4.2, 0.4);

  // 8. Ribbon Market Stall near Plaza
  const stall = new THREE.Group();
  stall.position.set(6.2, 0, -6.2);
  stall.rotation.y = -Math.PI * 0.25;
  const counter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 1.0, 1.2)), woodMat);
  counter.position.y = 0.5;
  counter.castShadow = true;
  const postL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.5, 0.18)), darkWoodMat);
  postL.position.set(-1.25, 1.25, -0.45);
  const postR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.5, 0.18)), darkWoodMat);
  postR.position.set(1.25, 1.25, -0.45);
  const stallRoof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.1, 0.22, 1.9)), awningMat);
  stallRoof.position.set(0, 2.55, 0.1);
  stallRoof.rotation.x = 0.18;
  stallRoof.castShadow = true;
  stall.add(counter, postL, postR, stallRoof);
  group.add(stall);
  addBoxObstacle(6.2, -6.2, 2.8, 1.8, 0.3);

  // 9. Sunlit Flower Garden (Southeast, near Gardener Haena)
  const gardenBox = new THREE.Group();
  gardenBox.position.set(10.5, 0, 9.8);
  const bedFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.8, 0.35, 3.6)), woodMat);
  bedFrame.position.y = 0.175;
  bedFrame.receiveShadow = true;
  const soil = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.4, 0.38, 3.2)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.95 })),
  );
  soil.position.y = 0.2;
  gardenBox.add(bedFrame, soil);
  group.add(gardenBox);
  addBoxObstacle(10.5, 9.8, 4.8, 3.6, 0.3);

  // 10. Warm Street Lanterns around the plaza & paths
  const lanternCoords: Array<[number, number]> = [
    [-5.8, -5.8],
    [5.8, 5.8],
    [-5.8, 5.8],
    [5.8, -10.5],
    [-3.2, -11.5],
    [14.2, 4.2],
  ];
  lanternCoords.forEach(([lx, lz]) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.35, 0.45)), stoneMat);
    base.position.y = 0.175;
    const pole = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 2.6, 0.18)), metalLanternMat);
    pole.position.y = 1.45;
    pole.castShadow = true;
    const head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.46, 0.42)), lanternGlowMat);
    head.position.y = 2.88;
    const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.14, 0.56)), metalLanternMat);
    cap.position.y = 3.16;
    lamp.add(base, pole, head, cap);
    group.add(lamp);
    addBoxObstacle(lx, lz, 0.5, 0.5, 0.25);
  });

  // 11. Instanced Pixel-Art Trees (Inner scenic trees + Dense outer grove perimeter)
  const innerTrees: Array<[number, number, number]> = [
    [-7.5, -13.5, 1.1],
    [7.2, -16.5, 1.0],
    [-19.5, -4.5, 1.15],
    [-16.5, 10.5, 1.05],
    [13.8, 12.5, 1.1],
    [3.5, 15.8, 1.0],
    [-3.5, 17.5, 1.15],
    [25.5, 8.5, 1.1],
  ];
  innerTrees.forEach(([tx, tz]) => addBoxObstacle(tx, tz, 1.1, 1.1, 0.35));

  const outerTrees: Array<[number, number, number]> = [];
  for (let angle = 0; angle < Math.PI * 2; angle += 0.14) {
    const r1 = 31 + Math.sin(angle * 5) * 2.2;
    const r2 = 36 + Math.cos(angle * 3) * 2.5;
    outerTrees.push([Math.cos(angle) * r1, Math.sin(angle) * r1, 0.95 + (Math.sin(angle * 7) + 1) * 0.18]);
    outerTrees.push([Math.cos(angle + 0.07) * r2, Math.sin(angle + 0.07) * r2, 1.05 + (Math.cos(angle * 4) + 1) * 0.2]);
  }

  const allTrees = [...innerTrees, ...outerTrees];
  const trunkGeo = trackGeo(new THREE.BoxGeometry(0.75, 2.2, 0.75));
  const trunkMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.bark, roughness: 0.9 }));
  const canopyLowGeo = trackGeo(new THREE.BoxGeometry(2.6, 1.5, 2.6));
  const canopyTopGeo = trackGeo(new THREE.BoxGeometry(1.75, 1.2, 1.75));
  const canopyMat = trackMat(new THREE.MeshStandardMaterial({ map: atlas.leaves, roughness: 0.85 }));

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, allTrees.length);
  trunkInst.castShadow = true;
  trunkInst.receiveShadow = true;

  const canopyLowInst = new THREE.InstancedMesh(canopyLowGeo, canopyMat, allTrees.length);
  canopyLowInst.castShadow = true;
  canopyLowInst.receiveShadow = true;

  const canopyTopInst = new THREE.InstancedMesh(canopyTopGeo, canopyMat, allTrees.length);
  canopyTopInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const tintColor = new THREE.Color();
  const treeTints = [0xffffff, 0xeefce8, 0xdcfce7, 0xfef9c3];

  allTrees.forEach(([x, z, s], idx) => {
    dummy.position.set(x, 1.1 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, (idx * 0.7) % (Math.PI * 2), 0);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 2.55 * s, z);
    dummy.updateMatrix();
    canopyLowInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 3.65 * s, z);
    dummy.updateMatrix();
    canopyTopInst.setMatrixAt(idx, dummy.matrix);

    tintColor.setHex(treeTints[idx % treeTints.length]);
    canopyLowInst.setColorAt(idx, tintColor);
    canopyTopInst.setColorAt(idx, tintColor);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyLowInst.instanceMatrix.needsUpdate = true;
  canopyTopInst.instanceMatrix.needsUpdate = true;
  if (canopyLowInst.instanceColor) canopyLowInst.instanceColor.needsUpdate = true;
  if (canopyTopInst.instanceColor) canopyTopInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  canopyLowInst.computeBoundingSphere();
  canopyTopInst.computeBoundingSphere();

  group.add(trunkInst, canopyLowInst, canopyTopInst);

  // 12. Instanced Colorful Pixel Flowers scattered across the meadow
  const flowerCount = 90;
  const flowerGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.22, 0.28));
  const flowerInstMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }));
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerInstMat, flowerCount);
  const flowerColors = [0xf43f5e, 0xfacc15, 0xfb923c, 0xa855f7, 0x38bdf8];

  for (let i = 0; i < flowerCount; i++) {
    const angle = i * 2.39996; // golden angle spiral
    const radius = 9.5 + ((i * 19) % 180) * 0.1;
    let fx = Math.cos(angle) * radius;
    const fz = Math.sin(angle) * radius;
    if (fx > 17 && fx < 24) fx += 7; // keep out of brook
    dummy.position.set(fx, 0.11, fz);
    dummy.scale.setScalar(0.8 + (i % 4) * 0.15);
    dummy.rotation.set(0, i * 0.5, 0);
    dummy.updateMatrix();
    flowerInst.setMatrixAt(i, dummy.matrix);
    tintColor.setHex(flowerColors[i % flowerColors.length]);
    flowerInst.setColorAt(i, tintColor);
  }
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  flowerInst.computeBoundingSphere();
  group.add(flowerInst);

  // 13. Low Wooden Fence Perimeter around Village Boundary (-27.5..27.5)
  const fencePosts: Array<[number, number]> = [];
  for (let i = -26; i <= 26; i += 4) {
    fencePosts.push([i, -27], [i, 27], [-27, i], [28.5, i]);
  }
  const postGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.9, 0.24));
  const postInst = new THREE.InstancedMesh(postGeo, darkWoodMat, fencePosts.length);
  postInst.castShadow = true;
  fencePosts.forEach(([px, pz], idx) => {
    dummy.position.set(px, 0.45, pz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    postInst.setMatrixAt(idx, dummy.matrix);
  });
  postInst.instanceMatrix.needsUpdate = true;
  postInst.computeBoundingSphere();
  group.add(postInst);

  return {
    group,
    obstacles,
    windmillBlades,
    waterTexture: atlas.water,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
