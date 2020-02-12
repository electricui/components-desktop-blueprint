import {
  Accessor,
  InjectedElectricityProps,
  StateTree,
  removeElectricProps,
  useHardwareState,
  useWriteState,
  withElectricity,
} from '@electricui/components-core'
import { Checkbox, ICheckboxProps } from '@blueprintjs/core'
import React, { Component, useCallback } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'

type UpstreamCheckboxProps = Omit<
  ICheckboxProps,
  | 'checked'
  | 'defaultIndeterminate'
  | 'indeterminate'
  | 'onChange'
  | 'defaultChecked'
>

/**
 * Remove the ICheckboxProps ones we don't want to show in the documentation
 * @remove defaultIndeterminate
 * @remove indeterminate
 * @remove onChange
 * @remove defaultChecked
 */
interface CheckboxProps extends UpstreamCheckboxProps {
  /**
   * An accessor to determine if the checkbox is in a 'checked' state.
   * If the result is truthy, the checkbox is considered 'checked'.
   */
  checked: Accessor<boolean>
  /**
   * An accessor to determine if the checkbox is in an 'uchecked' state.
   * If the result is truthy, the checkbox is considered 'uchecked'.
   */
  unchecked: Accessor<boolean>
  /**
   * A writer to write the Checked state.
   */
  writeChecked: ((staging: Draft<ElectricUIDeveloperState>) => void) | StateTree
  /**
   * A writer to write the Unchecked state.
   */
  writeUnchecked:
    | ((staging: Draft<ElectricUIDeveloperState>) => void)
    | StateTree
}

function valueFromCheckedUnchecked(
  checked: boolean | null,
  unchecked: boolean | null,
) {
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
 * @module components-desktop-blueprint
 * @name Checkbox
 * @props CheckboxProps
 */
function ElectricCheckbox(props: CheckboxProps) {
  const checked = useHardwareState(props.checked)
  const unchecked = useHardwareState(props.unchecked)
  const value = valueFromCheckedUnchecked(checked, unchecked)
  const writeState = useWriteState()

  const handleWriting = useCallback(
    (checked: boolean) => {
      writeState(checked ? props.writeUnchecked : props.writeChecked, true)
    },
    [props.writeChecked, props.writeUnchecked],
  )

  const onChange = useCallback(() => {
    if (value.checked) {
      handleWriting(false)
      return
    }

    handleWriting(true)
  }, [checked, unchecked])

  const rest = removeElectricProps(props, [
    'checked',
    'unchecked',
    'writeChecked',
    'writeUnchecked',
  ])

  return <Checkbox onChange={onChange} {...rest} {...value} />
}

export default ElectricCheckbox
