import {
  Accessor,
  deepObjectEquality,
  useAsyncThrow,
  useDeadline,
  useContainedState,
  useWriteState,
} from '@electricui/components-core'
import { Checkbox, CheckboxProps as ICheckboxProps } from '@blueprintjs/core'
import React, { useCallback, useMemo } from 'react'

import { Draft } from 'immer'

import { generateWriteErrHandler } from '../utils'

type UpstreamCheckboxProps = Omit<ICheckboxProps, 'checked' | 'onChange' | 'defaultChecked'>

interface CommonCheckboxProps<T> extends UpstreamCheckboxProps {
  /**
   * The checked value
   */
  checked: T
  /**
   * The unchecked value
   */
  unchecked: T
}

interface CheckboxPropsSimpleAccessor<T> extends CommonCheckboxProps<T> {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a string, number or boolean.
   */
  accessor: string
  /**
   * A writer to write the Checked state.
   *
   * If the accessor is a MessageID string this isn't required.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, value: T) => void
}

interface CheckboxPropsFunctionalAccessor<T> extends CommonCheckboxProps<T> {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a string, number or boolean.
   */
  accessor: Accessor<T>
  /**
   * A writer to write the Checked state.
   *
   * If the accessor is a MessageID string this isn't required.
   */
  writer: (staging: Draft<ElectricUIDeveloperState>, value: T) => void
}

/**
 * Remove the ICheckboxProps ones we don't want to show in the documentation
 * @remove onChange
 * @remove defaultChecked
 */
type CheckboxProps<T> = CheckboxPropsSimpleAccessor<T> | CheckboxPropsFunctionalAccessor<T>

function valueFromCheckedUnchecked(checked: boolean | null, unchecked: boolean | null) {
  if (checked) {
    return {
      checked: true,
      indeterminate: false,
    }
  }

  if (unchecked) {
    return {
      checked: false,
      indeterminate: false,
    }
  }

  return {
    checked: false,
    indeterminate: true,
  }
}

/**
 * Checkbox
 * @module @electricui/components-desktop-blueprint
 * @name Checkbox
 * @props CheckboxPropsFunctionalAccessor
 */
function ElectricCheckbox<T>(props: CheckboxProps<T>) {
  const { checked, unchecked, writer: writerProp, accessor, ...rest } = props

  // this will cause a re-update every time the messageID changes,
  // even if it doesn't cause a checked or unchecked state change.
  const accessedState = useContainedState(accessor)
  const writeState = useWriteState()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  // calculate if we are checked, unchecked or indeterminate
  const value = valueFromCheckedUnchecked(
    deepObjectEquality(accessedState, props.checked),
    deepObjectEquality(accessedState, props.unchecked),
  )

  // the writer
  const writer = useMemo(() => {
    if (writerProp) {
      return writerProp
    }

    if (typeof accessor === 'string') {
      return (staging: Draft<ElectricUIDeveloperState>, value: T) => {
        staging[accessor] = value
      }
    }

    throw new Error("If the Checkbox's accessor isn't a MessageID string, a writer must be provided")
  }, [writerProp, accessor])

  const handleWriting = useCallback(
    (writeChecked: boolean) => {
      const cancellationToken = getDeadline()

      writeState(
        draftState => {
          writer(draftState, writeChecked ? props.checked : props.unchecked)
        },
        true,
        cancellationToken,
      ).catch(generateWriteErrHandler(asyncThrow))
    },
    [writer, getDeadline, props.checked, props.unchecked],
  )

  const onChange = useCallback(() => {
    if (value.checked) {
      handleWriting(false)
      return
    }

    handleWriting(true)
  }, [value.checked])

  return <Checkbox onChange={onChange} {...rest} {...value} />
}

export default ElectricCheckbox
