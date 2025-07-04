import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Float,
  Line,
  OrbitControls,
  PerspectiveCamera,
  ScrollControls,
  Stats,
  useScroll,
} from "@react-three/drei";
import { Plane } from "./Plane";
import * as THREE from "three";
import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Jet } from "./Jet";
import { CloudB } from "./CloudB";
import { CloudA } from "./CloudA";
import {
  fadeOnBeforeCompile,
  fadeOnBeforeCompileFlat,
} from "../../utils/shaderEffects";
import {
  ANIMATION_CONFIG,
  CAMERA_CONFIG,
  PLANE_CONFIG,
  PATH_POINTS,
  LINE_CONFIG,
  DEBUG,
  TEXT_SECTIONS,
} from "../../utils/sceneConfig";
import BackgroundLamina from "./Backgroundlamina";
import { TextSection } from "./TextSection";

interface SceneProps {
  showStats?: boolean;
}

// Cloud interface
interface CloudData {
  type: "A" | "B";
  scale: THREE.Vector3;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

/**
 * Main Experience component
 * Contains the flight path, plane, and all scene elements
 */
const Experience = () => {
  // Create the flight curve from path points
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH_POINTS, false, "chordal", 0.5),
    []
  );

  // Generate points along the curve for visualization
  const linePoints = useMemo(
    () => curve.getPoints(ANIMATION_CONFIG.NO_OF_POINTS),
    [curve]
  );

  // Create the shape for the extruded path
  const lineShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, -0.1);
    shape.lineTo(0.05, -0.1);
    shape.lineTo(0.05, 0.1);
    shape.lineTo(0, 0.1);
    return shape;
  }, []);

  // Reference for the line material to control opacity
  const lineMaterialRef = useRef<THREE.Material | null>(null);

  // Cloud configuration
  const clouds = useMemo<CloudData[]>(
    () => [
      // STARTING AREA
      {
        type: "A",
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(1.8, -0.1, 3),
        rotation: new THREE.Euler(0, Math.PI, 0),
      },
      {
        type: "B",
        scale: new THREE.Vector3(1.5, 1.5, 1.5),
        position: new THREE.Vector3(-2.5, -0.5, 0),
        rotation: new THREE.Euler(0, 0, 0),
      },
      {
        type: "B",
        scale: new THREE.Vector3(1.5, 1.5, 1.5),
        position: new THREE.Vector3(5, 0.8, -3),
        rotation: new THREE.Euler(0, -0.7, 0),
      },
      {
        type: "A",
        scale: new THREE.Vector3(2, 2, 2),
        position: new THREE.Vector3(-4.5, 0.8, -5),
        rotation: new THREE.Euler(0, 0, 0),
      },
      {
        type: "A",
        scale: new THREE.Vector3(1.8, 1.8, 1.8),
        position: new THREE.Vector3(-4, 2.6, -105),
        rotation: new THREE.Euler(0, 0.2, 0),
      },
    ],
    []
  );

  const planeGroup = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const smoothScroll = useRef(0);
  const lastPosition = useRef(new THREE.Vector3());
  const lastLookAt = useRef(new THREE.Vector3());
  const currentRotation = useRef(new THREE.Quaternion());

  // Flight dynamics references
  const bankAngle = useRef(0);
  const pitchAngle = useRef(0);
  const yawAngle = useRef(0);
  const frameCount = useRef(0);

  // Flight axis vectors
  const xAxis = useRef(new THREE.Vector3(1, 0, 0)); // Right vector
  const yAxis = useRef(new THREE.Vector3(0, 1, 0)); // Up vector
  const zAxis = useRef(new THREE.Vector3(0, 0, 1)); // Forward vector
  const lastDirection = useRef(new THREE.Vector3(0, 0, -1));

  const scroll = useScroll();
  useFrame((state, delta) => {
    if (!planeGroup.current || !cameraRef.current) return;

    frameCount.current += 1;

    // Smooth out the scroll value
    smoothScroll.current = THREE.MathUtils.lerp(
      smoothScroll.current,
      scroll.offset,
      delta * ANIMATION_CONFIG.SCROLL_SMOOTHING
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

    // Calculate the rate of direction change for yaw
    const directionChange = new THREE.Vector3().subVectors(
      forwardDirection,
      lastDirection.current
    );

    // Update last direction
    lastDirection.current.copy(forwardDirection);

    // Calculate the future direction for banking
    const futureDirection = new THREE.Vector3()
      .subVectors(futurePoint, currentPosition)
      .normalize();

    // Calculate right vector and up vector
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3()
      .crossVectors(forwardDirection, worldUp)
      .normalize();
    const up = new THREE.Vector3()
      .crossVectors(right, forwardDirection)
      .normalize();

    // BANKING (ROLL) CALCULATION
    // Calculate banking angle based on future direction
    const horizontalFuture = new THREE.Vector3(
      futureDirection.x,
      0,
      futureDirection.z
    ).normalize();
    const turnAmount = Math.acos(
      Math.min(Math.max(forwardDirection.dot(horizontalFuture), -1), 1)
    );
    const turnDirection = Math.sign(right.dot(futureDirection));

    // Calculate target bank angle
    const targetBankAngle =
      -turnDirection * turnAmount * PLANE_CONFIG.MAX_BANK_ANGLE * 5;

    // PITCH CALCULATION
    // Calculate pitch based on elevation changes in the path
    const elevationChange = nextPoint.y - curPoint.y;
    const targetPitchAngle = Math.max(
      Math.min(
        elevationChange * PLANE_CONFIG.ELEVATION_INFLUENCE,
        PLANE_CONFIG.MAX_PITCH_ANGLE
      ),
      -PLANE_CONFIG.MAX_PITCH_ANGLE
    );

    // YAW CALCULATION
    // Use the horizontal component of direction change for yaw
    const horizontalDirectionChange = new THREE.Vector3(
      directionChange.x,
      0,
      directionChange.z
    );
    const targetYawAngle =
      horizontalDirectionChange.length() * Math.sign(directionChange.x) * 0.5;

    // Smoothly interpolate the angles
    bankAngle.current = THREE.MathUtils.lerp(
      bankAngle.current,
      targetBankAngle,
      PLANE_CONFIG.BANK_LERP
    );

    pitchAngle.current = THREE.MathUtils.lerp(
      pitchAngle.current,
      targetPitchAngle,
      PLANE_CONFIG.PITCH_LERP
    );

    yawAngle.current = THREE.MathUtils.lerp(
      yawAngle.current,
      targetYawAngle,
      PLANE_CONFIG.YAW_LERP
    );

    // Create the base rotation to face the direction of travel
    const baseRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(), forwardDirection, worldUp)
    );

    // Create the banking rotation around the forward axis (z)
    const bankRotation = new THREE.Quaternion().setFromAxisAngle(
      forwardDirection,
      bankAngle.current
    );

    // Create the pitch rotation around the right axis (x)
    const pitchRotation = new THREE.Quaternion().setFromAxisAngle(
      right,
      pitchAngle.current
    );

    // Create the yaw rotation around the up axis (y)
    const yawRotation = new THREE.Quaternion().setFromAxisAngle(
      worldUp,
      yawAngle.current
    );

    // Combine rotations: first face direction, then apply banking, pitch, and yaw
    let targetRotation = new THREE.Quaternion().copy(baseRotation);
    targetRotation.multiply(bankRotation);
    targetRotation.multiply(pitchRotation);

    // Smoothly interpolate to the target rotation
    currentRotation.current.slerp(targetRotation, PLANE_CONFIG.ROTATION_LERP);

    // Update plane position and rotation
    planeGroup.current.position.lerp(
      currentPosition,
      PLANE_CONFIG.POSITION_LERP
    );
    planeGroup.current.quaternion.copy(currentRotation.current);

    // Update flight axis vectors
    xAxis.current.set(1, 0, 0).applyQuaternion(currentRotation.current);
    yAxis.current.set(0, 1, 0).applyQuaternion(currentRotation.current);
    zAxis.current.set(0, 0, 1).applyQuaternion(currentRotation.current);

    // Update camera position
    const cameraOffset = new THREE.Vector3(
      0,
      CAMERA_CONFIG.HEIGHT,
      CAMERA_CONFIG.DISTANCE
    );
    cameraOffset.applyQuaternion(currentRotation.current);
    const targetCameraPos = currentPosition.clone().add(cameraOffset);

    // Smooth camera movement
    lastPosition.current.lerp(
      targetCameraPos,
      delta * ANIMATION_CONFIG.MOVEMENT_SMOOTHING
    );
    lastLookAt.current.lerp(
      currentPosition,
      delta * ANIMATION_CONFIG.MOVEMENT_SMOOTHING
    );

    // Update camera
    cameraRef.current.position.copy(lastPosition.current);
    cameraRef.current.lookAt(lastLookAt.current);

    // Debug logging
    if (DEBUG.ENABLED && frameCount.current % DEBUG.LOG_INTERVAL === 0) {
      console.log("=== JET MOVEMENT DEBUG ===");
      console.log(
        "Bank Angle:",
        ((bankAngle.current * 180) / Math.PI).toFixed(2) + "°"
      );
      console.log(
        "Pitch Angle:",
        ((pitchAngle.current * 180) / Math.PI).toFixed(2) + "°"
      );
      console.log(
        "Yaw Angle:",
        ((yawAngle.current * 180) / Math.PI).toFixed(2) + "°"
      );
      console.log("Position:", planeGroup.current.position);
      console.log("X Axis:", xAxis.current);
      console.log("Y Axis:", yAxis.current);
      console.log("Z Axis:", zAxis.current);
      console.log("Elevation Change:", elevationChange);
      console.log("Turn Amount:", turnAmount);
      console.log("Turn Direction:", turnDirection);
      console.log("Scroll Position:", scroll.offset.toFixed(3));
      console.log("========================");
    }
  });

  return (
    <>
      <directionalLight position={[-3, 3, 2]} intensity={1.1} />
      <directionalLight position={[-1, 3, 2]} intensity={0.3} />
      <directionalLight position={[0, 0, 2]} intensity={0.4} />

      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={CAMERA_CONFIG.INITIAL_POSITION}
        fov={CAMERA_CONFIG.FOV}
      />
      <group ref={planeGroup}>
        <ambientLight intensity={0.2} />
        <Float
          speed={15}
          rotationIntensity={0.1}
          floatIntensity={5}
          floatingRange={[-0.01, 0.01]}
        >
          <Jet />
        </Float>
      </group>
      <BackgroundLamina />
      {/* Clouds */}
      {clouds.map((cloud, index) => (
        <group
          key={index}
          position={cloud.position}
          rotation={[cloud.rotation.x, cloud.rotation.y, cloud.rotation.z]}
          scale={cloud.scale}
        >
          {cloud.type === "A" ? <CloudA /> : <CloudB />}
        </group>
      ))}

      <group position={[0, LINE_CONFIG.Y_OFFSET, 0]}>
        <Line
          points={linePoints}
          color={LINE_CONFIG.COLOR}
          linewidth={LINE_CONFIG.WIDTH * 1}
          transparent
          opacity={LINE_CONFIG.OPACITY * 0}
        />
      </group>
      <group position={[0, LINE_CONFIG.Y_OFFSET - 0.1, 0]}>
        <mesh>
          <extrudeGeometry
            args={[
              lineShape,
              {
                steps: ANIMATION_CONFIG.NO_OF_POINTS,
                bevelEnabled: false,
                extrudePath: curve,
              },
            ]}
          />
          <meshStandardMaterial
            ref={lineMaterialRef}
            color={LINE_CONFIG.COLOR}
            opacity={LINE_CONFIG.OPACITY}
            transparent
            envMapIntensity={2}
            onBeforeCompile={(shader) =>
              fadeOnBeforeCompile(shader, 100.0, 0.93, 40.0, 0.3)
            }
          />
        </mesh>
      </group>

      {/* Text Sections */}
      {TEXT_SECTIONS.map((section, index) => {
        // Get current camera position from the path
        const curPointIndex = Math.min(
          Math.floor(smoothScroll.current * (linePoints.length - 1)),
          linePoints.length - 2
        );
        const curPoint = linePoints[curPointIndex];

        // Calculate distance between camera and text section
        const distanceToSection = curPoint.distanceTo(section.position);
        const visibilityDistance = 120; // Distance at which text becomes visible
        const fadeDistance = 30; // Distance over which text fades in/out

        // Calculate opacity based on distance (inverse relationship)
        const opacity = Math.max(
          0,
          Math.min(
            1,
            1 -
              (distanceToSection - fadeDistance) /
                (visibilityDistance - fadeDistance)
          )
        );

        return opacity > 0 ? (
          <group
            key={`text-section-${index}`}
            position={section.position}
            rotation={
              section.rotation
                ? [section.rotation.x, section.rotation.y, section.rotation.z]
                : [0, 0, 0]
            }
          >
            <Float
              speed={1.5}
              rotationIntensity={0.1}
              floatIntensity={0.3}
              floatingRange={[-0.05, 0.05]}
            >
              <TextSection
                title={section.title}
                subtitle={section.subtitle}
                textColor={section.textColor || "white"}
                opacity={opacity}
              />
            </Float>
          </group>
        ) : null;
      })}
    </>
  );
};

/**
 * Main Scene component
 * Sets up the canvas and scene controls
 */
const Scene: React.FC<SceneProps> = ({ showStats = false }) => {
  // Add keyboard controls for debugging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d") {
        console.log("Debug mode toggled");
        DEBUG.ENABLED = !DEBUG.ENABLED;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className="w-full h-full">
        <Canvas gl={{ preserveDrawingBuffer: true }}>
          <color attach="background" args={["#eeeece"]} />
          <OrbitControls
            enableZoom={false}
            enablePan={true}
            enableRotate={true}
          />
          <ScrollControls pages={10} damping={0.5}>
            <Experience />
          </ScrollControls>
          {showStats && <Stats />}
        </Canvas>
      </div>
    </>
  );
};

export default Scene;
