import React, { Component, ReactNode } from 'react'
import { Omit } from 'utility-types'

import { Checkbox, ICheckboxProps } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

import { isSubset } from '../utils'

type UpstreamCheckboxProps = Omit<
  ICheckboxProps,
  | 'checked'
  | 'defaultIndeterminate'
  | 'indeterminate'
  | 'onChange'
  | 'defaultChecked'
>

/**
 * Remove the ICheckboxProps ones we don't want to show in the documentation
 * @remove defaultIndeterminate
 * @remove indeterminate
 * @remove onChange
 * @remove defaultChecked
 */
interface CheckboxProps extends UpstreamCheckboxProps {
  /**
   * The state tree to match when the checkbox is checked. Checking the checkbox sets this statetree.
   */
  checked: StateTree
  /**
   * The state tree to match when the checkbox is unchecked. Unchecking the checkbox sets this statetree.
   */
  unchecked: StateTree
}

/**
 * Checkbox
 * @module components-desktop-blueprint
 * @name Checkbox
 * @props CheckboxProps
 */
class ElectricCheckbox extends Component<
  CheckboxProps & InjectedElectricityProps
> {
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: CheckboxProps) => {
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

    const value = this.getValue()

    return <Checkbox onChange={this.onChange} {...rest} {...value} />
  }
}

export default withElectricity(ElectricCheckbox)
