"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, useGLTF } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ---------- 共享运行时状态(免重渲染) ---------- */
const fx = { fade: 1, px: 0, py: 0 };

/* ---------- 关键帧状态表(滚动位在 useKeyframes 按各 section 实测) ---------- */
type KeyState = { xf: number; y: number; scale: number; idle: number; fade: number };
type Keyframe = { sy: number } & KeyState;

const HERO: KeyState = { xf: 0.17, y: 0, scale: 1.35, idle: 1, fade: 1 };
const CARDS: KeyState = { xf: -0.28, y: 0, scale: 0.6, idle: 0.25, fade: 0 };
const STORY_IN: KeyState = { xf: -0.225, y: 0, scale: 1.0, idle: 0, fade: 0 };
const STORY_END: KeyState = { xf: -0.225, y: 0, scale: 1.05, idle: 0, fade: 0 };
const OUTRO: KeyState = { xf: 0, y: 0.05, scale: 1.5, idle: 0, fade: 0.5 };

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/* ---------- 环境光(离线) ---------- */
function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    return () => {
      scene.environment = null;
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ---------- 银饰环绕层(hero 氛围,随滚动淡出) ---------- */
function Ornaments() {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 1,
        roughness: 0.18,
        color: new THREE.Color("#dfe1e8"),
        envMapIntensity: 1.3,
        transparent: true,
      }),
    []
  );
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.15;
    mat.opacity = fx.fade;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, fx.py * 0.2, 0.05);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, fx.px * -0.1, 0.05);
  });
  return (
    <group ref={group}>
      <mesh material={mat} position={[2.6, 0.2, -1.2]}>
        <torusGeometry args={[1.0, 0.14, 32, 100]} />
      </mesh>
      <mesh material={mat} position={[-2.9, -0.6, -2]} rotation={[0.6, 0.3, 0]}>
        <torusGeometry args={[0.7, 0.1, 32, 100]} />
      </mesh>
      <mesh material={mat} position={[-1.6, 1.5, -0.8]} rotation={[0.3, 0.8, 0]}>
        <torusKnotGeometry args={[0.28, 0.08, 128, 16]} />
      </mesh>
      <mesh material={mat} position={[1.6, -1.6, -0.2]} rotation={[1.2, 0, 0.4]}>
        <torusGeometry args={[0.45, 0.07, 32, 80]} />
      </mesh>
    </group>
  );
}

