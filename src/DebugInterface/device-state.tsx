import React, { ReactNode, useCallback, useEffect, useState } from 'react'

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

function renderValue(value: any, valueAsString: string, light: boolean) {
  let str: ReactNode = valueAsString

  // If it's a number, and not an integer, give it at most 2 digits after the decimal
  if (typeof value === 'number' && !Number.isInteger(value)) {
    str = value.toFixed(2)
  }

  // Unsure why this doesn't natively support BigInts
  if (valueAsString === `<BigInt>`) {
    str = <span style={{ color: light ? '#ad6728' : '#dc9656' }}>{`${String(value)}n`}</span>
  }

  return str
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

  return <DebugStateRateInformation updateRateHz={updateRate} isStale={isStale} />
}

export function ConnectionInformation(props: { connectionHash: ConnectionHash }) {
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
          valueRenderer={(valueAsString, value, ...keyPath) => {
            const str = renderValue(value, valueAsString, light)

            return (
              <span style={{ fontFamily: 'monospace' }}>
                {str}{' '}
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

export function DebugStateMockTree(props: {
  data: {
    [key: string]: {
      value: any
      isStale: boolean
      updateRateHz: number | null
    }
  }
  shouldExpandNode?: (keyPath: (string | number)[], data: any, level: number) => boolean
}) {
  const light = !useDarkMode()

  const obj: {
    [key: string]: any
  } = {}

  for (const key of Object.keys(props.data)) {
    obj[key] = props.data[key].value
  }

  return (
    <JSONTree
      data={obj}
      theme={theme}
      invertTheme={light}
      hideRoot
      getItemString={(type, data, itemType, itemString, keyPath) => {
        return (
          <span>
            {itemType} {itemString}{' '}
            {keyPath.length === 1 ? (
              <DebugStateRateInformation
                isStale={props.data[keyPath[0]]?.isStale}
                updateRateHz={props.data[keyPath[0]]?.updateRateHz}
              />
            ) : null}
          </span>
        )
      }}
      valueRenderer={function (valueAsString, value, ...keyPath) {
        const str = renderValue(value, valueAsString, light)

        return (
          <span style={{ fontFamily: 'monospace' }}>
            {str}{' '}
            {keyPath.length === 1 ? (
              <DebugStateRateInformation
                isStale={props.data[keyPath[0]]?.isStale}
                updateRateHz={props.data[keyPath[0]]?.updateRateHz}
              />
            ) : null}
          </span>
        )
      }}
      shouldExpandNode={props.shouldExpandNode}
    />
  )
}

export function DebugStateRateInformation(props: { isStale: boolean; updateRateHz: number | null }) {
  if (props.isStale) {
    return <span style={{ color: '#dc5656' }}>(update {'>'}5s old)</span>
  }

  if (props.updateRateHz === null || !Number.isFinite(props.updateRateHz)) {
    return null
  }

  if (props.updateRateHz > 1000) {
    return <span style={{ color: '#d456dc' }}>(updating at {(props.updateRateHz / 1000).toFixed(2)}kHz)</span>
  }

  return <span style={{ color: '#d456dc' }}>(updating at {props.updateRateHz.toFixed(2)}hz)</span>
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

  return <DebugStateRateInformation updateRateHz={updateRate} isStale={isStale} />
}

export function ConnectionStateButton(props: {
  connectionHash: ConnectionHash
  active: boolean
  setSelectedConnection: (connectionHash: ConnectionHash | null) => void
}) {
  const connectionState = useConnectionState(props.connectionHash)
  const connectionAcceptability = useConnectionAcceptability(props.connectionHash)
  const transportKey = useConnectionTransportKey(props.connectionHash)
  const connectionName = useConnectionMetadataKey(props.connectionHash, 'name')

  const name = connectionName ?? transportKey ?? 'unknown transport key'

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
  const [selectedConnection, setSelectedConnection] = useState<ConnectionHash | null>(
    connectionHashes[0] ? connectionHashes[0] : null,
  )
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
          getItemString={(type, data, itemType, itemString, keyPath) => {
            return (
              <span>
                {itemType} {itemString}{' '}
                {keyPath.length === 1 ? (
                  <DeviceMessageIDInfo
                    deviceID={props.deviceID}
                    messageID={String(keyPath[0])}
                    key={`${props.deviceID}/${keyPath[0]}`}
                  />
                ) : null}
              </span>
            )
          }}
          valueRenderer={(valueAsString, value, ...keyPath) => {
            const str = renderValue(value, valueAsString, light)

            return (
              <span style={{ fontFamily: 'monospace' }}>
                {str}{' '}
                {keyPath.length === 1 ? (
                  <DeviceMessageIDInfo
                    deviceID={props.deviceID}
                    messageID={String(keyPath[0])}
                    key={`${props.deviceID}/${keyPath[0]}`}
                  />
                ) : null}
              </span>
            )
          }}
        />
      </DeviceIDContextProvider>
      <h3>Device Metadata:</h3>
      {Object.keys(deviceMetadata).length > 0 ? (
        <JSONTree
          data={deviceMetadata}
          valueRenderer={(valueAsString, value) => renderValue(value, valueAsString, light)}
          theme={theme}
          invertTheme={light}
          hideRoot
        />
      ) : (
        'No metadata'
      )}

      <h3>Connections:</h3>
      {connectionHashes.length > 0 ? (
        <ButtonGroup>
          {connectionHashes.map(connectionHash => (
            <ConnectionStateButton
              key={connectionHash}
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

export function DebugDeviceState() {
  const deviceIDs = useDeviceIDList()
  let [selectedDevice, setSelectedDevice] = useState<DeviceID | null>(null)

  // If there's only one device, and none have been selected, force it to be selected.
  if (selectedDevice === null && deviceIDs.length === 1) {
    selectedDevice = deviceIDs[0]
  }

  return (
    <>
      <h1>Device State</h1>
      <ButtonGroup>
        {deviceIDs.map(deviceID => (
          <DeviceStateButton
            key={deviceID}
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
