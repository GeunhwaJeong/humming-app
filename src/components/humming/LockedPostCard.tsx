// Humming: rendered in place of a gated post body — lock glyph, teaser
// copy, and a full-width subscribe CTA that settles on the Haneul chain.
import {View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {formatHaneul} from './api'
import {formatTier, hummingLockOf, useSubscribeMutation} from './hooks'

export function LockedPostCard({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const lock = hummingLockOf(post)
  const promptControl = Prompt.usePromptControl()
  const {mutate: subscribe, isPending} = useSubscribeMutation(post.author.did)

  if (!lock) return null

  const purchaseNote =
    lock.reason === 'paywall' && lock.priceGeunhwa
      ? ` · 단건 구매 ${formatHaneul(lock.priceGeunhwa)}`
      : ''

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
        구독자 전용 게시물입니다
      </Text>
      <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_medium]}>
        열람 자격은 Haneul 온체인 구독 상태로 판정됩니다{purchaseNote}
      </Text>
      {lock.tier && (
        <>
          <Button
            testID="hummingLockedSubscribeBtn"
            size="large"
            color="primary"
            disabled={isPending}
            style={[a.self_stretch, a.mt_xs]}
            label={`구독하고 게시물 보기 — ${formatTier(lock.tier)}`}
            onPress={e => {
              e.preventDefault()
              e.stopPropagation()
              promptControl.open()
            }}>
            <ButtonText>
              {isPending
                ? '온체인 결제 중…'
                : `구독하고 게시물 보기 — ${formatTier(lock.tier)}`}
            </ButtonText>
          </Button>
          <Prompt.Basic
            control={promptControl}
            title={`@${post.author.handle} 구독`}
            description={`${formatTier(lock.tier)} 요금이 내 Haneul 지갑에서 결제됩니다. 플랫폼 수수료를 제외한 전액이 크리에이터에게 온체인으로 즉시 정산됩니다.`}
            onConfirm={() => subscribe()}
            confirmButtonCta="온체인 결제"
          />
        </>
      )}
    </View>
  )
}
