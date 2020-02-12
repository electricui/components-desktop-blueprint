import {
  Accessor,
  StateTree,
  removeElectricProps,
  useHardwareState,
  useWriteState,
} from '@electricui/components-core'
import { ISwitchProps, Switch } from '@blueprintjs/core'
import React, { useCallback } from 'react'

import { Draft } from 'immer'
import { Omit } from 'utility-types'
import classnames from 'classnames'

type UpstreamSwitchProps = Omit<
  ISwitchProps,
  'checked' | 'onChange' | 'defaultChecked'
>

/**
 * Remove the ISwitchProps ones we don't want to show in the documentation
 * @remove onChange
 * @remove defaultChecked
 */
interface SwitchProps extends UpstreamSwitchProps {
  /**
   * An accessor to determine if the switch is in a 'on' state.
   * If the result is truthy, the switch is considered 'on'.
   */
  checked: Accessor<boolean>
  /**
   * An accessor to determine if the switch is in an 'off' state.
   * If the result is truthy, the switch is considered 'off'.
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
 * Switch
 * @module components-desktop-blueprint
 * @name Switch
 * @props SwitchProps
 */
function ElectricSwitch(props: SwitchProps) {
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
  }, [checked, unchecked]) // value is derived from checked and unchecked

  const rest = removeElectricProps(props, [
    'checked',
    'unchecked',
    'writeChecked',
    'writeUnchecked',
  ])

  const classNames = classnames(
    { indeterminate: value.indeterminate },
    props.className,
  )

  return (
    <Switch
      onChange={onChange}
      {...rest}
      checked={value.checked}
      className={classNames}
    />
  )
}

export default ElectricSwitch
