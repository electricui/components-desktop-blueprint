import React, { useState } from 'react'

import { ButtonGroup } from '@blueprintjs/core'

// import { useDarkMode } from '@electricui/components-desktop'
import { useSelector } from '@electricui/core-redux-state'
import { useDanglingConnectionHashes } from '@electricui/components-core'
import { ConnectionHash } from '@electricui/core'

import { ConnectionStateButton, ConnectionInformation } from './device-state'

export function DebugDanglingConnections() {
  // const light = !useDarkMode()
  const connectionHashes = useDanglingConnectionHashes()
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
      <h1>Dangling Connections</h1>
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
