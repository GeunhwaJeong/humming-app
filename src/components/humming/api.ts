// Humming monetization API — custom XRPC methods served by the facade.
// agent.call() only dispatches nsids registered in the bundled lexicons,
// so these custom methods go over raw fetch with the session's auth token;
// the facade signs chain transactions with the wallet bound to the DID.
import {type AtpAgent} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

// Display currency. 'USD' renders money as $1.50 over a 6-decimal payment
// coin (USDC networks); the default renders whole-coin HANEUL over 9 decimals.
// Baked at build time like every EXPO_PUBLIC_* value.
export const CURRENCY: 'USD' | 'HANEUL' =
  process.env.EXPO_PUBLIC_HUMMING_CURRENCY === 'USD' ? 'USD' : 'HANEUL'
export const GEUNHWA_PER_HANEUL = CURRENCY === 'USD' ? 1_000_000 : 1_000_000_000
// Unit label for static form copy ("price (USD)"); formatted amounts carry
// their own symbol via formatHaneul.
export const CURRENCY_LABEL = CURRENCY === 'USD' ? 'USD' : 'HANEUL'

export interface CreatorInfo {
  tier: {id: string; price: number; periodMs: number} | null
  viewer: {subscribed: boolean; expiresMs: number | null}
  profileLocked?: boolean
  stats?: {posts: number; images?: number; videos?: number}
}

export function formatHaneul(geunhwa: number): string {
  // BigInt division avoids float precision loss on large amounts. Up to 4
  // decimals, trimmed, so a 0.001 HANEUL tip does not display as 0. USD mode
  // keeps the conventional two decimals and only extends to show a sub-cent
  // amount as non-zero.
  const negative = geunhwa < 0
  const abs = BigInt(Math.round(Math.abs(geunhwa)))
  const whole = abs / BigInt(GEUNHWA_PER_HANEUL)
  const remainder = abs % BigInt(GEUNHWA_PER_HANEUL)
  const fracScale = CURRENCY === 'USD' ? 100n : 100_000n
  const fracDigits = CURRENCY === 'USD' ? 4 : 4
  let frac = (remainder / fracScale)
    .toString()
    .padStart(fracDigits, '0')
    .replace(/0+$/, '')
  const sign = negative ? '-' : ''
  if (CURRENCY === 'USD') {
    if (frac.length < 2) frac = frac.padEnd(2, '0')
    return `${sign}$${whole}.${frac}`
  }
  return `${sign}${whole}${frac ? `.${frac}` : ''} HANEUL`
}

/**
 * Locale-tolerant HANEUL price string to geunhwa ("1,5" and "1.5" both parse).
 * Returns null when the input is not a positive amount; callers apply their
 * own min/max bounds on top.
 */
export function parseHaneulToGeunhwa(input: string): number | null {
  const normalized = input.trim().replace(',', '.')
  if (!/^\d*\.?\d+$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * GEUNHWA_PER_HANEUL)
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
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    // All POSTs here move money: a fresh key per attempt lets the facade
    // dedupe a request that reaches it twice (e.g. a network-layer retry).
    headers['Idempotency-Key'] = nanoid()
  }
  const res = await fetch(url.toString(), {
    method: body !== undefined ? 'POST' : 'GET',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json: unknown
  try {
    json = await res.json()
  } catch {
    // Non-JSON body (e.g. an HTML 502 from the proxy): don't surface a raw
    // SyntaxError in the toast.
    throw new Error('Server temporarily unavailable. Please try again.')
  }
  if (!res.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json
        ? String(json.message)
        : `${nsid} failed (${res.status})`
    if (/insufficient/i.test(message)) {
      throw new Error(
        `Insufficient balance in your wallet. Top up ${CURRENCY_LABEL} and try again.`,
      )
    }
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

// 티어 생성(+잠금 모드)을 본인 지갑 서명으로 온체인 확정. verified 배지는
// 실제 신원 인증이 연결되기 전까지 발급하지 않는다.
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

export interface WalletActivityItem {
  kind: 'subscription' | 'tip' | 'purchase'
  direction: 'in' | 'out'
  counterparty: string
  amountGeunhwa: number
  atMs: number
  tx: string
}

export interface WalletInfo {
  address: string
  handle: string
  balanceGeunhwa: number
  activity: WalletActivityItem[]
}

// 지갑 패널(읽기 전용): 주소·잔고·최근 온체인 활동 — 가입=지갑을 UI에 드러낸다
export function getWalletInfo(agent: AtpAgent): Promise<WalletInfo> {
  return callFacade<WalletInfo>(agent, 'app.humming.wallet.getInfo')
}

/** 0x1234…5678 — 지갑 UI 관례(앞 4 + 뒤 4)의 축약 표기 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
