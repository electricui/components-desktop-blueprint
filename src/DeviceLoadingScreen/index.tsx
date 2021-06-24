import {
  useDeviceHandshakeProgressIDs,
  useDeviceHandshakeProgress,
  useDeviceDisconnect,
} from '@electricui/components-core'
import { Button, NonIdealState, ProgressBar } from '@blueprintjs/core'

import React, { useCallback } from 'react'

interface HandshakeCardProps {
  handshakeID: string
}

function HandshakeCard(props: HandshakeCardProps) {
  const progress = useDeviceHandshakeProgress(props.handshakeID)

  if (!progress) return null

  const { currentTask, complete, total } = progress

  return (
    <div
      style={{
        minWidth: 400,
      }}
    >
      {currentTask}
      <br />
      <br />
      <ProgressBar value={total === 0 ? 0 : complete / total} />
    </div>
  )
}

export const DeviceLoadingScreen = () => {
  const handshakeIDs = useDeviceHandshakeProgressIDs()
  const disconnect = useDeviceDisconnect()

  const disconnectCallback = useCallback(() => {
    disconnect().catch(err => {
      console.error('Caught error when trying to disconnect', err)
    })
  }, [disconnect])

  return (
    <NonIdealState
      icon="changes"
      title="Connecting"
      description={
        <React.Fragment>
          {handshakeIDs.map(handshakeID => (
            <HandshakeCard key={handshakeID} handshakeID={handshakeID} />
          ))}

          <Button intent="danger" onClick={disconnectCallback}></Button>
        </React.Fragment>
      }
    />
  )
}
