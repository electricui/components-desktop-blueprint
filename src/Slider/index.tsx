import {} from '@electricui/build-rollup-config'

import {
  FunctionalAccessor,
  useAsyncThrow,
  useCommitStateStaged,
  useDeadline,
  useHardwareState,
  usePushMessageIDs,
} from '@electricui/components-core'
import { IHandleProps, IMultiSliderProps, MultiSlider } from '@blueprintjs/core'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { generateWriteErrHandler, isElementOfType } from '../utils'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import throttle from 'lodash.throttle'
import { unstable_batchedUpdates } from 'react-dom'

type CommonHandleProps = Omit<IHandleProps, 'onChange' | 'onRelease' | 'value'>

/**
 * Slider Props
 * @remove onChange
 * @remove onRelease
 * @remove value
 */
interface SliderHandlePropsStringAccessor extends CommonHandleProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the SliderHandle.
   */
  accessor: string
  /**
   * If all the Slider's SliderHandles' Accessors are merely messageIDs, this name is optional.
   * If any Accessor is functional, then all SliderHandles need a name for their Accessor.
   * This name will be used as the key of a hashmap passed to the Slider's Writer, to convert the combination of all SliderHandle values into a StateTree to write to the device.
   */
  name?: string
}

interface SliderHandleProps extends CommonHandleProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the SliderHandle.
   *
   * This accessor is only for the interface state to prevent 'jumping' behaviour.
   */
  accessor: FunctionalAccessor<number>
  /**
   * If all the Slider's SliderHandles' Accessors are merely messageIDs, this name is optional.
   * If any Accessor is functional, then all SliderHandles need a name for their Accessor.
   * This name will be used as the key of a hashmap passed to the Slider's Writer, to convert the combination of all SliderHandle values into a StateTree to write to the device.
   */
  name: string
}

type HandleProps = SliderHandlePropsStringAccessor | SliderHandleProps

/**
 * A Slider handle
 * @module @electricui/components-desktop-blueprint
 * @name Slider.SliderHandle
 * @props SliderHandleProps
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ElectricSliderHandle(props: HandleProps) {
  return null
}
ElectricSliderHandle.displayName = 'SliderHandle'

type SliderValues = {
  [key: string]: number
}

type SliderPropsNoEventHandlers = Omit<IMultiSliderProps, 'onChange' | 'onRelease'>

interface CommonSliderProps extends SliderPropsNoEventHandlers {
  /**
   * If this is true, intermediate values while dragging will be added to the UI StateTree but not sent to the device. When the handle is released, the updated state will be written to the device.
   */
  sendOnlyOnRelease?: boolean
  /**
   * Throttle hardware updates to once every n milliseconds, by default 100ms.
   */
  throttleDuration?: number
}

