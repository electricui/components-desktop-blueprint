import {
  Accessor,
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  withElectricity,
} from '@electricui/components-core'
import { Checkbox, ICheckboxProps } from '@blueprintjs/core'
import React, { Component } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'

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
   * An accessor to determine if the checkbox is in a 'checked' state.
   * If the result is truthy, the checkbox is considered 'checked'.
   */
  checked: Accessor<boolean>
  /**
   * An accessor to determine if the checkbox is in an 'uchecked' state.
   * If the result is truthy, the checkbox is considered 'uchecked'.
   */
  unchecked: Accessor<boolean>
  /**
   * A writer to write the Checked state.
   */
  writeChecked: ((staging: Draft<ElectricUIDeveloperState>) => void) | StateTree
  /**
   * A writer to write the Unchecked state.
   */
  writeUnchecked:
    | ((staging: Draft<ElectricUIDeveloperState>) => void)
    | StateTree
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
  static readonly accessorKeys = ['checked', 'unchecked']

  static generateAccessorsFromProps = (props: CheckboxProps) => {
    return []
  }

  getValue = () => {
    const { access } = this.props

    if (access('checked')) {
      return {
        checked: true,
        indeterminate: false,
      }
    }

    if (access('unchecked')) {
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

  handleWriting = (
    writer: ((staging: Draft<ElectricUIDeveloperState>) => void) | StateTree,
  ) => {
    const { generateStaging, writeStaged, write } = this.props
    if (typeof writer === 'function') {
      const staging = generateStaging()
      const staged = writer(staging)
      writeStaged(staged, true)
      return
    }

    write(writer, true)
  }

  onChange = () => {
    const { writeChecked, writeUnchecked } = this.props

    // If we're checked, write the unchecked values
    if (this.getValue().checked) {
      this.handleWriting(writeUnchecked)
      return
    }

    // Otherwise write the checked values
    this.handleWriting(writeChecked)
  }

  render() {
    const rest = removeElectricProps(this.props, [
      'checked',
      'unchecked',
      'writeChecked',
      'writeUnchecked',
    ])

    const value = this.getValue()

    return <Checkbox onChange={this.onChange} {...rest} {...value} />
  }
}

export default withElectricity(ElectricCheckbox) as React.ComponentType<
  CheckboxProps
>
