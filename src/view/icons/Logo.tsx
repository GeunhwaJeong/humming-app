import {forwardRef} from 'react'
import {type TextProps} from 'react-native'
import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'
import {Image} from 'expo-image'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {flatten, useTheme} from '#/alf'

const ratio = 57 / 64

// Humming "hum arcs" mark — three arcs radiating from the bottom-right corner.
// Geometry from humming-brand/humming-mark.svg; the viewBox is tightened to the
// stroked bounds so the mark fills its box edge-to-edge like the old glyph.
export const HUM_ARC_VIEWBOX = '59 59 393 393'
export const HUM_ARC_INNER = 'M288 423A130 130 0 0 1 423 288'
export const HUM_ARC_MIDDLE = 'M192 378A230 230 0 0 1 398 189'
export const HUM_ARC_OUTER = 'M88 418A330 330 0 0 1 418 88'
export const HUM_ARC_STROKE = 58
// Brand colors: Haneul Sky / Mist
export const HUM_SKY = '#2E8FE0'
export const HUM_MIST = '#8CC9F5'

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {fill, ...rest} = props
  // `sky` renders the official two-tone mark; anything else is monochrome
  // with the middle arc at 55% opacity (brand mono treatment).
  const twoTone = fill === 'sky'
  const styles = flatten(props.style)
  const _fill = twoTone
    ? HUM_SKY
    : fill || styles?.color || t.palette.primary_500
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  const isKawaii = useKawaiiMode()

  if (isKawaii) {
    return (
      <Image
        source={
          size > 100
            ? require('../../../assets/kawaii.png')
            : require('../../../assets/kawaii_smol.png')
        }
        accessibilityLabel="Humming"
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        style={[{height: size, aspectRatio: 1.4}]}
      />
    )
  }

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox={HUM_ARC_VIEWBOX}
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      <Path
        stroke={_fill}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        d={HUM_ARC_INNER}
      />
      <Path
        stroke={twoTone ? HUM_MIST : _fill}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        opacity={twoTone ? 1 : 0.55}
        d={HUM_ARC_MIDDLE}
      />
      <Path
        stroke={_fill}
        strokeWidth={HUM_ARC_STROKE}
        strokeLinecap="round"
        d={HUM_ARC_OUTER}
      />
    </Svg>
  )
})
