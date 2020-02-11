import { Button, IButtonProps } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  withElectricity,
} from '@electricui/components-core'
import React, { Component, ReactNode } from 'react'

import { CALL_CALLBACK } from '@electricui/core'
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
class ElectricButton extends Component<
  ElectricButtonProps & InjectedElectricityProps
> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: ElectricButtonProps) => {
    return []
  }

  onClick = () => {
    const { generateStaging, writeStaged, writer, write, noAck } = this.props

    if (!writer) {
      return
    }

    if (typeof writer === 'function') {
      const staging = generateStaging()
      const staged = writer(staging)
      writeStaged(staged, !noAck)
      return
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
