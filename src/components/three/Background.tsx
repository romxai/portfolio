// Background.tsx
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { Environment, useScroll } from "@react-three/drei";
import {
  BACKGROUND_CONFIG,
  SKY_GRADIENTS,
  DEBUG,
} from "../../utils/sceneConfig";
import { vertexShader, fragmentShader } from "../../utils/backgroundShaders";

/**
 * Background component
 * Creates a dynamic sky background with color transitions based on scroll position
 */
const Background = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const frameCount = useRef(0);
  const scroll = useScroll();

  // Get all gradient pairs for smooth transitions
  const gradientPairs = Object.values(SKY_GRADIENTS);

  // Create shader uniforms
  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_noiseScale: { value: BACKGROUND_CONFIG.NOISE_SCALE },
      u_noiseIntensity: { value: BACKGROUND_CONFIG.NOISE_INTENSITY },
      u_topColor1: { value: gradientPairs[0].TOP },
      u_bottomColor1: { value: gradientPairs[0].BOTTOM },
      u_topColor2: { value: gradientPairs[1].TOP },
      u_bottomColor2: { value: gradientPairs[1].BOTTOM },
    }),
    []
  );

  // Update shader uniforms on each frame
  useFrame(({ clock }) => {
    frameCount.current += 1;

    // Use scroll.offset (0-1) to determine color transitions
    // Scale it to cover all gradient pairs
    const scrollBasedTime = scroll.offset * gradientPairs.length;
    uniforms.u_time.value = scrollBasedTime;

    // Update color pairs based on scroll position
    const cycleIndex = Math.floor(scrollBasedTime) % gradientPairs.length;
    const nextIndex = (cycleIndex + 1) % gradientPairs.length;

    uniforms.u_topColor1.value = gradientPairs[cycleIndex].TOP;
    uniforms.u_bottomColor1.value = gradientPairs[cycleIndex].BOTTOM;
    uniforms.u_topColor2.value = gradientPairs[nextIndex].TOP;
    uniforms.u_bottomColor2.value = gradientPairs[nextIndex].BOTTOM;

    // Debug logging
    if (DEBUG.ENABLED && frameCount.current % DEBUG.LOG_INTERVAL === 0) {
      console.log("=== BACKGROUND DEBUG ===");
      console.log("Scroll Offset:", scroll.offset.toFixed(3));
      console.log("Scroll-based Time:", scrollBasedTime.toFixed(3));
      console.log("Current Gradient Index:", cycleIndex);
      console.log("Next Gradient Index:", nextIndex);
      console.log("Current Top Color:", uniforms.u_topColor1.value);
      console.log("Current Bottom Color:", uniforms.u_bottomColor1.value);
      console.log("Next Top Color:", uniforms.u_topColor2.value);
      console.log("Next Bottom Color:", uniforms.u_bottomColor2.value);
      console.log("========================");
    }
  });

  return (
    <>
    <mesh ref={meshRef} scale={[1000, 1000, 1000]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>    
    <Environment background resolution={256}>
    <mesh ref={meshRef} scale={[1000, 1000, 1000]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
    </Environment>
    </>
  );
};

export default Background;
