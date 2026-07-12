// Humming: 크리에이터 되기 온보딩 + 내 수익 대시보드.
// 사이드바 진입점(프로필~설정 사이)에서 열리는 다이얼로그 두 개 —
// 비크리에이터에겐 전환 온보딩(KYC 스텁 → 티어 가격 → 잠금 모드),
// 크리에이터에겐 온체인 이벤트 집계 수익 장부를 보여준다.
import {useState} from 'react'
import {View} from 'react-native'

import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {formatHaneul, GEUNHWA_PER_HANEUL, type LockMode} from './api'
import {useBecomeCreatorMutation, useEarnings} from './hooks'

const LOCK_MODES: {value: LockMode; label: string; desc: string}[] = [
  {
    value: 'open',
    label: '전체 공개',
    desc: '글은 공개, 원하는 글만 개별 유료화',
  },
  {
    value: 'tease',
    label: '티저',
    desc: '잠긴 글이 미리보기 카드로 노출 (전환 유도)',
  },
  {
    value: 'lock',
    label: '전면 잠금',
    desc: '구독자 외에는 프로필 담벼락만 보임',
  },
]

/** 사이드바 진입점 — 크리에이터 여부에 따라 온보딩 또는 수익 대시보드를 연다. */
export function CreatorNavItem({minimal}: {minimal: boolean}) {
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
        accessibilityLabel={isCreator ? '내 수익' : '크리에이터 되기'}
        accessibilityHint=""
        testID="hummingCreatorNavItem">
        <View
          style={[a.align_center, a.justify_center, {width: 24, height: 24}]}>
          <SparkleIcon style={[t.atoms.text]} width={24} aria-hidden={true} />
        </View>
        {!minimal && (
          <View style={[a.flex_1]}>
            <Text style={[a.text_xl]}>
              {isCreator ? '내 수익' : '크리에이터 되기'}
            </Text>
            {!isCreator && (
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                수익의 95%를 받으세요
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

/** 전환 온보딩: KYC 동의(스텁) → 구독료 → 잠금 모드 → 온체인 확정 한 번. */
export function BecomeCreatorDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const [kycAgreed, setKycAgreed] = useState(false)
  const [price, setPrice] = useState('1')
  const [lockMode, setLockMode] = useState<LockMode>('tease')
  const mutation = useBecomeCreatorMutation()

  const priceGeunhwa = Math.round(Number(price) * GEUNHWA_PER_HANEUL)
  const priceValid =
    priceGeunhwa >= 10_000_000 && priceGeunhwa <= 100_000_000_000
  const canSubmit = kycAgreed && priceValid && !mutation.isPending

  const onSubmit = () => {
    mutation.mutate(
      {priceGeunhwa, periodDays: 30, lockMode},
      {onSuccess: () => control.close()},
    )
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label="크리에이터 되기"
        style={[{maxWidth: 440}, a.w_full]}>
        <View style={[a.gap_lg]}>
          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>크리에이터 되기</Text>
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              구독료의 95%가 내 Haneul 지갑으로 즉시 정산됩니다. 정산 대기도,
              출금 신청도 없습니다 — 결제와 동시에 온체인으로 도착합니다.
            </Text>
          </View>

          {/* ① KYC — 의도적 오프체인. 데모에서는 동의 즉시 통과, 통과 시 인증 배지 */}
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              1. 본인 인증
            </Text>
            <Button
              label="본인 인증 동의"
              size="large"
              variant="solid"
              color={kycAgreed ? 'secondary' : 'primary'}
              onPress={() => setKycAgreed(v => !v)}
              testID="hummingKycAgree">
              {kycAgreed && <ButtonIcon icon={CheckIcon} />}
              <ButtonText>
                {kycAgreed
                  ? '본인 인증 완료 (인증 배지 발급)'
                  : '본인 인증하기 (KYC)'}
              </ButtonText>
            </Button>
          </View>

          {/* ② 티어 가격 — subscriptions::create 인자 */}
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              2. 월 구독료 (30일, HANEUL)
            </Text>
            <TextField.Root isInvalid={!priceValid && price !== ''}>
              <TextField.Input
                testID="hummingTierPrice"
                label="구독료 (HANEUL)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </TextField.Root>
            {!priceValid && price !== '' && (
              <Text style={[a.text_sm, {color: t.palette.negative_500}]}>
                0.01 ~ 100 HANEUL 사이로 입력하세요
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
              3. 내 글 공개 방식
            </Text>
            {LOCK_MODES.map(m => (
              <Button
                key={m.value}
                label={m.label}
                size="large"
                variant={lockMode === m.value ? 'solid' : 'outline'}
                color={lockMode === m.value ? 'primary' : 'secondary'}
                onPress={() => setLockMode(m.value)}
                testID={`hummingLockMode-${m.value}`}>
                <View style={[a.flex_1, a.align_start]}>
                  <ButtonText>{m.label}</ButtonText>
                  <Text
                    style={[
                      a.text_xs,
                      lockMode === m.value
                        ? {color: t.palette.white}
                        : t.atoms.text_contrast_medium,
                    ]}>
                    {m.desc}
                  </Text>
                </View>
              </Button>
            ))}
          </View>

          <Button
            label="크리에이터로 전환"
            size="large"
            variant="solid"
            color="primary"
            disabled={!canSubmit}
            onPress={onSubmit}
            testID="hummingBecomeCreatorSubmit">
            {mutation.isPending && <ButtonIcon icon={Loader} />}
            <ButtonText>
              {mutation.isPending
                ? '온체인 확정 중…'
                : `전환하기 — ${priceValid ? formatHaneul(priceGeunhwa) : '?'} / 30일`}
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const KIND_LABEL = {
  subscription: '구독',
  tip: '팁',
  purchase: '단건구매',
} as const

/** 내 수익: 온체인 이벤트 집계 장부 — 체인이 원본이라 서버 없이도 재구성 가능한 숫자들. */
export function EarningsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {data: earnings, isLoading} = useEarnings()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label="내 수익"
        style={[{maxWidth: 440}, a.w_full]}>
        <View style={[a.gap_lg]}>
          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>내 수익</Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              모든 항목이 Haneul 온체인 이벤트에서 집계됩니다 (수수료 5% 제외
              순수령액)
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
                  총 순수령
                </Text>
                <Text style={[a.text_3xl, a.font_bold]}>
                  {formatHaneul(earnings.totals.totalGeunhwa)}
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  구독 {formatHaneul(earnings.totals.subscriptionGeunhwa)} · 팁{' '}
                  {formatHaneul(earnings.totals.tipGeunhwa)} · 단건{' '}
                  {formatHaneul(earnings.totals.purchaseGeunhwa)}
                </Text>
                {earnings.tier && (
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    내 티어: {formatHaneul(earnings.tier.priceGeunhwa)} /{' '}
                    {Math.round(earnings.tier.periodMs / 86_400_000)}일
                  </Text>
                )}
              </View>
              <View style={[a.gap_sm]}>
                {earnings.items.length === 0 && (
                  <Text style={[t.atoms.text_contrast_medium]}>
                    아직 수익 내역이 없습니다 — 첫 구독자를 기다리는 중!
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
                        {KIND_LABEL[item.kind]} · {item.from}
                        {item.postId ? ` (글 ${item.postId})` : ''}
                      </Text>
                      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                        {new Date(item.atMs).toLocaleString('ko-KR')} · tx{' '}
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
