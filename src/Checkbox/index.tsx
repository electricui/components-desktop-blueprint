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

interface CheckboxProps extends UpstreamCheckboxProps {
  checked: StateTree
  unchecked: StateTree
}

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
