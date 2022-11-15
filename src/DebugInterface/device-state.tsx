import React, { useCallback, useEffect, useState } from 'react'

import { IconNames } from '@blueprintjs/icons'
import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import { JSONTree } from 'react-json-tree'

import { useDarkMode } from '@electricui/components-desktop'
import { useSelector } from '@electricui/core-redux-state'
import {
  useDeviceIDList,
  useDeviceConnectionHashes,
  useDeviceManager,
  useConnectionMetadataKeyStale,
  useConnectionMetadataKey,
  useMessageIDStale,
  DeviceIDContextProvider,
  useConnectionState,
  useConnectionAcceptability,
  useConnectionTransportKey,
  useDeviceConnectionState,
  useDeviceHasAcceptableConnection,
  useDeviceMetadataKey,
  useDeviceConnectionRequested,
} from '@electricui/components-core'
import { ConnectionHash, CONNECTION_STATE, DeviceID, MANAGER_EVENTS, Message } from '@electricui/core'
import { timing } from '@electricui/timing'
import { FixedQueue } from '@electricui/timeseries'

function valueSupportBigInt(valueAsString: string, value: unknown, ...keyPath: (string | number)[]) {
  if (valueAsString === `<BigInt>`) {
    return `${String(value)}n`
  }

  return valueAsString
}

const theme = {
  base00: '#181818',
  base01: '#282828',
  base02: '#383838',
  base03: '#585858',
  base04: '#b8b8b8',
  base05: '#d8d8d8',
  base06: '#e8e8e8',
  base07: '#f8f8f8',
  base08: '#ab4642',
  base09: '#dc9656',
  base0A: '#f7ca88',
  base0B: '#a1b56c',
  base0C: '#86c1b9',
  base0D: '#7cafc2',
  base0E: '#ba8baf',
  base0F: '#a16946',
}

function ConnectionMetadataInfo(props: { connectionHash: ConnectionHash; metadataKey: string | number }) {
  const deviceManager = useDeviceManager()

  const [updateRate, setUpdateRate] = useState<number | null>(null)

  const isStale = useConnectionMetadataKeyStale(props.connectionHash, String(props.metadataKey), 5000)

  // Reset the queue when the staleness changes
  useEffect(() => {
    // Keep the last 20 times around
    const queue = new FixedQueue<number>(20)
    let lastUpdate = Date.now()

    const update = (connectionHash: ConnectionHash, key: string, value: any) => {
      if (key !== props.metadataKey || connectionHash !== props.connectionHash) {
        return
      }

      // When a new value is added, record the time
      queue.push(timing.now())

      // Only update once we have a few entries
      if (queue.length - 1 === 0) {
        return
      }

      // Update at most once a second
      if (Date.now() - lastUpdate < 1000) {
        return
      }
      lastUpdate = Date.now()

      // Average
      let averageTimeBetweenUpdates = 0
      let last: null | number = null
      queue.forEach(timestamp => {
        if (last === null) {
          last = timestamp
          return
        }

        const diff = timestamp - last

        averageTimeBetweenUpdates += diff
        last = timestamp
      })

      averageTimeBetweenUpdates = averageTimeBetweenUpdates / (queue.length - 1)

      // Timestamps are in milliseconds
      setUpdateRate(1000 / averageTimeBetweenUpdates)
    }

    deviceManager?.on(MANAGER_EVENTS.CONNECTION_METADATA_UPDATE, update)

    return () => {
      deviceManager?.removeListener(MANAGER_EVENTS.CONNECTION_METADATA_UPDATE, update)
    }
  }, [deviceManager, setUpdateRate, isStale])

  if (isStale) {
    return <span style={{ color: '#dc5656' }}>(update {'>'}5s old)</span>
  }

  if (updateRate === null || !Number.isFinite(updateRate)) {
    return null
  }

  if (updateRate > 1000) {
    return <span style={{ color: '#d456dc' }}>(updating at {(updateRate / 1000).toFixed(2)}kHz)</span>
  }

  return <span style={{ color: '#d456dc' }}>(updating at {updateRate.toFixed(2)}hz)</span>
}

