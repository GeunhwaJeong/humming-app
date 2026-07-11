// Humming: full-width subscription card under the profile header —
// tier price, on-chain subscribe CTA, post stats, locked-profile notice.
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'

import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatHaneul} from './api'
import {useCreatorInfo, useSubscribeMutation} from './hooks'

export function ProfileSubscribeCard({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(profile.did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(profile.did)

  const isMe = currentAccount?.did === profile.did
  if (isMe || !data?.tier) return null

  const {tier, viewer, profileLocked, stats} = data
  const monthly = `${formatHaneul(tier.price)} / ${Math.round(tier.periodMs / 86_400_000)}일`

  return (
    <View
      testID="hummingProfileSubscribeCard"
      style={[
        a.border,
        a.rounded_md,
        a.gap_sm,
        a.p_md,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
        구독
      </Text>
      {viewer.subscribed ? (
        <Button
          testID="hummingProfileSubscribedBtn"
          size="large"
          color="secondary"
          disabled
          style={[a.self_stretch]}
          label={`구독 중 — ${monthly}`}>
          <ButtonText>
            구독 중 ✓
            {viewer.expiresMs
              ? ` · ${new Date(viewer.expiresMs).toLocaleDateString('ko-KR')}까지`
              : ''}
          </ButtonText>
        </Button>
      ) : (
        <>
          <Button
            testID="hummingProfileSubscribeBtn"
            size="large"
            color="primary"
            disabled={isPending}
            style={[a.self_stretch]}
            label={`구독하기 — ${monthly}`}
            onPress={() => promptControl.open()}>
            <ButtonText>
              {isPending ? '온체인 결제 중…' : `구독하기 — ${monthly}`}
            </ButtonText>
          </Button>
          <Prompt.Basic
            control={promptControl}
            title={`@${profile.handle} 구독`}
            description={`${monthly} 요금이 내 Haneul 지갑에서 결제됩니다. 플랫폼 수수료를 제외한 전액이 크리에이터에게 온체인으로 즉시 정산되고, 구독 기간 판정도 체인이 합니다.`}
            onConfirm={() => subscribe()}
            confirmButtonCta="온체인 결제"
          />
        </>
      )}
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        {profileLocked && !viewer.subscribed && (
          <Lock size="xs" style={t.atoms.text_contrast_low} />
        )}
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          게시물 {stats?.posts ?? 0}개
          {stats?.images ? ` · 🖼 ${stats.images}` : ''}
          {stats?.videos ? ` · 🎬 ${stats.videos}` : ''}
          {profileLocked && !viewer.subscribed
            ? ' · 전부 구독자에게만 공개됩니다'
            : ''}
        </Text>
      </View>
    </View>
  )
}
