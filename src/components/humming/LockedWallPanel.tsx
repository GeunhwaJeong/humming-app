// Humming: the locked "wall" shown in place of a fully locked profile's
// feed — a large lock glyph over a muted area, an aggregate stats bar,
// and a full-width subscribe CTA. Mirrors the classic paysite layout.
import {View} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatTier, useCreatorInfo, useSubscribeMutation} from './hooks'

export function LockedWallPanel({did}: {did: string}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  // 우리 정체성 체계에서 did:web:<handle> — 표기용 핸들은 DID에서 유도
  const handle = did.startsWith('did:web:') ? did.slice('did:web:'.length) : did
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(did)

  if (!data?.tier) return null
  const {tier, stats} = data
  const monthly = formatTier(i18n, {
    priceGeunhwa: tier.price,
    periodMs: tier.periodMs,
  })

  return (
    <View testID="hummingLockedWallPanel" style={[a.w_full, a.px_lg, a.py_lg]}>
      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.align_center,
          a.justify_center,
          {minHeight: 340},
          t.atoms.bg_contrast_25,
        ]}>
        <Lock size="2xl" style={t.atoms.text_contrast_low} />
      </View>
      <View
        style={[
          a.w_full,
          a.border,
          a.rounded_md,
          a.gap_sm,
          a.p_md,
          a.mt_md,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {i18n._(
              plural(stats?.posts ?? 0, {one: '# post', other: '# posts'}),
            )}
            {stats?.images ? ` · 🖼 ${stats.images}` : ''}
            {stats?.videos ? ` · 🎬 ${stats.videos}` : ''}
          </Text>
          <Lock size="xs" style={t.atoms.text_contrast_low} />
        </View>
        <Button
          testID="hummingWallSubscribeBtn"
          size="large"
          color="primary"
          disabled={isPending}
          style={[a.self_stretch]}
          label={_(msg`Subscribe to see their posts · ${monthly}`)}
          onPress={() => promptControl.open()}>
          <ButtonText>
            {isPending ? (
              <Trans>Paying on-chain…</Trans>
            ) : (
              <Trans>Subscribe to see their posts · {monthly}</Trans>
            )}
          </ButtonText>
        </Button>
      </View>
      <Prompt.Basic
        control={promptControl}
        title={_(msg`Subscribe to @${handle}`)}
        description={_(
          msg`${monthly} will be charged from your wallet. Everything except the platform fee settles to the creator instantly on-chain.`,
        )}
        onConfirm={() => subscribe()}
        confirmButtonCta={_(msg`Pay on-chain`)}
      />
    </View>
  )
}
