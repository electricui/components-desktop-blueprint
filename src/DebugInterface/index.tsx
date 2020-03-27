import './index.css'

import { Button, Checkbox } from '@blueprintjs/core'
import React, { useState } from 'react'

import { DarkModeProvider } from '@electricui/components-desktop'
import { DarkModeWrapper } from '../DarkModeWrapper'
import { ipcRenderer } from 'electron'

const debugOptions = [
  {
    categoryTitle: 'Protocol',
    strings: [
      'electricui-protocol-cobs',
      'electricui-protocol-binary-cobs:pipelines',
      'electricui-protocol-binary-fifo-queue:queue',
      'electricui-protocol-binary:heartbeats',
      'electricui-protocol-binary:decoder',
      'electricui-protocol-binary:encoder',
      'electricui-protocol-binary-large-packet-handler:decoder',
      'electricui-protocol-binary-large-packet-handler:encoder',
      'electricui-protocol-binary:deliverability-manager',
      'electricui-protocol-binary:hint-validator-handshake',
      'electricui-protocol-binary:query-manager',
      'electricui-protocol-binary:connection-handshake',
    ],
  },
  {
    categoryTitle: 'Transports',
    strings: [
      'electricui-transport-node-ble:transport',
      'electricui-transport-node-hid:transport',
      'electricui-transport-node-websocket:*',
      'electricui-transport-node-ble:hint-producer',
      'electricui-transport-node-serial:hint-producer',
      'electricui-transport-node-serial:transport',
      'electricui-transport-node-serial:bandwidth-metadata',
      'electricui-transport-node-websocket:transport',
    ],
  },
  {
    categoryTitle: 'Core',
    strings: [
      'electricui-core:connection-interface',
      'electricui-core:connection',
      'electricui-core:device',
      'electricui-core:device-manager',
      'electricui-core:validation-worker',
      'electricui-core:router-log-ratio:result',
      'electricui-core:router-log-ratio:calculations',
    ],
  },
  {
    categoryTitle: 'Build Tools',
    strings: [
      'electricui-build-tools',
      'electricui-build-tools:main-client-hmr',
      'electricui-build-tools:dev-runner',
      'electricui-build-tools:clean',
    ],
  },
  {
    categoryTitle: 'Components Core',
    strings: [
      'electricui-components-core:proxy-client',
      'electricui-components-core:device-manager-proxy',
    ],
  },
  {
    categoryTitle: 'Utilities',
    strings: ['utility-ipc:server'],
  },
]

const debugStrings = debugOptions
  .map(opt => opt.strings)
  .reduce((all, strings) => all.concat(strings), [])
  .sort()

const DebugInterface = () => {
  const defaultSelected = localStorage.getItem('debug')

  const defaultSelectedArray = defaultSelected ? defaultSelected.split(',') : []

  const [selectedStrings, setSelected] = useState<string[]>(
    defaultSelectedArray,
  )

  return (
    <DarkModeProvider>
      <DarkModeWrapper>
        <div className="debug-page">
          <div className="debug-header">
            <div className="debug-header-buttons">
              <Button
                fill
                intent="success"
                className="bp3-outlined"
                large
                icon="applications"
                onClick={() => {
                  ipcRenderer.send('open-debug-window-dev-tools')
                }}
              >
                Transport Console
              </Button>
              <Button
                fill
                intent="warning"
                className="bp3-outlined"
                large
                icon="refresh"
                onClick={() => {
                  localStorage.setItem(
                    'debug',
                    selectedStrings
                      .filter(selectedString =>
                        debugStrings.includes(selectedString),
                      ) // remove ones set by not us
                      .join(','),
                  )
                  window.location.reload()
                }}
              >
                Apply Filters {'&'} Restart
              </Button>
              <Button
                fill
                intent="primary"
                className="bp3-outlined"
                large
                icon="document-open"
                onClick={() => {
                  ipcRenderer.send('open-debugging-docs')
                }}
              >
                Debugging Docs
              </Button>
            </div>
          </div>
          <div className="debug-content">
            <div style={{ padding: '0 2em' }}>
              <h1>Transport Debugger</h1>
              <p>
                Use this interface to filter the transport-manager's runtime
                debug output.
              </p>
              <p>
                Filter modifications require a restart of the transport-manager
                and will disconnect from all devices.
              </p>
              <div>
                <div className="optionslist">
                  {debugOptions.map(debugGroup => (
                    <div className="option" key={debugGroup.categoryTitle}>
                      <h3>{debugGroup.categoryTitle}</h3>
                      <ul>
                        {debugGroup.strings.map(debugString => (
                          <li style={{ listStyle: 'none' }} key={debugString}>
                            <Checkbox
                              checked={selectedStrings.includes(debugString)}
                              onChange={() => {
                                if (selectedStrings.includes(debugString)) {
                                  // remove it from the list
                                  setSelected(
                                    selectedStrings.filter(
                                      selectedString =>
                                        selectedString !== debugString,
                                    ),
                                  )
                                  return
                                }

                                setSelected([...selectedStrings, debugString])
                              }}
                            >
                              {debugString}
                            </Checkbox>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DarkModeWrapper>
    </DarkModeProvider>
  )
}

export default DebugInterface
