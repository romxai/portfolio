// Background.tsx
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 u_colorTop;
  uniform vec3 u_colorBottom;
  varying vec2 vUv;

  void main() {
    vec3 color = mix(u_colorBottom, u_colorTop, vUv.y);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const Background = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      u_colorTop: { value: new THREE.Color("#ffffff") },
      u_colorBottom: { value: new THREE.Color("#000000") },
    }),
    []
  );

  return (
    <>
    <mesh ref={meshRef} scale={[100, 100, 100]}>
      <sphereGeometry args={[1, 1, 100]} />
      <shaderMaterial
        side={THREE.BackSide}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
    <Environment background resolution={1024}>
    <mesh ref={meshRef} scale={[100, 100, 100]}>
      <sphereGeometry args={[1, 1, 100]} />
      <shaderMaterial
        side={THREE.BackSide}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
    </Environment>
    </>
  );
};

export default Background;
