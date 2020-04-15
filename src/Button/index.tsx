import { Button, IButtonProps } from '@blueprintjs/core'
import React, { ReactNode, useCallback } from 'react'
// import { getDependencyProps } from '../../utils'
import {
  StateTree,
  removeElectricProps,
  useSendCallback,
  useWriteState,
} from '@electricui/components-core'

import { Draft } from 'immer'

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove loading
 * @remove elementRef
 */
interface ElectricButtonProps extends IButtonProps {
  /** A functional writer that mutates state or a StateTree object for merging. */
  writer?: ((staging: Draft<ElectricUIDeveloperState>) => void) | StateTree

  /** A callback messageID to call upon clicking */
  callback?: string

  /** Action text. Can be any single React renderable. */
  children?: ReactNode

  /** Whether to not request acknowledgement of packets sent upon clicking. */
  noAck?: boolean

  /** If the button should display a disabled state and not send output. */
  disabled?: boolean
}

/**
 * Button
 * @module components-desktop-blueprint
 * @name Button
 * @props ElectricButtonProps
 */
export default function ElectricButton(props: ElectricButtonProps) {
  const sendCallback = useSendCallback()
  const writeState = useWriteState()

  const allOnClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (props.disabled) {
        return
      }

      // If we have a writer, call it now
      if (props.writer) {
        writeState(props.writer, !props.noAck).catch(err => {
          console.warn('Could not write state from button', err)
        })
      }

      // If there is a callback to call after our write, do it now
      if (props.callback) {
        sendCallback(props.callback, !props.noAck).catch(err => {
          console.warn('Unable to send callback from button', err)
        })
      }

      // If there's a regular JS onClick handler, call it
      if (props.onClick) {
        props.onClick(event)
      }
    },
    [props.writer, props.onClick, props.callback, props.noAck, props.disabled],
  )

  const disabled = props.disabled
  const rest = removeElectricProps(props, ['writer', 'noAck'])

  return <Button onClick={allOnClick} {...rest} disabled={disabled} />
}
