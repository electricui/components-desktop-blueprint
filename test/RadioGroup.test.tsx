import RadioGroup from '../src/RadioGroup'
import React from 'react'
import { describe, it } from '@jest/globals'

declare global {
  interface ElectricUIDeveloperState {
    lit_time: number
  }
}

describe(`RadioGroup`, () => {
  it(`basic type check #1`, () => {
    const RadioGroupExample = (
      <RadioGroup accessor="lit_time" writer={(state, value) => {
        state.lit_time = value
      }}>
        <RadioGroup.Radio value={3} label="hello" />
      </RadioGroup>
    )
  })
  it(`basic type check #2`, () => {
    const RadioGroupExample = (
      <RadioGroup accessor={state => state.lit_time} writer={(state, value) => {
        state.lit_time = value
      }}>
        <RadioGroup.Radio value={3} label="hello" />
      </RadioGroup>
    )
  })
})
