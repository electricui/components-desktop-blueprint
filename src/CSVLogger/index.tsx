import React from 'react'

import { useEventLogger } from '@electricui/components-desktop-charts'

import { Button } from '@blueprintjs/core'

import { remote } from 'electron'

const { dialog } = remote

type CSVLoggerProps = {
  dataSourceName: string
  timestampColumnName?: string
  timestampColumnFormat?: string
  startLoggingText?: string
  stopLoggingText?: string
  selectSaveLocationText?: string
  selectSaveLocationMessage?: string
}

const CSVLogger = (props: CSVLoggerProps) => {
  const [loggerInfo, setPath, setLogging] = useEventLogger(
    props.dataSourceName,
    {
      timestampColumnName: props.timestampColumnName,
      timestampColumnFormat: props.timestampColumnFormat,
    },
  )

  let writeButton

  if (loggerInfo.isLogging) {
    writeButton = (
      <Button color="red" onClick={() => setLogging(false)}>
        {props.stopLoggingText ? props.stopLoggingText : 'Stop Logging'}
      </Button>
    )
  } else {
    writeButton = (
      <Button
        color="blue"
        onClick={() => setLogging(true)}
        disabled={!loggerInfo.ready}
      >
        {props.startLoggingText ? props.startLoggingText : 'Start Logging'}
      </Button>
    )
  }

  const pathPicker = () => {
    const filepath = dialog.showSaveDialog({
      filters: [{ name: '.csv', extensions: ['csv'] }],
      message: props.selectSaveLocationMessage
        ? props.selectSaveLocationMessage
        : 'Select a Save Location',
    })

    if (filepath === undefined) {
      return
    }

    setPath(filepath)
  }

  return (
    <React.Fragment>
      {writeButton}{' '}
      <Button onClick={pathPicker} disabled={loggerInfo.isLogging}>
        {props.selectSaveLocationText
          ? props.selectSaveLocationText
          : 'Select Save Location'}
      </Button>
    </React.Fragment>
  )
}

export default CSVLogger
