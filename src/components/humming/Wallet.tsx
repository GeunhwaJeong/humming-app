// Humming: 지갑 패널 — "가입=지갑"을 UI에 드러낸다.
// 사이드바 진입점에서 열리는 다이얼로그: 주소·잔고·최근 온체인 활동 + 받기(QR).
// 받기 전용(읽기)이며 보내기는 의도적으로 없다 — 수탁 파사드가 임의 이체까지
// 서명하면 리스크 표면이 커지므로, 보내기는 비수탁 전환(패스키) 이후에만.
import {useCallback, useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
// @ts-expect-error missing types
import QRCode from 'react-native-qrcode-styled'
import * as Clipboard from 'expo-clipboard'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowTopCircle_Stroke2_Corner0_Rounded as ArrowCircleIcon} from '#/components/icons/ArrowTopCircle'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon} from '#/components/icons/Chevron'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {QrCode_Stroke2_Corner0_Rounded as QrCodeIcon} from '#/components/icons/QrCode'
import {Wallet_Stroke2_Corner0_Rounded as WalletIcon} from '#/components/icons/Wallet'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {
  CURRENCY_LABEL,
  formatHaneul,
  shortenAddress,
  type WalletActivityItem,
} from './api'
import {useWalletInfo} from './hooks'

const KIND_LABEL: Record<string, MessageDescriptor> = {
  subscription: msg`Subscription`,
  tip: msg`Tip`,
  purchase: msg`Purchase`,
}

/** 사이드바 진입점 — 프로필·크리에이터 항목과 같은 결의 지갑 메뉴. */
export function WalletNavItem({minimal}: {minimal: boolean}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  return (
    <>
      <PressableWithHover
        style={[
          a.flex_row,
          a.align_center,
          a.p_md,
          a.rounded_full,
          a.gap_sm,
          a.outline_inset_1,
          a.transition_color,
        ]}
        hoverStyle={t.atoms.bg_contrast_25}
        onPress={() => control.open()}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Wallet`)}
        accessibilityHint={_(msg`Opens your Haneul wallet`)}
        testID="hummingWalletNavItem">
        <View
          style={[a.align_center, a.justify_center, {width: 24, height: 24}]}>
          <WalletIcon style={[t.atoms.text]} width={24} aria-hidden={true} />
        </View>
        {!minimal && (
          <Text style={[a.text_xl]}>
            <Trans>Wallet</Trans>
          </Text>
        )}
      </PressableWithHover>
      <WalletDialog control={control} />
    </>
  )
}

export function WalletDialog({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Wallet`)}
        style={[{maxWidth: 400}, a.w_full]}>
        {/* 내부 컴포넌트가 열릴 때마다 마운트되어 항상 첫 화면(home)에서 시작 */}
        <WalletDialogInner />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

/** 주소 복사 공통 동작 — 눌린 대상의 아이콘이 400ms간 체크마크로 바뀌고 토스트. */
function useCopyAddress(address?: string) {
  const {_} = useLingui()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 400)
    return () => clearTimeout(timeout)
  }, [copied])
  const copy = useCallback(() => {
    if (!address) return
    void Clipboard.setStringAsync(address)
    setCopied(true)
    Toast.show(_(msg`Address copied to clipboard`), {type: 'success'})
  }, [address, _])
  return {copied, copy}
}

function WalletDialogInner() {
  const [view, setView] = useState<'home' | 'receive'>('home')
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {data: wallet, isLoading} = useWalletInfo(true)

  if (view === 'receive' && wallet) {
    return (
      <ReceiveView
        address={wallet.address}
        handle={wallet.handle}
        avatarUri={profile?.avatar}
        onBack={() => setView('home')}
      />
    )
  }
  return (
    <HomeView
      wallet={wallet}
      isLoading={isLoading}
      displayName={profile?.displayName}
      avatarUri={profile?.avatar}
      onReceive={() => setView('receive')}
    />
  )
}

