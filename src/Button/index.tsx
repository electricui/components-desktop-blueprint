import React, { Component } from 'react'

import { Button } from '@blueprintjs/core'

// import { getDependencyProps } from '../../utils'
import ElectrifyHOC, { removeElectrifyProps, ElectrifiedProps } from '../ElectrifyHOC'

interface StateTree {
  [key: string]: any
}

type ButtonProps = {
  high: StateTree
}

class ElectricButton extends Component<ButtonProps & ElectrifiedProps> {
  onClick = () => {
    const { write, high } = this.props

    write(high)
  }

  render() {
    const rest = removeElectrifyProps(this.props)

    return <Button onClick={this.onClick} {...rest} />
  }
}

export default ElectrifyHOC(ElectricButton)
