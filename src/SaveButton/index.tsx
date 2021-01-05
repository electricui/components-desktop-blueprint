import { Button, IButtonProps } from '@blueprintjs/core'
import React, { Component, ReactNode, useCallback } from 'react'
import { useAsyncThrow, useDeadline, useSaveContainer } from '@electricui/components-core'

import { generateWriteErrHandler } from '../utils'

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
 * @module @electricui/components-desktop-blueprint
 * @name SaveButton
 * @props ElectricSaveButtonProps
 */
const ElectricSaveButton = (props: ElectricSaveButtonProps) => {
  const getDeadline = useDeadline()

  // TODO: Work out why we need to rip the type prop out
  const { noAck, type, ...rest } = props

  // Use our savecontainer hook, reverse our noAck prop
  const { save, dirty } = useSaveContainer(!props.noAck)
  const asyncThrow = useAsyncThrow()

  const saveWithCatch = useCallback(() => {
    const cancellationToken = getDeadline()

    save(cancellationToken).catch(generateWriteErrHandler(asyncThrow))
  }, [])

  return <Button onClick={saveWithCatch} disabled={!dirty} {...rest} />
}

export default ElectricSaveButton
