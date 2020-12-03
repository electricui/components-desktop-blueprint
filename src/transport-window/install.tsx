import { DeviceManagerProxyServer, setupProxyServer } from '@electricui/components-core'

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

  // This is from the perspective of the transport managers index file, since we've stolen their module.hot reference.
  // hot.accept('./config', () => {
  //   console.log('Hot reloading device manager configuration...')
  //   console.log('Tearing down old proxy server')

  //   // Prepare the device manager proxy server for a hot reload
  //   const dataBundle = server.prepareForHotReload()

  //   console.log('Setting up new proxy server')

  //   // Setup the new proxy server
  //   server = setupProxyServer(deviceManager)
  //   server.setDataForHotReload(dataBundle)

  //   ReactDOM.render(<DebugInterface proxyServer={server} deviceManager={deviceManager} />, element)
  // })

  const ComponentToRender = Component ?? DebugInterface

  ReactDOM.render(<ComponentToRender proxyServer={server} deviceManager={deviceManager} />, element)

  return (element2: Element | DocumentFragment, deviceManager2: DeviceManager) => {
    // Shut down old device manager, old proxy server

    // Turn on new device manager, new proxy server

    // Connect to new devices

    // Re-render

    const dataBundle = server.prepareForHotReload()

    console.log(
      'hot handler in our control',
      element === element2 ? 'same elements' : 'elements changed',
      deviceManager === deviceManager2 ? 'same device mangaer' : 'device manager changed',
    )

    ReactDOM.render(<ComponentToRender proxyServer={server} deviceManager={deviceManager} />, element)
  }
}
