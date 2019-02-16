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

interface NumberInputProps extends UpstreamNumberInputProps {
  accessor: Accessor
  writer?: Writer
  debounceDuration?: number
}

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

    return (
      <NumericInput onValueChange={this.onChange} {...rest} value={value} />
    )
  }
}

export default withElectricity(ElectricNumberInput)
