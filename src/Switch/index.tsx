import './index.css'

// import { getDependencyProps } from '../../utils'
import {
  Accessor,
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  withElectricity,
} from '@electricui/components-core'
import { ISwitchProps, Switch } from '@blueprintjs/core'
import React, { Component, ReactNode } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import classnames from 'classnames'
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
   * An accessor to determine if the switch is in a 'on' state.
   * If the result is truthy, the switch is considered 'on'.
   */
  checked: Accessor<boolean>
  /**
   * An accessor to determine if the switch is in an 'off' state.
   * If the result is truthy, the switch is considered 'off'.
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
 * Switch
 * @module components-desktop-blueprint
 * @name Switch
 * @props SwitchProps
 */
class ElectricSwitch extends Component<SwitchProps & InjectedElectricityProps> {
  static readonly accessorKeys = ['checked', 'unchecked']

  static generateAccessorsFromProps = (props: SwitchProps) => {
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
      writer(staging) // mutate with the writer
      writeStaged(staging, true)
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

export default withElectricity(ElectricSwitch) as React.ComponentType<
  SwitchProps
>
