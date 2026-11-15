import * as THREE from 'three';
import type { NpcHatStyle } from '../data/questions';
import { createPixelFaceTexture } from './pixelTextures';

export interface CharacterConfig {
  shirtColor: number;
  pantsColor: number;
  hairColor: number;
  skinColor: number;
  hatStyle: NpcHatStyle | 'student';
  hatColor: number;
  hasBackpack?: boolean;
  backpackColor?: number;
}

export interface ArticulatedCharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  walkPhase: number;
  dispose: () => void;
}

export function createArticulatedCharacter(
  config: CharacterConfig,
  contactShadowTex: THREE.Texture,
): ArticulatedCharacterRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  const root = new THREE.Group();

  // Contact shadow grounded at y = 0.02
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(1.15, 1.15));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    }),
  );
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  // Materials with distinct roughness variation
  const skinMat = trackMat(new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.75 }));
  const shirtMat = trackMat(new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.85 }));
  const pantsMat = trackMat(new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.9 }));
  const hairMat = trackMat(new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.85 }));
  const shoeMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 }));
  const accentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: config.hatColor,
      roughness: config.hatStyle === 'crown' ? 0.25 : 0.75,
      metalness: config.hatStyle === 'crown' ? 0.65 : 0.05,
    }),
  );

  // Pelvis / body pivot at hip height (y = 0.56)
  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.56;
  root.add(bodyPivot);

  // Torso (height 0.54, sits from y=0 to y=0.54 relative to bodyPivot)
  const torso = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.54, 0.34)), shirtMat);
  torso.position.y = 0.27;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  // Collar / belt accent detail
  const beltMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 }));
  const belt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.07, 0.36)), beltMat);
  belt.position.y = 0.06;
  belt.castShadow = true;
  bodyPivot.add(belt);

  const buckleMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.7 }),
  );
  const buckle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.08, 0.04)), buckleMat);
  buckle.position.set(0, 0.06, 0.18);
  bodyPivot.add(buckle);

  // Backpack for student character
  if (config.hasBackpack) {
    const packColor = config.backpackColor ?? 0xd97706;
    const packMat = trackMat(new THREE.MeshStandardMaterial({ color: packColor, roughness: 0.8 }));
    const flapMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 }));

    const packMain = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.42, 0.18)), packMat);
    packMain.position.set(0, 0.28, -0.24);
    packMain.castShadow = true;
    bodyPivot.add(packMain);

    const packPocket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.18, 0.06)), flapMat);
    packPocket.position.set(0, 0.18, -0.34);
    bodyPivot.add(packPocket);

    const packFlap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.44, 0.1, 0.2)), flapMat);
    packFlap.position.set(0, 0.46, -0.24);
    bodyPivot.add(packFlap);
  }

  // Head group perched at top of torso
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.56, 0);
  bodyPivot.add(headGroup);

  const faceTex = createPixelFaceTexture(
    config.skinColor,
    config.hairColor,
    0x2c1810,
    true,
    config.hatStyle === 'glasses',
  );
  disposables.push(faceTex);

  const faceMat = trackMat(new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.78 }));
  const headGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.54, 0.54));
  // Box faces: +X, -X, +Y, -Y, +Z (front face!), -Z (back hair)
  const headMesh = new THREE.Mesh(headGeo, [
    skinMat,
    skinMat,
    hairMat,
    skinMat,
    faceMat,
    hairMat,
  ]);
  headMesh.position.y = 0.28;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Back & side hair cap
  const hairTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.14, 0.58)), hairMat);
  hairTop.position.set(0, 0.52, -0.01);
  hairTop.castShadow = true;
  headGroup.add(hairTop);

  const hairBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.36, 0.12)), hairMat);
  hairBack.position.set(0, 0.34, -0.25);
  hairBack.castShadow = true;
  headGroup.add(hairBack);

  // Ears
  const leftEar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.12)), skinMat);
  leftEar.position.set(-0.3, 0.26, 0.02);
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.12)), skinMat);
  rightEar.position.set(0.3, 0.26, 0.02);
  headGroup.add(rightEar);

  // Role-specific hats / accessories
  if (config.hatStyle === 'student' || config.hatStyle === 'cap' || config.hatStyle === 'mail') {
    const capCrown = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.18, 0.56)), accentMat);
    capCrown.position.set(0, 0.59, -0.01);
    capCrown.castShadow = true;
    headGroup.add(capCrown);

    const capBrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.52, 0.06, 0.26)), accentMat);
    capBrim.position.set(0, 0.51, 0.34);
    capBrim.castShadow = true;
    headGroup.add(capBrim);
  } else if (config.hatStyle === 'chef') {
    const chefBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.14, 0.54)), accentMat);
    chefBand.position.set(0, 0.6, 0);
    headGroup.add(chefBand);
    const chefPuff = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.28, 0.6)), accentMat);
    chefPuff.position.set(0, 0.78, 0);
    chefPuff.castShadow = true;
    headGroup.add(chefPuff);
  } else if (config.hatStyle === 'straw' || config.hatStyle === 'bucket') {
    const brim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.84, 0.06, 0.84)), accentMat);
    brim.position.set(0, 0.55, 0);
    brim.castShadow = true;
    headGroup.add(brim);
    const top = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.52, 0.2, 0.52)), accentMat);
    top.position.set(0, 0.66, 0);
    top.castShadow = true;
    headGroup.add(top);
  } else if (config.hatStyle === 'beret') {
    const beret = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.14, 0.62)), accentMat);
    beret.position.set(0.06, 0.59, -0.02);
    beret.rotation.z = -0.15;
    beret.castShadow = true;
    headGroup.add(beret);
  } else if (config.hatStyle === 'ribbon') {
    const bowL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.14, 0.1)), accentMat);
    bowL.position.set(-0.14, 0.6, 0.1);
    const bowR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.14, 0.1)), accentMat);
    bowR.position.set(0.14, 0.6, 0.1);
    headGroup.add(bowL, bowR);
  } else if (config.hatStyle === 'bandana') {
    const band = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.61, 0.12, 0.59)), accentMat);
    band.position.set(0, 0.49, 0);
    headGroup.add(band);
  } else if (config.hatStyle === 'crown') {
    const crownBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.5, 0.1, 0.5)), accentMat);
    crownBase.position.set(0, 0.61, 0);
    headGroup.add(crownBase);
    for (let i = -1; i <= 1; i++) {
      const spike = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.12, 0.1)), accentMat);
      spike.position.set(i * 0.16, 0.71, 0.18);
      headGroup.add(spike);
    }
  }

  // Arms pivoted at shoulder (y = 0.48 on bodyPivot, x = ±0.37)
  const makeArm = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.37, 0.48, 0);
    bodyPivot.add(pivot);

    const sleeve = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.24, 0.2)), shirtMat);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const forearm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.24, 0.16)), skinMat);
    forearm.position.y = -0.32;
    forearm.castShadow = true;
    pivot.add(forearm);

    return pivot;
  };

  const leftArmPivot = makeArm(-1);
  const rightArmPivot = makeArm(1);

  // Legs pivoted at hip (y = 0.56 in root space, x = ±0.15)
  const makeLeg = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.15, 0.56, 0);
    root.add(pivot);

    const leg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.42, 0.24)), pantsMat);
    leg.position.y = -0.21;
    leg.castShadow = true;
    leg.receiveShadow = true;
    pivot.add(leg);

    const shoe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.32)), shoeMat);
    shoe.position.set(0, -0.49, 0.04);
    shoe.castShadow = true;
    shoe.receiveShadow = true;
    pivot.add(shoe);

    return pivot;
  };

  const leftLegPivot = makeLeg(-1);
  const rightLegPivot = makeLeg(1);

  return {
    root,
    bodyPivot,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    walkPhase: 0,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

export function animateCharacterWalk(
  rig: ArticulatedCharacterRig,
  speedRatio: number,
  elapsed: number,
  delta: number,
) {
  if (speedRatio > 0.05) {
    // Advance walk cycle proportional to movement speed
    rig.walkPhase += delta * (9.5 * Math.min(speedRatio, 1.15));
    const swing = Math.sin(rig.walkPhase) * 0.78 * Math.min(speedRatio, 1);
    const bounce = Math.abs(Math.sin(rig.walkPhase)) * 0.065 * Math.min(speedRatio, 1);

    // Legs swing opposite to arms naturally
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, swing, 16, delta);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, -swing, 16, delta);

    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -swing * 0.85, 16, delta);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, swing * 0.85, 16, delta);

    // Subtle natural outward arm flare
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, -0.08, 12, delta);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, 0.08, 12, delta);

    // Gentle body vertical bob & torso twist
    rig.bodyPivot.position.y = THREE.MathUtils.damp(rig.bodyPivot.position.y, 0.56 + bounce, 18, delta);
    rig.bodyPivot.rotation.y = THREE.MathUtils.damp(
      rig.bodyPivot.rotation.y,
      Math.sin(rig.walkPhase) * 0.07,
      14,
      delta,
    );
    rig.headGroup.rotation.y = THREE.MathUtils.damp(
      rig.headGroup.rotation.y,
      -Math.sin(rig.walkPhase) * 0.04,
      14,
      delta,
    );
  } else {
    // Smoothly damp limbs back to idle breathing pose
    const breathe = Math.sin(elapsed * 2.4) * 0.015;
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0, 12, delta);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, 0, 12, delta);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, 0, 12, delta);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, 0, 12, delta);
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, -0.05 + breathe, 10, delta);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, 0.05 - breathe, 10, delta);
    rig.bodyPivot.position.y = THREE.MathUtils.damp(rig.bodyPivot.position.y, 0.56 + breathe * 0.6, 12, delta);
    rig.bodyPivot.rotation.y = THREE.MathUtils.damp(rig.bodyPivot.rotation.y, 0, 12, delta);
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, 0, 10, delta);
  }
}
