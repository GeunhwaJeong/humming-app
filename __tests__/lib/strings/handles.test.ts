// Copyright (c) 2023-2026 Bluesky Social PBC
// Modifications Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

import {
  isHummingDid,
  type IsValidHandle,
  validateServiceHandle,
} from '#/lib/strings/handles'

describe('handle validation', () => {
  const valid = [
    ['ali', 'bsky.social'],
    ['alice', 'bsky.social'],
    ['a-lice', 'bsky.social'],
    ['a-----lice', 'bsky.social'],
    ['123', 'bsky.social'],
    ['123456789012345678', 'bsky.social'],
    ['alice', 'custom-pds.com'],
    ['alice', 'my-custom-pds-with-long-name.social'],
    ['123456789012345678', 'my-custom-pds-with-long-name.social'],
  ]
  it.each(valid)(`should be valid: %s.%s`, (handle, service) => {
    const result = validateServiceHandle(handle, service)
    expect(result.overall).toEqual(true)
  })

  const invalid = [
    ['al', 'bsky.social', 'frontLengthNotTooShort'],
    ['-alice', 'bsky.social', 'hyphenStartOrEnd'],
    ['alice-', 'bsky.social', 'hyphenStartOrEnd'],
    ['%%%', 'bsky.social', 'handleChars'],
    ['1234567890123456789', 'bsky.social', 'frontLengthNotTooLong'],
    [
      '1234567890123456789',
      'my-custom-pds-with-long-name.social',
      'frontLengthNotTooLong',
    ],
    ['al', 'my-custom-pds-with-long-name.social', 'frontLengthNotTooShort'],
    ['a'.repeat(300), 'toolong.com', 'totalLength'],
  ] satisfies [string, string, keyof IsValidHandle][]
  it.each(invalid)(
    `should be invalid: %s.%s due to %s`,
    (handle, service, expectedError) => {
      const result = validateServiceHandle(handle, service)
      expect(result.overall).toEqual(false)
      expect(result[expectedError]).toEqual(false)
    },
  )
})

describe('isHummingDid', () => {
  const humming = [
    'did:web:alice.hum.haneul',
    'did:web:younggg.hum.sui',
    'did:web:a-1.hum.haneul',
  ]
  it.each(humming)('recognises a facade identity: %s', did => {
    expect(isHummingDid(did)).toEqual(true)
  })

  const other = [
    'did:plc:oisofpd7lj26yvgiivf3lxsi',
    'did:web:alice.bsky.social',
    'did:web:alice.hum',
    'did:web:hum.sui',
    'did:web:alice.hum.sui.evil.com',
    'did:web:Alice.hum.sui',
  ]
  it.each(other)('leaves any other DID to DID-document resolution: %s', did => {
    expect(isHummingDid(did)).toEqual(false)
  })
})
