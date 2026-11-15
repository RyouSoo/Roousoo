import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VILLAGE_NPCS, type NpcProfile } from '../data/questions';
import { animateCharacterWalk, createArticulatedCharacter, type ArticulatedCharacterRig } from '../three/characterBuilder';
import { createPixelTextureAtlas } from '../three/pixelTextures';
import { buildVillageScene, type ObstacleBox } from '../three/villageBuilder';
import { retroAudio } from '../utils/sound';

export interface PlayerHudPosition {
  x: number;
  z: number;
}

interface VillageCanvasProps {
  gameMode: 'title' | 'playing' | 'finished';
  movementLocked: boolean;
  completedNpcIds: number[];
  onNearbyNpcChange: (npc: NpcProfile | null) => void;
  onInteractNpc: (npc: NpcProfile) => void;
  onPlayerMove?: (pos: PlayerHudPosition) => void;
  virtualInputRef?: React.MutableRefObject<{ x: number; z: number }>;
  resetSignal: number;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _moveDir = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();

function collidesWithObstacles(x: number, z: number, radius: number, obstacles: ObstacleBox[]): boolean {
  if (x < -26.2 || x > 27.6 || z < -26.2 || z > 26.2) return true;
  for (let i = 0; i < obstacles.length; i++) {
    const b = obstacles[i];
    if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
      return true;
    }
  }
  return false;
}

