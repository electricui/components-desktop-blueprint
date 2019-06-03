import React, { ReactNode } from 'react'
import { Alert, Intent, IconName } from '@blueprintjs/core'
import { useDeviceManagerWorking } from '@electricui/components-core'

type DeviceManagerStatusModalProps = {
  /** The icon to display. */
  icon?: IconName
  /** The intent of the modal. */
  intent?: Intent
  /** The contents to render in the modal. */
  children?: ReactNode
}

const DeviceManagerStatusModal = ({
  intent,
  icon,
  children,
}: DeviceManagerStatusModalProps) => {
  const deviceManagerWorking = useDeviceManagerWorking()

  return (
    <Alert icon={icon} intent={intent} isOpen={!deviceManagerWorking}>
      {children}
    </Alert>
  )
}

DeviceManagerStatusModal.defaultProps = {
  children: (
    <p>
      The device manager doesn't appear to be working. A restart of the
      application is likely required.
    </p>
  ),
}

export default DeviceManagerStatusModal
