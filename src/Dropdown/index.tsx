import {
  Accessor,
  Draft,
  deepObjectEquality,
  useAsyncThrow,
  useDeadline,
  useHardwareState,
  useWriteState,
} from '@electricui/components-core'
import { Button, IMenuItemProps, MenuItem } from '@blueprintjs/core'
import { IItemRendererProps, ISelectProps, ItemRenderer, Select } from '@blueprintjs/select'
import React, { useCallback, useMemo } from 'react'
import { generateWriteErrHandler, isElementOfType } from '../utils'

type UpstreamSelectPropsProps<T> = Omit<ISelectProps<T>, 'itemRenderer' | 'items' | 'onItemSelect' | 'activeItem'>

interface DropdownProps<T> extends UpstreamSelectPropsProps<DropdownOptionProps<T>> {
  /**
   * Either a string that denotes the messageID or a function that takes the device's state tree and returns state to match against the values
   */
  accessor: Accessor<T>

  /**
   * A writer to write the selected state.
   *
   * If the accessor is a MessageID string this isn't required.
   */
  writer?: (staging: Draft<ElectricUIDeveloperState>, value: T | any) => void

  /**
   * A series of `Dropdown.Option` components that describe the possible selection options
   */
  children: React.ReactElement<DropdownOptionProps<T>>[] | React.ReactElement<DropdownOptionProps<T>>

  /**
   * A function that takes the currently selected item and returns the placeholder text.
   * It can also take a string.
   *
   * Can be used to display the name of the current selected item in addition for example.
   */
  placeholder?: ((selectedItem: DropdownOptionProps<T> | null) => string) | string

  itemRenderer?: ItemRenderer<DropdownOptionProps<T>>
}

interface DropdownOptionProps<T> extends IMenuItemProps {
  /**
   * The value to pass to the writer upon clicking.
   *
   * Also the value that's used to pattern match the current hardware state.
   */
  value: T
  /**
   * The text to display for the option.
   */
  text: string
}

/**
 * A Dropdown option
 * @module @electricui/components-desktop-blueprint
 * @name Dropdown.Option
 * @props DropdownOptionProps
 */
function DropdownOption<T>(props: DropdownOptionProps<T>) {
  return null
}
DropdownOption.displayName = 'DropdownOption'
Dropdown.Option = DropdownOption

function propsToDropdownOptionProps<T>(props: DropdownProps<T>): Array<DropdownOptionProps<T>> {
  return React.Children.map(props.children, child =>
    isElementOfType(child, DropdownOption) ? child.props : null,
  ).filter(child => child !== null)
}

function renderDefaultItem<T>(item: DropdownOptionProps<T>, itemProps: IItemRendererProps) {
  const { text, ...rest } = item

  return (
    <MenuItem active={itemProps.modifiers.active} key={text} onClick={itemProps.handleClick} text={text} {...rest} />
  )
}

/**
 * Dropdown
 * @module @electricui/components-desktop-blueprint
 * @name Dropdown
 * @props DropdownProps
 */
export function Dropdown<T>(props: DropdownProps<T>) {
  const hardwareState = useHardwareState<T>(props.accessor)
  const writeState = useWriteState()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  // Filter the props we need and the props we'll pass down.
  const { accessor: _1, writer: _2, children: _3, placeholder, ...rest } = props

  const items = propsToDropdownOptionProps(props)

  let selectedOption: DropdownOptionProps<T> | null = null

  for (const option of items) {
    if (deepObjectEquality(option.value, hardwareState)) {
      selectedOption = option
      break
    }
  }

  const placeholderText = useMemo(() => {
    if (typeof placeholder === 'function') {
      return placeholder(selectedOption)
    }

    if (typeof placeholder === 'string') {
      return selectedOption?.text ?? placeholder
    }

    return 'Select an option'
  }, [placeholder])

  // the writer
  const writer = useMemo(() => {
    if (props.writer) {
      return props.writer
    }

    if (typeof props.accessor === 'string') {
      const accessor = props.accessor
      return (staging: Draft<ElectricUIDeveloperState>, value: T) => {
        staging[accessor] = value
      }
    }

    throw new Error("If the Dropdown's accessor isn't a MessageID string, a writer must be provided")
  }, [props.writer, props.accessor])

  const handleWriting = useCallback(
    (toWrite: T) => {
      const cancellationToken = getDeadline()

      writeState(
        draftState => {
          writer(draftState, toWrite)
        },
        true,
        cancellationToken,
      ).catch(generateWriteErrHandler(asyncThrow))
    },
    [writer, getDeadline],
  )

  const onItemSelect = useCallback(
    (option: DropdownOptionProps<T>) => {
      handleWriting(option.value)
    },
    [handleWriting],
  )

  if (items.length === 0) {
    return <Button text={'No Options'} rightIcon="double-caret-vertical" />
  }

  return (
    <Select
      popoverProps={{ minimal: true }}
      filterable={false}
      {...rest}
      itemRenderer={props.itemRenderer ?? renderDefaultItem}
      items={items}
      onItemSelect={onItemSelect}
      activeItem={selectedOption}
    >
      <Button text={placeholderText} rightIcon="double-caret-vertical" />
    </Select>
  )
}
