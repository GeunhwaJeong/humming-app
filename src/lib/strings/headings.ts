// Copyright (c) 2023-2026 Bluesky Social PBC
// Modifications Copyright (c) 2026 Geunhwa Jeong
// SPDX-License-Identifier: MIT

export function bskyTitle(page: string, unreadCountLabel?: string) {
  const unreadPrefix = unreadCountLabel ? `(${unreadCountLabel}) ` : ''
  return `${unreadPrefix}${page} — Humming`
}
