'use client'

import Image from 'next/image'

// SmartImage wraps next/image with two conveniences:
//
// 1. Blob/data URLs auto-force `unoptimized`. next/image skips the optimizer
//    for those anyway, but being explicit keeps the wrapper's intent readable
//    and lets chat-preview and inbound-image call sites omit the prop.
// 2. Per-call-site `fill` opt-in (no default). Fluid containers pass `fill`
//    and rely on a `relative`-positioned parent; fixed-size previews pass
//    explicit `width`/`height`. Keeping `fill` opt-in — rather than defaulting
//    it — makes each call site honest about its layout intent.
//
// For blog covers (admin-pasted arbitrary URLs) callers pass `unoptimized`
// explicitly: expanding `images.remotePatterns` to a wildcard would expose
// `/_next/image?url=…` as an open proxy. `unoptimized` is Next's documented
// escape hatch for arbitrary-URL text columns — keeps lazy-loading and
// `sizes` semantics, skips AVIF/WebP recoding.

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  unoptimized?: boolean
  width?: number
  height?: number
  sizes?: string
}

export function SmartImage({
  src,
  alt,
  className,
  fill,
  unoptimized,
  width,
  height,
  sizes,
}: SmartImageProps) {
  const isLocalAsset = src.startsWith('blob:') || src.startsWith('data:')

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={fill ? (sizes ?? '(max-width: 768px) 100vw, 768px') : undefined}
      unoptimized={unoptimized || isLocalAsset}
    />
  )
}
