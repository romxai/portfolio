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
import { gsap } from "gsap";

interface SceneProps {
  showStats?: boolean;
}

// Animation and smoothing constants
const NO_OF_POINTS = 12000;
const CURVE_AHEAD_CAMERA = 0.008;
const CURVE_AHEAD_AIRPLANE = 0.02;
const FRICTION_DISTANCE = 42;
const AIRPLANE_MAX_ANGLE = 90; // Maximum banking angle in degrees
const CAMERA_HEIGHT = 0;
const CAMERA_DISTANCE = -5;

// Path configuration
const PATH_POINTS = [
  new THREE.Vector3(-3, 0, 0),
  new THREE.Vector3(0, 0, 10),
  new THREE.Vector3(2.5, 0, 20),
  new THREE.Vector3(3, 0, 30),
  new THREE.Vector3(6, 0, 40),
  new THREE.Vector3(5, 0, 50),
  new THREE.Vector3(2, 0, 60),
  new THREE.Vector3(-1, 0, 70),
  new THREE.Vector3(-5, 0, 80),
  new THREE.Vector3(0, 0, 90),
  new THREE.Vector3(0, 0, 100),
];

// Visual configuration for the path line
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

  // References
  const planeGroup = useRef<THREE.Group>(null);
  const cameraGroup = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const currentRotation = useRef(new THREE.Quaternion());

  // State tracking
  const lastScroll = useRef(0);
  const scroll = useScroll();

  useFrame((state, delta) => {
    if (
      !planeGroup.current ||
      !cameraGroup.current ||
      !cameraRef.current ||
      !lightRef.current
    )
      return;

    // Smooth scroll with friction
    let scrollOffset = Math.max(0, scroll.offset);
    let friction = 1;

    let lerpedScrollOffset = THREE.MathUtils.lerp(
      lastScroll.current,
      scrollOffset,
      delta * friction
    );
    lerpedScrollOffset = Math.min(Math.max(lerpedScrollOffset, 0), 1);
    lastScroll.current = lerpedScrollOffset;

    // Get current point and look-ahead points
    const curPoint = curve.getPoint(lerpedScrollOffset);
    const lookAtPoint = curve.getPoint(
      Math.min(lerpedScrollOffset + CURVE_AHEAD_CAMERA, 1)
    );

    // Calculate orientation and banking using forward and future directions
    const up = new THREE.Vector3(0, 1, 0);

    // Direction the airplane is currently heading
    const forwardDirection = new THREE.Vector3()
      .subVectors(lookAtPoint, curPoint)
      .normalize();

    // Future direction a bit further on the curve – helps to know if a turn is coming
    const futurePoint = curve.getPoint(
      Math.min(lerpedScrollOffset + CURVE_AHEAD_AIRPLANE, 1)
    );
    const futureDirection = new THREE.Vector3()
      .subVectors(futurePoint, curPoint)
      .normalize();

    // Right vector relative to the airplane
    const right = new THREE.Vector3()
      .crossVectors(forwardDirection, up)
      .normalize();

    // Only keep the horizontal component of the future direction (banking should not care about the y component)
    const horizontalFuture = new THREE.Vector3(
      futureDirection.x,
      0,
      futureDirection.z
    ).normalize();

    // Angle between current forward direction and where we will be heading soon
    let turnAmount = forwardDirection.angleTo(horizontalFuture); // radians

    // Determine if the turn is to the left or right
    const turnDirection = Math.sign(right.dot(futureDirection));

    // Calculate banking angle (negative = bank left, positive = bank right)
    let bankAngle = -turnDirection * turnAmount;

    // Clamp to our maximum allowed banking angle
    let bankDegrees = THREE.MathUtils.clamp(
      (bankAngle * 180) / Math.PI,
      -AIRPLANE_MAX_ANGLE,
      AIRPLANE_MAX_ANGLE
    );
    bankAngle = (bankDegrees * Math.PI) / 180;

    // Build the target rotation: first face the direction of travel, then apply banking
    const baseRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(), forwardDirection, up)
    );
    const bankRotation = new THREE.Quaternion().setFromAxisAngle(
      forwardDirection,
      bankAngle
    );
    const targetRotation = new THREE.Quaternion().multiplyQuaternions(
      baseRotation,
      bankRotation
    );

    // Smoothly interpolate the rotation for a natural feel
    currentRotation.current.slerp(targetRotation, delta * 4);

    // Update plane position and rotation
    planeGroup.current.position.copy(curPoint);
    planeGroup.current.quaternion.copy(currentRotation.current);

    // Update camera position to stay behind the plane using the same rotation
    const cameraOffset = new THREE.Vector3(
      0,
      CAMERA_HEIGHT,
      CAMERA_DISTANCE
    ).applyQuaternion(currentRotation.current);
    cameraGroup.current.position.copy(curPoint.clone().add(cameraOffset));
    cameraGroup.current.lookAt(curPoint);

    // Update light to follow the plane
    const lightOffset = new THREE.Vector3(-5, 10, -5).applyQuaternion(
      currentRotation.current
    );
    lightRef.current.position.copy(curPoint.clone().add(lightOffset));
    lightRef.current.target.position.copy(curPoint);
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <>
      <group ref={cameraGroup}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          fov={75}
          position={[0, CAMERA_HEIGHT, CAMERA_DISTANCE]}
        />
      </group>

      <ambientLight intensity={0.5} />
      <directionalLight
        ref={lightRef}
        position={[-5, 10, -5]}
        intensity={1}
        castShadow
      >
        <object3D position={[0, 0, 0]} />
      </directionalLight>

      <group ref={planeGroup}>
        <Jet rotation={[0, Math.PI, 0]} />
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
          <OrbitControls />
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
