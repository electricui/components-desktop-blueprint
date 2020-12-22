import {} from '@electricui/build-rollup-config'

import { Accessor, deepObjectEquality, useWriteState } from '@electricui/components-core'
import { IRadioGroupProps, IRadioProps, Radio, RadioGroup } from '@blueprintjs/core'
import React, { useCallback, useMemo } from 'react'
import { generateWriteErrHandler, isElementOfType } from '../utils'
import { useAsyncThrow, useDeadline, useContainedState } from '@electricui/components-core'

import { Draft } from 'immer'
import { Omit } from 'utility-types'

type UpstreamRadioProps = Omit<IRadioProps, 'checked' | 'defaultChecked' | 'onChange' | 'value'>

/**
 * Remove the IRadioProps ones we don't want to show in the documentation
 * @remove checked
 * @remove defaultChecked
 * @remove onChange
 */
interface RadioProps<T> extends UpstreamRadioProps {
  /**
   * The value that will be used to match against which Radio button is selected, and the value that will be written when this Radio button is selected.
   */
  value: T
}

/**
 * A Radio button
 * @module @electricui/components-desktop-blueprint
 * @name RadioGroup.Radio
 * @props RadioProps
 */
export function ElectricRadio<T>(props: RadioProps<T>) {
  return null
}
ElectricRadio.displayName = 'Radio'

// Remove the props that we will handle
type UpstreamRadioGroupProps = Omit<IRadioGroupProps, 'onChange' | 'options' | 'selectedValue'>

/**
 * RadioGroup Props
 * @remove onChange
 * @remove options
 * @remove selectedValue
 */
interface RadioGroupProps<T> extends UpstreamRadioGroupProps {
  /**
   * A radio button or an array of radio button.
   * @type <RadioGroup.Radio /> | <RadioGroup.Radio />[]
   */
  children: React.ReactElement<RadioProps<T>>[] | React.ReactElement<RadioProps<T>>
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a string or number for use in the RadioGroup.
   */
  accessor: Accessor
  /**
   * If the accessor is merely a messageID, this Writer is optional.
   * If the accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, value: T) => void
}

function propsToRadioProps<T>(props: RadioGroupProps<T>): Array<RadioProps<T>> {
  return React.Children.map(props.children, child =>
    isElementOfType(child, ElectricRadio) ? child.props : null,
  ).filter(child => child !== null)
}

/**
 * RadioGroup
 * @module @electricui/components-desktop-blueprint
 * @name RadioGroup
 * @props RadioGroupProps
 */
function ElectricRadioGroup<T>(props: RadioGroupProps<T>) {
  const { children, writer: writerProp, accessor, ...radioGroupProps } = props
  const radioProps = propsToRadioProps(props)

  const accessedState = useContainedState(accessor)
  const writeState = useWriteState()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  let selected = -1

  for (const [index, radio] of radioProps.entries()) {
    if (deepObjectEquality(accessedState, radio.value)) {
      selected = index
      break
    }
  }

  const writer = useMemo(() => {
    if (writerProp) {
      return writerProp
    }

    if (typeof accessor === 'string') {
      return (staging: Draft<ElectricUIDeveloperState>, value: T) => {
        staging[accessor] = value
      }
    }

    throw new Error("If the RadioGroup's accessor isn't a MessageID string, a writer must be provided")
  }, [writerProp, accessor])

  const handleWriting = useCallback(
    (value: T) => {
      const cancellationToken = getDeadline()

      writeState(
        draftState => {
          writer(draftState, value)
        },
        true,
        cancellationToken,
      ).catch(generateWriteErrHandler(asyncThrow))
    },
    [writer, getDeadline],
  )

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const index = (event.currentTarget as any).value

    const radio = radioProps[index] as RadioProps<T>

    if (radio) {
      handleWriting(radio.value)
    } else {
      console.warn("Clicked radiobutton but couldn't find the radio data?")
    }
  }

  return (
    <RadioGroup onChange={handleChange} {...radioGroupProps} selectedValue={selected === -1 ? undefined : selected}>
      {radioProps.map((radioPropList, index) => {
        const { value, ...cleanedPropList } = radioPropList

        return <Radio {...cleanedPropList} value={index} key={index} />
      })}
    </RadioGroup>
  )
}

ElectricRadioGroup.Radio = ElectricRadio

export default ElectricRadioGroup
