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

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove onClick
 * @remove loading
 * @remove elementRef
 */
interface ElectricButtonProps extends IButtonProps {
  /** A function that returns a StateTree or just a StateTree to write to the device upon clicking */
  writer: (() => StateTree) | StateTree

  /** Action text. Can be any single React renderable. */
  children?: ReactNode

  /** Whether to request acknowledgement of packets sent upon clicking. */
  noAck?: boolean
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

    if (typeof writer === 'function') {
      write(writer(), !noAck)
      return
    }

    write(writer, !noAck)
  }

  render() {
    const rest = removeElectricProps(this.props, ['writer', 'noAck'])

    return <Button onClick={this.onClick} {...rest} />
  }
}

export default withElectricity(ElectricButton)
