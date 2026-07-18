// Humming: upstream POSTs to Bluesky's go.bsky.app shortener. We run no
// shortlink service, and starter-pack paths must not leak to Bluesky infra —
// hand back the canonical URL unchanged (callers already treat this shape as
// the fallback).
export function useShortenLink() {
  return (inputUrl: string): Promise<{url: string}> => {
    return Promise.resolve({url: inputUrl})
  }
}
