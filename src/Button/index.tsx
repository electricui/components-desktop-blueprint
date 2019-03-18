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

type Writer = StateTree

/**
 * Remove the IButtonProps ones we don't want to show in the documentation
 * @remove type
 * @remove onClick
 * @remove loading
 * @remove elementRef
 */
interface ElectricButtonProps extends IButtonProps {
  /** A writer */
  writer: Writer
  /** Potential overwriting of button child nodes */
  children?: ReactNode
  /** whether to ack the writes when clicked */
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

    write(writer, !noAck)
  }

  render() {
    const rest = removeElectricProps(this.props, ['writer', 'noAck'])

    return <Button onClick={this.onClick} {...rest} />
  }
}

export default withElectricity(ElectricButton)
