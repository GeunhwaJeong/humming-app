// Humming: compact on-chain subscription button for the profile header
// action row. The full card below the bio is ProfileSubscribeCard.
import {type AppBskyActorDefs} from '@atproto/api'

import {useSession} from '#/state/session'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Star_Stroke2_Corner0_Rounded as Star} from '#/components/icons/Star'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {formatHaneul} from './api'
import {useCreatorInfo, useSubscribeMutation} from './hooks'

export function HummingSubscribeButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(profile.did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(profile.did)

  const isMe = currentAccount?.did === profile.did
  if (!data?.tier || isMe) return null

  const {tier, viewer} = data
  const monthly = `${formatHaneul(tier.price)} / ${Math.round(tier.periodMs / 86_400_000)}일`

  if (viewer.subscribed) {
    return (
      <Button
        testID="hummingSubscribedBtn"
        size="small"
        color="secondary"
        label={`구독 중 — ${monthly}`}
        onPress={() => {
          const until = viewer.expiresMs
            ? new Date(viewer.expiresMs).toLocaleDateString('ko-KR')
            : '?'
          Toast.show(`구독 중이에요. ${until}까지 유효 (온체인 판정)`)
        }}>
        <ButtonIcon icon={Star} />
        <ButtonText>구독 중</ButtonText>
      </Button>
    )
  }

  return (
    <>
      <Button
        testID="hummingSubscribeBtn"
        size="small"
        color="primary"
        disabled={isPending}
        label={`구독 — ${monthly}`}
        onPress={() => promptControl.open()}>
        <ButtonIcon icon={Star} />
        <ButtonText>{isPending ? '결제 중…' : `구독 ${monthly}`}</ButtonText>
      </Button>
      <Prompt.Basic
        control={promptControl}
        title={`@${profile.handle} 구독`}
        description={`${monthly} 요금이 내 Haneul 지갑에서 결제됩니다. 플랫폼 수수료를 제외한 전액이 크리에이터에게 온체인으로 즉시 정산되고, 구독 기간 판정도 체인이 합니다.`}
        onConfirm={() => subscribe()}
        confirmButtonCta="온체인 결제"
      />
    </>
  )
}
