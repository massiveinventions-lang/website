import { useRef, Suspense, Component, ReactNode, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function makeWoodTexture() {
  const w = 512, h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0,    "#7B4A22");
  base.addColorStop(0.15, "#9C6030");
  base.addColorStop(0.4,  "#C07838");
  base.addColorStop(0.6,  "#A86228");
  base.addColorStop(0.85, "#8C5020");
  base.addColorStop(1,    "#7B4A22");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 180; i++) {
    const y = Math.random() * h;
    const dark = Math.random() > 0.5;
    ctx.strokeStyle = dark
      ? `rgba(40,15,0,${0.04 + Math.random() * 0.12})`
      : `rgba(220,150,80,${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.4 + Math.random() * 1.5;
    ctx.beginPath();
    let cy = y;
    for (let x = 0; x <= w; x += 3) {
      cy += (Math.random() - 0.5) * 1.2;
      x === 0 ? ctx.moveTo(x, cy) : ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  const vig = ctx.createLinearGradient(0, 0, w, 0);
  vig.addColorStop(0,    "rgba(30,10,0,0.35)");
  vig.addColorStop(0.12, "rgba(30,10,0,0)");
  vig.addColorStop(0.88, "rgba(30,10,0,0)");
  vig.addColorStop(1,    "rgba(30,10,0,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

function SpeakerCone({ x }: { x: number }) {
  const z = 1.12;
  return (
    <group position={[x, -0.05, z]}>
      <mesh>
        <torusGeometry args={[0.56, 0.06, 16, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[0.56, 64]} />
        <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.46, 64]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.32, 0.025, 8, 40]} />
        <meshStandardMaterial color="#282828" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <sphereGeometry args={[0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Knob({ x }: { x: number }) {
  return (
    <group position={[x, 1.07, 0.35]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.13, 0.06, 24]} />
        <meshStandardMaterial color="#B8922A" roughness={0.25} metalness={0.95} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.04, 24]} />
        <meshStandardMaterial color="#D4AA44" roughness={0.15} metalness={1} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.09, 6]} />
        <meshStandardMaterial color="#3A2800" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Nameplate() {
  return (
    <group position={[-0.62, 1.065, 0.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.26]} />
        <meshStandardMaterial color="#A07820" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.86, 0.003, 0.22]} />
        <meshStandardMaterial color="#C8A030" roughness={0.2} metalness={0.95} />
      </mesh>
    </group>
  );
}

function Foot({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -1.07, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 20]} />
        <meshStandardMaterial color="#B8922A" roughness={0.2} metalness={1} />
      </mesh>
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.04, 20]} />
        <meshStandardMaterial color="#8A6010" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

function SpeakerAssembly() {
  const woodTex = useMemo(() => makeWoodTexture(), []);
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.12,
    metalness: 0.06,
    envMapIntensity: 1.2,
  }), [woodTex]);

  return (
    <group>
      <RoundedBox args={[3.6, 2.2, 2.4]} radius={0.28} smoothness={6}>
        <primitive object={woodMat} attach="material" />
      </RoundedBox>
      <mesh position={[0, -0.05, 1.202]}>
        <planeGeometry args={[3.3, 1.8]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.9} metalness={0.05} />
      </mesh>
      <SpeakerCone x={-0.88} />
      <SpeakerCone x={0.88} />
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[3.54, 0.02, 2.34]} />
        <meshStandardMaterial map={woodTex} roughness={0.08} metalness={0.08} color="#8B5E30" />
      </mesh>
      <Knob x={-0.15} />
      <Knob x={0.38} />
      <Knob x={0.82} />
      <Knob x={1.22} />
      <Nameplate />
      <Foot x={-1.5} z={0.95} />
      <Foot x={1.5}  z={0.95} />
      <Foot x={-1.5} z={-0.95} />
      <Foot x={1.5}  z={-0.95} />
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[3.54, 0.02, 2.34]} />
        <meshStandardMaterial map={woodTex} roughness={0.3} metalness={0.05} color="#5C3018" />
      </mesh>
    </group>
  );
}

function AutoRotateScene({ isUserInteracting }: { isUserInteracting: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const autoY = useRef(0.4);

  useFrame((_s, delta) => {
    if (!groupRef.current || isUserInteracting) return;
    // Clamp delta to avoid snap-spinning when a backgrounded tab resumes.
    const dt = Math.min(delta, 1 / 30);
    autoY.current += dt * 0.22;
    groupRef.current.rotation.y = autoY.current;
    groupRef.current.rotation.x = -0.08;
  });

  return (
    <group ref={groupRef}>
      <SpeakerAssembly />
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

function FallbackSpeaker() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--retro-cream)] rounded-3xl">
      <div className="relative w-[320px] h-[200px] rounded-[20px] shadow-2xl"
        style={{ background: "linear-gradient(135deg, #7B4A22 0%, #C07838 40%, #9C6030 100%)" }}>
        <div className="absolute inset-3 rounded-xl flex items-center justify-between px-6"
          style={{ background: "rgba(8,8,8,0.88)" }}>
          {[0, 1].map((s) => (
            <div key={s} className="flex items-center justify-center"
              style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,#1a1a1a,#0a0a0a)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle,#252525,#111)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Speaker3DDetail() {
  const [webglSupported, setWebglSupported] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) setWebglSupported(false);
    } catch { setWebglSupported(false); }
  }, []);

  const handleInteractionStart = () => {
    setIsUserInteracting(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const handleInteractionEnd = () => {
    idleTimer.current = setTimeout(() => setIsUserInteracting(false), 2500);
  };

  return (
    <div
      className="w-full h-full"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      <WebGLErrorBoundary fallback={<FallbackSpeaker />}>
        {webglSupported ? (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-[var(--accent-brown)] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Canvas
              dpr={[1, 1.5]}
              performance={{ min: 0.5 }}
              camera={{ position: [0, 0.4, 6.5], fov: 40 }}
              style={{ width: "100%", height: "100%", cursor: "grab" }}
            >
              <spotLight position={[-4, 7, 5]} angle={0.22} penumbra={0.8} intensity={3.5} color="#FFE0A0" />
              <spotLight position={[5, 3, 4]}  angle={0.3}  penumbra={1}   intensity={1.8} color="#FFD090" />
              <pointLight position={[4, -1, -3]} intensity={1.2} color="#C8922A" />
              <ambientLight intensity={0.55} color="#FFF4E0" />
              <Environment preset="sunset" />

              <AutoRotateScene isUserInteracting={isUserInteracting} />

              <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={12} blur={3.5} far={5} resolution={256} frames={1} color="#4A2808" />

              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={4}
                maxDistance={10}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
                makeDefault
              />
            </Canvas>
          </Suspense>
        ) : (
          <FallbackSpeaker />
        )}
      </WebGLErrorBoundary>
    </div>
  );
}
