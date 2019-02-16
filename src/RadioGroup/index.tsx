import React, { Component } from 'react'
import { Omit } from 'utility-types'

import {
  IRadioGroupProps,
  IRadioProps,
  Radio as BlueprintRadio,
  RadioGroup,
} from '@blueprintjs/core'
import {
  removeElectricProps,
  withElectricity,
  Accessor,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

import { isElementOfType } from '../utils'

interface ExtendedRadioProps extends IRadioProps {
  value: string | number
}

type RadioProps = Omit<
  ExtendedRadioProps,
  'checked' | 'defaultChecked' | 'onChange'
>

/**
 * SFC used to pass radio handle props to a RadioGroup.
 * This element is not rendered directly.
 */
export const Radio: React.SFC<RadioProps> = () => null
Radio.displayName = 'Radio'

type RadioValue = string | number

type Writer = (value: RadioValue) => StateTree

// We want to try to force only Radios to be our children
// But I'm pretty sure this doesn't actually work?
interface ExtendedRadioGroupProps extends IRadioGroupProps {
  children: React.ReactElement<RadioProps>[] | React.ReactElement<RadioProps>
  accessor: Accessor
  writer?: Writer
}

// Remove the props that we will handle
type RadioGroupProps = Omit<
  ExtendedRadioGroupProps,
  'onChange' | 'options' | 'selectedValue'
> &
  InjectedElectricityProps

type RadioGroupPropsPublic = Omit<
  ExtendedRadioGroupProps,
  'onChange' | 'options' | 'selectedValue'
>

function propsToRadioProps(props: RadioGroupProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, Radio) ? child.props : null,
  ).filter(child => child !== null) as Array<RadioProps>
}

class ElectricRadioGroup extends React.Component<RadioGroupProps> {
  public static readonly displayName = 'RadioGroup'
  static readonly accessorKeys = ['accessor']

  static generateAccessorsFromProps = (props: RadioGroupProps) => []

  defaultWriter = (value: RadioValue) => {
    const { accessor } = this.props

    if (typeof accessor !== 'string') {
      throw new Error(
        "The radio group needs a writer since the accessor isn't simple",
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

  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { write } = this.props

    const writer = this.getWriter()

    const radioPropsList = propsToRadioProps(this.props)

    const clickedValue = event.currentTarget.value

    let valueToWrite: string | number = clickedValue

    // Iterate over every child radio prop to see if we can find the actual type of the value
    radioPropsList.forEach(radioProps => {
      const radioValue = radioProps.value

      if (typeof radioValue === 'string') {
        valueToWrite = String(clickedValue)
        return
      }

      if (typeof radioValue === 'number') {
        valueToWrite = parseInt(clickedValue, 10)
        return
      }
    })

    const toWrite = writer(valueToWrite)

    write(toWrite, true)
  }

  getSelectedValue = () => {
    const { access } = this.props

    const value = access('accessor')

    return value
  }

  render() {
    const radioGroupProps = removeElectricProps(this.props, [
      'children',
      'writer',
      'accessor',
    ])

    const radioProps = propsToRadioProps(this.props)

    return (
      <RadioGroup
        onChange={this.handleChange}
        {...radioGroupProps}
        selectedValue={this.getSelectedValue()}
      >
        {radioProps.map((radioPropList, index) => {
          return <BlueprintRadio {...radioPropList} key={radioPropList.value} />
        })}
      </RadioGroup>
    )
  }
}

const RadioGroupWithElectricity = withElectricity(ElectricRadioGroup)
// The withElectricity HOC strips static methods that aren't part of react
// So we need to add the Radio manually and coax the types back to what we want
const RadioGroupWithRadio = RadioGroupWithElectricity as React.ComponentClass<
  RadioGroupPropsPublic
> & {
  Radio: typeof Radio
}
RadioGroupWithRadio.Radio = Radio

export default RadioGroupWithRadio
