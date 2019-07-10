import React, { Component, ReactNode } from 'react'

import { Button, IButtonProps } from '@blueprintjs/core'

import { useSaveContainer } from '@electricui/components-core'

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove onClick
 * @remove loading
 * @remove elementRef
 * @remove disabled
 */
interface ElectricSaveButtonProps extends IButtonProps {
  /** Action text. Can be any single React renderable. */
  children?: ReactNode

  /** Whether to not request acknowledgement of packets sent upon clicking. */
  noAck?: boolean
}

/**
 * SaveButton
 * @module components-desktop-blueprint
 * @name SaveButton
 * @props ElectricSaveButtonProps
 */
const ElectricSaveButton = (props: ElectricSaveButtonProps) => {
  // TODO: Work out why we need to rip the type prop out
  const { noAck, type, ...rest } = props

  // Use our savecontainer hook, reverse our noAck prop
  const { save, dirty } = useSaveContainer(!props.noAck)

  return <Button onClick={save} disabled={!dirty} {...rest} />
}

export default ElectricSaveButton
