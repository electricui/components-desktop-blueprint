// import { getDependencyProps } from '../../utils'
import {
  Accessor,
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  useAsyncThrow,
  withElectricity,
} from '@electricui/components-core'
import { INumericInputProps, NumericInput } from '@blueprintjs/core'
import React, { Component, ReactNode } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import debounce from 'lodash.debounce'
import { generateWriteErrHandler } from 'src/utils'

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
   * If the accessor is merely a messageID, this Writer is optional.
   * If the accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, value: number) => void
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

  defaultWriter = (staging: Draft<ElectricUIDeveloperState>, value: number) => {
    const { accessor } = this.props

    if (typeof accessor !== 'string') {
      throw new Error(
        "The number input needs a writer since the accessor isn't simply a MessageID",
      )
    }

    // Perform the mutation
    staging[accessor] = value
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
    push(keysToWrite, true).catch(
      generateWriteErrHandler(
        err =>
          this.setState(() => {
            throw err
          }), // make the callback inline since this isn't hooks based
      ),
    )
  }

  onChange = (valueAsNumber: number, valueAsString: string) => {
    const { commitStaged, generateStaging } = this.props

    const value = valueAsNumber
    const writer = this.getWriter()

    const staging = generateStaging() // Generate the staging
    writer(staging, value) // The writer mutates the staging into a 'staged'

    const messageIDsModified = commitStaged(staging)

    this.setLocalValue(value)

    this.debouncedPush(Object.keys(messageIDsModified))
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
    const rest = removeElectricProps(this.props, [
      'accessor',
      'debounceDuration',
    ])

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

export default withElectricity(ElectricNumberInput) as React.ComponentType<
  NumberInputProps
>
