// Humming: 컴포저 "열람 설정" — 이 글에 단건 가격을 붙이면 글 작성과 같은
// 트랜잭션에서 온체인 페이월이 생성된다 (공개 글이 기본값).
// Bluesky의 threadgate(답글 제한)와는 별개의 축: 저건 상호작용, 이건 열람.
import {useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Text} from '#/components/Typography'
import {GEUNHWA_PER_HANEUL} from './api'

export function PaywallButton({
  valueHaneul,
  onChange,
}: {
  valueHaneul: string | null
  onChange: (v: string | null) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()
  const [draft, setDraft] = useState(valueHaneul ?? '0.5')

  const draftGeunhwa = Math.round(Number(draft) * GEUNHWA_PER_HANEUL)
  const draftValid =
    draftGeunhwa >= 10_000_000 && draftGeunhwa <= 100_000_000_000
  const isSet = valueHaneul !== null

  return (
    <>
      <Button
        style={a.p_sm}
        label={
          isSet
            ? _(msg`Paid post (${valueHaneul} HANEUL)`)
            : _(msg`Viewing access`)
        }
        variant="ghost"
        shape="round"
        color={isSet ? 'primary' : 'secondary'}
        onPress={() => control.open()}
        testID="hummingPaywallBtn">
        <LockIcon
          size="lg"
          style={
            isSet
              ? {color: t.palette.primary_500}
              : t.atoms.text_contrast_medium
          }
        />
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Viewing access`)}
          style={[{maxWidth: 400}, a.w_full]}>
          <View style={[a.gap_lg]}>
            <View style={[a.gap_xs]}>
              <Text style={[a.text_2xl, a.font_semi_bold]}>
                <Trans>Viewing access</Trans>
              </Text>
              <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans>
                  Add a price and subscribers read for free while everyone else
                  pays per post. The price is fixed on-chain together with the
                  post.
                </Trans>
              </Text>
            </View>
            <View style={[a.gap_sm]}>
              <TextField.Root isInvalid={!draftValid && draft !== ''}>
                <TextField.Input
                  testID="hummingPaywallPrice"
                  label={_(msg`Price per post (HANEUL)`)}
                  value={draft}
                  onChangeText={setDraft}
                  keyboardType="decimal-pad"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </TextField.Root>
              {!draftValid && draft !== '' && (
                <Text style={[a.text_sm, {color: t.palette.negative_500}]}>
                  <Trans>Enter a price between 0.01 and 100 HANEUL</Trans>
                </Text>
              )}
            </View>
            <View style={[a.flex_row, a.gap_sm]}>
              {isSet && (
                <Button
                  label={_(msg`Make it free`)}
                  size="large"
                  variant="solid"
                  color="secondary"
                  style={[a.flex_1]}
                  onPress={() => {
                    onChange(null)
                    control.close()
                  }}
                  testID="hummingPaywallClear">
                  <ButtonText>
                    <Trans>Make it free</Trans>
                  </ButtonText>
                </Button>
              )}
              <Button
                label={_(msg`Set as paid post`)}
                size="large"
                variant="solid"
                color="primary"
                style={[a.flex_1]}
                disabled={!draftValid}
                onPress={() => {
                  onChange(draft)
                  control.close()
                }}
                testID="hummingPaywallApply">
                <ButtonText>
                  <Trans>Set as paid — {draft} HANEUL</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
