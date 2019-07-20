import React from 'react'
import { ipcRenderer } from 'electron'

import { Alert } from '@blueprintjs/core'

const NoIPCModal = () => (
  <Alert
    intent="warning"
    isOpen={true}
    onConfirm={() => ipcRenderer.send('open-debug-window')}
    confirmButtonText="Open Transport Window"
    onCancel={() => window.location.reload()}
    cancelButtonText="Reload UI"
  >
    <p>The connection to the transport process has been lost.</p>

    <ul>
      <li>It may reconnect in the next couple of seconds.</li>
      <li>It may need to be reloaded.</li>
      <li>This process may need to be reloaded.</li>
    </ul>
  </Alert>
)

export default NoIPCModal
