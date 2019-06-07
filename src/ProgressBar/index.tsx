import classnames from 'classnames'
import React, { Component } from 'react'
import { Omit } from 'utility-types'

import { IProgressBarProps, ProgressBar } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
  Accessor,
} from '@electricui/components-core'

type UpstreamProgressBarProps = Omit<IProgressBarProps, 'value' | 'stripes'>

interface ProgressBarProps extends UpstreamProgressBarProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the SliderHandle.
   */
  accessor: Accessor

  /**
   * The minimum value
   */
  min?: number
  /**
   * The maximum value
   */
  max?: number
  /**
   * Whether to display the progress bar with stripes or not
   */
  stripes?: boolean
}

/**
 * ProgressBar
 * @module components-desktop-blueprint
 * @name ProgressBar
 * @props ProgressBarProps
 */
class ElectricProgressBar extends Component<
  ProgressBarProps & InjectedElectricityProps
> {
  static readonly accessorKeys = ['accessor']

  static generateAccessorsFromProps = (props: ProgressBarProps) => {
    return []
  }

  render() {
    const rest = removeElectricProps(this.props, ['min', 'max', 'accessor'])

    const { access, min, max, stripes } = this.props

    const value = access('accessor')

    const minWithDefault = min || 0
    const maxWithDefault = max || 1
    const stripesWithDefaults = stripes || false

    const clamped = (value - minWithDefault) / (maxWithDefault - minWithDefault)

    return (
      <ProgressBar {...rest} value={clamped} stripes={stripesWithDefaults} />
    )
  }
}

export default withElectricity(ElectricProgressBar)
