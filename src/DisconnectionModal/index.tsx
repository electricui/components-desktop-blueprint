import { Alert, IconName, Intent } from '@blueprintjs/core'
import React, { ReactNode } from 'react'
import {
  useDeadline,
  useDeviceDisconnect,
  useDeviceHasAcceptableConnection,
} from '@electricui/components-core'

type DisconnectionModalProps = {
  /** A function that navigates to the connections screen. */
  navigateToConnectionsScreen: () => void
  /** Text to display in the button that goes to the connections screen without disconnecting. */
  backText: string
  /** Text to display in the button that goes to the connections screen, disconnecting from the device. */
  disconnectText: string
  /** The icon to display. */
  icon?: IconName
  /** The intent of the modal. */
  intent?: Intent
  /** The contents to render in the modal. */
  children?: ReactNode
}

/**
 * DisconnectionModal
 * @module @electricui/components-desktop-blueprint
 * @name DisconnectionModal
 * @props DisconnectionModalProps
 */
const DisconnectionModal = ({
  navigateToConnectionsScreen,
  backText,
  disconnectText,
  intent,
  icon,
  children,
}: DisconnectionModalProps) => {
  const disconnect = useDeviceDisconnect()
  const hasAcceptableConnection = useDeviceHasAcceptableConnection()
  const getDeadline = useDeadline()

  return (
    <Alert
      cancelButtonText={backText}
      confirmButtonText={disconnectText}
      icon={icon}
      intent={intent}
      isOpen={!hasAcceptableConnection}
      onCancel={navigateToConnectionsScreen}
      onConfirm={() => {
        navigateToConnectionsScreen()
        disconnect(getDeadline())
      }}
    >
      {children}
    </Alert>
  )
}

DisconnectionModal.defaultProps = {
  backText: 'Go to the Connection Screen',
  disconnectText: 'Disconnect',
  children: (
    <p>
      Connection has been lost with your device. If we successfully reconnect
      this dialog will be dismissed.
    </p>
  ),
}

export default DisconnectionModal
