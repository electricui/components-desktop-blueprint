import './connection-page.css'

import { Box, Composition } from 'atomic-layout'
import { Button, Classes, Icon, NonIdealState, Tag } from '@blueprintjs/core'
import {
  useConnectionMetadataKey,
  useConnectionState,
  useDeadline,
  useDeviceConnect,
  useDeviceConnectionHashes,
  useDeviceConnectionRequested,
  useDeviceConnectionState,
  useDeviceDisconnect,
  useDeviceHandshakeState,
  useDeviceIDList,
  useDeviceMetadataKey,
  usePollForDevices,
  useDeviceConnectionError,
} from '@electricui/components-core'
import React, { useCallback } from 'react'
import posed, { PoseGroup } from 'react-pose'

import { DeviceIDContextProvider } from '@electricui/components-core'
import { IconNames } from '@blueprintjs/icons'
import { CONNECTION_STATE, DeviceID } from '@electricui/core'
import classNames from 'classnames'

const NoFoundDiv = posed.div({
  enter: { y: 0, opacity: 1 },
  exit: { y: 0, opacity: 0 },
})

const DeviceCard = posed.div({
  enter: { y: 0, opacity: 1 },
  exit: { y: 0, opacity: 0 },
  init: {
    marginBottom: '2em',
  },
})

enum InnerCardStates {
  'CONNECTING' = 'CONNECTING',
  'CONNECTED' = 'CONNECTED',
  'DISCONNECTING' = 'DISCONNECTING',
  'DISCONNECTED' = 'DISCONNECTED',
  'DISCOVERING' = 'DISCOVERING',
  'ERRORED' = 'ERRORED',
}

const InnerCardPoses = {
  [InnerCardStates.CONNECTING]: {
    borderRight: '2px solid rgba(72, 175, 240, 1)',
  },
  [InnerCardStates.CONNECTED]: {
    borderRight: '2px solid rgba(61, 204, 145, 1)',
  },
  [InnerCardStates.DISCONNECTING]: {
    borderRight: '2px solid rgba(255, 115, 115, 0.5)',
  },
  [InnerCardStates.DISCONNECTED]: {
    borderRight: '2px solid rgba(61, 204, 145, 0)',
  },
  [InnerCardStates.DISCOVERING]: {
    borderRight: '2px solid rgba(194, 116, 194, 0.5)',
  },
  [InnerCardStates.ERRORED]: {
    borderRight: '2px solid rgba(204, 61, 61, 1)',
  },
}

const DeviceInnerCard = posed.div(InnerCardPoses)

export type ConnectionsProps = {
  maxWidth?: number
  preConnect: (deviceID: DeviceID) => void
  postHandshake: (deviceID: DeviceID) => void
  onFailure: (deviceID: DeviceID, err: Error) => void
  style?: React.CSSProperties
  internalCardComponent: React.ReactNode
  noDevicesText?: string
}

interface NoDevicesProps {
  noDevicesText?: string
}

const NoDevices = (props: NoDevicesProps) => {
  return (
    <NoFoundDiv key="nodevices">
      <NonIdealState title="No devices found" />
    </NoFoundDiv>
  )
}

export type DeviceLineProps = {
  deviceID: DeviceID
  maxWidth: number
  preConnect: (deviceID: DeviceID) => void
  postHandshake: (deviceID: DeviceID) => void
  onFailure: (deviceID: DeviceID, err: Error) => void
  internalCardComponent?: React.ReactNode
}

const useConnectWithTimeout = (
  deviceID: DeviceID,
  preConnect: (deviceID: DeviceID) => void,
  postHandshake: (deviceID: DeviceID) => void,
  onFailure: (deviceID: DeviceID, err: Error) => void,
) => {
  const connect = useDeviceConnect(deviceID)
  const disconnect = useDeviceDisconnect(deviceID)
  const getDeadline = useDeadline()

  const connectWithCBs = useCallback(async () => {
    preConnect(deviceID)

    const connectCancellationToken = getDeadline()

    try {
      await connect(connectCancellationToken)

      postHandshake(deviceID)
    } catch (err) {
      if (connectCancellationToken.caused(err)) {
        console.log('Connection was cancelled')
      } else {
        console.log('Connection failed:', err)
      }

      onFailure(deviceID, err)

      try {
        return disconnect()
      } catch (errDisconnect) {
        console.log('Could not disconnect after failed connection!', errDisconnect)
      }
    }
  }, [deviceID])

  return connectWithCBs
}

export type CardInternalsProps = {
  deviceID: DeviceID
}

const CardInternals = (props: CardInternalsProps) => {
  const deviceID = props.deviceID

  const metadataName = useDeviceMetadataKey('name', deviceID)
  const metadataType = useDeviceMetadataKey('type', deviceID)

  let header = <h3 className={`${Classes.HEADING} ${Classes.SKELETON}`}>Placeholder name</h3>

  if (metadataName) {
    header = <h3 className={Classes.HEADING}>{metadataName}</h3>
  }

  if (metadataType) {
    header = <h3 className={Classes.HEADING}>{metadataType}</h3>
  }

  return (
    <React.Fragment>
      {header}
      <p>Device ID: {deviceID}</p>
    </React.Fragment>
  )
}

type ConnectionHashProps = {
  deviceID: DeviceID
  connectionHash: string
}