export default function VillageCanvas({
  gameMode,
  movementLocked,
  completedNpcIds,
  onNearbyNpcChange,
  onInteractNpc,
  onPlayerMove,
  virtualInputRef,
  resetSignal,
}: VillageCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Mutable refs so React state updates never tear down the WebGL canvas
  const gameModeRef = useRef(gameMode);
  const movementLockedRef = useRef(movementLocked);
  const completedIdsRef = useRef<Set<number>>(new Set(completedNpcIds));
  const nearbyNpcRef = useRef<NpcProfile | null>(null);
  const onNearbyNpcChangeRef = useRef(onNearbyNpcChange);
  const onInteractNpcRef = useRef(onInteractNpc);
  const onPlayerMoveRef = useRef(onPlayerMove);

  const playerPosRef = useRef(new THREE.Vector3(0, 0, 5.5));
  const playerYawRef = useRef(Math.PI);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    movementLockedRef.current = movementLocked;
  }, [movementLocked]);

  useEffect(() => {
    completedIdsRef.current = new Set(completedNpcIds);
  }, [completedNpcIds]);

  useEffect(() => {
    onNearbyNpcChangeRef.current = onNearbyNpcChange;
    onInteractNpcRef.current = onInteractNpc;
    onPlayerMoveRef.current = onPlayerMove;
  }, [onNearbyNpcChange, onInteractNpc, onPlayerMove]);

  useEffect(() => {
    playerPosRef.current.set(0, 0, 5.5);
    playerYawRef.current = Math.PI;
    nearbyNpcRef.current = null;
    onNearbyNpcChangeRef.current(null);
  }, [resetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL (SwiftShader, llvmpipe, WARP) from renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Scene & Horizon-matched bright daylight sky
    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xdff4ff);
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(0xdff4ff, 0.0115);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 160);
    camera.position.set(0, 10, 17);

    // Studio Environment Reflection (RoomEnvironment via PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Daylight Rig
    const hemiLight = new THREE.HemisphereLight(0xcbeafe, 0x8dc964, 0.85);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5d6, 1.55);
    sunLight.position.set(22, 34, 18);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 34;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 90;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const rimLight = new THREE.DirectionalLight(0xbbe6ff, 0.45);
    rimLight.position.set(-20, 18, -22);
    scene.add(rimLight);

    // Build Procedural Pixel Textures & Village World
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const atlas = createPixelTextureAtlas(maxAnisotropy);
    const village = buildVillageScene(atlas);
    scene.add(village.group);

    // Build Articulated Student Character
    const studentRig = createArticulatedCharacter(
      {
        shirtColor: 0x3b82f6,
        pantsColor: 0x1e293b,
        hairColor: 0x3f2414,
        skinColor: 0xfde2c8,
        hatStyle: 'student',
        hatColor: 0xf59e0b,
        hasBackpack: true,
        backpackColor: 0xea580c,
      },
      atlas.contactShadow,
    );
    studentRig.root.position.copy(playerPosRef.current);
    studentRig.root.rotation.y = playerYawRef.current;
    scene.add(studentRig.root);

    // Build 10 Distinct Articulated NPCs + Floating Pixel Badges + Ground Interaction Rings
    interface NpcEntity {
      profile: NpcProfile;
      rig: ArticulatedCharacterRig;
      badgeSprite: THREE.Sprite;
      exclaimMat: THREE.SpriteMaterial;
      doneMat: THREE.SpriteMaterial;
      ringMesh: THREE.Mesh;
    }

    const ringGeo = new THREE.RingGeometry(1.1, 1.38, 24);
    const npcEntities: NpcEntity[] = VILLAGE_NPCS.map((npc) => {
      const rig = createArticulatedCharacter(
        {
          shirtColor: npc.shirtColor,
          pantsColor: npc.pantsColor,
          hairColor: npc.hairColor,
          skinColor: npc.skinColor,
          hatStyle: npc.hatStyle,
          hatColor: npc.hatColor,
        },
        atlas.contactShadow,
      );
      rig.root.position.set(npc.position[0], npc.position[1], npc.position[2]);
      rig.root.rotation.y = npc.rotationY;
      scene.add(rig.root);

      // Register soft collision around each NPC
      village.obstacles.push({
        minX: npc.position[0] - 0.5,
        maxX: npc.position[0] + 0.5,
        minZ: npc.position[2] - 0.5,
        maxZ: npc.position[2] + 0.5,
      });

      const exclaimMat = new THREE.SpriteMaterial({ map: atlas.questExclaim, transparent: true });
      const doneMat = new THREE.SpriteMaterial({ map: atlas.questDone, transparent: true });
      const badgeSprite = new THREE.Sprite(exclaimMat);
      badgeSprite.scale.set(0.68, 0.68, 1);
      badgeSprite.position.set(npc.position[0], 2.45, npc.position[2]);
      scene.add(badgeSprite);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(npc.position[0], 0.055, npc.position[2]);
      ringMesh.visible = false;
      scene.add(ringMesh);

      return { profile: npc, rig, badgeSprite, exclaimMat, doneMat, ringMesh };
    });

    // Pre-warm shaders on GPU devices
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Keyboard State
    const keysPressed = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' && !e.repeat) {
        if (
          gameModeRef.current === 'playing' &&
          !movementLockedRef.current &&
          nearbyNpcRef.current
        ) {
          onInteractNpcRef.current(nearbyNpcRef.current);
        }
        return;
      }

      keysPressed.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };

    const onBlur = () => {
      keysPressed.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Resize Observer
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // Animation Loop with Software-WebGL Pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let stepCooldown = 0;
    let hudEmitTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.08);
      const elapsed = clock.getElapsedTime();

      // Animate village props (windmill sails + flowing brook water)
      village.windmillBlades.rotation.x = elapsed * 0.85;
      village.waterTexture.offset.y = (elapsed * 0.25) % 1;

      const mode = gameModeRef.current;
      const locked = movementLockedRef.current;

      // Player Movement Logic
      let moveSpeedRatio = 0;
      if (mode === 'playing' && !locked) {
        let inputX = 0;
        let inputZ = 0;
        if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) inputZ -= 1;
        if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) inputZ += 1;
        if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) inputX -= 1;
        if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) inputX += 1;

        if (virtualInputRef?.current) {
          inputX += virtualInputRef.current.x;
          inputZ += virtualInputRef.current.z;
        }

        _moveDir.set(inputX, 0, inputZ);
        if (_moveDir.lengthSq() > 0.001) {
          _moveDir.normalize();
          moveSpeedRatio = 1;
          const speed = 6.2 * delta;
          const pos = playerPosRef.current;
          const radius = 0.45;

          const nextX = pos.x + _moveDir.x * speed;
          if (!collidesWithObstacles(nextX, pos.z, radius, village.obstacles)) {
            pos.x = nextX;
          }

          const nextZ = pos.z + _moveDir.z * speed;
          if (!collidesWithObstacles(pos.x, nextZ, radius, village.obstacles)) {
            pos.z = nextZ;
          }

          // Smooth character facing rotation
          const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
          let diff = targetYaw - playerYawRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          playerYawRef.current += diff * (1 - Math.exp(-14 * delta));

          stepCooldown -= delta;
          if (stepCooldown <= 0) {
            retroAudio.playStep();
            stepCooldown = 0.31;
          }
        }
      }

      studentRig.root.position.copy(playerPosRef.current);
      studentRig.root.rotation.y = playerYawRef.current;
      animateCharacterWalk(studentRig, moveSpeedRatio, elapsed, delta);

      // Update HUD player position periodically
      hudEmitTimer += delta;
      if (hudEmitTimer >= 0.08 && onPlayerMoveRef.current) {
        hudEmitTimer = 0;
        onPlayerMoveRef.current({ x: playerPosRef.current.x, z: playerPosRef.current.z });
      }

      // Check proximity to NPCs & animate NPC idle/badges
      let closestNpc: NpcProfile | null = null;
      let closestDist = 3.15;
      const completedSet = completedIdsRef.current;

      for (let i = 0; i < npcEntities.length; i++) {
        const ent = npcEntities[i];
        const isDone = completedSet.has(ent.profile.id);
        ent.badgeSprite.material = isDone ? ent.doneMat : ent.exclaimMat;
        ent.badgeSprite.position.y = 2.42 + Math.sin(elapsed * 3.2 + i) * 0.09;

        const dx = playerPosRef.current.x - ent.profile.position[0];
        const dz = playerPosRef.current.z - ent.profile.position[2];
        const dist = Math.hypot(dx, dz);

        if (!isDone && dist < closestDist) {
          closestDist = dist;
          closestNpc = ent.profile;
        }

        // Friendly turn toward player when nearby
        if (dist < 4.2) {
          const lookYaw = Math.atan2(dx, dz);
          let yawDiff = lookYaw - ent.rig.root.rotation.y;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          ent.rig.root.rotation.y += yawDiff * (1 - Math.exp(-7 * delta));
        } else {
          let yawDiff = ent.profile.rotationY - ent.rig.root.rotation.y;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          ent.rig.root.rotation.y += yawDiff * (1 - Math.exp(-4 * delta));
        }

        animateCharacterWalk(ent.rig, 0, elapsed + i * 0.7, delta);
        ent.ringMesh.visible = !isDone && mode === 'playing' && dist < 3.15;
      }

      if ((closestNpc?.id ?? null) !== (nearbyNpcRef.current?.id ?? null)) {
        nearbyNpcRef.current = closestNpc;
        onNearbyNpcChangeRef.current(closestNpc);
      }

      // Camera Choreography
      if (mode === 'title') {
        const orbitAngle = elapsed * 0.14;
        _camTargetPos.set(Math.sin(orbitAngle) * 19, 11.5, Math.cos(orbitAngle) * 19);
        _camLookAt.set(0, 1.8, 0);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 4, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 4, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 4, delta);
        camera.lookAt(_camLookAt);
      } else {
        const px = playerPosRef.current.x;
        const pz = playerPosRef.current.z;
        _camTargetPos.set(px, 8.8, pz + 11.2);
        _camLookAt.set(px, 1.35, pz - 0.8);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 7.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 7.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 7.5, delta);
        camera.lookAt(_camLookAt);

        // Keep shadow frustum centered near player
        sunLight.position.set(px + 20, 32, pz + 16);
        sunLight.target.position.set(px, 0, pz);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      studentRig.dispose();
      npcEntities.forEach((ent) => {
        ent.rig.dispose();
        ent.exclaimMat.dispose();
        ent.doneMat.dispose();
        (ent.ringMesh.material as THREE.Material).dispose();
      });
      ringGeo.dispose();
      village.dispose();
      atlas.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFF8EB] p-6">
          <div className="pixel-panel max-w-md p-6 text-center">
            <h2 className="font-display text-2xl text-[#451A03] mb-2">3D 화면을 열 수 없습니다</h2>
            <p className="text-sm text-[#78350F]">
              브라우저에서 WebGL 그래픽 기능이 비활성화되어 있습니다. 하드웨어 가속을 켜거나 새로고침해 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
