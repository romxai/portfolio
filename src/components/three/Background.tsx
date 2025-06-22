// Background.tsx
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState } from "react";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec3 u_bg;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  varying vec2 vUv;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec3 color = u_bg;
    float noise1 = snoise(vUv + u_time * 0.2);
    float noise2 = snoise(vUv + u_time * 0.4);

    color = mix(color, u_colorA, noise1);
    color = mix(color, u_colorB, noise2);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const Background = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scrollY, setScrollY] = useState(0);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_bg: { value: new THREE.Color("#0f0f1f") },
      u_colorA: { value: new THREE.Color("#9FBAF9") },
      u_colorB: { value: new THREE.Color("#FEB3D9") },
    }),
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    uniforms.u_time.value = elapsed;

    const colorA = new THREE.Color().setHSL((elapsed * 0.5) % 1, 0.7, 0.5);
    const colorB = new THREE.Color().setHSL((elapsed * 0.05 + 0.33) % 1, 0.7, 0.5);

    uniforms.u_colorA.value = colorA;
    uniforms.u_colorB.value = colorB;
    });


  return (
    <mesh ref={meshRef} scale={[100, 100, 100]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default Background;
