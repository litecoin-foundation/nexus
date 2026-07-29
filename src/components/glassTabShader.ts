import {processUniforms, Skia, TileMode} from '@shopify/react-native-skia';
import type {
  SkImageFilter,
  SkRuntimeShaderBuilder,
} from '@shopify/react-native-skia';

// Multi-box liquid glass filter for the main screen.
export const glassTabShader = Skia.RuntimeEffect.Make(`
uniform vec4 b0;
uniform vec4 b1;
uniform vec4 b2;
uniform vec4 b3;
uniform float cornerR;
uniform float darken;
uniform float splitProgress;
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
  vec2 halfSize = max(box.zw * 0.5, vec2(0.001));
  float radius = min(cornerR, min(halfSize.x, halfSize.y));
  return sdRoundedBox(xy - center, halfSize, vec4(radius));
}

// Polynomial smooth union from the reference implementation. It gives the
// emerging control a soft liquid neck while it is still touching Trade.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(a, b, h) - k * h * (1.0 - h);
}

float sdf(vec2 xy) {
  float trade = sdButton(xy, b0);
  float d = trade;

  // A negative value selects the ordinary multi-box mode used by the bottom
  // tab bar. Values from zero to one are the Trade split lifecycle.
  if (splitProgress < 0.0) {
    d = min(d, sdButton(xy, b1));
  }

  // Like the example's collapsing circle, Sell has no geometry at progress
  // zero. It blooms from Trade's edge, smooth-unions with it, then separates
  // as the union radius tightens and the final gap opens.
  if (splitProgress > 0.001) {
    float birth = smoothstep(0.0, 0.30, splitProgress);
    vec4 emerging = b1;
    float emergingHeight = max(0.001, b1.w * birth);
    emerging.y += (b1.w - emergingHeight) * 0.5;
    emerging.w = emergingHeight;
    float sell = sdButton(xy, emerging);
    float unionRadius = mix(18.0, 3.0, smoothstep(0.30, 1.0, splitProgress));
    d = smin(trade, sell, unionRadius);
  }

  d = min(d, sdButton(xy, b2));
  d = min(d, sdButton(xy, b3));
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

const CROP_PAD = 120;

// Caller hoists the builder and blur child.
export const makeGlassTabFilter = (
  builder: SkRuntimeShaderBuilder,
  blurChild: SkImageFilter,
  boxes: number[][],
  cornerR: number,
  darken: number,
  splitProgress = -1,
): SkImageFilter => {
  'worklet';
  processUniforms(
    glassTabShader,
    {
      b0: boxes[0],
      b1: boxes[1],
      b2: boxes[2],
      b3: boxes[3] ?? boxes[0],
      cornerR,
      darken,
      splitProgress,
    },
    builder,
  );
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const box of boxes) {
    minX = Math.min(minX, box[0]);
    minY = Math.min(minY, box[1]);
    maxX = Math.max(maxX, box[0] + box[2]);
    maxY = Math.max(maxY, box[1] + box[3]);
  }
  const crop = Skia.XYWHRect(
    minX - CROP_PAD,
    minY - CROP_PAD,
    maxX - minX + 2 * CROP_PAD,
    maxY - minY + 2 * CROP_PAD,
  );
  return Skia.ImageFilter.MakeCrop(
    crop,
    null,
    Skia.ImageFilter.MakeRuntimeShaderWithChildren(
      builder,
      0,
      ['blurredImage'],
      // clamp so a sample just past the pad replicates edge pixels instead
      // of fading to transparent
      [Skia.ImageFilter.MakeCrop(crop, TileMode.Clamp, blurChild)],
    )!,
  )!;
};
