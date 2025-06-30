import { MAX_VISIBLE_FILTER_ITEM } from 'src/app/shared/constants';

export function formatInputFilterListWithOthers(
  items: string[],
  highlightText: string = 'others',
  maxDisplay: number = 3,
): string {
  if (!items || items.length === 0) return '';

  if (items.length <= maxDisplay) {
    return items.join(', ');
  }

  const displayedItems = items.slice(0, maxDisplay).join(', ');
  const remainingCount = items.length - maxDisplay;

  return `${displayedItems}, +${remainingCount} ${highlightText}`;
}

export function formatFilterItem(filterItem, allSelectionText) {
  if (!Array.isArray(filterItem) || filterItem.length === 0) {
    return allSelectionText;
  }

  if (filterItem.length <= MAX_VISIBLE_FILTER_ITEM) {
    return filterItem.join(', ');
  }

  const visibleStores = filterItem.slice(0, MAX_VISIBLE_FILTER_ITEM).join(', ');
  const remainingCount = filterItem.length - MAX_VISIBLE_FILTER_ITEM;

  return `${visibleStores} (+${remainingCount} others)`;
}
