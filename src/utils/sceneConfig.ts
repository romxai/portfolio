/**
 * Scene configuration constants
 * Central place for all scene-related configuration settings
 */
import * as THREE from "three";

/**
 * Animation and smoothing constants
 */
export const ANIMATION_CONFIG = {
  NO_OF_POINTS: 1200,
  SCROLL_SMOOTHING: 1,
  MOVEMENT_SMOOTHING: 3,
};

/**
 * Camera configuration
 */
export const CAMERA_CONFIG = {
  FOV: 40,
  HEIGHT: 1.5, // Height above the path
  DISTANCE: 8, // Distance from the plane
  INITIAL_POSITION: new THREE.Vector3(0, 1.5, 8),
};

/**
 * Plane movement configuration
 */
export const PLANE_CONFIG = {
  MAX_BANK_ANGLE: 0.8, // Maximum banking/tilt angle in radians (about 45 degrees)
  BANK_LERP: 0.01, // Banking lerp factor (lower = smoother)
  PITCH_LERP: 0.1, // Pitch lerp factor
  YAW_LERP: 0.1, // Yaw lerp factor
  ROTATION_LERP: 0.1, // How quickly the plane rotates to face direction
  LOOK_AHEAD: 5, // How many points to look ahead for banking calculation
  POSITION_LERP: 0.1, // Position lerp factor
  MAX_PITCH_ANGLE: 0.4, // Maximum pitch angle in radians (about 23 degrees)
  ELEVATION_INFLUENCE: 0.8, // How much elevation changes affect pitch
};

/**
 * Path configuration - defines the flight path points
 */
export const PATH_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -20),
  new THREE.Vector3(-10, 1, -30),
  new THREE.Vector3(-5, 2, -30),
  new THREE.Vector3(2, 0, -40),
  new THREE.Vector3(5, -1, -50),
  new THREE.Vector3(6, 0, -60),
  new THREE.Vector3(3, 2, -70),
  new THREE.Vector3(2.5, 1, -80),
  new THREE.Vector3(0, 0, -90),
  new THREE.Vector3(-1, -1, -1000),
];

/**
 * Visual configuration for the line path
 */
export const LINE_CONFIG = {
  COLOR: "white",
  WIDTH: 16,
  OPACITY: 0.2,
  Y_OFFSET: -3,
};

/**
 * Debug configuration
 */
export const DEBUG = {
  ENABLED: true,
  LOG_INTERVAL: 60, // Log every 60 frames
  SHOW_AXES: false,
  AXIS_LENGTH: 2,
};

/**
 * Background animation configuration
 */
export const BACKGROUND_CONFIG = {
  COLOR_TRANSITION_SPEED: 0.2, // Speed of color changes
  NOISE_MOVEMENT_SPEED: 100, // Speed of noise pattern movement
  NOISE_SCALE: 15, // Scale of the noise pattern
  NOISE_INTENSITY: 0.05, // How strong the noise affects the colors
};

/**
 * Sky color palette pairs (top, bottom)
 * These colors will be cycled through as the user scrolls
 */
export const SKY_GRADIENTS = [
  {
    colorA: "#3535cc", // Initial blue
    colorB: "#abaadd", // Light blue-purple
  },
  {
    colorA: "#6f35cc", // Purple
    colorB: "#ffad30", // Orange
  },
  {
    colorA: "#424242", // Dark gray
    colorB: "#ffcc00", // Yellow
  },
  {
    colorA: "#81318b", // Purple
    colorB: "#55ab8f", // Teal
  },
];
