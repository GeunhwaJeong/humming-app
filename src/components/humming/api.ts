// Humming monetization API — custom XRPC methods served by the facade.
// agent.call() only dispatches nsids registered in the bundled lexicons,
// so these custom methods go over raw fetch with the session's auth token;
// the facade signs chain transactions with the wallet bound to the DID.
import {type AtpAgent} from '@atproto/api'

export const GEUNHWA_PER_HANEUL = 1_000_000_000

export interface CreatorInfo {
  tier: {id: string; price: number; periodMs: number} | null
  viewer: {subscribed: boolean; expiresMs: number | null}
  profileLocked?: boolean
  stats?: {posts: number; images?: number; videos?: number}
}

export function formatHaneul(geunhwa: number): string {
  const whole = geunhwa / GEUNHWA_PER_HANEUL
  return `${Number.isInteger(whole) ? whole : whole.toFixed(2)} HANEUL`
}

async function callFacade<T>(
  agent: AtpAgent,
  nsid: string,
  params?: Record<string, string>,
  body?: unknown,
): Promise<T> {
  const url = new URL(`/xrpc/${nsid}`, agent.dispatchUrl)
  if (params) url.search = new URLSearchParams(params).toString()
  const headers: Record<string, string> = {}
  const token = agent.session?.accessJwt
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(url.toString(), {
    method: body !== undefined ? 'POST' : 'GET',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json: unknown = await res.json()
  if (!res.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json
        ? String(json.message)
        : `${nsid} failed (${res.status})`
    throw new Error(message)
  }
  return json as T
}

export function getCreatorInfo(
  agent: AtpAgent,
  actor: string,
): Promise<CreatorInfo> {
  return callFacade<CreatorInfo>(agent, 'app.humming.monetization.getCreator', {
    actor,
  })
}

export function subscribeToCreator(
  agent: AtpAgent,
  creator: string,
): Promise<{digest: string; priceGeunhwa: number}> {
  return callFacade(agent, 'app.humming.monetization.subscribe', undefined, {
    creator,
  })
}

export function purchasePost(
  agent: AtpAgent,
  postId: string,
): Promise<{digest: string; priceGeunhwa: number; postId: string}> {
  return callFacade(agent, 'app.humming.monetization.purchasePost', undefined, {
    postId,
  })
}

export function tipCreator(
  agent: AtpAgent,
  creator: string,
  amountGeunhwa: number,
  postId?: string,
): Promise<{digest: string; amountGeunhwa: number}> {
  return callFacade(agent, 'app.humming.monetization.tip', undefined, {
    creator,
    amountGeunhwa,
    // 글에 귀속된 팁은 온체인 TipSent 이벤트에 post_id로 기록됨
    postId,
  })
}

export type LockMode = 'open' | 'tease' | 'lock'

export interface EarningsItem {
  kind: 'subscription' | 'tip' | 'purchase'
  from: string
  postId?: string | null
  grossGeunhwa: number
  netGeunhwa: number
  atMs: number
  tx: string
}

export interface Earnings {
  totals: {
    subscriptionGeunhwa: number
    tipGeunhwa: number
    purchaseGeunhwa: number
    totalGeunhwa: number
  }
  items: EarningsItem[]
  tier: {id: string; priceGeunhwa: number; periodMs: number} | null
  isCreator: boolean
}

// 티어 생성(+잠금 모드)을 본인 지갑 서명으로 온체인 확정 — KYC 통과 시 verified 배지
export function becomeCreator(
  agent: AtpAgent,
  input: {priceGeunhwa: number; periodDays: number; lockMode: LockMode},
): Promise<{digest: string; verified: boolean}> {
  return callFacade(
    agent,
    'app.humming.creator.becomeCreator',
    undefined,
    input,
  )
}

// 온체인 이벤트(Subscribed/TipSent/PostPurchased) 집계 — 체인이 곧 정산 장부
export function getEarnings(agent: AtpAgent): Promise<Earnings> {
  return callFacade<Earnings>(agent, 'app.humming.creator.getEarnings')
}
