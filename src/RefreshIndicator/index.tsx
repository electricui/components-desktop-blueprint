import React from 'react'
import RefreshSpinner from './spinner'
import { RefreshIndicator as RootRefreshIndicator } from '@electricui/components-desktop'

interface RefreshIndicatorProps {
  children: React.ReactNode[] | React.ReactNode
  renderIfLoading?: React.ReactNode[] | React.ReactNode
}

const RefreshIndicator = (props: RefreshIndicatorProps) => {
  return (
    <RootRefreshIndicator
      children={props.children}
      renderIfLoading={
        props.renderIfLoading ? props.renderIfLoading : <RefreshSpinner />
      }
    />
  )
}

export default RefreshIndicator