function ConnectionInformation(props: { connectionHash: ConnectionHash }) {
  const connectionState = useSelector(state => state.electricui.connections[props.connectionHash])
  const light = !useDarkMode()

  return (
    <>
      <JSONTree
        data={{
          hash: props.connectionHash,
          ...(connectionState.state !== undefined ? { state: connectionState.state } : {}),
          ...(connectionState.transportKey !== undefined ? { transportKey: connectionState.transportKey } : {}),
          ...(connectionState.acceptable !== undefined ? { acceptable: connectionState.acceptable } : {}),
          ...(connectionState.errorMessage !== undefined ? { error: connectionState.errorMessage } : {}),
        }}
        theme={theme}
        invertTheme={light}
        hideRoot
      />
      <h4>Metadata:</h4>
      {connectionState?.metadata && Object.keys(connectionState.metadata).length > 0 ? (
        <JSONTree
          data={connectionState.metadata}
          theme={theme}
          invertTheme={light}
          hideRoot
          valueRenderer={function (valueAsString, value, ...keyPath) {
            return (
              <span style={{ fontFamily: 'monospace' }}>
                {valueAsString}{' '}
                <ConnectionMetadataInfo
                  connectionHash={props.connectionHash}
                  metadataKey={keyPath[0]}
                  key={`${props.connectionHash}/${keyPath[0]}`}
                />
              </span>
            )
          }}
        />
      ) : (
        'No metadata'
      )}
    </>
  )
}

function DeviceMessageIDInfo(props: { deviceID: DeviceID; messageID: string }) {
  const deviceManager = useDeviceManager()

  const [updateRate, setUpdateRate] = useState<number | null>(null)

  const isStale = useMessageIDStale(props.messageID, 5000)

  // Reset the queue when the staleness changes
  useEffect(() => {
    // Keep the last 20 times around
    const queue = new FixedQueue<number>(20)
    let lastUpdate = Date.now()

    const update = (deviceID: DeviceID, message: Message, connectionHash?: ConnectionHash) => {
      if (deviceID !== props.deviceID || message.messageID !== props.messageID) {
        return
      }

      // When a new value is added, record the time
      queue.push(message.metadata.timestamp)

      // Only update once we have a few entries
      if (queue.length - 1 === 0) {
        return
      }

      // Update at most once a second
      if (Date.now() - lastUpdate < 1000) {
        return
      }
      lastUpdate = Date.now()

      // Average
      let averageTimeBetweenUpdates = 0
      let last: null | number = null
      queue.forEach(timestamp => {
        if (last === null) {
          last = timestamp
          return
        }

        const diff = timestamp - last

        averageTimeBetweenUpdates += diff
        last = timestamp
      })

      averageTimeBetweenUpdates = averageTimeBetweenUpdates / (queue.length - 1)

      setUpdateRate(1000 / averageTimeBetweenUpdates)
    }

    deviceManager?.on(MANAGER_EVENTS.RECEIVE_FROM_DEVICE, update)

    return () => {
      deviceManager?.removeListener(MANAGER_EVENTS.RECEIVE_FROM_DEVICE, update)
    }
  }, [deviceManager, setUpdateRate, isStale])

  if (isStale) {
    return <span style={{ color: '#dc5656' }}>(update {'>'}5s old)</span>
  }

  if (updateRate === null || !Number.isFinite(updateRate)) {
    return null
  }

  if (updateRate > 1000) {
    return <span style={{ color: '#d456dc' }}>(updating at {(updateRate / 1000).toFixed(2)}kHz)</span>
  }

  return <span style={{ color: '#d456dc' }}>(updating at {updateRate.toFixed(2)}hz)</span>
}

function ConnectionStateButton(props: {
  connectionHash: ConnectionHash
  active: boolean
  setSelectedConnection: (connectionHash: ConnectionHash | null) => void
}) {
  const connectionState = useConnectionState(props.connectionHash)
  const connectionAcceptability = useConnectionAcceptability(props.connectionHash)
  const transportKey = useConnectionTransportKey(props.connectionHash)
  const connectionName = useConnectionMetadataKey(props.connectionHash, 'name')

  const name = connectionName ?? transportKey

  let intent: Intent = Intent.NONE

  switch (connectionState) {
    case CONNECTION_STATE.DISCONNECTING:
    case CONNECTION_STATE.DISCONNECTED:
      intent = Intent.DANGER
      break
    case CONNECTION_STATE.CONNECTING:
      intent = Intent.PRIMARY
      break
    case CONNECTION_STATE.CONNECTED:
      if (connectionAcceptability) {
        intent = Intent.SUCCESS
      } else {
        intent = Intent.WARNING
      }
      break
  }

  const onClick = useCallback(() => {
    if (props.active) {
      props.setSelectedConnection(null)
    } else {
      props.setSelectedConnection(props.connectionHash)
    }
  }, [props.connectionHash, props.setSelectedConnection, props.active])

  return (
    <Button
      text={name}
      active={props.active}
      intent={intent}
      onClick={onClick}
      icon={props.active ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT}
    />
  )
}

