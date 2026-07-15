// Humming: shared creator-info query + subscribe mutation, used by the
// profile header button, the profile subscribe card, and locked post cards.
import {type AppBskyFeedDefs} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {
  becomeCreator,
  formatHaneul,
  getCreatorInfo,
  getEarnings,
  getWalletInfo,
  type LockMode,
  purchasePost,
  subscribeToCreator,
} from './api'

export function useCreatorInfo(did: string) {
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  return useQuery({
    queryKey: ['humming-creator', did],
    queryFn: () => getCreatorInfo(agent, did),
    enabled: !!did && hasSession && currentAccount?.did !== did,
  })
}

export function useSubscribeMutation(did: string) {
  const {_} = useLingui()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscribeToCreator(agent, did),
    onSuccess: res => {
      const tx = res.digest.slice(0, 8)
      const price = formatHaneul(res.priceGeunhwa)
      Toast.show(_(msg`Subscribed! On-chain tx: ${tx}… (${price})`), {
        type: 'success',
      })
      // 구독 즉시 잠긴 게시물이 열리므로 피드/프로필 전체 재조회
      void queryClient.invalidateQueries()
    },
    onError: e => {
      Toast.show(_(msg`Subscription failed: ${String(e)}`), {type: 'error'})
    },
  })
}

export function usePurchaseMutation(postUri: string) {
  const {_} = useLingui()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      const postId = /\/(\d+)$/.exec(postUri)?.[1]
      if (!postId) throw new Error(_(msg`This post cannot be purchased`))
      return purchasePost(agent, postId)
    },
    onSuccess: res => {
      const tx = res.digest.slice(0, 8)
      const price = formatHaneul(res.priceGeunhwa)
      Toast.show(
        _(
          msg`Purchased! This post is unlocked for you permanently (tx: ${tx}…, ${price})`,
        ),
        {type: 'success'},
      )
      void queryClient.invalidateQueries()
    },
    onError: e => {
      Toast.show(_(msg`Purchase failed: ${String(e)}`), {type: 'error'})
    },
  })
}

// 내 지갑(주소·잔고·최근 활동) — 사이드바 지갑 패널이 사용, 열려 있는 동안만 조회
export function useWalletInfo(enabled: boolean) {
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  return useQuery({
    queryKey: ['humming-wallet', currentAccount?.did],
    queryFn: () => getWalletInfo(agent),
    enabled: hasSession && enabled,
    // 잔고는 외부 입금(거래소 송금 등)으로도 변하므로 패널이 열려 있으면 주기 갱신
    refetchInterval: 10_000,
  })
}

// 내 수익/크리에이터 여부 — 사이드바 진입점과 수익 대시보드가 공유
export function useEarnings() {
  const agent = useAgent()
  const {hasSession, currentAccount} = useSession()
  return useQuery({
    queryKey: ['humming-earnings', currentAccount?.did],
    queryFn: () => getEarnings(agent),
    enabled: hasSession,
  })
}

export function useBecomeCreatorMutation() {
  const {_} = useLingui()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      priceGeunhwa: number
      periodDays: number
      lockMode: LockMode
    }) => becomeCreator(agent, input),
    onSuccess: res => {
      const tx = res.digest.slice(0, 8)
      Toast.show(
        _(
          msg`You are a creator now! Your tier has been created on-chain (tx: ${tx}…)`,
        ),
        {type: 'success'},
      )
      void queryClient.invalidateQueries()
    },
    onError: e => {
      Toast.show(_(msg`Conversion failed: ${String(e)}`), {type: 'error'})
    },
  })
}

/** 파사드가 게이팅된 게시물에 붙이는 구조화 잠금 마커 (post.humming). */
export interface HummingLock {
  locked: boolean
  reason: 'paywall' | 'profile'
  priceGeunhwa: number | null
  tier: {priceGeunhwa: number; periodMs: number} | null
  media?: {images: number; videos: number}
}

export function hummingLockOf(
  post: AppBskyFeedDefs.PostView,
): HummingLock | undefined {
  const lock = (post as {humming?: HummingLock}).humming
  return lock?.locked ? lock : undefined
}

export function formatTier(
  i18n: I18n,
  tier: {priceGeunhwa: number; periodMs: number},
): string {
  const price = formatHaneul(tier.priceGeunhwa)
  const days = Math.round(tier.periodMs / 86_400_000)
  return i18n._(msg`${price} / ${days} days`)
}
