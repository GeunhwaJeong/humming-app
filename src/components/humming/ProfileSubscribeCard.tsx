// Humming: full-width subscription card under the profile header —
// tier price, on-chain subscribe CTA, post stats, locked-profile notice.
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatTier, useCreatorInfo, useSubscribeMutation} from './hooks'

export function ProfileSubscribeCard({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const promptControl = Prompt.usePromptControl()
  const {data} = useCreatorInfo(profile.did)
  const {mutate: subscribe, isPending} = useSubscribeMutation(profile.did)

  const isMe = currentAccount?.did === profile.did
  if (isMe || !data?.tier) return null

  const {tier, viewer, profileLocked, stats} = data
  const monthly = formatTier(i18n, {
    priceGeunhwa: tier.price,
    periodMs: tier.periodMs,
  })
  const untilDate = viewer.expiresMs
    ? new Date(viewer.expiresMs).toLocaleDateString(i18n.locale)
    : null

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
        <Trans>Subscription</Trans>
      </Text>
      {viewer.subscribed ? (
        <Button
          testID="hummingProfileSubscribedBtn"
          size="large"
          color="secondary"
          disabled
          style={[a.self_stretch]}
          label={_(msg`Subscribed — ${monthly}`)}>
          <ButtonText>
            {untilDate ? (
              <Trans>Subscribed ✓ · until {untilDate}</Trans>
            ) : (
              <Trans>Subscribed ✓</Trans>
            )}
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
            label={_(msg`Subscribe — ${monthly}`)}
            onPress={() => promptControl.open()}>
            <ButtonText>
              {isPending ? (
                <Trans>Paying on-chain…</Trans>
              ) : (
                <Trans>Subscribe — {monthly}</Trans>
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
      )}
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        {profileLocked && !viewer.subscribed && (
          <Lock size="xs" style={t.atoms.text_contrast_low} />
        )}
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {i18n._(plural(stats?.posts ?? 0, {one: '# post', other: '# posts'}))}
          {stats?.images ? ` · 🖼 ${stats.images}` : ''}
          {stats?.videos ? ` · 🎬 ${stats.videos}` : ''}
          {profileLocked && !viewer.subscribed
            ? ` · ${_(msg`All posts are for subscribers only`)}`
            : ''}
        </Text>
      </View>
    </View>
  )
}
