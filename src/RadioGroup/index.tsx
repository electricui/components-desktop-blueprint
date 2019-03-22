import React, { Component } from 'react'
import { Omit } from 'utility-types'

import {
  IRadioGroupProps,
  IRadioProps,
  Radio,
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

type UpstreamRadioProps = Omit<
  IRadioProps,
  'checked' | 'defaultChecked' | 'onChange'
>

/**
 * Remove the IRadioProps ones we don't want to show in the documentation
 * @remove checked
 * @remove defaultChecked
 * @remove onChange
 */
interface RadioProps extends UpstreamRadioProps {
  /**
   * The value that will be used to match against which Radio button is selected, and the value that will be written when this Radio button is selected.
   */
  value: string | number
}

/**
 * A Radio button
 * @module components-desktop-blueprint
 * @name RadioGroup.Radio
 * @props RadioProps
 */
export class ElectricRadio extends React.Component<RadioProps> {
  static readonly displayName = 'Radio'
}

type RadioValue = string | number

type Writer = (value: RadioValue) => StateTree

// We want to try to force only Radios to be our children
// But I'm pretty sure this doesn't actually work?

// Remove the props that we will handle
type UpstreamRadioGroupProps = Omit<
  IRadioGroupProps,
  'onChange' | 'options' | 'selectedValue'
>

/**
 * RadioGroup Props
 * @remove onChange
 * @remove options
 * @remove selectedValue
 */
interface RadioGroupProps extends UpstreamRadioGroupProps {
  /**
   * A radio button or an array of radio button.
   * @type <RadioGroup.Radio /> | <RadioGroup.Radio />[]
   */
  children: React.ReactElement<RadioProps>[] | React.ReactElement<RadioProps>
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a string or number for use in the RadioGroup.
   */
  accessor: Accessor
  /**
   * If the accessor is merely a messageID, this Writer is optional. If the Accessor is functional, then this writer must be used to transform the value from the Radio button selected into a StateTree for writing to the device.
   */
  writer?: Writer
}

function propsToRadioProps(props: RadioGroupProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, ElectricRadio) ? child.props : null,
  ).filter(child => child !== null) as Array<RadioProps>
}

/**
 * RadioGroup
 * @module components-desktop-blueprint
 * @name RadioGroup
 * @props RadioGroupProps
 */
class ElectricRadioGroup extends React.Component<
  RadioGroupProps & InjectedElectricityProps
> {
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
          return <Radio {...radioPropList} key={radioPropList.value} />
        })}
      </RadioGroup>
    )
  }
}

const RadioGroupWithElectricity = withElectricity(ElectricRadioGroup)
// The withElectricity HOC strips static methods that aren't part of react
// So we need to add the Radio manually and coax the types back to what we want
const RadioGroupWithRadio = RadioGroupWithElectricity as React.ComponentClass<
  RadioGroupProps
> & {
  Radio: typeof ElectricRadio
}
RadioGroupWithRadio.Radio = ElectricRadio

export default RadioGroupWithRadio
