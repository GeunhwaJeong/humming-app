// Humming: money display and price parsing must be exact. A wrong number
// here is a wrong number in a payment confirm dialog.
import {formatHaneul, GEUNHWA_PER_HANEUL, parseHaneulToGeunhwa} from '../api'

describe('formatHaneul', () => {
  it('formats whole amounts without decimals', () => {
    expect(formatHaneul(0)).toBe('0 HANEUL')
    expect(formatHaneul(GEUNHWA_PER_HANEUL)).toBe('1 HANEUL')
    expect(formatHaneul(100 * GEUNHWA_PER_HANEUL)).toBe('100 HANEUL')
  })

  it('shows small amounts instead of rounding them to 0', () => {
    expect(formatHaneul(1_000_000)).toBe('0.001 HANEUL')
    expect(formatHaneul(GEUNHWA_PER_HANEUL / 10)).toBe('0.1 HANEUL')
  })

  it('trims trailing zeros and caps at 4 decimals', () => {
    expect(formatHaneul(1_500_000_000)).toBe('1.5 HANEUL')
    expect(formatHaneul(1_234_500_000)).toBe('1.2345 HANEUL')
    expect(formatHaneul(1_234_560_000)).toBe('1.2345 HANEUL')
  })

  it('keeps the integer part exact for large balances', () => {
    // 9,007,199.254740992 HANEUL: above Number.MAX_SAFE_INTEGER as geunhwa,
    // naive float division would drift.
    expect(formatHaneul(9_007_199_254_740_992)).toBe('9007199.2547 HANEUL')
  })
})

describe('parseHaneulToGeunhwa', () => {
  it('parses dot and comma decimal separators', () => {
    expect(parseHaneulToGeunhwa('1.5')).toBe(1_500_000_000)
    expect(parseHaneulToGeunhwa('1,5')).toBe(1_500_000_000)
    expect(parseHaneulToGeunhwa('0.01')).toBe(10_000_000)
    expect(parseHaneulToGeunhwa(' 2 ')).toBe(2_000_000_000)
  })

  it('rejects non-positive and malformed input', () => {
    expect(parseHaneulToGeunhwa('')).toBeNull()
    expect(parseHaneulToGeunhwa('.')).toBeNull()
    expect(parseHaneulToGeunhwa('abc')).toBeNull()
    expect(parseHaneulToGeunhwa('-1')).toBeNull()
    expect(parseHaneulToGeunhwa('0')).toBeNull()
    expect(parseHaneulToGeunhwa('1.2.3')).toBeNull()
  })
})
