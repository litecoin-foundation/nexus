import React from 'react';
import Svg, {Defs, Ellipse, G, Mask, Path, Rect} from 'react-native-svg';

const MOUTH = {cx: 131.5, cy: 72, rotation: 49};

interface Props {
  color?: string;
  style?: any;
}

const MegaphoneArt: React.FC<Props> = props => {
  const {color = '#ffffff', style} = props;

  return (
    <Svg viewBox="-19 0 248 269" width="100%" height="100%" style={style}>
      <Defs>
        <Mask
          id="megaphoneMouth"
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={200}
          height={200}>
          <Rect x={0} y={0} width={200} height={200} fill="#ffffff" />
          <Ellipse
            cx={MOUTH.cx}
            cy={MOUTH.cy}
            rx={31}
            ry={8.5}
            rotation={MOUTH.rotation}
            originX={MOUTH.cx}
            originY={MOUTH.cy}
            fill="#000000"
          />
        </Mask>
      </Defs>

      <G fill={color}>
        {/* Grip, tucked under the cone and on the viewBox's centre line so
            it lands on the screen's own centre */}
        <Path
          d="M105 129L105 171"
          stroke={color}
          strokeWidth={21}
          strokeLinecap="round"
          fill="none"
        />

        <G mask="url(#megaphoneMouth)">
          <Path
            d="M103.5 40L39.5 137L55.5 155L159.5 104Z"
            stroke={color}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          <Ellipse
            cx={MOUTH.cx}
            cy={MOUTH.cy}
            rx={42}
            ry={15}
            rotation={MOUTH.rotation}
            originX={MOUTH.cx}
            originY={MOUTH.cy}
          />
        </G>

        <Path
          d="M140.5 33A40 40 0 0 1 171.5 68"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M144.5 18A56 56 0 0 1 187.5 66"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};

export default React.memo(MegaphoneArt);
