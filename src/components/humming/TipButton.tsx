// Humming: on-chain tip button in the post controls row.
// Fixed demo amount; the transfer settles on the Haneul chain with the
// platform fee split applied by the contract.
import {type AppBskyFeedDefs} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {type Shadow} from '#/state/cache/types'
import {useAgent, useSession} from '#/state/session'
import {Gift1_Stroke2_Corner0_Rounded as Gift} from '#/components/icons/Gift1'
import {
  PostControlButton,
  PostControlButtonIcon,
} from '#/components/PostControls/PostControlButton'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {formatHaneul, GEUNHWA_PER_HANEUL, tipCreator} from './api'

const TIP_GEUNHWA = GEUNHWA_PER_HANEUL / 10 // 0.1 HANEUL

export function HummingTipButton({
  post,
  big,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
}) {
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()

  const {mutate: tip, isPending} = useMutation({
    mutationFn: () => tipCreator(agent, post.author.did, TIP_GEUNHWA),
    onSuccess: res => {
      Toast.show(
        `팁 전송 완료! ${formatHaneul(res.amountGeunhwa)} → @${post.author.handle} (tx: ${res.digest.slice(0, 8)}…)`,
        {type: 'success'},
      )
    },
    onError: e => {
      Toast.show(`팁 실패: ${String(e)}`, {type: 'error'})
    },
  })

  if (!hasSession || currentAccount?.did === post.author.did) return null

  return (
    <>
      <PostControlButton
        testID="hummingTipBtn"
        big={big}
        disabled={isPending}
        onPress={() => promptControl.open()}
        label={`@${post.author.handle}에게 ${formatHaneul(TIP_GEUNHWA)} 팁 보내기`}>
        <PostControlButtonIcon icon={Gift} />
      </PostControlButton>
      <Prompt.Basic
        control={promptControl}
        title={`@${post.author.handle}에게 팁 보내기`}
        description={`${formatHaneul(TIP_GEUNHWA)}이 내 Haneul 지갑에서 크리에이터 지갑으로 온체인 전송됩니다 (플랫폼 수수료 자동 공제).`}
        onConfirm={() => tip()}
        confirmButtonCta="팁 보내기"
      />
    </>
  )
}
