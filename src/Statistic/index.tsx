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

export type StatisticsProps = {
  children:
    | React.ReactElement<StatisticProps>[]
    | React.ReactElement<StatisticProps>
  color?: string
}
export type StatisticProps = {
  children?: ReactNode | ReactNode[]
  value?: string | number | ReactNode
  accessor?: Accessor
  label?: string | number | ReactNode
  prefix?: string | ReactNode
  suffix?: string | ReactNode
  style?: React.CSSProperties
  color?: string
  inGroupOf?: number
}

export type StatisticLabelProps = {
  children: ReactNode
}

export type StatisticValueProps = {
  children?: string | number | ReactNode
  accessor?: Accessor
  prefix?: string | ReactNode
  suffix?: string | ReactNode
}

const Label = (props: StatisticLabelProps) => {
  return <div className="label" {...props} />
}
const Value = (props: StatisticValueProps) => {
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
        <Value
          suffix={props.suffix}
          prefix={props.prefix}
          accessor={props.accessor}
          children={val || undefined}
        />
        <Label>{props.label}</Label>
      </div>
    )
  }
}

Statistic.Label = Label
Statistic.Value = Value
Statistic.displayName = 'Statistic'

/*
  Statistics will auto count their children if they're _exactly_ Statistic components.
  If they're a different component they can't be counted or style injected.

  In which case the Statistic will need to include its own minWidth style prop to make them spaced evenly.
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
