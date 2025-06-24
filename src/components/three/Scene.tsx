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
import { Jet } from "./Jet";

interface SceneProps {
  showStats?: boolean;
}

// Animation and smoothing constants
const NO_OF_POINTS = 12000;
const SCROLL_SMOOTHING = 2;
const MOVEMENT_SMOOTHING = 4;

// Camera configuration
const CAMERA_CONFIG = {
  FOV: 40,
  HEIGHT: 1.5, // Height above the path
  DISTANCE: 8, // Distance from the plane
  INITIAL_POSITION: new THREE.Vector3(0, 1.5, 8),
};

// Plane movement configuration
const PLANE_CONFIG = {
  MAX_BANK_ANGLE: 1, // Maximum banking/tilt angle in radians (about 30 degrees)
  BANK_LERP: 0.5, // Banking lerp factor (lower = smoother)
  ROTATION_LERP: 1, // How quickly the plane rotates to face direction
  LOOK_AHEAD: 3, // How many points to look ahead for banking calculation
  POSITION_LERP: 0.1, // Position lerp factor
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
  const currentRotation = useRef(new THREE.Quaternion());
  const bankAngle = useRef(0);

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

    // Get points for position and direction calculation
    const curPoint = linePoints[curPointIndex];
    const nextPoint =
      linePoints[Math.min(curPointIndex + 1, linePoints.length - 1)];
    const futurePoint =
      linePoints[
        Math.min(curPointIndex + PLANE_CONFIG.LOOK_AHEAD, linePoints.length - 1)
      ];

    // Calculate current position
    const interpolationFactor =
      (smoothScroll.current * (linePoints.length - 1)) % 1;
    const currentPosition = new THREE.Vector3().lerpVectors(
      curPoint,
      nextPoint,
      interpolationFactor
    );

    // Calculate forward direction (where the plane should face)
    const forwardDirection = new THREE.Vector3()
      .subVectors(nextPoint, curPoint)
      .normalize();

    // Calculate the future direction for banking
    const futureDirection = new THREE.Vector3()
      .subVectors(futurePoint, currentPosition)
      .normalize();

    // Calculate right vector and up vector
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3()
      .crossVectors(forwardDirection, up)
      .normalize();

    // Calculate banking angle based on future direction
    const horizontalFuture = new THREE.Vector3(
      futureDirection.x,
      0,
      futureDirection.z
    ).normalize();
    const turnAmount = Math.acos(forwardDirection.dot(horizontalFuture));
    const turnDirection = Math.sign(right.dot(futureDirection));

    // Calculate target bank angle
    const targetBankAngle =
      -turnDirection * turnAmount * PLANE_CONFIG.MAX_BANK_ANGLE;

    // Smoothly interpolate the bank angle
    bankAngle.current = THREE.MathUtils.lerp(
      bankAngle.current,
      targetBankAngle,
      PLANE_CONFIG.BANK_LERP
    );

    // Create the base rotation to face the direction of travel
    const baseRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(), forwardDirection, up)
    );

    // Create the banking rotation
    const bankRotation = new THREE.Quaternion().setFromAxisAngle(
      forwardDirection,
      bankAngle.current
    );

    // Combine rotations: first face direction, then apply banking
    const targetRotation = new THREE.Quaternion().multiplyQuaternions(
      baseRotation,
      bankRotation
    );

    // Smoothly interpolate to the target rotation
    currentRotation.current.slerp(targetRotation, PLANE_CONFIG.ROTATION_LERP);

    // Update plane position and rotation
    planeGroup.current.position.lerp(
      currentPosition,
      PLANE_CONFIG.POSITION_LERP
    );
    planeGroup.current.quaternion.copy(currentRotation.current);

    // Update camera position
    const cameraOffset = new THREE.Vector3(
      0,
      CAMERA_CONFIG.HEIGHT,
      CAMERA_CONFIG.DISTANCE
    );
    cameraOffset.applyQuaternion(currentRotation.current);
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
        <Jet />
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
