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
import { IItemRendererProps, ItemRenderer, Select } from '@blueprintjs/select'
import React, { useCallback, useMemo } from 'react'
import { generateWriteErrHandler, isElementOfType } from '../utils'

const ElectricSelect = Select

interface DropdownProps<T> {
  accessor: Accessor<T>
  writer: (staging: Draft<ElectricUIDeveloperState>, value: T | any) => void
  children: React.ReactElement<DropdownOptionProps<T>>[] | React.ReactElement<DropdownOptionProps<T>>
  placeholder?: string
  itemRenderer?: ItemRenderer<DropdownOptionProps<T>>
}

interface DropdownOptionProps<T> extends IMenuItemProps {
  value: T
  text: string
}

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

export function Dropdown<T>(props: DropdownProps<T>) {
  const hardwareState = useHardwareState<T>(props.accessor)
  const writeState = useWriteState()
  const asyncThrow = useAsyncThrow()
  const getDeadline = useDeadline()

  const placeholderText = props.placeholder ?? 'Select an option'

  const items = propsToDropdownOptionProps(props)

  let selectedOption: DropdownOptionProps<T> | null = null

  for (const option of items) {
    if (deepObjectEquality(option.value, hardwareState)) {
      selectedOption = option
      break
    }
  }

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
    <ElectricSelect
      itemRenderer={props.itemRenderer ?? renderDefaultItem}
      items={items}
      onItemSelect={onItemSelect}
      filterable={false}
      popoverProps={{ minimal: true }}
      activeItem={selectedOption}
    >
      <Button text={selectedOption?.text ?? placeholderText} rightIcon="double-caret-vertical" />
    </ElectricSelect>
  )
}
