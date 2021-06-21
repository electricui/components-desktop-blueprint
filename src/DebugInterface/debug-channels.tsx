import React, { useCallback, useState } from 'react'

import { Checkbox } from '@blueprintjs/core'
import debug from 'debug'

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
      'electricui-protocol-binary:connection-handshake:events',
      'electricui-protocol-binary:connection-handshake:state-transitions',
      'electricui-protocol-binary:connection-handshake:progress-updates',
      'electricui-protocol-binary:connection-handshake:outgoing',
      'electricui-protocol-binary:connection-handshake:general',
    ],
  },
  {
    categoryTitle: 'Transports',
    strings: [
      'electricui-transport-node-ble:transport',
      'electricui-transport-node-hid:transport',
      'electricui-transport-node-ble:hint-producer',
      'electricui-transport-node-serial:hint-producer',
      'electricui-transport-node-serial:usb-hint-transformer',
      'electricui-transport-node-serial:transport',
      'electricui-transport-node-serial:bandwidth-metadata',
      'electricui-transport-node-websocket:transport',
    ],
  },
  {
    categoryTitle: 'Core',
    strings: [
      'electricui-core:cancellation-token',
      'electricui-core:connection-interface',
      'electricui-core:connection',
      'electricui-core:device',
      'electricui-core:device-manager',
      'electricui-core:discovery-manager',
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
    categoryTitle: 'IPC',
    strings: [
      'electricui-core-device-manager-proxy:client',
      'electricui-core-device-manager-proxy:server',
      'electricui-core-device-manager-proxy:client-pings',
      'electricui-core-device-manager-proxy:server-pings',
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

export function DebugChannels() {
  const currentlySelected = debugStrings.filter(str => debug.enabled(str))

  const [selectedStrings, setSelected] = useState<string[]>(currentlySelected)

  const select = useCallback(
    (namespaces: string[]) => {
      const namespaceStr = namespaces.join(',')
      debug.enable(namespaceStr)

      setSelected(debugStrings.filter(str => debug.enabled(str)))
    },
    [setSelected],
  )

  return (
    <>
      <h1>Transport Debugger</h1>
      <p>Use this interface to filter the transport-manager&apos;s runtime debug output.</p>
      <p>Filter modifications require a restart of the transport-manager and will disconnect from all devices.</p>
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
                          select(selectedStrings.filter(selectedString => selectedString !== debugString))
                          return
                        }

                        select([...selectedStrings, debugString])
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
    </>
  )
}
