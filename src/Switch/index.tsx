import './index.css'

import classnames from 'classnames'
import React, { Component, ReactNode } from 'react'
import { Omit } from 'utility-types'

import { ISwitchProps, Switch } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

import { isSubset } from '@electricui/core'

type UpstreamSwitchProps = Omit<
  ISwitchProps,
  'checked' | 'onChange' | 'defaultChecked'
>

/**
 * Remove the ISwitchProps ones we don't want to show in the documentation
 * @remove onChange
 * @remove defaultChecked
 */
interface SwitchProps extends UpstreamSwitchProps {
  /**
   * The state tree to match when the switch is on. Switching the switch on sets this StateTree.
   */
  checked: StateTree
  /**
   * The state tree to match when the switch is off. Switching the switch off sets this StateTree.
   */
  unchecked: StateTree
}

/**
 * Switch
 * @module components-desktop-blueprint
 * @name Switch
 * @props SwitchProps
 */
class ElectricSwitch extends Component<SwitchProps & InjectedElectricityProps> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: SwitchProps) => {
    const keySet = new Set<string>()

    for (const key of Object.keys(props.checked)) {
      keySet.add(key)
    }

    for (const key of Object.keys(props.unchecked)) {
      keySet.add(key)
    }

    return Array.from(keySet.values()).map(key => ({
      accessorKey: key,
      accessor: key,
    }))
  }

  getValue = () => {
    const { getState, checked, unchecked } = this.props

    const state = getState()

    if (isSubset(state, checked)) {
      return {
        checked: true,
        indeterminate: false,
      }
    }

    if (isSubset(state, unchecked)) {
      return {
        checked: false,
        indeterminate: false,
      }
    }

    return {
      checked: false,
      indeterminate: true,
    }
  }

  onChange = () => {
    const { write, checked, unchecked } = this.props

    // If we're checked, write the unchecked values
    if (this.getValue().checked) {
      write(unchecked, true)
      return
    }

    // Otherwise write the checked values
    write(checked, true)
  }

  render() {
    const rest = removeElectricProps(this.props, ['checked', 'unchecked'])

    const { className } = this.props
    const { checked, indeterminate } = this.getValue()

    const classNames = classnames({ indeterminate }, className)

    return (
      <Switch
        onChange={this.onChange}
        {...rest}
        checked={checked}
        className={classNames}
      />
    )
  }
}

export default withElectricity(ElectricSwitch)
