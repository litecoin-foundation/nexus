import {processUniforms, Skia} from '@shopify/react-native-skia';
import type {
  SkImageFilter,
  SkRuntimeShaderBuilder,
} from '@shopify/react-native-skia';

// Multi-box liquid glass filter for the main screen.
export const glassTabShader = Skia.RuntimeEffect.Make(`
uniform vec4 b0;
uniform vec4 b1;
uniform vec4 b2;
uniform float cornerR;
uniform float darken;
uniform shader image;
uniform shader blurredImage;

float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

float sdButton(vec2 xy, vec4 box) {
  vec2 center = box.xy + box.zw * 0.5;
  return sdRoundedBox(xy - center, box.zw * 0.5, vec4(cornerR));
}

float sdf(vec2 xy) {
  float d = sdButton(xy, b0);
  d = min(d, sdButton(xy, b1));
  d = min(d, sdButton(xy, b2));
  return d;
}

vec2 calculateGradient(vec2 p) {
  const float epsilon = 1.0;
  float dx = sdf(p + vec2(epsilon, 0.0)) - sdf(p - vec2(epsilon, 0.0));
  float dy = sdf(p + vec2(0.0, epsilon)) - sdf(p - vec2(0.0, epsilon));
  return vec2(dx, dy) / (2.0 * epsilon);
}

vec3 getNormal(float sd, vec2 gradient, float thickness) {
  float dx = gradient.x;
  float dy = gradient.y;
  float n_cos = max(thickness + sd, 0.0) / thickness;
  float n_sin = sqrt(1.0 - n_cos * n_cos);
  return normalize(vec3(dx * n_cos, dy * n_cos, n_sin));
}

float height(float sd, float thickness) {
  if (sd >= 0.0)       return 0.0;
  if (sd < -thickness) return thickness;
  float x = thickness + sd;
  return sqrt(thickness * thickness - x * x);
}

vec4 calculateLiquidGlass(float sd, vec2 g, vec2 fragCoord) {
  // Chromatic aberration is in pixel units so the fringe doesn't scale
  // with the canvas size.
  float thickness       = 9.0;
  float transmission    = 0.9;
  float ior             = 1.5;
  float caPixels        = 7.5;
  float distortionScale = 1.0;

  vec3 normal   = getNormal(sd, g * distortionScale, thickness);
  vec3 incident = vec3(0.0, 0.0, -1.0);

  float fresnel = pow(1.0 - abs(dot(incident, normal)), 3.0);

  vec3  refract_vec    = refract(incident, normal, 1.0 / ior);
  float h              = height(sd, thickness);
  float base_height    = thickness * 8.0;
  float refract_length = (h + base_height) / dot(vec3(0.0, 0.0, -1.0), refract_vec);

  vec2 base_coord = fragCoord + refract_vec.xy * refract_length;
  vec2 offsetPx   = refract_vec.xy * caPixels;

  float rv = blurredImage.eval(base_coord - offsetPx).r;
  float gv = blurredImage.eval(base_coord).g;
  float bv = blurredImage.eval(base_coord + offsetPx).b;
  vec4 refract_color = vec4(rv, gv, bv, 1.0);

  vec3 reflect_vec   = reflect(incident, normal);
  float spec = pow(clamp(abs(reflect_vec.x - reflect_vec.y), 0.0, 1.0), 2.0);
  vec4 reflect_color = vec4(spec, spec, spec, 0.0);

  vec4 glass_color = mix(refract_color, reflect_color,
                         fresnel * (1.0 - transmission));

  // Slight white lift on the glass body.
  glass_color = mix(glass_color, vec4(1.0, 1.0, 1.0, 1.0), 0.10);

  float shadowWidth = 14.0;
  float edgeDist = clamp(-sd / shadowWidth, 0.0, 1.0);
  glass_color.rgb *= mix(0.88, 1.0, smoothstep(0.0, 1.0, edgeDist));

  // 1.0 = clear glass, lower = darker glass.
  glass_color.rgb *= darken;

  return glass_color;
}

vec4 render(vec2 xy) {
  float d = sdf(xy);
  vec2  g = calculateGradient(xy);
  if (d > 0.0) {
    return image.eval(xy);
  } else {
    return calculateLiquidGlass(d, g, xy);
  }
}

vec4 main(vec2 fragCoord) {
  // The filter covers the whole canvas, so bail out cheaply away from the
  // buttons and only supersample the anti-aliased rim.
  float dc = sdf(fragCoord);
  if (dc > 1.5) {
    return image.eval(fragCoord);
  }
  if (dc < -1.5) {
    vec2 g = calculateGradient(fragCoord);
    return calculateLiquidGlass(dc, g, fragCoord);
  }
  const int samples = 4;
  float sampleStrength = 1.0 / float(samples * samples);
  vec4 finalColor = vec4(0.0);
  for (int m = 0; m < samples; m++) {
    for (int n = 0; n < samples; n++) {
      vec2 off = vec2(float(m), float(n)) / float(samples)
               - 0.5 / float(samples);
      finalColor += render(fragCoord + off) * sampleStrength;
    }
  }
  return finalColor;
}
`)!;

// Caller hoists the builder and blur child.
export const makeGlassTabFilter = (
  builder: SkRuntimeShaderBuilder,
  blurChild: SkImageFilter,
  boxes: number[][],
  cornerR: number,
  darken: number,
): SkImageFilter => {
  'worklet';
  processUniforms(
    glassTabShader,
    {b0: boxes[0], b1: boxes[1], b2: boxes[2], cornerR, darken},
    builder,
  );
  return Skia.ImageFilter.MakeRuntimeShaderWithChildren(
    builder,
    0,
    ['blurredImage'],
    [blurChild],
  )!;
};
