import React, { Component } from 'react'

import { Button } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import { withElectricity, InjectedElectricityProps } from '@electricui/components-core'

interface StateTree {
  [key: string]: any
}

type ButtonProps = {
  high: StateTree
}

class ElectricButton extends Component<ButtonProps & InjectedElectricityProps> {
  onClick = () => {
    const { write, high } = this.props

    write(high, true)
  }

  render() {
    const rest = this.props //  removeElectrifyProps(this.props)

    return <Button onClick={this.onClick} {...rest} />
  }
}

export default withElectricity(ElectricButton)
