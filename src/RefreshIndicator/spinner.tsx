import React from 'react'
import { Spinner } from '@blueprintjs/core'

function RefreshSpinner() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 15,
        right: 15,
      }}
    >
      <Spinner intent="success" size={30}></Spinner>
    </div>
  )
}

export default RefreshSpinner