const ConnectionHash = (props: ConnectionHashProps) => {
  const deviceID = props.deviceID
  const connectionHash = props.connectionHash

  const connectionState = useConnectionState(connectionHash)
  const connectionRequested = useDeviceConnectionRequested(deviceID)
  const connectionName = useConnectionMetadataKey<string>(connectionHash, 'name')

  return (
    <Tag
      round
      intent={connectionRequested && connectionState === CONNECTION_STATE.CONNECTED ? 'success' : 'none'}
      style={{ marginLeft: 4 }}
    >
      {connectionName}
    </Tag>
  )
}

const DeviceLine = (props: DeviceLineProps) => {
  const deviceID = props.deviceID
  const maxWidth = props.maxWidth

  const connectionHashes = useDeviceConnectionHashes(deviceID)
  const disconnect = useDeviceDisconnect(deviceID)
  const connectionRequested = useDeviceConnectionRequested(deviceID)
  const connectionState = useDeviceConnectionState(deviceID)

  const handshakeState = useDeviceHandshakeState(deviceID)
  const lastError = useDeviceConnectionError(deviceID)

  const connect = useConnectWithTimeout(deviceID, props.preConnect, props.postHandshake, props.onFailure)

  const cardClick = useCallback(() => {
    if (connectionHashes.length === 0) {
      // we're a ghost card, don't do anything
      return
    }

    if (!connectionRequested) {
      // we haven't requested a connection yet, so do so.
      connect()
      return
    }

    // If a connection is requested and we've connected, just run the post handshake hook
    if (connectionState === CONNECTION_STATE.CONNECTED) {
      props.postHandshake(deviceID)
    }

    // Otherwise we're probably still connecting, do nothing
  }, [connectionHashes.length, connectionRequested])

  // Device Card Pose
  let deviceInnerCardPose: string = connectionState
  if (
    !connectionRequested &&
    (connectionState === CONNECTION_STATE.CONNECTED || connectionState === CONNECTION_STATE.CONNECTING)
  ) {
    deviceInnerCardPose = InnerCardStates.DISCOVERING
  }

  // Handshake errors
  let errorMessage = null

  if (handshakeState === 'failed') {
    errorMessage = (
      <Tag intent="danger" style={{ maxWidth: maxWidth }}>
        A handshake error occurred
      </Tag>
    )
    deviceInnerCardPose = InnerCardStates.ERRORED
  } else if (lastError !== null) {
    errorMessage = (
      <Tag intent="danger" style={{ maxWidth: maxWidth }}>
        {lastError}
      </Tag>
    )
    deviceInnerCardPose = InnerCardStates.ERRORED
  }

  // If they provide an internal card component, wrap it in a device ID context and render it, otherwise provide defaults
  const InternalCard = props.internalCardComponent ? (
    <DeviceIDContextProvider deviceID={deviceID}>{props.internalCardComponent}</DeviceIDContextProvider>
  ) : (
    <CardInternals deviceID={deviceID} />
  )

  return (
    <DeviceCard key={deviceID} style={{ maxWidth: maxWidth, margin: '0 auto' }}>
      <DeviceInnerCard
        className={
          connectionHashes.length === 0
            ? `${Classes.CARD} ${Classes.ELEVATION_0} disabled-card`
            : `${Classes.CARD} ${Classes.ELEVATION_1} ${Classes.INTERACTIVE}`
        }
        pose={deviceInnerCardPose}
        style={{
          padding: 0,
        }}
      >
        {/* The disconnect button */}
        {connectionRequested && connectionState === CONNECTION_STATE.CONNECTED ? (
          <Button
            intent="danger"
            onClick={() => disconnect()}
            style={{
              position: 'absolute',
              right: 0,
              marginRight: '-2em',
            }}
          >
            <Icon icon={IconNames.CROSS} />
          </Button>
        ) : null}

        {/* The connection card */}
        <div
          onClick={cardClick}
          style={{
            padding: 20,
          }}
        >
          <Composition templateCols="repeat(2, 1fr)">
            <Box>{InternalCard}</Box>
            <Box
              style={{
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <div>
                  {connectionHashes.map(connectionHash => (
                    <ConnectionHash deviceID={deviceID} connectionHash={connectionHash} key={connectionHash} />
                  ))}
                </div>
              </div>
            </Box>
          </Composition>

          {errorMessage}
        </div>
      </DeviceInnerCard>
    </DeviceCard>
  )
}

export const Connections = (props: ConnectionsProps) => {
  const deviceIDs = useDeviceIDList()
  const { poll, polling } = usePollForDevices()

  const { maxWidth, style } = props

  const maxWidthWithDefault = maxWidth || 400

  const list = deviceIDs.map(deviceID => (
    <DeviceLine
      key={deviceID}
      deviceID={deviceID}
      maxWidth={maxWidthWithDefault}
      preConnect={props.preConnect}
      postHandshake={props.postHandshake}
      onFailure={props.onFailure}
      internalCardComponent={props.internalCardComponent}
    />
  ))

  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: maxWidthWithDefault + 50,
        position: 'relative',
        ...(style ?? {}),
      }}
      className="eui-connections-list"
    >
      {deviceIDs.length === 0 ? <NoDevices noDevicesText={props.noDevicesText} /> : null}
      <PoseGroup>{list}</PoseGroup>

      <Button
        onClick={poll}
        disabled={polling}
        fill
        style={{
          width: maxWidth,
          margin: '2em auto 0 auto',
        }}
        loading={polling}
      >
        Refresh
      </Button>
    </div>
  )
}