/* ---------- 主角:贯穿全页的银项圈 ---------- */
function TravelingCollar({
  keys,
  reduced,
}: {
  keys: MutableRefObject<Keyframe[]>;
  reduced: boolean;
}) {
  const { scene } = useGLTF("/models/collar-meshopt.glb", true, true);
  const group = useRef<THREE.Group>(null); // 位移/缩放
  const spinner = useRef<THREE.Group>(null); // 旋转
  const idleAccum = useRef(0);
  const storyBase = useRef<number | null>(null);

  const silver = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 1,
        roughness: 0.16,
        color: new THREE.Color("#e6e7ec"),
        envMapIntensity: 1.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.25,
      }),
    []
  );

  useEffect(() => {
    scene.traverse((o: any) => {
      if (o.isMesh) {
        o.geometry.computeVertexNormals();
        o.material = silver;
      }
    });
  }, [scene, silver]);

  useFrame((state, dt) => {
    if (!group.current || !spinner.current) return;
    const vw = state.viewport.width;
    const sy = window.scrollY;
    const ks = keys.current;
    if (ks.length < 5) return;

    /* 相邻关键帧插值 */
    let i = 0;
    while (i < ks.length - 2 && sy > ks[i + 1].sy) i++;
    const a = ks[i];
    const b = ks[i + 1];
    const span = Math.max(1, b.sy - a.sy);
    const t = smoothstep(Math.min(1, Math.max(0, (sy - a.sy) / span)));
    const xf = THREE.MathUtils.lerp(a.xf, b.xf, t);
    const y = THREE.MathUtils.lerp(a.y, b.y, t);
    const scale = THREE.MathUtils.lerp(a.scale, b.scale, t);
    const idle = THREE.MathUtils.lerp(a.idle, b.idle, t);
    fx.fade = THREE.MathUtils.lerp(a.fade, b.fade, t);

    if (!reduced) idleAccum.current += dt * 0.35 * idle;

    /* 叙事段(ks[2]→ks[3]):进入时捕获当前角,段末精确锁正面 */
    const sIn = ks[2].sy;
    const sOut = ks[3].sy;
    const sp = sOut > sIn ? Math.min(1, Math.max(0, (sy - sIn) / (sOut - sIn))) : 1;
    let rotY: number;
    if (sp <= 0) {
      storyBase.current = null;
      rotY = idleAccum.current;
    } else {
      if (storyBase.current === null) storyBase.current = idleAccum.current;
      const base = storyBase.current;
      const front = Math.round(base / (Math.PI * 2)) * Math.PI * 2;
      rotY = base + (front - base) * smoothstep(sp);
    }

    /* 阻尼趋近目标(丝滑) */
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, xf * vw, 5, dt);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y, 5, dt);
    const s = THREE.MathUtils.damp(group.current.scale.x, scale, 5, dt);
    group.current.scale.setScalar(s);
    spinner.current.rotation.y = THREE.MathUtils.damp(spinner.current.rotation.y, rotY, 6, dt);
    spinner.current.rotation.x = THREE.MathUtils.damp(
      spinner.current.rotation.x,
      fx.py * 0.12,
      5,
      dt
    );
    spinner.current.rotation.z = THREE.MathUtils.damp(
      spinner.current.rotation.z,
      fx.px * -0.08,
      5,
      dt
    );
  });

  return (
    <group ref={group}>
      <group ref={spinner}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/* ---------- 关键帧滚动位实测(挂载/resize/字体就绪后重算) ---------- */
function useKeyframes() {
  const keys = useRef<Keyframe[]>([]);
  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight;
      const q = (s: string) => document.querySelector(s)?.getBoundingClientRect();
      const hero = q("#sec-hero");
      const cards = q("#sec-cards");
      const story = q("#sec-story");
      const outro = q("#sec-outro");
      if (!hero || !cards || !story || !outro) return;
      const absTop = (r: DOMRect) => r.top + window.scrollY;
      const maxY = document.documentElement.scrollHeight - vh;
      const raw: Keyframe[] = [
        { sy: 0, ...HERO },
        { sy: absTop(cards) - vh * 0.55, ...CARDS },
        { sy: absTop(story) - vh * 0.25, ...STORY_IN },
        { sy: absTop(story) + story.height - vh, ...STORY_END },
        { sy: maxY, ...OUTRO },
      ];
      let prev = 0;
      keys.current = raw.map((k) => {
        const sy = Math.max(k.sy, prev + 1);
        prev = sy;
        return { ...k, sy };
      });
    };
    measure();
    window.addEventListener("resize", measure);
    const timer = setTimeout(measure, 800);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(timer);
    };
  }, []);
  return keys;
}

/* ---------- 外壳:固定全屏画布(pointer-events:none,不挡 DOM) ---------- */
export default function ScrollScene() {
  const keys = useKeyframes();
  const [reduced, setReduced] = useState(false);
  const [showFx, setShowFx] = useState(true);

  /* 指针视差(canvas 不接收指针,监听 window) */
  useEffect(() => {
    const fn = (e: PointerEvent) => {
      fx.px = (e.clientX / window.innerWidth) * 2 - 1;
      fx.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", fn, { passive: true });
    return () => window.removeEventListener("pointermove", fn);
  }, []);

  /* 降级媒体查询 */
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  /* 粒子显隐(离散切换,避免逐帧重渲染) */
  useEffect(() => {
    let raf = 0;
    const fn = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setShowFx(fx.fade > 0.05);
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => {
      window.removeEventListener("scroll", fn);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <color attach="background" args={["#0b0c10"]} />
        <Env />
        <ambientLight intensity={0.3} />
        <Suspense fallback={null}>
          <TravelingCollar keys={keys} reduced={reduced} />
        </Suspense>
        <Ornaments />
        {!reduced && showFx && (
          <Sparkles count={90} scale={[9, 5, 4]} size={2} speed={0.3} color="#cfd3dc" opacity={0.6} />
        )}
      </Canvas>
    </div>
  );
}
