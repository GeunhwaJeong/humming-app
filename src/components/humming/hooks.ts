// Humming: shared creator-info query + subscribe mutation, used by the
// profile header button, the profile subscribe card, and locked post cards.
import {type AppBskyFeedDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {formatHaneul, getCreatorInfo, subscribeToCreator} from './api'

export function useCreatorInfo(did: string) {
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  return useQuery({
    queryKey: ['humming-creator', did],
    queryFn: () => getCreatorInfo(agent, did),
    enabled: hasSession && currentAccount?.did !== did,
  })
}

export function useSubscribeMutation(did: string) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscribeToCreator(agent, did),
    onSuccess: res => {
      Toast.show(
        `구독 완료! 온체인 tx: ${res.digest.slice(0, 8)}… (${formatHaneul(res.priceGeunhwa)})`,
        {type: 'success'},
      )
      // 구독 즉시 잠긴 게시물이 열리므로 피드/프로필 전체 재조회
      void queryClient.invalidateQueries()
    },
    onError: e => {
      Toast.show(`구독 실패: ${String(e)}`, {type: 'error'})
    },
  })
}

/** 파사드가 게이팅된 게시물에 붙이는 구조화 잠금 마커 (post.humming). */
export interface HummingLock {
  locked: boolean
  reason: 'paywall' | 'profile'
  priceGeunhwa: number | null
  tier: {priceGeunhwa: number; periodMs: number} | null
}

export function hummingLockOf(
  post: AppBskyFeedDefs.PostView,
): HummingLock | undefined {
  const lock = (post as {humming?: HummingLock}).humming
  return lock?.locked ? lock : undefined
}

export function formatTier(tier: {
  priceGeunhwa: number
  periodMs: number
}): string {
  return `${formatHaneul(tier.priceGeunhwa)} / ${Math.round(tier.periodMs / 86_400_000)}일`
}
