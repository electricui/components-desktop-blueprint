import React from 'react'
import { useDarkMode } from '@electricui/components-desktop'

export type DarkModeWrapperProps = {
  children: React.ReactNode
}

export const DarkModeWrapper = (props: DarkModeWrapperProps) => {
  const isDark = useDarkMode()

  return <div className={isDark ? 'bp3-dark' : ''}>{props.children}</div>
}
