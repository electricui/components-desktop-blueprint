import React, { useContext, useState, useEffect, useRef, useMemo } from 'react'

import { usePolledLogger } from '@electricui/components-desktop-charts'

import { Button } from '@blueprintjs/core'

import { remote } from 'electron'

const { dialog } = remote

type PolledCSVLoggerProps = {
  dataSourceNames: Array<string>
  interval: number
  timestampColumnName?: string
  timestampColumnFormat?: string
  startLoggingText?: string
  stopLoggingText?: string
  selectSaveLocationText?: string
  selectSaveLocationMessage?: string
}

const PolledCSVLogger = (props: PolledCSVLoggerProps) => {
  const memoisedOptions = useMemo(
    () => ({
      timestampColumnName: props.timestampColumnName,
      timestampColumnFormat: props.timestampColumnFormat,
    }),
    [props.timestampColumnFormat, props.timestampColumnName],
  )

  const [loggerInfo, setPath, setLogging] = usePolledLogger(
    props.dataSourceNames,
    props.interval,
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

  const foundPath = (filepath: string, bookmark: string) => {
    if (filepath === undefined) {
      return
    }

    setPath(filepath)
  }

  const pathPicker = async () => {
    dialog.showSaveDialog(
      {
        filters: [{ name: '.csv', extensions: ['csv'] }],
        message: props.selectSaveLocationMessage
          ? props.selectSaveLocationMessage
          : 'Select a Save Location',
      },
      foundPath,
    )
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

export default PolledCSVLogger