import debounce from 'lodash.debounce'
import React, { Component, ReactNode } from 'react'
import { Omit } from 'utility-types'

import { InputGroup, IInputGroupProps } from '@blueprintjs/core'
// import { getDependencyProps } from '../../utils'
import {
  removeElectricProps,
  withElectricity,
  Accessor,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

type UpstreamTextInputProps = Omit<
  IInputGroupProps,
  'defaultValue' | 'onChange' | 'value'
>

type Writer = (value: string) => StateTree

/**
 * Remove the IInputGroupProps ones we don't want to show in the documentation
 * @remove defaultValue
 * @remove onChange
 * @remove value
 */
interface TextInputProps extends UpstreamTextInputProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the TextInput.
   */
  accessor: Accessor
  /**
   * If the accessor is merely a messageID, this Writer is optional. If the Accessor is functional, then this writer must be used to transform the value from the TextInput into a StateTree for writing to the device.
   */
  writer?: Writer
  /**
   * Wait this many milliseconds until no changes have occurred before writing them.
   */
  debounceDuration?: number
}

/**
 * TextInput
 * @module components-desktop-blueprint
 * @name TextInput
 * @props TextInputProps
 */
class ElectricTextInput extends Component<
  TextInputProps & InjectedElectricityProps
> {
  static readonly accessorKeys = ['accessor']

  static generateAccessorsFromProps = (props: TextInputProps) => []

  debouncedPush: (toWrite: StateTree) => void

  constructor(props: TextInputProps & InjectedElectricityProps) {
    super(props)

    this.push = this.push.bind(this)

    const debounceDuration = props.debounceDuration || 250
    this.debouncedPush = debounce(this.push, debounceDuration, {
      trailing: true,
    })
    this.debouncedPush = this.debouncedPush.bind(this)
  }

  defaultWriter = (value: string) => {
    const { accessor } = this.props

    if (typeof accessor !== 'string') {
      throw new Error(
        "The text input needs a writer since the accessor isn't simple",
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

  onChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { commit } = this.props

    const value = event.currentTarget.value
    const writer = this.getWriter()
    const toWrite = writer(value)

    commit(toWrite)

    this.debouncedPush(Object.keys(toWrite))
  }

  render() {
    const rest = removeElectricProps(this.props, ['accessor'])

    const value = this.getValue()

    return <InputGroup onChange={this.onChange} {...rest} value={value} />
  }
}

export default withElectricity(ElectricTextInput)
