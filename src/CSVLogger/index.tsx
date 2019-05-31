import React from 'react'

import { useEventLogger } from '@electricui/components-desktop-charts'

import { Button } from '@blueprintjs/core'

import { remote } from 'electron'

const { dialog } = remote

const CSVLogger = () => {
  const [loggerInfo, setPath, setLogging] = useEventLogger('temps', {
    timestampColumnFormat: 'hh:mm:ss.SSS',
  })

  let writeButton

  if (loggerInfo.isLogging) {
    writeButton = (
      <Button color="red" onClick={() => setLogging(false)}>
        Stop Logging
      </Button>
    )
  } else {
    writeButton = (
      <Button
        color="blue"
        onClick={() => setLogging(true)}
        disabled={!loggerInfo.ready}
      >
        Start Logging
      </Button>
    )
  }

  const pathPicker = () => {
    const filepath = dialog.showSaveDialog({
      filters: [{ name: '.csv', extensions: ['csv'] }],
      message: 'Select a Save Location',
    })

    if (filepath === undefined) {
      return
    }

    setPath(filepath)
  }

  return (
    <React.Fragment>
      {writeButton}
      <Button onClick={pathPicker} disabled={loggerInfo.isLogging}>
        Select Save Location
      </Button>
    </React.Fragment>
  )
}

export default CSVLogger
