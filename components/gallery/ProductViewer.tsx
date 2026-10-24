"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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

/* 真实 GLB 几何 + 程序化银材质(GLB 无材质/无法线/无 UV,均在运行时补) */
function Collar({
  url,
  revealed,
  reduced,
  onReady,
}: {
  url: string;
  revealed: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  const { scene } = useGLTF(url, true, true); // 显式启用 draco/meshopt 解码
  const group = useRef<THREE.Group>(null);

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
        o.geometry.computeVertexNormals(); // 补法线
        o.material = silver; // 程序化银
      }
    });
    onReady(); // suspense 已解析 = GLB 已加载
  }, [scene, silver, onReady]);

  /* #3 锻造成型揭示:加载完成从 0.02 缩放生长到 1 */
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = revealed ? 1 : 0.02;
    const k = reduced ? 1 : Math.min(1, dt * 3);
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, k);
    group.current.scale.setScalar(s);
  });

  return (
    <group ref={group} scale={0.02}>
      <primitive object={scene} />
    </group>
  );
}

export default function ProductViewer({ url }: { url: string }) {
  useGLTF.preload(url); // 泛化：按传入产品模型预加载对应 GLB（slug → model 路径）

  const { progress, active } = useProgress();
  const [ready, setReady] = useState(false);
  const [overlayGone, setOverlayGone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setOverlayGone(true), 900);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <>
      <div className="canvas-layer">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0.1, 3.2], fov: 40 }}>
          {/* 不透明深色底:3D 阶段盖住静态参考图,不再透出白色照片背景 */}
          <color attach="background" args={["#101218"]} />
          <Env />
          <ambientLight intensity={0.35} />
          <Suspense fallback={null}>
            <Collar
              url={url}
              revealed={ready}
              reduced={reduced}
              onReady={() => setReady(true)}
            />
          </Suspense>
          <OrbitControls
            autoRotate={!reduced}
            autoRotateSpeed={1.4}
            enablePan={false}
            minDistance={1.6}
            maxDistance={5.5}
          />
        </Canvas>
      </div>

      {/* #3 锻造成型加载遮罩 */}
      <div className={`viewer-overlay ${overlayGone ? "fade-out" : ""}`}>
        <div style={{ letterSpacing: 6 }}>
          {ready ? "成型" : "锻造成型中"}…
        </div>
        <div className="bar">
          <div style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#8b93a7" }}>
          {Math.round(progress)}%
        </div>
      </div>
    </>
  );
}
