import { Button, IButtonProps } from '@blueprintjs/core'
import React, { Component, ReactNode } from 'react'

import { useSaveContainer } from '@electricui/components-core'

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove onClick
 * @remove loading
 * @remove elementRef
 * @remove disabled
 */
interface ElectricResetButtonProps extends IButtonProps {
  /** Action text. Can be any single React renderable. */
  children?: ReactNode

  /** Whether to not request acknowledgement of packets sent upon clicking. */
  noAck?: boolean
}

/**
 * ResetButton
 * @module @electricui/components-desktop-blueprint
 * @name ResetButton
 * @props ElectricResetButtonProps
 */
const ElectricResetButton = (props: ElectricResetButtonProps) => {
  // TODO: Work out why we need to rip the type prop out
  const { noAck, type, ...rest } = props

  // Use our savecontainer hook, reverse our noAck prop
  const { reset, dirty } = useSaveContainer(!props.noAck)

  return <Button onClick={reset} disabled={!dirty} {...rest} />
}

export default ElectricResetButton
