// Humming: compact on-chain subscription button for the profile header
// action row. The full card below the bio is ProfileSubscribeCard.
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {formatTier, useCreatorInfo, useSubscribeMutation} from './hooks'

export function HummingSubscribeButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_, i18n} = useLingui()
  const {currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(profile.did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(profile.did)

  const isMe = currentAccount?.did === profile.did
  if (!data?.tier || isMe) return null

  const {tier, viewer} = data
  const monthly = formatTier(i18n, {
    priceGeunhwa: tier.price,
    periodMs: tier.periodMs,
  })

  if (viewer.subscribed) {
    return (
      <Button
        testID="hummingSubscribedBtn"
        size="small"
        color="secondary"
        label={_(msg`Subscribed — ${monthly}`)}
        onPress={() => {
          const until = viewer.expiresMs
            ? new Date(viewer.expiresMs).toLocaleDateString(i18n.locale)
            : '?'
          Toast.show(
            _(msg`Subscribed. Valid until ${until} (verified on-chain).`),
          )
        }}>
        <ButtonIcon icon={CircleCheck} />
        <ButtonText>
          <Trans>Subscribed</Trans>
        </ButtonText>
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
        label={_(msg`Subscribe — ${monthly}`)}
        onPress={() => promptControl.open()}>
        <ButtonText>
          {isPending ? (
            <Trans>Paying on-chain…</Trans>
          ) : (
            <Trans>Subscribe {monthly}</Trans>
          )}
        </ButtonText>
      </Button>
      <Prompt.Basic
        control={promptControl}
        title={_(msg`Subscribe to @${profile.handle}`)}
        description={_(
          msg`${monthly} will be charged from your Haneul wallet. Everything except the platform fee settles to the creator instantly on-chain, and the chain itself enforces the subscription period.`,
        )}
        onConfirm={() => subscribe()}
        confirmButtonCta={_(msg`Pay on-chain`)}
      />
    </>
  )
}
