// Copyright (c) 2023-2026 Bluesky Social PBC
// Modifications Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {
  HUM_ARC_INNER,
  HUM_ARC_MIDDLE,
  HUM_ARC_OUTER,
  HUM_ARC_STROKE,
  HUM_ARC_VIEWBOX,
} from '#/view/icons/Logo'

const ratio = 54 / 61

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)
  const stroke = fill || pal.text.color

  return (
    <Svg
      fill="none"
      viewBox={HUM_ARC_VIEWBOX}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path
        stroke={stroke}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        d={HUM_ARC_INNER}
      />
      <Path
        stroke={stroke}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        opacity={0.55}
        d={HUM_ARC_MIDDLE}
      />
      <Path
        stroke={stroke}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        d={HUM_ARC_OUTER}
      />
    </Svg>
  )
}
