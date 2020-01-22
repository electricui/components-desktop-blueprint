import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@blueprintjs/core'
import { DataSourceReference } from '@electricui/core-timeseries'
import { remote } from 'electron'
import { useEventLogger } from '@electricui/components-desktop-charts'

const { dialog } = remote

type EventCSVLoggerProps = {
  dataSource: DataSourceReference
  timestampColumnName?: string
  timestampColumnFormat?: string
  startLoggingText?: string
  stopLoggingText?: string
  selectSaveLocationText?: string
  selectSaveLocationMessage?: string
}

export const EventCSVLogger = (props: EventCSVLoggerProps) => {
  const memoisedOptions = useMemo(
    () => ({
      timestampColumnName: props.timestampColumnName,
      timestampColumnFormat: props.timestampColumnFormat,
    }),
    [props.timestampColumnFormat, props.timestampColumnName],
  )

  const [loggerInfo, setPath, setLogging] = useEventLogger(
    props.dataSource,
    memoisedOptions,
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

  const foundPath = (filepath: string | undefined) => {
    if (filepath === undefined) {
      return
    }

    setPath(filepath)
  }

  const pathPicker = async () => {
    dialog
      .showSaveDialog({
        filters: [{ name: '.csv', extensions: ['csv'] }],
        message: props.selectSaveLocationMessage
          ? props.selectSaveLocationMessage
          : 'Select a Save Location',
      })
      .then(p => {
        foundPath(p.filePath)
      })
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
