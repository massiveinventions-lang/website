import { useRef, Suspense, Component, ReactNode, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

function SpeakerModel() {
  const { scene } = useGLTF("/sp-3d-texture.glb");

  const { centerOffset, modelScale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    return {
      centerOffset: [-center.x, -center.y, -center.z] as [number, number, number],
      modelScale: 2.8 / maxDim,
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
      }
    });
  }, [scene]);

  return (
    <group scale={modelScale}>
      <group position={centerOffset}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

interface SceneProps {
  dragging: React.MutableRefObject<boolean>;
  dragDelta: React.MutableRefObject<{ x: number; y: number }>;
}

function Scene({ dragging, dragDelta }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const autoY  = useRef(0);
  const rotY   = useRef(0);
  const rotX   = useRef(0);

  useFrame((_s, delta) => {
    if (!groupRef.current) return;

    // Clamp delta so a tab that's been backgrounded for minutes doesn't
    // dump a multi-second jump into the physics in a single frame. rAF
    // pauses while the tab is hidden, then resumes with a huge `delta`
    // on the first frame back. Without this clamp, the model would
    // snap-spin multiple revolutions and then settle over the next
    // few frames (visible glitch).
    const dt = Math.min(delta, 1 / 30); // cap at ~33ms (30fps minimum)

    if (dragging.current) {
      rotY.current += dragDelta.current.x * 0.01;
      rotX.current += dragDelta.current.y * 0.01;
      rotX.current  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX.current));
      dragDelta.current = { x: 0, y: 0 };
      autoY.current = rotY.current;
    } else {
      autoY.current += dt * 0.25;
      rotY.current += (autoY.current - rotY.current) * 0.05;
      rotX.current += (0 - rotX.current) * 0.03;
    }

    groupRef.current.rotation.y = rotY.current;
    groupRef.current.rotation.x = rotX.current;
  });

  return (
    <group ref={groupRef}>
      <SpeakerModel />
    </group>
  );
}

interface EBState { hasError: boolean }
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function CSSFallbackSpeaker() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <div className="relative w-[400px] h-[240px] rounded-[28px] shadow-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7B4A22 0%, #C07838 40%, #9C6030 70%, #7B4A22 100%)" }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute w-full h-[1px]"
              style={{ top: `${8 + i * 9}%`, background: "rgba(40,15,0,0.12)" }} />
          ))}
          <div className="absolute inset-3 rounded-2xl flex items-center justify-between px-6"
            style={{ background: "rgba(8,8,8,0.88)" }}>
            {[0, 1].map((s) => (
              <div key={s} className="relative flex items-center justify-center"
                style={{ width: 104, height: 104, borderRadius: "50%", background: "radial-gradient(circle,#1a1a1a,#0a0a0a)" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle,#252525,#111)" }} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[var(--accent-brown)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Speaker3D() {
  const [webglSupported, setWebglSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const dragging   = useRef(false);
  const dragDelta  = useRef({ x: 0, y: 0 });
  const lastPos    = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) setWebglSupported(false);
    } catch { setWebglSupported(false); }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragDelta.current = {
      x: e.clientX - lastPos.current.x,
      y: e.clientY - lastPos.current.y,
    };
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    dragging.current = false;
    setIsDragging(false);
  };

  return (
    <div
      className="w-full h-full relative pointer-events-auto"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(192,120,56,0.22) 0%, transparent 65%)" }} />

      <WebGLErrorBoundary fallback={<CSSFallbackSpeaker />}>
        {webglSupported ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Canvas
              dpr={[1, 1.5]}
              performance={{ min: 0.5 }}
              camera={{ position: [0, 0, 7], fov: 42 }}
              style={{ width: "100%", height: "100%" }}
            >
              <spotLight position={[-4, 7, 5]} angle={0.22} penumbra={0.8} intensity={3.5} color="#FFE0A0" />
              <spotLight position={[5, 3, 4]}  angle={0.3}  penumbra={1}   intensity={1.8} color="#FFD090" />
              <pointLight position={[4, -1, -3]} intensity={1.2} color="#C8922A" />
              <ambientLight intensity={0.9} color="#FFF4E0" />
              <Environment preset="sunset" />

              <Scene dragging={dragging} dragDelta={dragDelta} />
            </Canvas>
          </Suspense>
        ) : (
          <CSSFallbackSpeaker />
        )}
      </WebGLErrorBoundary>
    </div>
  );
}

useGLTF.preload("/sp-3d-texture.glb");
