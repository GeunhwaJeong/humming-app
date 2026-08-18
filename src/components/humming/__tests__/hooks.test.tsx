// Humming: regression tests for the payment double-fire guard. A rapid
// double-tap must never start two on-chain payments.
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

// The hooks module transitively imports the session state (which drags in
// native bottom-sheet code) and the Toast UI; neither loads under Jest and
// neither is exercised by these tests.
jest.mock('#/state/session', () => ({
  useAgent: jest.fn(),
  useSession: jest.fn(() => ({hasSession: false, currentAccount: undefined})),
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))

import {useSingleFlightMutation} from '../hooks'

function wrapper({children}: React.PropsWithChildren<{}>) {
  const client = new QueryClient({
    defaultOptions: {mutations: {retry: false}},
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useSingleFlightMutation', () => {
  it('drops mutate() calls made while a mutation is in flight', async () => {
    let resolve!: (v: string) => void
    const mutationFn = jest.fn(() => new Promise<string>(y => (resolve = y)))
    const {result} = renderHook(() => useSingleFlightMutation({mutationFn}), {
      wrapper,
    })

    // Simulates a double-tap: both calls land before isPending flips.
    act(() => {
      result.current.mutate()
      result.current.mutate()
    })
    // react-query starts the mutationFn on a microtask, so wait for it.
    await waitFor(() => expect(result.current.isPending).toBe(true))
    expect(mutationFn).toHaveBeenCalledTimes(1)

    act(() => resolve('ok'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // A deliberate second payment after settling still works.
    act(() => result.current.mutate())
    await waitFor(() => expect(mutationFn).toHaveBeenCalledTimes(2))
  })

  it('releases the lock when the mutation fails', async () => {
    const mutationFn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('chain unreachable'))
      .mockResolvedValueOnce('ok')
    const {result} = renderHook(
      () => useSingleFlightMutation({mutationFn, onError: () => {}}),
      {wrapper},
    )

    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isError).toBe(true))

    // The failed attempt must not leave the guard permanently locked.
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mutationFn).toHaveBeenCalledTimes(2)
  })
})
