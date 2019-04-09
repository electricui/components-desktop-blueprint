import React from 'react'
import posed, { PoseGroup } from 'react-pose'
import { Cell, Grid } from 'styled-css-grid'
import { IconNames } from '@blueprintjs/icons'
import {
  Button,
  Classes,
  NonIdealState,
  Tag,
  Icon,
  ProgressBar,
  Overlay,
  Card,
  Elevation,
} from '@blueprintjs/core'
import {
  Connect,
  ConnectionMetadata,
  ConnectionState,
  ConsecutivePollFailureMessage,
  DeviceConnectionHashes,
  DeviceIDList,
  DeviceMetadata,
  Disconnect,
  Poll,
} from '@electricui/components-core'
import { CONNECTION_STATE } from '@electricui/core'

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

type ConnectionsProps = {
  maxWidth: number
  preConnect: (deviceID: string) => void
  postHandshake: (deviceID: string) => void
  onFailure: (deviceID: string) => void
}

class Connections extends React.Component<ConnectionsProps> {
  static defaultProps = {
    maxWidth: 400,
  }

  renderNoDevices = () => {
    return (
      <NoFoundDiv key="nodevices">
        <NonIdealState
          icon="satellite"
          title="No devices found"
          description={
            <ConsecutivePollFailureMessage>
              {noIncreases =>
                noIncreases >= 3 ? (
                  <div>Hey maybe try something else?</div>
                ) : null
              }
            </ConsecutivePollFailureMessage>
          }
        />
      </NoFoundDiv>
    )
  }

  renderDeviceInternal = (deviceID: string) => {
    return (
      <DeviceMetadata deviceID={deviceID}>
        {metadata => {
          let header = (
            <h3 className={`${Classes.HEADING} ${Classes.SKELETON}`}>
              Placeholder name
            </h3>
          )

          if (metadata.name) {
            header = <h3 className={Classes.HEADING}>{metadata.name}</h3>
          }
          if (metadata.type) {
            header = <h3 className={Classes.HEADING}>{metadata.type}</h3>
          }

          return (
            <React.Fragment>
              {header}
              <p>Device ID: {deviceID}</p>
            </React.Fragment>
          )
        }}
      </DeviceMetadata>
    )
  }

  cardClick = (
    deviceID: string,
    numConnectionHashes: number,
    connectionRequested: boolean,
    connectToDevice: () => void,
  ) => {
    if (numConnectionHashes === 0) {
      // we're a ghost card, don't do anything
      return
    }

    if (!connectionRequested) {
      // we haven't requested a connection yet, so do so.
      this.props.preConnect(deviceID)
      connectToDevice()
    }

    if (connectionRequested) {
      // we've already requested a connection
      this.props.postHandshake(deviceID)
    }

    console.error('cardClick weird state')
    return
  }

  renderDeviceID = (deviceID: string) => {
    const { maxWidth } = this.props

    return (
      <DeviceCard
        key={deviceID}
        style={{ maxWidth: maxWidth, margin: '0 auto' }}
      >
        <DeviceConnectionHashes deviceID={deviceID}>
          {connectionHashes => (
            <Connect
              deviceID={deviceID}
              preConnect={() => {
                this.props.preConnect(deviceID)
              }}
              postHandshake={() => {
                this.props.postHandshake(deviceID)
              }}
              onFailure={() => {
                this.props.onFailure(deviceID)
              }}
            >
              {(
                connectOnClick,
                connectionRequested,
                connectionState,
                deviceManagerReady,
              ) => (
                <Disconnect deviceID={deviceID}>
                  {disconnectOnClick => {
                    let deviceInnerCardPose

                    if (
                      !connectionRequested &&
                      (connectionState === 'CONNECTED' ||
                        connectionState === 'CONNECTING')
                    ) {
                      deviceInnerCardPose = 'DISCOVERING'
                    } else {
                      deviceInnerCardPose = connectionState
                    }

                    return (
                      <React.Fragment>
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
                          {connectionRequested &&
                          connectionState === 'CONNECTED' ? (
                            <Button
                              intent="danger"
                              onClick={disconnectOnClick}
                              style={{
                                position: 'absolute',
                                right: 0,
                                marginRight: '-2em',
                                marginTop: '-1.5em',
                              }}
                            >
                              <Icon icon={IconNames.CROSS} />
                            </Button>
                          ) : null}

                          {/* The connection card */}
                          <div
                            onClick={() =>
                              this.cardClick(
                                deviceID,
                                connectionHashes.length,
                                connectionRequested,
                                connectOnClick,
                              )
                            }
                            style={{
                              padding: 20,
                            }}
                          >
                            <Grid columns={2} alignItems="end">
                              <Cell>{this.renderDeviceInternal(deviceID)}</Cell>
                              {connectionHashes.length === 0 ? null : (
                                <Cell
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
                                        <ConnectionState
                                          connectionHash={connectionHash}
                                          key={connectionHash}
                                        >
                                          {connectionState => (
                                            <ConnectionMetadata
                                              connectionHash={connectionHash}
                                            >
                                              {metadata => (
                                                <Tag
                                                  round
                                                  intent={
                                                    connectionRequested &&
                                                    connectionState ===
                                                      'CONNECTED'
                                                      ? 'success'
                                                      : 'none'
                                                  }
                                                  style={{ marginLeft: 4 }}
                                                >
                                                  {metadata.name}
                                                </Tag>
                                              )}
                                            </ConnectionMetadata>
                                          )}
                                        </ConnectionState>
                                      ))}
                                    </div>
                                  </div>
                                </Cell>
                              )}
                            </Grid>
                          </div>
                        </DeviceInnerCard>
                      </React.Fragment>
                    )
                  }}
                </Disconnect>
              )}
            </Connect>
          )}
        </DeviceConnectionHashes>
      </DeviceCard>
    )
  }

  render() {
    const { maxWidth } = this.props

    return (
      <div
        style={{
          margin: '0 auto',
          height: '80vh',
          paddingTop: '10vh',
          paddingBottom: '10vh',
          maxWidth: maxWidth + 50,
          position: 'relative',
        }}
      >
        <DeviceIDList>
          {deviceIDs => (
            <React.Fragment>
              <PoseGroup>
                {deviceIDs.length === 0
                  ? this.renderNoDevices() // render no devices found, otherwise render each of them
                  : deviceIDs.map(deviceID => this.renderDeviceID(deviceID))}
              </PoseGroup>

              <Poll>
                {(onClick, polling, deviceManagerReady) => (
                  <Button
                    onClick={onClick}
                    disabled={polling || !deviceManagerReady}
                    fill
                    style={{
                      width: maxWidth,
                      margin: '2em auto 0 auto',
                    }}
                  >
                    Refresh
                  </Button>
                )}
              </Poll>
            </React.Fragment>
          )}
        </DeviceIDList>
      </div>
    )
  }
}

export default Connections