function HomeView({
  wallet,
  isLoading,
  displayName,
  avatarUri,
  onReceive,
}: {
  wallet?: {
    address: string
    handle: string
    balanceGeunhwa: number
    activity: WalletActivityItem[]
  }
  isLoading: boolean
  displayName?: string
  avatarUri?: string
  onReceive: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {copied, copy} = useCopyAddress(wallet?.address)
  const isEmpty = !!wallet && wallet.balanceGeunhwa === 0

  return (
    <View style={[a.gap_lg]}>
      {/* 아이덴티티: 아바타 + 이름/핸들 + 축약 주소 필(탭=복사) — 핸들이 곧 지갑 이름 */}
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <UserAvatar type="user" size={48} avatar={avatarUri} />
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text style={[a.text_lg, a.font_semi_bold]} numberOfLines={1}>
            {displayName || wallet?.handle || '…'}
          </Text>
          {wallet && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={_(msg`Copy wallet address`)}
              accessibilityHint=""
              onPress={copy}
              style={[
                a.flex_row,
                a.align_center,
                a.gap_xs,
                a.self_start,
                a.rounded_full,
                a.px_sm,
                a.py_2xs,
                t.atoms.bg_contrast_25,
              ]}
              testID="hummingWalletAddressPill">
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {shortenAddress(wallet.address)}
              </Text>
              {copied ? (
                <CircleCheckIcon
                  size="xs"
                  style={{color: t.palette.positive_500}}
                />
              ) : (
                <ClipboardIcon
                  size="xs"
                  style={[t.atoms.text_contrast_medium]}
                />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* 잔고 — 지갑의 첫 번째 질문 "내가 얼마 갖고 있지"에 가장 크게 답한다 */}
      <View style={[a.gap_2xs]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Balance</Trans>
        </Text>
        {isLoading || !wallet ? (
          <Loader size="lg" />
        ) : (
          <Text style={[a.text_3xl, a.font_bold]} testID="hummingWalletBalance">
            {formatHaneul(wallet.balanceGeunhwa)}
          </Text>
        )}
      </View>

      {/* 받기 — 유일한 액션. 보내기는 패스키(비수탁) 전환 후에 생긴다 */}
      <Button
        label={_(msg`Receive ${CURRENCY_LABEL}`)}
        size="large"
        variant="solid"
        color="primary"
        onPress={onReceive}
        testID="hummingWalletReceiveBtn">
        <ButtonIcon icon={QrCodeIcon} />
        <ButtonText>
          <Trans>Receive</Trans>
        </ButtonText>
      </Button>

      {isEmpty ? (
        // 빈 지갑 = 신규 가입자의 기본 화면 — 잔고 대신 "지갑이 이미 있다"를 알려준다
        <View
          style={[a.gap_xs, a.p_lg, a.rounded_md, t.atoms.bg_contrast_25]}
          testID="hummingWalletEmpty">
          <Text style={[a.text_md, a.font_semi_bold]}>
            <Trans>Your wallet is ready</Trans>
          </Text>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>
              A wallet was created for you the moment you signed up. Send{' '}
              {CURRENCY_LABEL} to your address from an exchange or another
              wallet to subscribe, tip, and unlock posts.
            </Trans>
          </Text>
        </View>
      ) : (
        wallet &&
        wallet.activity.length > 0 && (
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Recent activity</Trans>
            </Text>
            {wallet.activity.slice(0, 3).map(item => (
              <ActivityRow key={item.tx + item.direction} item={item} />
            ))}
          </View>
        )
      )}
    </View>
  )
}

function ActivityRow({item}: {item: WalletActivityItem}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const incoming = item.direction === 'in'
  return (
    <View style={[a.flex_row, a.align_center, a.gap_md, a.py_xs]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          t.atoms.bg_contrast_25,
          {width: 32, height: 32},
        ]}>
        <ArrowCircleIcon
          size="sm"
          style={[
            incoming
              ? {color: t.palette.positive_500}
              : t.atoms.text_contrast_medium,
            // 들어오는 돈은 ↓(내 지갑으로), 나가는 돈은 ↑ — 화살표 방향이 곧 방향성
            incoming && {transform: [{rotate: '180deg'}]},
          ]}
        />
      </View>
      <View style={[a.flex_1]}>
        <Text style={[a.text_md]} numberOfLines={1}>
          {i18n._(KIND_LABEL[item.kind] ?? msg`Payment`)} · @{item.counterparty}
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {new Date(item.atMs).toLocaleString(i18n.locale)} ·{' '}
          {_(msg`tx ${item.tx.slice(0, 8)}…`)}
        </Text>
      </View>
      <Text
        style={[
          a.text_md,
          a.font_semi_bold,
          incoming && {color: t.palette.positive_500},
        ]}>
        {incoming ? '+' : '−'}
        {formatHaneul(item.amountGeunhwa)}
      </Text>
    </View>
  )
}

const QR_AREA = 220

function ReceiveView({
  address,
  handle,
  avatarUri,
  onBack,
}: {
  address: string
  handle: string
  avatarUri?: string
  onBack: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {copied, copy} = useCopyAddress(address)

  return (
    <View style={[a.gap_lg]}>
      {/* 뒤로가기 + 타이틀 — 다이얼로그 안 서브 화면 (Uniswap 모달 내 전환과 동형) */}
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          label={_(msg`Back to wallet`)}
          size="small"
          variant="ghost"
          color="secondary"
          shape="round"
          onPress={onBack}
          testID="hummingWalletBackBtn">
          <ButtonIcon icon={ChevronLeftIcon} />
        </Button>
        <Text style={[a.text_xl, a.font_semi_bold]}>
          <Trans>Receive {CURRENCY_LABEL}</Trans>
        </Text>
      </View>

      {/* QR: 스캔 대비를 위해 항상 밝은 카드 위에, 브랜드 색 둥근 점 + 중앙 아바타 */}
      <View style={[a.align_center]}>
        <View
          style={[
            a.align_center,
            a.justify_center,
            {
              backgroundColor: t.palette.white,
              borderRadius: 24,
              padding: 12,
            },
          ]}
          testID="hummingWalletQr">
          <QRCode
            data={address}
            style={{
              width: QR_AREA,
              height: QR_AREA,
              backgroundColor: t.palette.white,
            }}
            pieceSize={4}
            padding={4}
            pieceBorderRadius={2}
            color={t.palette.primary_500}
            errorCorrectionLevel="H"
            outerEyesOptions={{
              topLeft: {borderRadius: 12, color: t.palette.primary_500},
              topRight: {borderRadius: 12, color: t.palette.primary_500},
              bottomLeft: {borderRadius: 12, color: t.palette.primary_500},
            }}
            innerEyesOptions={{
              topLeft: {borderRadius: 4, color: t.palette.primary_500},
              topRight: {borderRadius: 4, color: t.palette.primary_500},
              bottomLeft: {borderRadius: 4, color: t.palette.primary_500},
            }}
            logo={{
              hidePieces: true,
              padding: 4,
              scale: 1,
              href: avatarUri
                ? {uri: avatarUri}
                : require('../../../assets/logo.png'),
            }}
          />
        </View>
        <Text style={[a.text_sm, a.pt_sm, t.atoms.text_contrast_medium]}>
          @{handle}
        </Text>
      </View>

      {/* 풀 주소 박스 — 박스 전체가 탭=복사. 축약 대신 전문을 보여줘 검증 가능하게 */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Copy wallet address`)}
        accessibilityHint=""
        onPress={copy}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_md,
          a.p_md,
          a.rounded_md,
          a.border,
          t.atoms.border_contrast_medium,
        ]}
        testID="hummingWalletFullAddress">
        <Text
          style={[
            a.flex_1,
            a.text_sm,
            a.leading_snug,
            // 0x… 연속 문자열은 스스로 줄바꿈되지 않는다 — 박스 밖 넘침 방지
            web({wordBreak: 'break-all'}),
          ]}>
          {address}
        </Text>
        {copied ? (
          <CircleCheckIcon size="md" style={{color: t.palette.positive_500}} />
        ) : (
          <ClipboardIcon size="md" style={[t.atoms.text_contrast_medium]} />
        )}
      </Pressable>

      {/* 네트워크 안내 — 경고가 아닌 정보형 (Uniswap "use this address to receive on") */}
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <CircleInfoIcon size="sm" style={[t.atoms.text_contrast_medium]} />
        <Text style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>
            Use this address to receive {CURRENCY_LABEL} — from an exchange or
            any other wallet.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
