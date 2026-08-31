// Humming: on-chain tip button in the post controls row.
// Fixed demo amount; the transfer settles on-chain with the
// platform fee split applied by the contract.
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {type Shadow} from '#/state/cache/types'
import {useAgent, useSession} from '#/state/session'
import {Gift1_Stroke2_Corner0_Rounded as Gift} from '#/components/icons/Gift1'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from '#/components/PostControls/PostControlButton'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {formatHaneul, GEUNHWA_PER_HANEUL, tipCreator} from './api'
import {useSingleFlightMutation} from './hooks'

const TIP_GEUNHWA = GEUNHWA_PER_HANEUL / 10 // 0.1 HANEUL

export function HummingTipButton({
  post,
  big,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()

  const postId = /\/(\d+)$/.exec(post.uri)?.[1]
  const {mutate: tip, isPending} = useSingleFlightMutation(
    `tip:${postId ?? post.uri}`,
    {
      mutationFn: () => tipCreator(agent, post.author.did, TIP_GEUNHWA, postId),
      onSuccess: res => {
        const amount = formatHaneul(res.amountGeunhwa)
        const handle = post.author.handle
        const tx = res.digest.slice(0, 8)
        Toast.show(_(msg`Tip sent! ${amount} → @${handle} (tx: ${tx}…)`), {
          type: 'success',
        })
      },
      onError: e => {
        Toast.show(_(msg`Tip failed: ${String(e)}`), {type: 'error'})
      },
    },
  )

  if (!hasSession || currentAccount?.did === post.author.did) return null

  const tipAmount = formatHaneul(TIP_GEUNHWA)

  return (
    <>
      <PostControlButton
        testID="hummingTipBtn"
        big={big}
        disabled={isPending}
        onPress={() => promptControl.open()}
        label={_(msg`Send a ${tipAmount} tip to @${post.author.handle}`)}>
        <PostControlButtonIcon icon={Gift} />
        {big && (
          <PostControlButtonText>
            <Trans>Send tip</Trans>
          </PostControlButtonText>
        )}
      </PostControlButton>
      <Prompt.Basic
        control={promptControl}
        title={_(msg`Send a tip to @${post.author.handle}`)}
        description={_(
          msg`${tipAmount} will be sent on-chain from your wallet straight to the creator's wallet (platform fee deducted automatically).`,
        )}
        onConfirm={() => tip()}
        confirmButtonCta={_(msg`Send tip`)}
      />
    </>
  )
}
