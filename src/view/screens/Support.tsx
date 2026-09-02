// Copyright (c) 2023-2026 Bluesky Social PBC
// Modifications Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {HELP_DESK_URL, SUPPORT_EMAIL} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {TextLink} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Support`)} />
      <CenteredView>
        <Text type="title-xl" style={[pal.text, s.p20, s.pb5]}>
          <Trans>Support</Trans>
        </Text>
        <Text style={[pal.text, s.p20]}>
          <Trans>
            If you need help, please email us at{' '}
            <TextLink
              href={HELP_DESK_URL}
              text={SUPPORT_EMAIL}
              style={pal.link}
            />{' '}
            and we will get back to you.
          </Trans>
        </Text>
      </CenteredView>
    </Layout.Screen>
  )
}
