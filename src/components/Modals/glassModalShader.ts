import {processUniforms, Skia, TileMode} from '@shopify/react-native-skia';
import type {
  SkImageFilter,
  SkRuntimeShaderBuilder,
} from '@shopify/react-native-skia';

// Single-box liquid glass for the transaction detail sheet. Same pipeline as
// glassTabShader, tuned thicker and milkier for a large frosted panel: the
// filter spans the whole screen, so main() keeps the cheap exits and only
// supersamples the anti-aliased rim.
export const glassModalShader = Skia.RuntimeEffect.Make(`
uniform vec4 box;
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

float sdf(vec2 xy) {
  vec2 center = box.xy + box.zw * 0.5;
  vec2 halfSize = max(box.zw * 0.5, vec2(0.001));
  float radius = min(cornerR, min(halfSize.x, halfSize.y));
  return sdRoundedBox(xy - center, halfSize, vec4(radius));
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
  // Shallow Apple-sheet glass: a narrow bevel with a gentle bend. depth is
  // the virtual distance to the content plane — keeping it small bounds the
  // rim's sample displacement to roughly thickness + depth px, so the edge
  // bends nearby content instead of dragging in far-away pixels. The body is
  // a perfectly uniform grey frost: no falloffs, rings or sheens that could
  // band a few pixels inside the edge.
  float thickness = 8.0;
  float ior       = 1.5;
  float caPixels  = 3.0;
  float depth     = 12.0;

  vec3 normal   = getNormal(sd, g, thickness);
  vec3 incident = vec3(0.0, 0.0, -1.0);

  vec3  refract_vec    = refract(incident, normal, 1.0 / ior);
  float h              = height(sd, thickness);
  float refract_length = (h + depth) / dot(vec3(0.0, 0.0, -1.0), refract_vec);

  vec2 base_coord = fragCoord + refract_vec.xy * refract_length;
  vec2 offsetPx   = refract_vec.xy * caPixels;

  float rv = blurredImage.eval(base_coord - offsetPx).r;
  float gv = blurredImage.eval(base_coord).g;
  float bv = blurredImage.eval(base_coord + offsetPx).b;
  vec4 refract_color = vec4(rv, gv, bv, 1.0);

  // Near-white frost with just a whisper of cool grey.
  vec4 glass_color = mix(refract_color, vec4(0.95, 0.953, 0.958, 1.0), 0.55);

  // 1.0 = clear glass, lower = darker glass.
  glass_color.rgb *= darken;

  return glass_color;
}

vec4 render(vec2 xy) {
  float d = sdf(xy);
  if (d > 0.0) {
    return image.eval(xy);
  } else {
    vec2 g = calculateGradient(xy);
    return calculateLiquidGlass(d, g, xy);
  }
}

vec4 main(vec2 fragCoord) {
  // The filter covers the whole canvas, so bail out cheaply away from the
  // sheet and only supersample the anti-aliased rim.
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

// bound the shader + blur passes to the card instead of the whole layer.
const CROP_PAD = 160;

// Caller hoists the builder and blur child.
export const makeGlassModalFilter = (
  builder: SkRuntimeShaderBuilder,
  blurChild: SkImageFilter,
  box: number[],
  cornerR: number,
  darken: number,
): SkImageFilter => {
  'worklet';
  processUniforms(
    glassModalShader,
    {
      box,
      cornerR,
      darken,
    },
    builder,
  );
  const crop = Skia.XYWHRect(
    box[0] - CROP_PAD,
    box[1] - CROP_PAD,
    box[2] + 2 * CROP_PAD,
    box[3] + 2 * CROP_PAD,
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
