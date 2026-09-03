// Copyright (c) 2023-2026 Bluesky Social PBC
// Modifications Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Terms of Service`)} />
      <TermsBody />
    </Layout.Screen>
  )
}

function TermsBody() {
  const pal = usePalette('default')
  const {_} = useLingui()
  return (
    <ScrollView style={[s.hContentRegion, pal.view]}>
      <View style={[s.p20, a.gap_md]}>
        <Text type="sm" style={pal.textLight}>
          <Trans>Last updated: September 3, 2026</Trans>
        </Text>

        <SectionText title={_(msg`1. About Humming`)}>
          <Trans>
            Humming is a social platform where creators publish content and
            receive payments directly on a public blockchain. By creating an
            account or using Humming, you agree to these terms. If you do not
            agree, do not use the service.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`2. Age requirement`)}>
          <Trans>
            You must be at least 14 years old to use Humming. Some features,
            such as paid content, may additionally require you to be of legal
            age under the laws that apply to you.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`3. On-chain payments are final`)}>
          <Trans>
            Subscriptions, post purchases, and tips are executed as transactions
            on the blockchain and settle directly to the creator. Once confirmed
            on-chain, a payment cannot be reversed by Humming. Purchase records
            are permanently stored on-chain, including a pointer to the content
            as it existed at the moment of purchase. Creators may voluntarily
            refund a payment, but Humming cannot force them to do so.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`4. Your wallet`)}>
          <Trans>
            During the current early-access period, Humming creates and holds a
            blockchain wallet on your behalf (a custodial wallet). Your password
            protects access to this wallet, so use a strong, unique password.
            Keep balances small: this is an early-stage service and self-custody
            support is on the roadmap. Humming is not responsible for losses
            caused by sharing or losing your password.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`5. Creator content`)}>
          <Trans>
            Creators are solely responsible for the content they publish and for
            honoring what they advertise for paid content. Content that is
            illegal, infringes copyright, involves minors in any way, or depicts
            non-consensual acts is prohibited and will be removed, and the
            account terminated. Humming may remove content or restrict accounts
            that violate these terms.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`6. Prohibited conduct`)}>
          <Trans>
            You may not: attempt to access another person's account or wallet;
            abuse, spam, or defraud other users; interfere with the operation of
            the service; or use the service to violate any applicable law.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`7. Service availability`)}>
          <Trans>
            Humming is provided "as is" during early access. We do not guarantee
            uninterrupted availability. Content is stored off-chain and may be
            removed for legal or policy reasons; on-chain records (payments,
            subscriptions, name registrations) persist on the blockchain
            independently of Humming.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`8. Termination`)}>
          <Trans>
            You may stop using Humming at any time. We may suspend or terminate
            accounts that violate these terms. Because wallets and payment
            records live on the blockchain, on-chain assets and records are
            unaffected by account termination.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`9. Changes`)}>
          <Trans>
            We may update these terms as the service evolves. Material changes
            will be announced in the app. Continued use after a change means you
            accept the updated terms.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`10. Platform fee`)}>
          <Trans>
            The platform fee is currently 0% of each payment. The on-chain
            contract caps the fee at 5%, and it cannot be raised above that cap
            without a contract upgrade. Any change to the fee will be announced
            in the app at least 30 days before it takes effect.
          </Trans>
        </SectionText>
      </View>
      <View style={s.footerSpacer} />
    </ScrollView>
  )
}

function SectionText({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const pal = usePalette('default')
  return (
    <Text lineHeight={1.3} style={pal.text}>
      <Text type="lg-bold" style={pal.text}>
        {title}
        {'\n'}
      </Text>
      {children}
    </Text>
  )
}
