import { Environment, Sphere, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Gradient, LayerMaterial } from "lamina";
import { useRef, useEffect, useMemo } from "react";

import * as THREE from "three";
import { SKY_GRADIENTS } from "../../utils/sceneConfig";

// Enable proper color management for Three.js
// This ensures colors are handled correctly in the linear color space
// Required for proper color conversion with hexadecimal and CSS colors
THREE.ColorManagement.enabled = true;

// Define proper type for the backgroundColors prop
interface BackgroundProps {
  backgroundColors?: React.MutableRefObject<{
    colorA: string;
    colorB: string;
  }>;
}

/**
 * Background component using Lamina's LayerMaterial for gradient effects
 * Creates a large sphere with a gradient material that serves as the scene background
 * Also creates an environment map with the same gradient for reflections
 * Colors cycle based on scroll position
 */
const BackgroundLamina = ({ backgroundColors }: BackgroundProps) => {
  const start = 0.2;
  const end = -0.5;

  // Use any type for Lamina refs as it's challenging to get the exact type
  // This is a common approach with libraries that don't export their internal types
  const gradientRef = useRef<any>(null);
  const gradientEnvRef = useRef<any>(null);

  // Create a local reference for colors if one isn't provided
  const localBackgroundColors = useRef({
    colorA: SKY_GRADIENTS[0].colorA,
    colorB: SKY_GRADIENTS[0].colorB,
  });

  // Use the provided colors ref or the local one
  const colors = backgroundColors || localBackgroundColors;

  // Get scroll information for color transitions
  const scroll = useScroll();
  const lastScrollOffset = useRef(0);

  // Initialize color management on component mount
  useEffect(() => {
    // Ensure color management is enabled
    THREE.ColorManagement.enabled = true;
  }, []);

  // Update colors based on scroll position
  useFrame((state, delta) => {
    // Get current scroll position
    const scrollOffset = scroll.offset;

    // Update local colors based on scroll position if no external colors are provided
    if (!backgroundColors) {
      // Calculate which gradient pair to use based on scroll position
      const gradientCount = SKY_GRADIENTS.length;
      const scrollBasedIndex = Math.min(
        Math.floor(scrollOffset * gradientCount),
        gradientCount - 1
      );

      // Get the current and next gradient pairs
      const currentGradient = SKY_GRADIENTS[scrollBasedIndex];
      const nextGradient =
        SKY_GRADIENTS[(scrollBasedIndex + 1) % gradientCount];

      // Calculate the interpolation factor between the two gradient pairs
      const interpolationFactor = (scrollOffset * gradientCount) % 1;

      // Interpolate the colors
      const colorA = new THREE.Color(currentGradient.colorA).lerp(
        new THREE.Color(nextGradient.colorA),
        interpolationFactor
      );

      const colorB = new THREE.Color(currentGradient.colorB).lerp(
        new THREE.Color(nextGradient.colorB),
        interpolationFactor
      );

      // Update the local colors
      localBackgroundColors.current.colorA = colorA.getStyle();
      localBackgroundColors.current.colorB = colorB.getStyle();
    }

    // Update the gradient colors
    if (gradientRef.current && colors.current) {
      gradientRef.current.colorA = new THREE.Color(
        colors.current.colorA
      ).convertSRGBToLinear(); // Convert to linear color space for proper rendering

      gradientRef.current.colorB = new THREE.Color(
        colors.current.colorB
      ).convertSRGBToLinear();
    }

    if (gradientEnvRef.current && colors.current) {
      gradientEnvRef.current.colorA = new THREE.Color(
        colors.current.colorA
      ).convertSRGBToLinear();

      gradientEnvRef.current.colorB = new THREE.Color(
        colors.current.colorB
      ).convertSRGBToLinear();
    }

    // Update last scroll offset
    lastScrollOffset.current = scrollOffset;
  });

  return (
    <>
      {/* Background sphere */}
      <Sphere scale={[1000, 1000, 1000]} rotation-y={Math.PI / 2}>
        <LayerMaterial color="#ffffff" side={THREE.BackSide}>
          <Gradient ref={gradientRef} axes="y" start={start} end={end} />
        </LayerMaterial>
      </Sphere>

      {/* Environment lighting sphere with the same gradient */}
      <Environment resolution={50} frames={Infinity}>
        <Sphere
          scale={[100, 100, 100]}
          rotation-y={Math.PI / 2}
          rotation-x={Math.PI}
        >
          <LayerMaterial color="#ffffff" side={THREE.BackSide}>
            <Gradient ref={gradientEnvRef} axes="y" start={start} end={end} />
          </LayerMaterial>
        </Sphere>
      </Environment>
    </>
  );
};

export default BackgroundLamina;
