// Adapted from react-native-fast-confetti
// https://github.com/AlirezaHadjar/react-native-fast-confetti
// MIT LICENSE
// Copyright (c) 2024 Alireza Hadjar

export type FlakeSize = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type ConfettiProps = {
  /**
   * @description number of confetti pieces to render.
   * @default 200
   */
  count?: number;
  /**
   * @description the size confetti's flake.
   */
  flakeSize?: FlakeSize;
  /**
   * @description The width of the confetti's container.
   * @default SCREEN_WIDTH
   */
  width?: number;
  /**
   * @description The height of the confetti's container.
   * @default SCREEN_HEIGHT
   */
  height?: number;
  /**
   * @description The duration of confetti falling down (milliseconds).
   * @default 8000
   */
  fallDuration?: number;
  /**
   * @description The duration of confetti blast (milliseconds).
   * @default 300
   */
  blastDuration?: number;
  /**
   * @description Wether the animation should play on mount.
   * @default true
   */
  autoplay?: boolean;
  /**
   * @description Wether the animation should play again after it ends.
   * @default true
   */
  isInfinite?: boolean;
  /**
   * @description The array of confetti flakes color.
   */
  colors?: string[];
  /**
   * @description The delay in milliseconds before the confetti animation starts automatically after initialization.
   * @default 0
   */
  autoStartDelay?: number;
  /**
   * @description Should the confetti flakes fade out as they reach the bottom.
   */
  fadeOutOnEnd?: boolean;
  /**
   * @description The approximate space between confetti flakes vertically. Lower value results in denser confetti.
   * @default 30
   */
  verticalSpacing?: number;
  /**
   * @description A callback that is called when the falling animation starts.
   */
  onAnimationStart?: () => void;
  /**
   * @description A callback that is called when the falling animation starts.
   */
  onAnimationEnd?: () => void;
  /**
   * @description An array of positions from which confetti flakes should blast.
   */
  cannonsPositions?: Position[];
  /**
   * @description Controls the random size variation of confetti flakes. Value between 0 and 1.
   * A value of 0.1 means flakes can vary up to 10% smaller than the base size, with more flakes
   * clustering towards the original size and fewer towards the minimum size.
   * Recommended value is between 0 and 0.5
   * @default 0
   */
  sizeVariation?: number;
  /**
   * @description The range of the radius of the confetti flakes.
   * A tuple of [min, max] values from which a random radius will be selected for each flake.
   * @default '[0, 0]'
   */
  radiusRange?: [number, number];
};

export type PIConfettiProps = Omit<
  ConfettiProps,
  'autoPlay' | 'verticalSpacing' | 'autoStartDelay' | 'cannonsPositions'
> & {
  /**
   * @description The position from which confetti flakes should blast.
   * @default { x: containerWidth / 2, y: 150 }
   */
  blastPosition?: Position;
  /**
   * @description The radius of the blast.
   * @default 180
   */
  blastRadius?: number;
};

export type ConfettiMethods = {
  /**
   * @description start the animation from the beginning
   */
  restart: () => void;
  /**
   * @description pause the animation
   */
  pause: () => void;
  /**
   * @description reset the animation and not play it
   */
  reset: () => void;
  /**
   * @description resume the animation from where it paused
   */
  resume: () => void;
};
