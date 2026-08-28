// Humming: 크리에이터 되기 온보딩 + 내 수익 대시보드.
// 사이드바 진입점(프로필~설정 사이)에서 열리는 다이얼로그 두 개 —
// 비크리에이터에겐 전환 온보딩(KYC 스텁 → 티어 가격 → 잠금 모드),
// 크리에이터에겐 온체인 이벤트 집계 수익 장부를 보여준다.
import {useState} from 'react'
import {View} from 'react-native'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {
  CURRENCY_LABEL,
  formatHaneul,
  type LockMode,
  parseHaneulToGeunhwa,
} from './api'
import {useBecomeCreatorMutation, useEarnings} from './hooks'

const LOCK_MODES: {
  value: LockMode
  label: MessageDescriptor
  desc: MessageDescriptor
}[] = [
  {
    value: 'open',
    label: msg`Open`,
    desc: msg`Posts stay public — put a price only on the ones you choose`,
  },
  {
    value: 'tease',
    label: msg`Tease`,
    desc: msg`Locked posts show as teaser cards (drives conversion)`,
  },
  {
    value: 'lock',
    label: msg`Full lock`,
    desc: msg`Non-subscribers only see your profile wall`,
  },
]

/** 사이드바 진입점 — 크리에이터 여부에 따라 온보딩 또는 수익 대시보드를 연다. */
export function CreatorNavItem({minimal}: {minimal: boolean}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: earnings} = useEarnings()
  const control = Dialog.useDialogControl()
  const isCreator = !!earnings?.isCreator

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
        accessibilityLabel={
          isCreator ? _(msg`My earnings`) : _(msg`Become a creator`)
        }
        accessibilityHint=""
        testID="hummingCreatorNavItem">
        <View
          style={[a.align_center, a.justify_center, {width: 24, height: 24}]}>
          <SparkleIcon style={[t.atoms.text]} width={24} aria-hidden={true} />
        </View>
        {!minimal && (
          <View style={[a.flex_1]}>
            <Text style={[a.text_xl]}>
              {isCreator ? (
                <Trans>My earnings</Trans>
              ) : (
                <Trans>Become a creator</Trans>
              )}
            </Text>
            {!isCreator && (
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                <Trans>Keep 95% of what you earn</Trans>
              </Text>
            )}
          </View>
        )}
      </PressableWithHover>
      {isCreator ? (
        <EarningsDialog control={control} />
      ) : (
        <BecomeCreatorDialog control={control} />
      )}
    </>
  )
}

