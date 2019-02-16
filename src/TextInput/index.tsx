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

interface TextInputProps extends UpstreamTextInputProps {
  accessor: Accessor
  writer?: Writer
  debounceDuration?: number
}

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
