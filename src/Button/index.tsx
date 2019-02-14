import React, { Component, ReactNode } from 'react'

import { Button } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

type Writer = StateTree

type ButtonProps = {
  writer: Writer
  children?: ReactNode
  noAck?: boolean
}

class ElectricButton extends Component<ButtonProps & InjectedElectricityProps> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: ButtonProps) => {
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
