import React, { Component, ReactNode } from 'react'

import { Button } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
} from '@electricui/components-core'

interface StateTree {
  [key: string]: any
}

type ButtonProps = {
  high: StateTree
  children?: ReactNode
}

class ElectricButton extends Component<ButtonProps & InjectedElectricityProps> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: ButtonProps) => {
    return []
  }

  onClick = () => {
    const { write, high } = this.props

    write(high, true)
  }

  render() {
    const rest = removeElectricProps(this.props, ['high'])

    return <Button onClick={this.onClick} {...rest} />
  }
}

export default withElectricity(ElectricButton)
