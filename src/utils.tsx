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
