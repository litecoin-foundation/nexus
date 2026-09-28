import {processUniforms, Skia} from '@shopify/react-native-skia';
import type {
  SkImageFilter,
  SkRuntimeShaderBuilder,
} from '@shopify/react-native-skia';

// This filter runs in physical pixels (the caller cancels the Canvas's
// density transform). Keep the optical dimensions in points so the material
// looks the same on 1x, 2x and 3x screens.
export const glassTabBarShader = Skia.RuntimeEffect.Make(`
uniform vec4 capsule;
uniform float pixelRatio;
uniform float darken;
uniform float nativeOpacity;
uniform shader blurredImage;
uniform shader nativeImage;

vec4 backgroundAt(vec2 xy) {
  vec4 background = blurredImage.eval(xy);
  if (nativeOpacity <= 0.0) {
    return background;
  }
  // The card is already blurred and uploaded at idle. Only its position and
  // fade change during the transition; no per-frame image merge/blur pass.
  vec4 card = nativeImage.eval(xy) * nativeOpacity;
  return card + background * (1.0 - card.a);
}

vec4 main(vec2 fragCoord) {
  vec2 xy = fragCoord / pixelRatio;
  vec2 p = xy - (capsule.xy + capsule.zw * 0.5);
  float radius = capsule.w * 0.5;
  // Distance to the capsule's centre segment also gives its exact normal;
  // no finite differences or repeated multi-box SDF evaluations are needed.
  vec2 q = vec2(p.x - clamp(p.x, -capsule.z * 0.5 + radius,
                                    capsule.z * 0.5 - radius), p.y);
  float qLength = length(q);
  float sd = qLength - radius;
  float aa = 0.5 / pixelRatio;
  float coverage = 1.0 - smoothstep(-aa, aa, sd);
  if (coverage <= 0.0) {
    return vec4(0.0);
  }

  vec2 gradient = q / max(qLength, 0.0001);
  const float thickness = 8.0;
  float edge = clamp((thickness + min(sd, 0.0)) / thickness, 0.0, 1.0);
  float heightRatio = sqrt(max(0.0, 1.0 - edge * edge));
  vec3 normal = vec3(gradient * edge, heightRatio);
  vec3 incident = vec3(0.0, 0.0, -1.0);
  vec3 refracted = refract(incident, normal, 1.0 / 1.5);
  float travel = thickness * (heightRatio + 8.0) / max(-refracted.z, 0.001);
  vec2 samplePoint = (xy + refracted.xy * travel) * pixelRatio;
  // A small spectral separation retains liquid refraction without turning
  // fine text into the broad coloured fringes of the old 7.5-point split.
  vec2 chroma = refracted.xy * 1.25 * pixelRatio;
  vec4 red = backgroundAt(samplePoint - chroma);
  vec4 green = backgroundAt(samplePoint);
  vec4 blue = backgroundAt(samplePoint + chroma);
  // Backdrop samples are premultiplied. Complete partially transparent
  // samples with the sheet colour, including during card transitions.
  vec3 color = vec3(red.r, green.g, blue.b)
             + vec3(0.965) * (1.0 - vec3(red.a, green.a, blue.a));
  color = mix(color, vec3(1.0), 0.18) * darken;

  float depth = max(-sd, 0.0);
  color *= mix(0.90, 1.0, smoothstep(0.0, 10.0, depth));
  // The white hairline is drawn with the same gradient as Send/Receive.
  // Keep only a soft interior sheen here, bright along both flat edges and
  // fading toward the cap equators, so there is no second competing rim.
  float light = gradient.y * gradient.y;
  float sheen = exp(-depth / 2.5);
  color = mix(color, vec3(1.0), sheen * 0.035 * light);

  // Transparent outside the lens: no rectangular passthrough can resample
  // the list or expose a crop boundary as a horizontal hairline.
  return vec4(color * coverage, coverage);
}
`)!;

export const makeGlassTabBarFilter = (
  builder: SkRuntimeShaderBuilder,
  blurChild: SkImageFilter,
  capsule: number[],
  pixelRatio: number,
  darken: number,
  nativeImage: SkImageFilter,
  nativeOpacity: number,
): SkImageFilter => {
  'worklet';
  processUniforms(
    glassTabBarShader,
    {capsule, pixelRatio, darken, nativeOpacity},
    builder,
  );
  // Refraction reaches ~72 points beyond an output pixel at the rim. Tell
  // Skia to retain that input (the old filter declared a zero sample radius).
  const filter = Skia.ImageFilter.MakeRuntimeShaderWithChildren(
    builder,
    80 * pixelRatio,
    ['blurredImage', 'nativeImage'],
    [blurChild, nativeImage],
  );
  // Crop only the OUTPUT; Skia obtains the padded input through sampleRadius.
  // One physical pixel includes the entire antialiased silhouette.
  return Skia.ImageFilter.MakeCrop(
    Skia.XYWHRect(
      capsule[0] * pixelRatio - 1,
      capsule[1] * pixelRatio - 1,
      capsule[2] * pixelRatio + 2,
      capsule[3] * pixelRatio + 2,
    ),
    null,
    filter,
  );
};
