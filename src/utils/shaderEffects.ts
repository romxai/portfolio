/**
 * Shader effects utility functions
 * Contains reusable shader modifications for various visual effects
 */

/**
 * Applies a distance-based fade effect to a shader with enhanced depth perception
 * Objects will gradually fade out as they get further from the camera
 * Additionally, objects will have increased opacity when very close to add depth perception
 *
 * @param shader - The shader to modify
 * @param fadeDistance - The distance at which objects start to fade (default: 350.0)
 * @param easingFactor - Controls the easing curve of the fade (default: 0.93)
 * @param nearDistance - The distance at which objects have maximum opacity (default: 20.0)
 * @param depthFactor - Controls how much extra opacity is added for depth perception (default: 0.3)
 */
export const fadeOnBeforeCompile = (
  shader: { fragmentShader: string },
  fadeDistance: number = 200.0,
  easingFactor: number = 0.93,
  nearDistance: number = 10.0,
  depthFactor: number = 0.3
) => {
  // Convert parameters to strings to ensure they're properly inserted in the shader
  const fadeDistStr = fadeDistance.toFixed(1);
  const easingFactorStr = easingFactor.toFixed(2);
  const nearDistStr = nearDistance.toFixed(1);
  const depthFactorStr = depthFactor.toFixed(2);

  shader.fragmentShader = shader.fragmentShader
    .replace(
      `#include <common>`,
      `#include <common>
  float exponentialEasing(float x, float a) {
  
    float epsilon = 0.00001;
    float min_param_a = 0.0 + epsilon;
    float max_param_a = 1.0 - epsilon;
    a = max(min_param_a, min(max_param_a, a));
    
    if (a < 0.5){
      // emphasis
      a = 2.0*(a);
      float y = pow(x, a);
      return y;
    } else {
      // de-emphasis
      a = 2.0*(a-0.5);
      float y = pow(x, 1.0/(1.0-a));
      return y;
    }
  }`
    )
    .replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
float fadeDist = ${fadeDistStr};
float nearDist = ${nearDistStr};
float dist = length(vViewPosition);

// Base fade opacity that decreases with distance
float fadeOpacity = smoothstep(fadeDist, 0.0, dist);
fadeOpacity = exponentialEasing(fadeOpacity, ${easingFactorStr});

// Enhanced depth perception - add extra opacity when very close
float depthEnhancement = smoothstep(nearDist, 0.0, dist) * ${depthFactorStr};
float finalOpacity = min(fadeOpacity + depthEnhancement, 1.0) * opacity;

vec4 diffuseColor = vec4( diffuse, finalOpacity );`
    );
};

/**
 * Applies a distance-based fade effect with flat shading
 * This version is for materials that need special output fragment handling
 *
 * @param shader - The shader to modify
 * @param fadeDistance - The distance at which objects start to fade (default: 350.0)
 * @param easingFactor - Controls the easing curve of the fade (default: 0.93)
 * @param nearDistance - The distance at which objects have maximum opacity (default: 20.0)
 * @param depthFactor - Controls how much extra opacity is added for depth perception (default: 0.3)
 */
export const fadeOnBeforeCompileFlat = (
  shader: { fragmentShader: string },
  fadeDistance: number = 10.0,
  easingFactor: number = 0.93,
  nearDistance: number = 5.0,
  depthFactor: number = 0.3
) => {
  // Apply the standard fade effect first
  fadeOnBeforeCompile(
    shader,
    fadeDistance,
    easingFactor,
    nearDistance,
    depthFactor
  );

  // Then replace the output fragment
  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <output_fragment>`,
    `gl_FragColor = diffuseColor;`
  );
};
