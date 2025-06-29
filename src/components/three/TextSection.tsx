import { Text } from "@react-three/drei";
import { fadeOnBeforeCompileFlat } from "../../utils/shaderEffects";
import { ReactNode, useMemo } from "react";
import * as THREE from "three";

interface TextSectionProps {
  title?: string;
  subtitle: string;
  textColor?: string;
  titleSize?: number;
  subtitleSize?: number;
  maxWidth?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children?: ReactNode;
  opacity?: number;
}

/**
 * TextSection component
 * Renders 3D text with fade effect for titles and subtitles
 * Uses bitcountgriddouble for titles and dmsans for body text
 */
export const TextSection: React.FC<TextSectionProps> = ({
  title,
  subtitle,
  textColor = "white",
  titleSize = 0.52,
  subtitleSize = 0.2,
  maxWidth = 2.5,
  position,
  rotation,
  children,
  opacity = 1,
}) => {
  // Create a color instance that can be modified for opacity
  const color = useMemo(() => new THREE.Color(textColor), [textColor]);

  // Create a customized shader compiler function with the current opacity
  const customFadeCompiler = (shader: { fragmentShader: string }) => {
    fadeOnBeforeCompileFlat(shader, 100.0, 0.93, 10.0, 0.3);
  };

  return (
    <group position={position} rotation={rotation}>
      {!!title && (
        <Text
          color={textColor}
          anchorX="left"
          anchorY="bottom"
          fontSize={titleSize}
          maxWidth={maxWidth}
          lineHeight={1}
          font="/fonts/BitcountGridDouble-Regular.ttf"
        >
          {title}
          <meshStandardMaterial
            color={color}
            opacity={opacity}
            transparent
            onBeforeCompile={customFadeCompiler}
          />
        </Text>
      )}

      <Text
        color={textColor}
        anchorX="left"
        anchorY="top"
        fontSize={subtitleSize}
        maxWidth={maxWidth}
        font="/fonts/DMSans_18pt-Regular.ttf"
      >
        {subtitle}
        <meshStandardMaterial
          color={color}
          opacity={opacity}
          transparent
          onBeforeCompile={customFadeCompiler}
        />
      </Text>
      {children}
    </group>
  );
};
