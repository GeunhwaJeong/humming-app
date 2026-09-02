// Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

// Humming: rendered in place of a gated post body — lock glyph, teaser
// copy, and a full-width subscribe CTA that settles on-chain.
import {View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatHaneul} from './api'
import {
  formatTier,
  hummingLockOf,
  usePurchaseMutation,
  useSubscribeMutation,
} from './hooks'

export function LockedPostCard({post}: {post: AppBskyFeedDefs.PostView}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const lock = hummingLockOf(post)
  const promptControl = Prompt.usePromptControl()
  const purchasePromptControl = Prompt.usePromptControl()
  const {mutate: subscribe, isPending} = useSubscribeMutation(post.author.did)
  const {mutate: purchase, isPending: isPurchasing} = usePurchaseMutation(
    post.uri,
  )

  if (!lock) return null

  const purchasable = lock.reason === 'paywall' && !!lock.priceGeunhwa
  const tierLabel = lock.tier ? formatTier(i18n, lock.tier) : ''
  const price = lock.priceGeunhwa ? formatHaneul(lock.priceGeunhwa) : ''

  return (
    <View
      testID="hummingLockedPostCard"
      style={[
        a.border,
        a.rounded_md,
        a.align_center,
        a.gap_sm,
        a.py_xl,
        a.px_lg,
        a.mb_xs,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <Lock size="xl" style={t.atoms.text_contrast_low} />
      <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
        <Trans>Subscribers-only post</Trans>
      </Text>
      {!!(lock.media?.images || lock.media?.videos) && (
        <Text
          testID="hummingMediaTeaser"
          style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {[
            lock.media.images
              ? `🖼 ${i18n._(plural(lock.media.images, {one: '# photo', other: '# photos'}))}`
              : null,
            lock.media.videos
              ? `🎬 ${i18n._(plural(lock.media.videos, {one: '# video', other: '# videos'}))}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}
      <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_medium]}>
        <Trans>
          Access is verified by your on-chain subscription and purchase state
        </Trans>
      </Text>
      {lock.tier && (
        <>
          <Button
            testID="hummingLockedSubscribeBtn"
            size="large"
            color="primary"
            disabled={isPending}
            style={[a.self_stretch, a.mt_xs]}
            label={_(msg`Subscribe to view · ${tierLabel}`)}
            onPress={e => {
              e.preventDefault()
              e.stopPropagation()
              promptControl.open()
            }}>
            <ButtonText>
              {isPending ? (
                <Trans>Paying on-chain…</Trans>
              ) : (
                <Trans>Subscribe to view · {tierLabel}</Trans>
              )}
            </ButtonText>
          </Button>
          <Prompt.Basic
            control={promptControl}
            title={_(msg`Subscribe to @${post.author.handle}`)}
            description={_(
              msg`${tierLabel} will be charged from your wallet. Everything except the platform fee settles to the creator instantly on-chain.`,
            )}
            onConfirm={() => subscribe()}
            confirmButtonCta={_(msg`Pay on-chain`)}
          />
        </>
      )}
      {purchasable && (
        <>
          <Button
            testID="hummingPurchaseBtn"
            size="large"
            color="secondary"
            disabled={isPurchasing}
            style={[a.self_stretch]}
            label={_(msg`Buy this post only · ${price}`)}
            onPress={e => {
              e.preventDefault()
              e.stopPropagation()
              purchasePromptControl.open()
            }}>
            <ButtonText>
              {isPurchasing ? (
                <Trans>Paying on-chain…</Trans>
              ) : (
                <Trans>Buy this post only · {price}</Trans>
              )}
            </ButtonText>
          </Button>
          <Prompt.Basic
            control={purchasePromptControl}
            title={_(msg`Buy this post`)}
            description={_(
              msg`${price} will be charged from your wallet and this post stays unlocked for you permanently, no subscription needed. The purchase is recorded on-chain.`,
            )}
            onConfirm={() => purchase()}
            confirmButtonCta={_(msg`Pay on-chain`)}
          />
        </>
      )}
    </View>
  )
}
