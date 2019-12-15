import { Helmet } from 'react-helmet'
import React from 'react'
import { useDarkMode } from '@electricui/components-desktop'

export type DarkModeWrapperProps = {
  children: React.ReactNode
}

export const DarkModeWrapper = (props: DarkModeWrapperProps) => {
  const isDark = useDarkMode()

  return (
    <React.Fragment>
      <Helmet>
        <body className={isDark ? 'bp3-dark' : ''} />
      </Helmet>

      {props.children}
    </React.Fragment>
  )
}
