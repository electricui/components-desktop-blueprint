import React, { Component } from 'react'
import { Omit } from 'utility-types'

import { IHandleProps, IMultiSliderProps, MultiSlider } from '@blueprintjs/core'
import {
  removeElectricProps,
  withElectricity,
  Accessor,
  InjectedElectricityProps,
  StateTree,
} from '@electricui/components-core'

import { isElementOfType } from '../utils'

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 */
interface ExtendedSliderHandleProps extends IHandleProps {
  accessor: Accessor
  name?: string
}

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 */
type HandleProps = Omit<
  ExtendedSliderHandleProps,
  'onChange' | 'onRelease' | 'value'
>

/**
 * A Slider handle
 * @module components-desktop-blueprint
 * @name Slider.SliderHandle
 * @props ExtendedSliderHandleProps
 */
export class SliderHandle extends React.Component<HandleProps> {
  static readonly displayName = 'SliderHandle'
}

type SliderValues = {
  [key: string]: number
}

type Writer = (sliderValues: SliderValues) => StateTree

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 * @grab ExtendedSliderHandleProps
 */
interface ExtendedSliderProps extends IMultiSliderProps {
  /**
   * A Slider handle or an array of slider handles.
   * @type <SliderHandle /> | <SliderHandle />[]
   */
  children: React.ReactElement<HandleProps>[] | React.ReactElement<HandleProps>
  writer?: Writer
  sendOnlyOnRelease?: boolean
}

// Remove the props that we will handle
type SliderProps = Omit<ExtendedSliderProps, 'onChange' | 'onRelease'> &
  InjectedElectricityProps

type SliderPropsPublic = Omit<ExtendedSliderProps, 'onChange' | 'onRelease'>

function propsToHandleProps(props: SliderProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, SliderHandle) ? child.props : null,
  ).filter(child => child !== null) as Array<HandleProps>
}

function handlePropsToAccessorKey(handleProps: Array<HandleProps>) {
  return handleProps.map(props => {
    if (typeof props.accessor !== 'string') {
      if (typeof props.name === 'undefined') {
        console.error(
          'If a Slider Handle Accessor is a function it needs a name',
        )

        return 'unknown'
      }

      return props.name
    }

    return props.accessor
  })
}

/**
 * Slider
 * @module components-desktop-blueprint
 * @name Slider
 * @props ExtendedSliderProps
 */
class Slider extends React.Component<SliderProps> {
  public static readonly displayName = 'Slider'
  static readonly accessorKeys = []

  static generateAccessorsFromProps = (props: SliderProps) => {
    // Iterate over this components children
    // If the child is a handle, grab its props
    // filter out non-handles
    const handleProps = propsToHandleProps(props)

    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    const accessorObjects = handleProps.map((props, index) => ({
      accessorKey: childAccessorKeys[index],
      accessor: props.accessor,
    }))

    return accessorObjects
  }

  defaultWriter = (sliderValues: SliderValues) => {
    return sliderValues
  }

  getWriter = () => {
    const { writer } = this.props

    if (writer) {
      return writer
    }

    return this.defaultWriter
  }

  convertArrayValuesToHashmap = (values: number[]) => {
    const handleProps = propsToHandleProps(this.props)
    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    const sliderValues: { [key: string]: number } = {}

    // For each handle, get the value
    handleProps.forEach((props, index) => {
      sliderValues[childAccessorKeys[index]] = values[index]
    })

    return sliderValues
  }

  handleChange = (values: number[]) => {
    const { commit, write, sendOnlyOnRelease } = this.props

    const sliderValues = this.convertArrayValuesToHashmap(values)

    const writer = this.getWriter()
    const toWrite = writer(sliderValues)

    if (sendOnlyOnRelease) {
      commit(toWrite)
      return
    }

    write(toWrite, false)
  }

  handleRelease = (values: number[]) => {
    const { write } = this.props
    const sliderValues = this.convertArrayValuesToHashmap(values)

    const writer = this.getWriter()
    const toWrite = writer(sliderValues)

    write(toWrite, true)
  }

  getValues = () => {
    // Grab the handle props
    const handleProps = propsToHandleProps(this.props)
    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    const { access } = this.props

    const sliderValues: { [key: string]: number } = {}

    // For each handle, get the value
    const values = handleProps.forEach(
      (props, index) =>
        (sliderValues[childAccessorKeys[index]] = access(
          childAccessorKeys[index],
        )),
    )

    return sliderValues
  }

  getChildProps = () => {
    return React.Children.map(this.props.children, child =>
      isElementOfType(child, SliderHandle) ? child.props : null,
    ).filter(child => child !== null)
  }

  render() {
    const { access } = this.props

    const sliderProps = removeElectricProps(this.props, ['children', 'writer'])

    const handleProps = propsToHandleProps(this.props)
    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    let isValid = true

    handleProps.forEach((handlePropList, index) => {
      const value = access(childAccessorKeys[index])

      if (typeof value !== 'number') {
        isValid = false
      }
    })

    if (!isValid) {
      return <MultiSlider {...sliderProps} disabled={true} />
    }

    return (
      <MultiSlider
        onChange={this.handleChange}
        onRelease={this.handleRelease}
        {...sliderProps}
      >
        {handleProps.map((handlePropList, index) => {
          const key = childAccessorKeys[index]
          const value = access(key)

          if (typeof value !== 'number') {
            return null
          }

          const { accessor, name, ...restHandle } = handlePropList
          return <MultiSlider.Handle {...restHandle} value={value} key={key} />
        })}
      </MultiSlider>
    )
  }
}

const SliderWithElectricity = withElectricity(Slider)
// The withElectricity HOC strips static methods that aren't part of react
// So we need to add the Handle manually and coax the types back to what we want
const SliderWithHandle = SliderWithElectricity as React.ComponentClass<
  SliderPropsPublic
> & {
  Handle: typeof SliderHandle
}
SliderWithHandle.Handle = SliderHandle

export default SliderWithHandle
