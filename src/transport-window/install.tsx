import { DeviceManagerProxyServer, setupProxyServer } from '@electricui/core-device-manager-proxy'

import { DebugInterface } from '../DebugInterface'
import { DeviceManager } from '@electricui/core'
// Take a DeviceManager and a root and begin the render process for React
import React from 'react'
import ReactDOM from 'react-dom'

interface DebugInterfaceProps {
  proxyServer: DeviceManagerProxyServer
  deviceManager: DeviceManager
}

export function setupProxyAndDebugInterface(
  element: Element | DocumentFragment,
  deviceManager: DeviceManager,
  Component?: React.FC<DebugInterfaceProps>,
) {
  let server = setupProxyServer(deviceManager)

  const ComponentToRender = Component ?? DebugInterface

  ReactDOM.render(<ComponentToRender proxyServer={server} deviceManager={deviceManager} />, element)

  // On refresh.
  return (element2: Element | DocumentFragment, deviceManager2: DeviceManager) => {
    // console.log('Setting up new proxy server for device manager', deviceManager2.uuid, '(was', deviceManager.uuid, ')')

    // Grab the hot reload data
    const mutableHotReloadData = {}
    server.requestDataForHotReload(mutableHotReloadData)

    // generate a new proxy server
    server = setupProxyServer(deviceManager2)

    // Apply the hot reload data
    server.provideDataForHotReload(mutableHotReloadData)

    // Re-render
    ReactDOM.render(<ComponentToRender proxyServer={server} deviceManager={deviceManager2} />, element2)
  }
}
