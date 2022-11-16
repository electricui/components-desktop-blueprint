import './index.css'

import { Alignment, Button, Classes, Navbar, Tab, Tabs } from '@blueprintjs/core'
import React, { useState } from 'react'

import { Composition } from 'atomic-layout'
import { DarkModeWrapper } from '../DarkModeWrapper'
import { DebugChannels } from './debug-channels'
import { DeviceManager } from '@electricui/core'
import { IconNames } from '@blueprintjs/icons'
import { ipcRenderer } from 'electron'
import { DebugDeviceState } from './device-state'

import { DeviceManagerProxyContext, EventConnector } from '@electricui/components-core'
import { StateProvider } from '@electricui/components-core'

interface DebugInterfaceProps {
  deviceManager: DeviceManager
}

export const DebugInterface = (props: DebugInterfaceProps) => {
  const [selectedTab, setSelectedTab] = useState<string | number>('debug_channels')

  return (
    <DarkModeWrapper>
      <div className="debug-header">
        <Navbar style={{ background: 'transparent', boxShadow: 'none' }}>
          <div style={{ margin: '0 auto', width: '100%' }}>
            <Navbar.Group align={Alignment.LEFT}>
              <Button
                minimal
                large
                icon={IconNames.FILTER}
                text="Debug Log Channels"
                onClick={() => {
                  setSelectedTab('debug_channels')
                }}
                active={selectedTab === 'debug_channels'}
                style={{ marginRight: '0.5em' }}
              />
              <Button
                minimal
                large
                icon={IconNames.PROPERTIES}
                text="Device State"
                onClick={() => {
                  setSelectedTab('device_state')
                }}
                active={selectedTab === 'device_state'}
                style={{ marginRight: '0.5em' }}
              />
              {/* 
              <Button
                disabled
                minimal
                large
                icon={IconNames.SATELLITE}
                text="Connection States"
                onClick={() => {
                  setSelectedTab('connection_states')
                }}
                active={selectedTab === 'connection_states'}
              /> */}
            </Navbar.Group>
            <Navbar.Group align={Alignment.RIGHT}>
              <Button
                intent="success"
                className={Classes.OUTLINED}
                large
                minimal
                icon="applications"
                onClick={() => {
                  ipcRenderer.send('open-debug-window-dev-tools')
                }}
                style={{ marginRight: '0.5em' }}
              >
                Open Transport Console
              </Button>
              <Button
                intent="primary"
                className={Classes.OUTLINED}
                large
                minimal
                icon="document-open"
                onClick={() => {
                  ipcRenderer.send('open-debugging-docs')
                }}
              >
                Open Debugging Docs
              </Button>
            </Navbar.Group>
          </div>
        </Navbar>
      </div>
      <div className="debug-content">
        <StateProvider>
          <DeviceManagerProxyContext.Provider
            value={{ foundTransportManager: true, deviceManager: props.deviceManager }}
          >
            {selectedTab === 'debug_channels' ? <DebugChannels /> : null}
            {selectedTab === 'device_state' ? <DebugDeviceState /> : null}
            <EventConnector />
          </DeviceManagerProxyContext.Provider>
        </StateProvider>
      </div>
    </DarkModeWrapper>
  )
}
