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
 * @remove clampValueOnBlur
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

  const numericInputProps = removeElectricProps(props, ['writer', 'clampValueOnBlur'])

  const lastUpdateID = useRef(0)
  const lastPushedUpdateID = useRef(0)
  const [lastUpdateIDState, setLastUpdateID] = useState(0)
  const [lastPushedUpdateIDState, setLastPushedUpdateID] = useState(0)

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

        setLastUpdateID(thisPushID)

        // We already caught the promise, don't catch it again
        // eslint-disable-next-line promise/catch-or-return
        pushPromise.finally(() => {
          // When it's received by hardware, update our last push finished ID asyncronously, hold the focussed state until then
          lastPushedUpdateID.current = thisPushID
          setLastPushedUpdateID(thisPushID)
        })
      },
      // throttle options
      props.throttleDuration ?? 100,
      { leading: true, trailing: true },
    ),
    // callback deps
    [writer, props.throttleDuration, setLastUpdateID, setLastPushedUpdateID],
  )

  const handleChange = useCallback(
    (value: number) => {
      unstable_batchedUpdates(() => {
        setLocalState(value)

        // Don't write if we have a minimum and it's below it
        if (typeof props.min !== 'undefined') {
          if (value < props.min) {
            return
          }
        }

        // Don't write if we have a maximum and it's above it
        if (typeof props.max !== 'undefined') {
          if (value > props.max) {
            return
          }
        }

        performWrite(value)
      })
    },
    [performWrite, setLocalState],
  )

  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [setFocused])

  const handleBlur = useCallback(() => {
    unstable_batchedUpdates(() => {
      setFocused(false)

      // Check if we went below the minimum, correct if we did and write
      if (typeof props.min !== 'undefined') {
        if (localState < props.min) {
          const min = props.min // capture in a closure

          setLocalState(min)
          performWrite(min)
          return
        }
      }

      // Check if we went above the maximum, correct if we did and write
      if (typeof props.max !== 'undefined') {
        if (localState > props.max) {
          const max = props.max
          setLocalState(max)
          performWrite(max)
          return
        }
      }
    })
  }, [setFocused])

  // If focused or if we're waiting on messages, use local state.
  const useLocalState = focused || lastUpdateIDState !== lastPushedUpdateIDState // prettier-ignore

  // Calculate which state to display
  const value = useLocalState ? localState : hardwareState ?? 0

  return (
    <>
      <NumericInput
        onValueChange={handleChange}
        {...numericInputProps}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        clampValueOnBlur
      />
    </>
  )
}

export default ElectricNumberInput
