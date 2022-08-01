import Button from '../src/Button'
import React from 'react'
import { describe, it } from '@jest/globals'

declare global {
  interface ElectricUIDeveloperState {
    lit_time: number
  }
}

describe(`Button`, () => {
  it(`basic type check #1`, () => {
    const buttonExample = (
      <Button
        writer={state => {
          state.lit_time = 32
        }}
      />
    )
  })
  it(`basic type check #2`, () => {
    const buttonExample = (
      <Button
        writer={{
          lit_time: 32,
        }}
      />
    )
  })
})