function DeviceInformation(props: { deviceID: DeviceID }) {
  const deviceState = useSelector(state => state.electricui.hardware[props.deviceID])
  const deviceMetadata = useSelector(state => state.electricui.devices[props.deviceID].metadata)

  const light = !useDarkMode()
  const connectionHashes = useDeviceConnectionHashes(props.deviceID)
  const [selectedConnection, setSelectedConnection] = useState<ConnectionHash | null>(null)
  const connectionExists = useSelector(state =>
    Boolean(
      selectedConnection && // A connection must be selected
        state.electricui.connections[selectedConnection] && // it has to have metadata in the tree
        connectionHashes.includes(selectedConnection), // and it has to belong to this device, if it's dangling, omit it.
    ),
  )

  return (
    <>
      <h3>Hardware state:</h3>
      <DeviceIDContextProvider deviceID={props.deviceID}>
        <JSONTree
          data={deviceState}
          theme={theme}
          invertTheme={light}
          hideRoot
          valueRenderer={function (valueAsString, value, ...keyPath) {
            let str = valueAsString

            // Unsure why this doesn't natively support BigInts
            if (valueAsString === `<BigInt>`) {
              str = <span style={{ color: light ? '#ad6728' : '#dc9656' }}>{`${String(value)}n`}</span>
            }

            return (
              <span style={{ fontFamily: 'monospace' }}>
                {str}{' '}
                <DeviceMessageIDInfo
                  deviceID={props.deviceID}
                  messageID={String(keyPath[0])}
                  key={`${props.deviceID}/${keyPath[0]}`}
                />
              </span>
            )
          }}
        />
      </DeviceIDContextProvider>
      <h3>Device Metadata:</h3>
      {Object.keys(deviceMetadata).length > 0 ? (
        <JSONTree data={deviceMetadata} valueRenderer={valueSupportBigInt} theme={theme} invertTheme={light} hideRoot />
      ) : (
        'No metadata'
      )}

      <h3>Connections:</h3>
      {connectionHashes.length > 0 ? (
        <ButtonGroup>
          {connectionHashes.map(connectionHash => (
            <ConnectionStateButton
              connectionHash={connectionHash}
              active={selectedConnection === connectionHash}
              setSelectedConnection={setSelectedConnection}
            />
          ))}
        </ButtonGroup>
      ) : (
        'No connections'
      )}

      {selectedConnection && connectionExists ? (
        <ConnectionInformation connectionHash={selectedConnection} key={selectedConnection} />
      ) : null}
    </>
  )
}

function DeviceStateButton(props: {
  deviceID: DeviceID
  active: boolean
  setSelectedDevice: (deviceID: DeviceID | null) => void
}) {
  const deviceConnectionState = useDeviceConnectionState(props.deviceID)
  const deviceHasAcceptableConnection = useDeviceHasAcceptableConnection(props.deviceID)
  const deviceName = useDeviceMetadataKey('name', props.deviceID)
  const connectionRequested = useDeviceConnectionRequested(props.deviceID)

  const name = deviceName ?? props.deviceID

  let intent: Intent = Intent.NONE

  switch (deviceConnectionState) {
    case CONNECTION_STATE.DISCONNECTING:
    case CONNECTION_STATE.DISCONNECTED:
      intent = Intent.DANGER
      break
    case CONNECTION_STATE.CONNECTING:
      intent = Intent.PRIMARY
      break
    case CONNECTION_STATE.CONNECTED:
      if (deviceHasAcceptableConnection) {
        intent = Intent.SUCCESS
      } else {
        intent = Intent.WARNING
      }
      break
  }

  const isDiscovering =
    !connectionRequested &&
    (deviceConnectionState === CONNECTION_STATE.CONNECTED || deviceConnectionState === CONNECTION_STATE.CONNECTING)

  if (isDiscovering) {
    intent = Intent.NONE
  }

  const onClick = useCallback(() => {
    if (props.active) {
      props.setSelectedDevice(null)
    } else {
      props.setSelectedDevice(props.deviceID)
    }
  }, [props.deviceID, props.setSelectedDevice, props.active])

  return (
    <Button
      text={name}
      active={props.active}
      intent={intent}
      style={
        isDiscovering
          ? {
              // discovering style override
              backgroundColor: '#990f56',
            }
          : undefined
      }
      onClick={onClick}
      icon={props.active ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT}
    />
  )
}

export function DeviceState() {
  const deviceIDs = useDeviceIDList()
  const [selectedDevice, setSelectedDevice] = useState<DeviceID | null>(null)

  return (
    <>
      <h1>Device State</h1>
      <ButtonGroup>
        {deviceIDs.map(deviceID => (
          <DeviceStateButton
            deviceID={deviceID}
            active={selectedDevice === deviceID}
            setSelectedDevice={setSelectedDevice}
          />
        ))}
      </ButtonGroup>

      {selectedDevice ? <DeviceInformation deviceID={selectedDevice} /> : null}

      {/* AllState:
      <JSONTree data={deviceState} theme={theme} invertTheme={light} hideRoot /> */}
    </>
  )
}
