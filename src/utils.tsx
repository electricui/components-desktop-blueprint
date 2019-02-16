import React from 'react'

/**
 * Returns true if the given JSX element matches the given component type.
 *
 * NOTE: This function only checks equality of `displayName` for performance and
 * to tolerate multiple minor versions of a component being included in one
 * application bundle.
 * @param element JSX element in question
 * @param ComponentType desired component type of element
 */
export function isElementOfType<P = {}>(
  element: any,
  ComponentType: React.ComponentType<P>,
): element is React.ReactElement<P> {
  return (
    element != null &&
    element.type != null &&
    element.type.displayName != null &&
    element.type.displayName === ComponentType.displayName
  )
}

type ComparisonSet = {
  [key: string]: any
}

export function isSubset(superset: ComparisonSet, subset: ComparisonSet) {
  if (
    typeof superset !== 'object' ||
    superset === null ||
    (typeof subset !== 'object' || subset === null)
  ) {
    return false
  }

  for (const key of Object.keys(subset)) {
    const subsetItem = subset[key]
    const supersetItem = superset[key]
    if (
      typeof subsetItem === 'object' && subsetItem !== null
        ? !isSubset(supersetItem, subsetItem)
        : supersetItem !== subsetItem
    ) {
      return false
    }
  }

  return true
}
