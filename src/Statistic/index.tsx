import React, { ReactNode } from 'react'
import { isElementOfType } from '../utils'
import './index.css'

import { Accessor } from '@electricui/components-core'
import { Printer } from '@electricui/components-desktop'

/*
  <Statistics>
    <Statistic>
      <Statistic.Value suffix="º">23</Statistic.Value>
      <Statistic.Label>Temp 1</Statistic.Label>
    </Statistic>
    <Statistic
      value={26}
      label="Temp 2"
      suffix="º"
      color={Colors.BLUE3}
    />
    <Statistic value={22} label="Temp 3" suffix="º" />
    <Statistic value={22} label="Temp 4" suffix="º" />
    <Statistic value={22} label="Temp 5" suffix="º" />
    <Statistic value={22} label="Temp 6" suffix="º" />
  </Statistics>
 */

export interface StatisticsProps {
  /** The Statistic components to evenly space. If the Statistic components are not direct children, remember to set their inGroupOf prop so that they are spaced evenly.*/
  children:
    | React.ReactElement<StatisticProps>[]
    | React.ReactElement<StatisticProps>

    /** The css compatible colour for the statistics. */
  color?: string
}

export interface StatisticProps {
  /**
   * The <Statistic.Value /> and <Statistic.Label /> components.
   */
  children?: ReactNode | ReactNode[]

  /**
   * The number value to display. Takes precedence over <Statistic.Value /> and <Statistic.Label /> component children.
   */
  value?: string | number | ReactNode

  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number. Takes precedence over the value prop.
   */
  accessor?: Accessor

  /** The label text. */
  label?: string | number | ReactNode

  /** An optional prefix for the value. */
  prefix?: string | ReactNode

  /** An optional suffix for the value. */
  suffix?: string | ReactNode

  /** Any custom styling to apply to the component. */
  style?: React.CSSProperties

  /** The css compatible colour for the statistic. */
  color?: string

  /** The amount of Statistic children of a Statistics wrapper in a line to evenly space them apart. */
  inGroupOf?: number
}

export interface StatisticLabelProps {
  /** The label text. */
  children: ReactNode
}

export interface StatisticValueProps {
  /** The value text. */
  children?: string | number | ReactNode
  
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns a number. Takes precedence over children.
   */
  accessor?: Accessor

  /** An optional prefix for the value. */
  prefix?: string | ReactNode

  /** An optional suffix for the value. */
  suffix?: string | ReactNode
}

/**
 * Statistic Label
 * @module components-desktop-blueprint
 * @name Statistic.Label
 * @props StatisticLabelProps
 */
const StatisticLabel = (props: StatisticLabelProps) => {
  return <div className="label" {...props} />
}

/**
 * Statistic Value
 * @module components-desktop-blueprint
 * @name Statistic.Value
 * @props StatisticValueProps
 */
const StatisticValue = (props: StatisticValueProps) => {
  const { children, suffix, prefix, ...rest } = props

  let val = props.children
  if (props.accessor) {
    val = <Printer accessor={props.accessor} />
  }

  return (
    <div className="value" {...rest}>
      {prefix}
      {val}
      {suffix}
    </div>
  )
}

/**
 * Statistic
 * @module components-desktop-blueprint
 * @name Statistic
 * @props StatisticProps
 */
const Statistic = (props: StatisticProps) => {
  const mixedStyle = props.style || {}

  if (props.inGroupOf) {
    mixedStyle.minWidth = `${100 / props.inGroupOf}%`
  }

  mixedStyle.color = props.color

  let val = props.value
  if (props.accessor) {
    val = <Printer accessor={props.accessor} />
  }

  if (props.children) {
    const { children, ...rest } = props
    return (
      <div className="eui statistic" style={mixedStyle}>
        {children}
      </div>
    )
  } else {
    return (
      <div className="eui statistic" style={mixedStyle}>
        <StatisticValue
          suffix={props.suffix}
          prefix={props.prefix}
          accessor={props.accessor}
          children={val || undefined}
        />
        <StatisticLabel>{props.label}</StatisticLabel>
      </div>
    )
  }
}

Statistic.Label = StatisticLabel
Statistic.Value = StatisticValue
Statistic.displayName = 'Statistic'

/*
  Statistics will auto count their children if they're _exactly_ Statistic components.
  If they're a different component they can't be counted or style injected.

  In which case the Statistic will need to include its own minWidth style prop to make them spaced evenly.
*/

/**
 * Statistics
 * @module components-desktop-blueprint
 * @name Statistics
 * @props StatisticsProps
 */
export const Statistics = (props: StatisticsProps) => {
  if (!hasStatisticChildren(props)) {
    return <div className="eui statistics">{props.children}</div>
  }

  const stats = propsToStatisticProps(props)

  return (
    <div className="eui statistics">
      {stats.map((statistic, i) => (
        <Statistic
          key={`${statistic.label || ''}:${statistic.value || ''}:${i}`}
          color={props.color}
          {...statistic}
          style={{ minWidth: `${100 / stats.length}%` }}
        />
      ))}
    </div>
  )
}

function hasStatisticChildren(props: StatisticsProps) {
  return (
    React.Children.map(props.children, child =>
      isElementOfType(child, Statistic) ? child.props : null,
    ).filter(child => child !== null).length > 0
  )
}
function propsToStatisticProps(props: StatisticsProps) {
  return React.Children.map(props.children, child =>
    isElementOfType(child, Statistic) ? child.props : null,
  ).filter(child => child !== null) as Array<StatisticProps>
}

export default Statistic
