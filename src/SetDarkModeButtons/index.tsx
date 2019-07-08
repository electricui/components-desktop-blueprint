import React from 'react'

import {
  useDarkMode,
  setUserDarkMode,
  useDarkModeSystem,
} from '@electricui/components-desktop'

import { Button } from '@blueprintjs/core'

export const SetDarkModeButtons = () => {
  const darkMode = useDarkMode()
  const system = useDarkModeSystem()

  if (darkMode) {
    return (
      <>
        <Button
          icon="lightbulb"
          onClick={() => setUserDarkMode(false)}
          style={{ marginLeft: 10 }}
        />
        {system ? null : (
          <Button
            icon="settings"
            onClick={() => setUserDarkMode(null)}
            style={{ marginLeft: 10 }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Button
        icon="moon"
        onClick={() => setUserDarkMode(true)}
        style={{ marginLeft: 10 }}
      />
      {system ? null : (
        <Button
          icon="settings"
          onClick={() => setUserDarkMode(null)}
          style={{ marginLeft: 10 }}
        />
      )}
    </>
  )
}
