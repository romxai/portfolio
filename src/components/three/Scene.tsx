import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Line,
  OrbitControls,
  PerspectiveCamera,
  ScrollControls,
  Stats,
} from "@react-three/drei";
import { Plane } from "./Plane";
import Background from "./Background";
import StaticBg from "./StaticBg";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

interface SceneProps {
  showStats?: boolean;
}

const NO_OF_POINTS = 2000;

const Experience = () => {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-5, 0, -20),
      new THREE.Vector3(-1, 0, -30),
      new THREE.Vector3(2, 0, -40),
      new THREE.Vector3(5, 0, -50),
      new THREE.Vector3(6, 0, -60),
      new THREE.Vector3(3, 0, -70),
      new THREE.Vector3(2.5, 0, -80),
      new THREE.Vector3(0, 0, -90),
      new THREE.Vector3(-3, 0, -100),
    ],
    false,
    "catmullrom",
    0.5
  );

  const linePoints = useMemo(() => curve.getPoints(NO_OF_POINTS), [curve]);

  const lineShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);

    shape.lineTo(0, -0.5);
    shape.lineTo(0.2, -0.5);
    shape.lineTo(0.2, 0.5);
    shape.lineTo(0, 0.5);
    return shape;
  }, [curve]);

  const planePosition = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());

  const scroll = useScroll();
  useFrame(() => {
    const currentPosition = Math.min(
      Math.round(scroll.offset * linePoints.length),
      linePoints.length - 1
    );

    // Get current point and next point for direction
    const currentPoint = linePoints[currentPosition];
    const nextPoint =
      linePoints[Math.min(currentPosition + 1, linePoints.length - 1)];

    // Update plane position
    planePosition.current.copy(currentPoint);

    // Calculate direction vector
    const direction = new THREE.Vector3()
      .subVectors(nextPoint, currentPoint)
      .normalize();

    // Position camera behind and slightly above the plane
    cameraPosition.current
      .copy(currentPoint)
      .sub(direction.multiplyScalar(8))
      .add(new THREE.Vector3(0, 2, 0));
    cameraTarget.current.copy(currentPoint).add(direction);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 8]}
        fov={40}
        ref={(camera) => {
          if (camera) {
            camera.position.copy(cameraPosition.current);
            camera.lookAt(cameraTarget.current);
          }
        }}
      />
      <group position={planePosition.current}>
        <Plane />
      </group>
      <StaticBg />
      <group position={[0, -3, 0]}>
        <Line
          points={linePoints}
          color="white"
          linewidth={16}
          transparent
          opacity={0.2}
        />
      </group>
      <group position={[0, -3, 0]}>
        <mesh>
          <extrudeGeometry
            args={[
              lineShape,
              { steps: NO_OF_POINTS, bevelEnabled: false, extrudePath: curve },
            ]}
          />
          <meshStandardMaterial color="white" opacity={0.4} transparent />
        </mesh>
      </group>
    </>
  );
};

const Scene: React.FC<SceneProps> = ({ showStats = false }) => {
  return (
    <>
      <div className="w-full h-full">
        <Canvas>
          <color attach="background" args={["#eeeece"]} />
          <OrbitControls
            enableZoom={false}
            enablePan={true}
            enableRotate={true}
          />
          <ScrollControls pages={5} damping={0.25}>
            <Experience />
          </ScrollControls>
          {showStats && <Stats />}
        </Canvas>
      </div>
    </>
  );
};

export default Scene;
