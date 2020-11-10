import {} from '@electricui/build-rollup-config'

import {
  Accessor,
  removeElectricProps,
  useAsyncThrow,
  useCommitStateStaged,
  useDeadline,
  useHardwareState,
  usePushMessageIDs,
} from '@electricui/components-core'
import { INumericInputProps, NumericInput } from '@blueprintjs/core'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import { generateWriteErrHandler } from '../utils'
import throttle from 'lodash.throttle'
import { unstable_batchedUpdates } from 'react-dom'

type UpstreamNumberInputProps = Omit<INumericInputProps, 'onValueChange' | 'value'>

/**
 * Remove the IInputGroupProps ones we don't want to show in the documentation
 * @remove defaultValue
 * @remove onChange
 * @remove value
 */
interface NumberInputProps extends UpstreamNumberInputProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the TextInput.
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
  throttleDuration?: number
  /**
   * Limit the maximum length of the string. This does not take into consideration any null bytes required, etc.
   */
  maxLength?: number
}

/**
 * NumberInput
 * @module @electricui/components-desktop-blueprint
 * @name NumberInput
 * @props NumberInputProps
 */
function ElectricNumberInput(props: NumberInputProps) {
  const [focused, setFocused] = useState(false)
  const hardwareState = useHardwareState<number>(props.accessor)
  const [localState, setLocalState] = useState<number>(hardwareState ?? 0)
  const [generateStaging, commitStaged] = useCommitStateStaged()
  const pushMessageIDs = usePushMessageIDs()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  const numericInputProps = removeElectricProps(props, ['writer'])

  const lastUpdateID = useRef(0)
  const lastPushedUpdateID = useRef(0)

  const writer = useMemo(() => {
    if (props.writer) {
      return props.writer
    }

    if (typeof props.accessor === 'string') {
      return (staging: Draft<ElectricUIDeveloperState>, value: number) => {
        staging[props.accessor as string] = value
      }
    }

    throw new Error("If the NumberInput's accessor isn't a MessageID string, a writer must be provided")
  }, [props.writer, props.accessor])

  const performWrite = useCallback(
    throttle(
      (value: number) => {
        const staging = generateStaging() // Generate the staging
        writer(staging, value) // The writer mutates the staging into a 'staged'

        const messageIDs = commitStaged(staging)

        // Increment the last push ID
        lastUpdateID.current++

        // Create a deadline
        const cancellationToken = getDeadline()

        // Capture a copy of it
        const thisPushID = lastUpdateID.current

        // Only ack on release
        const pushPromise = pushMessageIDs(messageIDs, true, cancellationToken).catch(
          generateWriteErrHandler(asyncThrow),
        )

        // We already caught the promise, don't catch it again
        // eslint-disable-next-line promise/catch-or-return
        pushPromise.finally(() => {
          // When it's received by hardware, update our last push finished ID asyncronously, hold the focussed state until then
          lastPushedUpdateID.current = thisPushID
        })
      },
      // throttle options
      props.throttleDuration ?? 100,
      { leading: false, trailing: true },
    ),
    // callback deps
    [writer, props.throttleDuration],
  )

  const handleChange = useCallback(
    (value: number) => {
      unstable_batchedUpdates(() => {
        setLocalState(value)
        performWrite(value)
      })
    },
    [performWrite, setLocalState],
  )

  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [setFocused])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [setFocused])

  // If focused or if we're waiting on messages, use local state.
  const useLocalState = focused || lastUpdateID.current !== lastPushedUpdateID.current // prettier-ignore

  // Calculate which state to display
  const value = useLocalState ? localState : hardwareState ?? 0

  return (
    <NumericInput
      onValueChange={handleChange}
      {...numericInputProps}
      value={value}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export default ElectricNumberInput
