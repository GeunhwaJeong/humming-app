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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyPolicy'>
export const PrivacyPolicyScreen = (_props: Props) => {
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Privacy Policy`)} />
      <PrivacyBody />
    </Layout.Screen>
  )
}

function PrivacyBody() {
  const pal = usePalette('default')
  const {_} = useLingui()
  return (
    <ScrollView style={[s.hContentRegion, pal.view]}>
      <View style={[s.p20, a.gap_md]}>
        <Text type="sm" style={pal.textLight}>
          <Trans>Last updated: August 31, 2026</Trans>
        </Text>

        <SectionText title={_(msg`1. What we collect`)}>
          <Trans>
            When you sign up, Humming stores your chosen nickname and a salted
            hash of your password, never the password itself. During the current
            early-access period we also generate and hold the private key of
            your blockchain wallet (custodial). Media you upload is stored on
            our servers. We do not collect your email address, phone number, or
            real name, and we do not use third-party trackers or advertising
            identifiers.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`2. What lives on the blockchain`)}>
          <Trans>
            Your nickname registration, posts, subscriptions, purchases, and
            tips are recorded on the blockchain, which is public and permanent.
            Anyone can see the payment flows of a wallet address. Post content
            itself is stored off-chain on our servers; the chain holds only a
            content pointer.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`3. How we use data`)}>
          <Trans>
            We use your data only to operate the service: authenticating you,
            signing the transactions you request, serving content you are
            entitled to view, and protecting the service from abuse (such as
            rate limiting by network address). We do not sell or share your data
            with advertisers.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`4. Deletion`)}>
          <Trans>
            You can delete your uploaded media and off-chain content by
            contacting us or using in-app deletion where available. Records
            already committed to the blockchain cannot be erased by anyone; this
            is a property of public blockchains, so post and pay with that in
            mind.
          </Trans>
        </SectionText>

        <SectionText title={_(msg`5. Contact`)}>
          <Trans>
            For privacy requests, contact the Humming team via the links on
            humming.social.
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