/** 전환 온보딩: 구독료 → 잠금 모드 → 온체인 확정 한 번. (신원 인증은 예정) */
export function BecomeCreatorDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const [price, setPrice] = useState('1')
  const [lockMode, setLockMode] = useState<LockMode>('tease')
  const mutation = useBecomeCreatorMutation()

  const priceGeunhwa = parseHaneulToGeunhwa(price)
  const priceValid =
    priceGeunhwa !== null &&
    priceGeunhwa >= 10_000_000 &&
    priceGeunhwa <= 100_000_000_000
  const canSubmit = priceValid && !mutation.isPending

  const onSubmit = () => {
    if (priceGeunhwa === null) return
    mutation.mutate(
      {priceGeunhwa, periodDays: 30, lockMode},
      {onSuccess: () => control.close()},
    )
  }

  const priceLabel = priceValid ? formatHaneul(priceGeunhwa) : '?'

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Become a creator`)}
        style={[{maxWidth: 440}, a.w_full]}>
        <View style={[a.gap_lg]}>
          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>
              <Trans>Become a creator</Trans>
            </Text>
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>
                95% of every subscription settles straight to your Haneul
                wallet. No payout queue, no withdrawal request — the money
                arrives on-chain the moment a fan pays.
              </Trans>
            </Text>
          </View>

          {/* ① 신원 인증: 아직 실제 검증이 없으므로 배지를 주장하지 않는
              정직한 비활성 상태. 실제 KYC가 연결되면 여기서 활성화한다. */}
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>1. Identity verification</Trans>
            </Text>
            <Button
              label={_(msg`Identity verification coming soon`)}
              size="large"
              variant="solid"
              color="secondary"
              disabled
              testID="hummingKycComingSoon">
              <ButtonText>
                <Trans>Verification coming soon</Trans>
              </ButtonText>
            </Button>
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              <Trans>
                Identity verification is not available yet. You can become a
                creator now and verify later to receive a badge.
              </Trans>
            </Text>
          </View>

          {/* ② 티어 가격 — subscriptions::create 인자 */}
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>
                2. Monthly subscription price (30 days, {CURRENCY_LABEL})
              </Trans>
            </Text>
            <TextField.Root isInvalid={!priceValid && price !== ''}>
              <TextField.Input
                testID="hummingTierPrice"
                label={_(msg`Subscription price (${CURRENCY_LABEL})`)}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </TextField.Root>
            {!priceValid && price !== '' && (
              <Text style={[a.text_sm, {color: t.palette.negative_500}]}>
                <Trans>
                  Enter a price between 0.01 and 100 {CURRENCY_LABEL}
                </Trans>
              </Text>
            )}
          </View>

          {/* ③ 잠금 모드 — creator_prefs::set_prefs, 티어와 같은 tx로 원자 확정 */}
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>3. How your posts are shown</Trans>
            </Text>
            {LOCK_MODES.map(m => (
              <Button
                key={m.value}
                label={i18n._(m.label)}
                size="large"
                variant={lockMode === m.value ? 'solid' : 'outline'}
                color={lockMode === m.value ? 'primary' : 'secondary'}
                onPress={() => setLockMode(m.value)}
                testID={`hummingLockMode-${m.value}`}>
                <View style={[a.flex_1, a.align_start]}>
                  <ButtonText>{i18n._(m.label)}</ButtonText>
                  <Text
                    style={[
                      a.text_xs,
                      lockMode === m.value
                        ? {color: t.palette.white}
                        : t.atoms.text_contrast_medium,
                    ]}>
                    {i18n._(m.desc)}
                  </Text>
                </View>
              </Button>
            ))}
          </View>

          <Button
            label={_(msg`Become a creator`)}
            size="large"
            variant="solid"
            color="primary"
            disabled={!canSubmit}
            onPress={onSubmit}
            testID="hummingBecomeCreatorSubmit">
            {mutation.isPending && <ButtonIcon icon={Loader} />}
            <ButtonText>
              {mutation.isPending ? (
                <Trans>Confirming on-chain…</Trans>
              ) : (
                <Trans>Convert: {priceLabel} / 30 days</Trans>
              )}
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const KIND_LABEL: Record<string, MessageDescriptor> = {
  subscription: msg`Subscription`,
  tip: msg`Tip`,
  purchase: msg`Purchase`,
}

/** 내 수익: 온체인 이벤트 집계 장부 — 체인이 원본이라 서버 없이도 재구성 가능한 숫자들. */
export function EarningsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {data: earnings, isLoading} = useEarnings()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`My earnings`)}
        style={[{maxWidth: 440}, a.w_full]}>
        <View style={[a.gap_lg]}>
          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>
              <Trans>My earnings</Trans>
            </Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>
                Every line is aggregated from Haneul on-chain events (net of the
                5% platform fee)
              </Trans>
            </Text>
          </View>
          {isLoading || !earnings ? (
            <Loader size="xl" />
          ) : (
            <>
              <View
                style={[a.p_lg, a.rounded_md, t.atoms.bg_contrast_25, a.gap_xs]}
                testID="hummingEarningsTotal">
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>Total net earnings</Trans>
                </Text>
                <Text style={[a.text_3xl, a.font_bold]}>
                  {formatHaneul(earnings.totals.totalGeunhwa)}
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>
                    Subscriptions{' '}
                    {formatHaneul(earnings.totals.subscriptionGeunhwa)} · Tips{' '}
                    {formatHaneul(earnings.totals.tipGeunhwa)} · Purchases{' '}
                    {formatHaneul(earnings.totals.purchaseGeunhwa)}
                  </Trans>
                </Text>
                {earnings.tier && (
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>
                      My tier: {formatHaneul(earnings.tier.priceGeunhwa)} /{' '}
                      {Math.round(earnings.tier.periodMs / 86_400_000)} days
                    </Trans>
                  </Text>
                )}
              </View>
              <View style={[a.gap_sm]}>
                {earnings.items.length === 0 && (
                  <Text style={[t.atoms.text_contrast_medium]}>
                    <Trans>
                      No earnings yet — waiting for your first subscriber!
                    </Trans>
                  </Text>
                )}
                {earnings.items.map(item => (
                  <View
                    key={item.tx + item.kind}
                    style={[
                      a.flex_row,
                      a.justify_between,
                      a.align_center,
                      a.py_xs,
                    ]}>
                    <View>
                      <Text style={[a.text_md]}>
                        {i18n._(KIND_LABEL[item.kind] ?? msg`Payment`)} ·{' '}
                        {item.from}
                        {item.postId ? ` · ${_(msg`post ${item.postId}`)}` : ''}
                      </Text>
                      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                        {new Date(item.atMs).toLocaleString(i18n.locale)} · tx{' '}
                        {item.tx.slice(0, 8)}…
                      </Text>
                    </View>
                    <Text style={[a.text_md, a.font_semi_bold]}>
                      +{formatHaneul(item.netGeunhwa)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
