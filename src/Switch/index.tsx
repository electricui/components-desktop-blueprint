import './index.css'

import {
  Accessor,
  deepObjectEquality,
  useAsyncThrow,
  useDeadline,
  useContainedState,
  useWriteState,
} from '@electricui/components-core'
import { SwitchProps as ISwitchProps, Switch } from '@blueprintjs/core'
import React, { useCallback, useMemo } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import classnames from 'classnames'
import { generateWriteErrHandler } from '../utils'

type UpstreamSwitchProps = Omit<ISwitchProps, 'checked' | 'onChange' | 'defaultChecked'>

interface CommonSwitchProps<T> extends UpstreamSwitchProps {
  /**
   * The checked value
   */
  checked: T
  /**
   * The unchecked value
   */
  unchecked: T
}

interface SwitchPropsSimpleAccessor<T> extends CommonSwitchProps<T> {
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

interface SwitchPropsFunctionalAccessor<T> extends CommonSwitchProps<T> {
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
 * Remove the ISwitchProps ones we don't want to show in the documentation
 * @remove checked
 * @remove onChange
 * @remove defaultChecked
 * @extends ISwitchProps
 */
interface SwitchPropsForDocs extends ISwitchProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a string, number or boolean.
   */
  accessor: Accessor
  /**
   * A writer to write the Checked state.
   *
   * If the accessor is a MessageID string this isn't required.
   */
  writer: (staging: Draft<ElectricUIDeveloperState>, value: any) => void
}

/**
 * Remove the ISwitchProps ones we don't want to show in the documentation
 * @remove onChange
 * @remove defaultChecked
 */
type SwitchProps<T> = SwitchPropsSimpleAccessor<T> | SwitchPropsFunctionalAccessor<T>

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
 * Switch
 * @module @electricui/components-desktop-blueprint
 * @name Switch
 * @props SwitchPropsForDocs
 */
function ElectricSwitch<T>(props: SwitchProps<T>) {
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

    throw new Error("If the Switch's accessor isn't a MessageID string, a writer must be provided")
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
    [writer, props.checked, props.unchecked],
  )

  const onChange = useCallback(() => {
    if (value.checked) {
      handleWriting(false)
      return
    }

    handleWriting(true)
  }, [value.checked])

  const classNames = classnames({ indeterminate: value.indeterminate }, props.className)

  return <Switch onChange={onChange} {...rest} checked={value.checked} className={classNames} />
}

export default ElectricSwitch
