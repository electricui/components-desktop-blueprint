import debounce from 'lodash.debounce'
import React, { Component, ReactNode } from 'react'
import { Omit } from 'utility-types'

import { INumericInputProps, NumericInput } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  Accessor,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

type UpstreamNumberInputProps = Omit<
  INumericInputProps,
  'onValueChange' | 'value'
>

type Writer = (value: number) => StateTree

/**
 * Remove the INumericInputProps ones we don't want to show in the documentation
 * @remove onValueChange
 * @remove value
 */
interface NumberInputProps extends UpstreamNumberInputProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the NumberInput.
   */
  accessor: Accessor
  /**
   * If the accessor is merely a messageID, this Writer is optional. If the Accessor is functional, then this writer must be used to transform the value from the NumberInput into a StateTree for writing to the device.
   */
  writer?: Writer
  /**
   * With this many milliseconds until no changes have occurred before writing them.
   */
  debounceDuration?: number
}

/**
 * NumberInput
 * @module components-desktop-blueprint
 * @name NumberInput
 * @props NumberInputProps
 */
class ElectricNumberInput extends Component<
  NumberInputProps & InjectedElectricityProps
> {
  static readonly accessorKeys = ['accessor']

  static generateAccessorsFromProps = (props: NumberInputProps) => []

  debouncedPush: (toWrite: StateTree) => void

  constructor(props: NumberInputProps & InjectedElectricityProps) {
    super(props)

    this.push = this.push.bind(this)

    const debounceDuration = props.debounceDuration || 100
    this.debouncedPush = debounce(this.push, debounceDuration, {
      trailing: true,
    })
    this.debouncedPush = this.debouncedPush.bind(this)
  }

  defaultWriter = (value: number) => {
    const { accessor } = this.props

    if (typeof accessor !== 'string') {
      throw new Error(
        "The number input needs a writer since the accessor isn't simple",
      )
    }

    return {
      [accessor]: value,
    }
  }

  getWriter = () => {
    const { writer } = this.props

    if (writer) {
      return writer
    }

    return this.defaultWriter
  }

  getValue = () => {
    const { access } = this.props

    return access('accessor')
  }

  push(keysToWrite: string[]) {
    const { push } = this.props
    push(keysToWrite, true)
  }

  onChange = (valueAsNumber: number, valueAsString: string) => {
    const { commit } = this.props

    const value = valueAsNumber
    const writer = this.getWriter()
    const toWrite = writer(value)

    commit(toWrite)

    this.debouncedPush(Object.keys(toWrite))
  }

  render() {
    const rest = removeElectricProps(this.props, ['accessor'])

    const value = this.getValue()

    if (typeof value !== 'number') {
      return <NumericInput {...rest} disabled={true} value="" />
    }

    return (
      <NumericInput onValueChange={this.onChange} {...rest} value={value} />
    )
  }
}

export default withElectricity(ElectricNumberInput)
