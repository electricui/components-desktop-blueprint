import React, { Component, ReactNode } from 'react'
import { Omit } from 'utility-types'

import { Button, IButtonProps } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'
import { CALL_CALLBACK } from '@electricui/core'

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove loading
 * @remove elementRef
 */
interface ElectricButtonProps extends IButtonProps {
  /** A function that returns a StateTree or just a StateTree to write to the device upon clicking */
  writer?: (() => StateTree) | StateTree

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
class ElectricButton extends Component<
  ElectricButtonProps & InjectedElectricityProps
> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: ElectricButtonProps) => {
    return []
  }

  onClick = () => {
    const { write, writer, noAck } = this.props

    if (!writer) {
      return
    }

    if (typeof writer === 'function') {
      write(writer(), !noAck)
      return
    }

    if (Array.isArray(writer)) {
      for (const w of writer) {
        write(w, !noAck)
      }
    }

    write(writer, !noAck)
  }

  allOnClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const { write, onClick, callback, noAck, disabled } = this.props

    if (disabled) {
      return
    }

    this.onClick()

    if (callback) {
      write({ [callback]: CALL_CALLBACK }, !noAck)
    }

    if (typeof onClick === 'function') {
      onClick(event)
    }
  }

  render() {
    const disabled = this.props.disabled
    const rest = removeElectricProps(this.props, ['writer', 'noAck'])

    return <Button onClick={this.allOnClick} {...rest} disabled={disabled} />
  }
}

export default withElectricity(ElectricButton) as React.ComponentType<
  ElectricButtonProps
>
