import {
  Accessor,
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  withElectricity,
} from '@electricui/components-core'
import { IHandleProps, IMultiSliderProps, MultiSlider } from '@blueprintjs/core'
import React, { Component } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import { isElementOfType } from '../utils'

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 * @remove value
 */
interface ExtendedSliderHandleProps extends IHandleProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the SliderHandle.
   */
  accessor: Accessor
  /**
   * If all the Slider's SliderHandles' Accessors are merely messageIDs, this name is optional.
   * If any Accessor is functional, then all SliderHandles need a name for their Accessor.
   * This name will be used as the key of a hashmap passed to the Slider's Writer, to convert the combination of all SliderHandle values into a StateTree to write to the device.
   */
  name?: string
}

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
export class ElectricSliderHandle extends React.Component<HandleProps> {
  static readonly displayName = 'SliderHandle'
}

type SliderValues = {
  [key: string]: number
}

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 */
interface ExtendedSliderProps extends IMultiSliderProps {
  /**
   * A Slider handle or an array of slider handles.
   * @type <Slider.SliderHandle /> | <Slider.SliderHandle />[]
   */
  children: React.ReactElement<HandleProps>[] | React.ReactElement<HandleProps>
  /**
   * If all the SliderHandles' Accessors are merely messageIDs, this Writer is optional.
   * If any Accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer?: (
    staging: Draft<ElectricUIDeveloperState>,
    sliderValues: SliderValues,
  ) => void
  /**
   * If this is true, intermediate values while dragging will be added to the UI StateTree but not sent to the device. When the handle is released, the StateTree will be written to the device.
   */
  sendOnlyOnRelease?: boolean
}

// Remove the props that we will handle
type SliderProps = Omit<ExtendedSliderProps, 'onChange' | 'onRelease'> &
  InjectedElectricityProps

type SliderPropsPublic = Omit<ExtendedSliderProps, 'onChange' | 'onRelease'>

interface MutableReaderState {
  mutableValues: number[]
  focused: boolean
}

function propsToHandleProps(props: SliderProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, ElectricSliderHandle) ? child.props : null,
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
class ElectricSlider extends React.Component<SliderProps, MutableReaderState> {
  public static readonly displayName = 'Slider'
  static readonly accessorKeys = []
  state: MutableReaderState = {
    mutableValues: [],
    focused: false,
  }

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

  defaultWriter = (
    staging: Draft<ElectricUIDeveloperState>,
    sliderValues: SliderValues,
  ) => {
    for (const messageID of Object.keys(sliderValues)) {
      staging[messageID] = sliderValues[messageID]
    }
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

  getLocalValue = () => {
    return this.state.mutableValues
  }

  getFocused = () => {
    return this.state.focused
  }

  /**
   * We maintain a local state while the user is focused so we don't have "jumping" behaviour
   */
  setLocalValue = (values: number[]) => {
    this.setState({ mutableValues: values, focused: true })
  }

  handleChange = (values: number[]) => {
    const {
      commitStaged,
      writeStaged,
      generateStaging,
      sendOnlyOnRelease,
    } = this.props

    const sliderValues = this.convertArrayValuesToHashmap(values)

    const writer = this.getWriter()

    const staging = generateStaging() // Generate the staging
    writer(staging, sliderValues) // The writer mutates the staging into a 'staged'

    if (sendOnlyOnRelease) {
      commitStaged(staging)
      return
    }

    writeStaged(staging, false)

    this.setLocalValue(values)
  }

  handleRelease = (values: number[]) => {
    const { writeStaged, generateStaging } = this.props
    const sliderValues = this.convertArrayValuesToHashmap(values)

    const writer = this.getWriter()
    const staging = generateStaging() // Generate the staging
    writer(staging, sliderValues) // The writer mutates the staging into a 'staged'

    writeStaged(staging, true)

    this.setState({ focused: false })
  }

  getValues = () => {
    // Grab the handle props
    const handleProps = propsToHandleProps(this.props)
    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    const { access } = this.props

    const sliderValues: { [key: string]: number } = {}

    // For each handle, get the value
    handleProps.forEach((props, index) => {
      sliderValues[childAccessorKeys[index]] = access(childAccessorKeys[index])
    })

    return sliderValues
  }

  getChildProps = () => {
    return React.Children.map(this.props.children, child =>
      isElementOfType(child, ElectricSliderHandle) ? child.props : null,
    ).filter(child => child !== null)
  }

  /**
   * Get the initial state
   */
  static getDerivedStateFromProps(
    props: SliderProps,
    state: MutableReaderState,
  ) {
    const handleProps = propsToHandleProps(props)
    const childAccessorKeys = handlePropsToAccessorKey(handleProps)

    const { access } = props

    const sliderValues: { [key: string]: number } = {}

    // For each handle, get the value
    handleProps.forEach((props, index) => {
      sliderValues[childAccessorKeys[index]] = access(childAccessorKeys[index])
    })

    return {
      focused: false,
      mutableValues: sliderValues,
    }
  }

  // onTouchStart onTouchEnd

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
          const value = this.getFocused()
            ? this.getValues()[index]
            : access(key)

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

const SliderWithElectricity = withElectricity(ElectricSlider)
// The withElectricity HOC strips static methods that aren't part of react
// So we need to add the Handle manually and coax the types back to what we want
const SliderWithHandle = SliderWithElectricity as React.ComponentClass<
  SliderPropsPublic
> & {
  Handle: typeof ElectricSliderHandle
}
SliderWithHandle.Handle = ElectricSliderHandle

export default SliderWithHandle
