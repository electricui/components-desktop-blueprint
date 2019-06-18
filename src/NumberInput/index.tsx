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
   * Wait this many milliseconds until no changes have occurred before writing them.
   */
  debounceDuration?: number
}

interface MutableReaderState {
  mutableValue: number
  focused: boolean
}

/**
 * NumberInput
 * @module components-desktop-blueprint
 * @name NumberInput
 * @props NumberInputProps
 */
class ElectricNumberInput extends Component<
  NumberInputProps & InjectedElectricityProps,
  MutableReaderState
> {
  static readonly accessorKeys = ['accessor']
  state: MutableReaderState = {
    mutableValue: 0,
    focused: false,
  }

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

  getLocalValue = () => {
    return this.state.mutableValue
  }

  getFocused = () => {
    return this.state.focused
  }

  /**
   * We maintain a local state while the user is focused so we don't have "jumping" behaviour
   */
  setLocalValue = (value: number) => {
    this.setState({ mutableValue: value })
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

    this.setLocalValue(value)

    this.debouncedPush(Object.keys(toWrite))
  }

  /**
   * On focus, enter user input mode and just in time override our mutable value with the hardware state
   */
  onFocus = (event: React.FormEvent<HTMLInputElement>) => {
    this.setState({ focused: true, mutableValue: this.getValue() })
  }

  onBlur = (event: React.FormEvent<HTMLInputElement>) => {
    this.setState({ focused: false })
  }

  render() {
    const rest = removeElectricProps(this.props, ['accessor'])

    const value = this.getFocused() ? this.getLocalValue() : this.getValue()

    if (typeof value !== 'number') {
      return <NumericInput {...rest} disabled={true} value="" />
    }

    return (
      <NumericInput
        onValueChange={this.onChange}
        {...rest}
        value={value}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      />
    )
  }
}

export default withElectricity(ElectricNumberInput)
