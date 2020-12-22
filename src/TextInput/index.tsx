import {} from '@electricui/build-rollup-config'

import {
  Accessor,
  useAsyncThrow,
  useCommitStateStaged,
  useDeadline,
  useHardwareState,
  usePushMessageIDs,
} from '@electricui/components-core'
import { IInputGroupProps, InputGroup } from '@blueprintjs/core'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import { generateWriteErrHandler } from '../utils'
import throttle from 'lodash.throttle'
import { unstable_batchedUpdates } from 'react-dom'

type UpstreamTextInputProps = Omit<IInputGroupProps, 'defaultValue' | 'onChange' | 'value'>

/**
 * Remove the IInputGroupProps ones we don't want to show in the documentation
 * @remove defaultValue
 * @remove onChange
 * @remove value
 */
interface TextInputProps extends UpstreamTextInputProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the TextInput.
   */
  accessor: Accessor
  /**
   * If the accessor is merely a messageID, this Writer is optional.
   * If the accessor is functional, then this writer must be used to mutate the StateTree for writing to the device.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, value: string) => void
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
 * TextInput
 * @module @electricui/components-desktop-blueprint
 * @name TextInput
 * @props TextInputProps
 */
function ElectricTextInput(props: TextInputProps) {
  const [focused, setFocused] = useState(false)
  const hardwareState = useHardwareState<string>(props.accessor)
  const [localState, setLocalState] = useState<string>(hardwareState ?? '')
  const [generateStaging, commitStaged] = useCommitStateStaged()
  const pushMessageIDs = usePushMessageIDs()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  const { writer: writerProp, ...textProps } = props

  const lastUpdateID = useRef(0)
  const lastPushedUpdateID = useRef(0)

  const writer = useMemo(() => {
    if (writerProp) {
      return writerProp
    }

    if (typeof props.accessor === 'string') {
      return (staging: Draft<ElectricUIDeveloperState>, value: string) => {
        staging[props.accessor as string] = value
      }
    }

    throw new Error("If the TextBox's accessor isn't a MessageID string, a writer must be provided")
  }, [writerProp, props.accessor])

  const performWrite = useCallback(
    throttle(
      (value: string) => {
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
      { leading: true, trailing: true },
    ),
    // callback deps
    [writer, props.throttleDuration],
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      unstable_batchedUpdates(() => {
        let value = (event.currentTarget as any).value

        if (props.maxLength && value.length >= props.maxLength) {
          value = value.slice(0, props.maxLength - 1)
        }

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
  const value = useLocalState ? localState : hardwareState ?? ''

  return <InputGroup onChange={handleChange} {...textProps} value={value} onFocus={handleFocus} onBlur={handleBlur} />
}

export default ElectricTextInput
