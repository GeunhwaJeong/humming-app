// Humming: the locked "wall" shown in place of a fully locked profile's
// feed — a large lock glyph over a muted area, an aggregate stats bar,
// and a full-width subscribe CTA. Mirrors the classic paysite layout.
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatHaneul} from './api'
import {useCreatorInfo, useSubscribeMutation} from './hooks'

export function LockedWallPanel({did}: {did: string}) {
  const t = useTheme()
  // 우리 정체성 체계에서 did:web:<handle> — 표기용 핸들은 DID에서 유도
  const handle = did.startsWith('did:web:') ? did.slice('did:web:'.length) : did
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(did)

  if (!data?.tier) return null
  const {tier, stats} = data
  const monthly = `${formatHaneul(tier.price)} / ${Math.round(tier.periodMs / 86_400_000)}일`

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
            게시물 {stats?.posts ?? 0}개
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
          label={`구독하여 사용자의 게시물 보기 — ${monthly}`}
          onPress={() => promptControl.open()}>
          <ButtonText>
            {isPending
              ? '온체인 결제 중…'
              : `구독하여 사용자의 게시물 보기 — ${monthly}`}
          </ButtonText>
        </Button>
      </View>
      <Prompt.Basic
        control={promptControl}
        title={`@${handle} 구독`}
        description={`${monthly} 요금이 내 Haneul 지갑에서 결제됩니다. 플랫폼 수수료를 제외한 전액이 크리에이터에게 온체인으로 즉시 정산됩니다.`}
        onConfirm={() => subscribe()}
        confirmButtonCta="온체인 결제"
      />
    </View>
  )
}