interface SliderPropsWithWriter extends CommonSliderProps {
  /**
   * A Slider handle or an array of slider handles.
   * @type <Slider.SliderHandle /> | <Slider.SliderHandle />[]
   */
  children: React.ReactElement<HandleProps>[] | React.ReactElement<HandleProps>
  /**
   * If all the SliderHandles' Accessors are merely messageIDs, this Writer is optional.
   * If any Accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer: (staging: Draft<ElectricUIDeveloperState>, sliderValues: SliderValues) => void
}

/**
 * If all the Sliders have simple MessageID accessors, the writer is optional
 */
interface SliderPropsAutomaticWriter extends CommonSliderProps {
  /**
   * A Slider handle or an array of slider handles.
   * @type <Slider.SliderHandle /> | <Slider.SliderHandle />[]
   */
  children: React.ReactElement<SliderHandlePropsStringAccessor>[] | React.ReactElement<SliderHandlePropsStringAccessor>
  /**
   * If all the SliderHandles' Accessors are merely messageIDs, this Writer is optional.
   * If any Accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, sliderValues: SliderValues) => void
}

type SliderProps = SliderPropsWithWriter | SliderPropsAutomaticWriter

function propsToHandleProps(props: SliderProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, ElectricSliderHandle) ? child.props : null,
  ).filter(child => child !== null) as Array<HandleProps>
}

function handlePropsToAccessorKey(handleProps: Array<HandleProps>) {
  return handleProps.map(props => {
    if (typeof props.accessor !== 'string') {
      if (typeof props.name === 'undefined') {
        throw new Error('If a Slider Handle Accessor is a function it needs a name')
      }

      return props.name
    }

    return props.accessor
  })
}

function convertArrayValuesToHashmap(handleProps: Array<HandleProps>, values: number[]) {
  const childAccessorKeys = handlePropsToAccessorKey(handleProps)

  const sliderValues: { [key: string]: number } = {}

  // For each handle, get the value
  handleProps.forEach((props, index) => {
    sliderValues[childAccessorKeys[index]] = values[index]
  })

  return sliderValues
}

const defaultWriter = (staging: Draft<ElectricUIDeveloperState>, sliderValues: SliderValues) => {
  for (const messageID of Object.keys(sliderValues)) {
    staging[messageID] = sliderValues[messageID]
  }
}

/**
 * Slider
 * @module @electricui/components-desktop-blueprint
 * @name Slider
 * @props SliderPropsWithWriter
 */
function ElectricSlider(props: SliderProps) {
  const [focused, setFocused] = useState(false)
  const [localState, setLocalState] = useState<number[] | null>(null)
  const [generateStaging, commitStaged] = useCommitStateStaged()
  const pushMessageIDs = usePushMessageIDs()
  const messageIDsNeedAcking = useRef<Set<string>>(new Set())
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  const { children, writer: writerProp, ...sliderProps } = props

  const handleProps = propsToHandleProps(props)
  const childAccessorKeys = handlePropsToAccessorKey(handleProps)

  const lastUpdateID = useRef(0)
  const lastPushedUpdateID = useRef(0)

  let isValid = true

  // As long as we have the same amount of handles, this will call the same amount of useInterfaceState hooks
  const hardwareState = handleProps.map(handleProp => {
    const value = useHardwareState(handleProp.accessor)

    if (typeof value !== 'number') {
      isValid = false
    }

    return value
  })

  const writer = useMemo(() => {
    if (writerProp) {
      return writerProp
    }

    return defaultWriter
  }, [writerProp])

  const performWrite = useCallback(
    throttle(
      (values: number[], release: boolean) => {
        const sliderValues = convertArrayValuesToHashmap(handleProps, values)

        const staging = generateStaging() // Generate the staging
        writer(staging, sliderValues) // The writer mutates the staging into a 'staged'

        const messageIDs = commitStaged(staging)
        // If the handle is held down for more than `props.throttleDuration`ms, then the committed state
        // will be modified twice with the same values, the second time, no changes will be detected
        // but the message would not have been acked.
        // remembering the messageIDs that changed, we can force an ack later.
        for (const messageID of messageIDs) {
          messageIDsNeedAcking.current.add(messageID)
        }

        // Increment the last push ID
        lastUpdateID.current++

        if (props.sendOnlyOnRelease && !release) {
          return
        }

        // Create a deadline
        const cancellationToken = getDeadline()

        // Capture a copy of it
        const thisPushID = lastUpdateID.current

        // Only ack on release
        const pushPromise = pushMessageIDs(Array.from(messageIDsNeedAcking.current), release, cancellationToken).catch(
          generateWriteErrHandler(asyncThrow),
        )

        // Clear the messageIDs to ack on release
        if (release) {
          messageIDsNeedAcking.current.clear()

          // We already caught the promise, don't catch it again
          // eslint-disable-next-line promise/catch-or-return
          pushPromise.finally(() => {
            // When it's received by hardware, update our last push finished ID asyncronously, hold the focussed state until then
            lastPushedUpdateID.current = thisPushID
          })
        }
      },
      // throttle options
      props.throttleDuration ?? 100,
      { leading: true, trailing: true },
    ),
    // callback deps
    [writer, props.throttleDuration, props.sendOnlyOnRelease],
  )

  const handleChange = useCallback(
    (values: number[]) => {
      unstable_batchedUpdates(() => {
        // We're focused
        setFocused(true)
        setLocalState(values)
        performWrite(values, false)
      })
    },
    [performWrite],
  )

  const handleRelease = useCallback(
    (values: number[]) => {
      unstable_batchedUpdates(() => {
        // We're no longer focused
        setFocused(false)
        setLocalState(values)
        performWrite(values, true)
      })
    },
    [performWrite],
  )

  if (!isValid) {
    return <MultiSlider {...sliderProps} disabled={true} />
  }

  // If focused or if we're waiting on messages, use local state.
  const useLocalState = focused || lastUpdateID.current !== lastPushedUpdateID.current // prettier-ignore

  // Calculate which state to display
  const stateToDisplay = (useLocalState
    ? hardwareState.map((hardwareState, index) => {
        // we're focused, so grab the local state if we can instead
        if (localState) {
          return localState[index]
        }

        return hardwareState
      })
    : hardwareState) as number[] // nothing will be null by now, we bailed with the isValid check

  return (
    <MultiSlider onChange={handleChange} onRelease={handleRelease} {...sliderProps}>
      {handleProps.map((handlePropList, index) => {
        const { accessor, name, ...restHandle } = handlePropList
        const val = stateToDisplay[index]
        return <MultiSlider.Handle {...restHandle} value={val} key={childAccessorKeys[index]} />
      })}
    </MultiSlider>
  )
}

// Add the handle to the component
ElectricSlider.Handle = ElectricSliderHandle

export default ElectricSlider
