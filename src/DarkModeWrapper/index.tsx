import { Helmet } from 'react-helmet'
import React, { useLayoutEffect } from 'react'
import { useDarkMode } from '@electricui/components-desktop'
import { Classes } from '@blueprintjs/core'

export type DarkModeWrapperProps = {
  children: React.ReactNode
}

export const DarkModeWrapper = (props: DarkModeWrapperProps) => {
  const isDark = useDarkMode()

  // When dark mode changes, force a full reflow with the scrollbar removed, then back again,
  // so that the 'dark mode' mode of the scrollbar doesn't get stuck
  useLayoutEffect(() => {
    // Hide everything
    document.documentElement.style.display = 'none'

    // Trigger a reflow by reading the client width
    document.body.clientWidth

    // Show everything, the scrollbar if it was there will be back
    document.documentElement.style.display = ''
  }, [isDark])

  return (
    <React.Fragment>
      <Helmet>
        <body className={isDark ? Classes.DARK : ''} />
        {/* tell Chromium we know how to render dark mode */}
        <meta name="color-scheme" content="light dark" />
      </Helmet>

      {props.children}
    </React.Fragment>
  )
}
