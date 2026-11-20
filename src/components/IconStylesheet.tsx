"use client"

import { useEffect, useRef } from 'react'

const ICON_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'

export default function IconStylesheet() {
  const link = useRef<HTMLLinkElement>(null)
  useEffect(() => {
    // A cached stylesheet may finish before hydration attaches onLoad.
    if (link.current?.sheet) link.current.media = 'all'
  }, [])

  return <>
    <link ref={link} rel='stylesheet' href={ICON_CSS} crossOrigin='anonymous' media='print'
      onLoad={event => { event.currentTarget.media = 'all' }} />
    <noscript><link rel='stylesheet' href={ICON_CSS} crossOrigin='anonymous' /></noscript>
  </>
}
