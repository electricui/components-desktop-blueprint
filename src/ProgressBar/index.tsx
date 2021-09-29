import { Accessor, useContainedState } from '@electricui/components-core'
import { ProgressBarProps as IProgressBarProps, ProgressBar } from '@blueprintjs/core'

import { Omit } from 'utility-types'
import React from 'react'

type UpstreamProgressBarProps = Omit<IProgressBarProps, 'value' | 'stripes'>

interface ProgressBarProps extends UpstreamProgressBarProps {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number for use in the SliderHandle.
   */
  accessor: Accessor

  /**
   * The minimum value
   */
  min?: number
  /**
   * The maximum value
   */
  max?: number
  /**
   * Whether to display the progress bar with stripes or not
   */
  stripes?: boolean
}

/**
 * ProgressBar
 * @module @electricui/components-desktop-blueprint
 * @name ProgressBar
 * @props ProgressBarProps
 */
export default function ElectricProgressBar(props: ProgressBarProps) {
  const { min, max, accessor, stripes, ...rest } = props
  const value = useContainedState(accessor)

  const minWithDefault = min ?? 0
  const maxWithDefault = max ?? 1
  const stripesWithDefaults = stripes ?? false

  const clamped = (value - minWithDefault) / (maxWithDefault - minWithDefault)

  return <ProgressBar {...rest} value={clamped} stripes={stripesWithDefaults} />
}
