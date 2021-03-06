import './connection-page.css'

import { Box, Composition } from 'atomic-layout'
import { Button, Classes, Icon, NonIdealState, Tag } from '@blueprintjs/core'
import {
  ConsecutivePollFailureMessage,
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
} from '@electricui/components-core'
import React, { useCallback, useState } from 'react'
import posed, { PoseGroup } from 'react-pose'

import { DeviceIDContextProvider } from '@electricui/components-core'
import { IconNames } from '@blueprintjs/icons'
import { CancellationToken, CONNECTION_STATE } from '@electricui/core'

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

const DeviceInnerCard = posed.div({
  CONNECTING: {
    borderRight: '2px solid rgba(72, 175, 240, 1)',
  },
  CONNECTED: {
    borderRight: '2px solid rgba(61, 204, 145, 1)',
  },
  DISCONNECTING: {
    borderRight: '2px solid rgba(255, 115, 115, 0.5)',
  },
  DISCONNECTED: {
    borderRight: '2px solid rgba(61, 204, 145, 0)',
  },
  DISCOVERING: {
    borderRight: '2px solid rgba(194, 116, 194, 0.5)',
  },
})

export type ConnectionsProps = {
  maxWidth?: number
  preConnect: (deviceID: string) => void
  postHandshake: (deviceID: string) => void
  onFailure: (deviceID: string, err: Error) => void
  style: React.CSSProperties
  internalCardComponent: React.ReactNode
  noDevicesText?: string
}

interface NoDevicesProps {
  noDevicesText?: string
}

const NoDevices = (props: NoDevicesProps) => {
  return (
    <NoFoundDiv key="nodevices">
      <NonIdealState
        title="No devices found"
        description={
          <ConsecutivePollFailureMessage>
            {noIncreases =>
              noIncreases >= 3 ? <div>{props.noDevicesText ?? 'Unable to detect any new devices.'}</div> : null
            }
          </ConsecutivePollFailureMessage>
        }
      />
    </NoFoundDiv>
  )
}

export type DeviceLineProps = {
  deviceID: string
  maxWidth: number
  preConnect: (deviceID: string) => void
  postHandshake: (deviceID: string) => void
  onFailure: (deviceID: string, err: Error) => void
  internalCardComponent?: React.ReactNode
}

const useConnectWithTimeout = (
  deviceID: string,
  preConnect: (deviceID: string) => void,
  postHandshake: (deviceID: string) => void,
  onFailure: (deviceID: string, err: Error) => void,
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

      const disconnectCancellationToken = getDeadline()

      try {
        return disconnect(disconnectCancellationToken)
      } catch (errDisconnect) {
        console.log('Could not disconnect after failed connection!', errDisconnect)
      }
    }
  }, [deviceID])

  return connectWithCBs
}

export type CardInternalsProps = {
  deviceID: string
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
  deviceID: string
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
      intent={connectionRequested && connectionState === 'CONNECTED' ? 'success' : 'none'}
      style={{ marginLeft: 4 }}
    >
      {connectionName}
    </Tag>
  )
}

const DeviceLine = (props: DeviceLineProps) => {
  const deviceID = props.deviceID
  const maxWidth = props.maxWidth

  // If they provide an internal card component, wrap it in a device ID context and render it, otherwise provide defaults
  const InternalCard = props.internalCardComponent ? (
    <DeviceIDContextProvider deviceID={deviceID}>{props.internalCardComponent}</DeviceIDContextProvider>
  ) : (
    <CardInternals deviceID={deviceID} />
  )

  const connectionHashes = useDeviceConnectionHashes(deviceID)
  const disconnect = useDeviceDisconnect(deviceID)
  const connectionRequested = useDeviceConnectionRequested(deviceID)
  const connectionState = useDeviceConnectionState(deviceID)
  const getDeadline = useDeadline()

  const handshakeState = useDeviceHandshakeState(deviceID)

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
  if (!connectionRequested && (connectionState === 'CONNECTED' || connectionState === 'CONNECTING')) {
    deviceInnerCardPose = 'DISCOVERING'
  }

  // Handshake errors

  let errorMessage = null

  if (handshakeState === 'failed') {
    errorMessage = <Tag intent="danger">A handshake error occurred</Tag>
  }

  return (
    <DeviceCard key={deviceID} style={{ maxWidth: maxWidth, margin: '0 auto' }}>
      <DeviceInnerCard
        className={
          connectionHashes.length === 0
            ? 'bp3-card bp3-elevation-0 disabled-card'
            : 'bp3-card bp3-interactive bp3-elevation-1'
        }
        pose={deviceInnerCardPose}
        style={{
          padding: 0,
        }}
      >
        {/* The disconnect button */}
        {connectionRequested && connectionState === 'CONNECTED' ? (
          <Button
            intent="danger"
            onClick={() => disconnect(getDeadline())}
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
                <div>{errorMessage}</div>
              </div>
            </Box>
          </Composition>
        </div>
      </DeviceInnerCard>
    </DeviceCard>
  )
}

const Connections = (props: ConnectionsProps) => {
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
        ...style,
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

export default Connections
