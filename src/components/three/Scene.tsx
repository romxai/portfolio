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

// Animation and smoothing constants
const NO_OF_POINTS = 2000;
const SCROLL_SMOOTHING = 2;
const MOVEMENT_SMOOTHING = 4;

// Camera configuration
const CAMERA_CONFIG = {
  FOV: 40,
  HEIGHT: 1.5, // Height above the path
  DISTANCE: 8, // Distance from the plane
  INITIAL_POSITION: new THREE.Vector3(0, 1.5, 8),
};

// Path configuration
const PATH_POINTS = [
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
];

// Visual configuration
const LINE_CONFIG = {
  COLOR: "white",
  WIDTH: 16,
  OPACITY: 0.2,
  Y_OFFSET: -3,
};

const Experience = () => {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH_POINTS, false, "catmullrom", 0.5),
    []
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
  }, []);

  const planeGroup = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const smoothScroll = useRef(0);
  const lastPosition = useRef(new THREE.Vector3());
  const lastLookAt = useRef(new THREE.Vector3());

  const scroll = useScroll();
  useFrame((state, delta) => {
    if (!planeGroup.current || !cameraRef.current) return;

    // Smooth out the scroll value
    smoothScroll.current = THREE.MathUtils.lerp(
      smoothScroll.current,
      scroll.offset,
      delta * SCROLL_SMOOTHING
    );

    const curPointIndex = Math.min(
      Math.floor(smoothScroll.current * (linePoints.length - 1)),
      linePoints.length - 2
    );

    // Get current and next points
    const curPoint = linePoints[curPointIndex];
    const nextPoint = linePoints[curPointIndex + 1];

    // Calculate smooth position between points
    const interpolationFactor =
      (smoothScroll.current * (linePoints.length - 1)) % 1;
    const currentPosition = new THREE.Vector3().lerpVectors(
      curPoint,
      nextPoint,
      interpolationFactor
    );

    // Calculate direction for rotation
    const direction = new THREE.Vector3()
      .subVectors(nextPoint, curPoint)
      .normalize();
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(),
        direction,
        new THREE.Vector3(0, 0, 0)
      )
    );

    // Update plane position and rotation
    planeGroup.current.position.lerp(
      currentPosition,
      delta * MOVEMENT_SMOOTHING
    );
    planeGroup.current.quaternion.slerp(
      targetRotation,
      delta * MOVEMENT_SMOOTHING
    );

    // Calculate camera target position (behind the plane)
    const cameraOffset = new THREE.Vector3(
      0,
      CAMERA_CONFIG.HEIGHT,
      CAMERA_CONFIG.DISTANCE
    );
    cameraOffset.applyQuaternion(planeGroup.current.quaternion);
    const targetCameraPos = currentPosition.clone().add(cameraOffset);

    // Smooth camera movement
    lastPosition.current.lerp(targetCameraPos, delta * MOVEMENT_SMOOTHING);
    lastLookAt.current.lerp(currentPosition, delta * MOVEMENT_SMOOTHING);

    // Update camera
    cameraRef.current.position.copy(lastPosition.current);
    cameraRef.current.lookAt(lastLookAt.current);
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={CAMERA_CONFIG.INITIAL_POSITION}
        fov={CAMERA_CONFIG.FOV}
      />
      <group ref={planeGroup}>
        <Plane />
      </group>
      <StaticBg />
      <group position={[0, LINE_CONFIG.Y_OFFSET, 0]}>
        <Line
          points={linePoints}
          color={LINE_CONFIG.COLOR}
          linewidth={LINE_CONFIG.WIDTH}
          transparent
          opacity={LINE_CONFIG.OPACITY}
        />
      </group>
      <group position={[0, LINE_CONFIG.Y_OFFSET, 0]}>
        <mesh>
          <extrudeGeometry
            args={[
              lineShape,
              { steps: NO_OF_POINTS, bevelEnabled: false, extrudePath: curve },
            ]}
          />
          <meshStandardMaterial
            color={LINE_CONFIG.COLOR}
            opacity={LINE_CONFIG.OPACITY}
            transparent
          />
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
