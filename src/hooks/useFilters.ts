import { useMemo, useState } from 'react';
import type { Spot } from '../types/data';

export interface FilterState {
  areas: Set<string>;
  categories: Set<string>;
  onlyWarning: boolean;
  onlyAnime: boolean;
  onlyPriority: boolean;
  onlyAnimeSrc: boolean;
  onlyGameSrc: boolean;
  onlyGuide: boolean;
  query: string;
}

export type OnlyFlagKey =
  | 'onlyWarning'
  | 'onlyAnime'
  | 'onlyPriority'
  | 'onlyAnimeSrc'
  | 'onlyGameSrc'
  | 'onlyGuide';

const INITIAL_STATE: FilterState = {
  areas: new Set(),
  categories: new Set(),
  onlyWarning: false,
  onlyAnime: false,
  onlyPriority: false,
  onlyAnimeSrc: false,
  onlyGameSrc: false,
  onlyGuide: false,
  query: '',
};

function passesFilter(filters: FilterState, s: Spot): boolean {
  if (filters.areas.size > 0 && !filters.areas.has(s.area)) return false;
  if (filters.categories.size > 0 && !filters.categories.has(s.category)) return false;
  if (filters.onlyWarning && s.status !== 'caution' && s.status !== 'closed') return false;
  if (filters.onlyAnime && s.anime !== 'new') return false;
  if (filters.onlyPriority && !s.priority) return false;
  if (filters.onlyAnimeSrc && !s.srcAnime) return false;
  if (filters.onlyGameSrc && !s.srcGame) return false;
  if (filters.onlyGuide && !s.guide) return false;
  if (filters.query) {
    const hay = [s.name, s.gameName, s.address, s.area, s.category, s.description]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(filters.query)) return false;
  }
  return true;
}

export function useFilters(spots: Spot[]) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_STATE);

  const toggleArea = (area: string) => {
    setFilters((prev) => {
      const areas = new Set(prev.areas);
      if (areas.has(area)) areas.delete(area);
      else areas.add(area);
      return { ...prev, areas };
    });
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => {
      const categories = new Set(prev.categories);
      if (categories.has(category)) categories.delete(category);
      else categories.add(category);
      return { ...prev, categories };
    });
  };

  const toggleFlag = (key: OnlyFlagKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, query: query.trim().toLowerCase() }));
  };

  const reset = () => setFilters(INITIAL_STATE);

  const visibleSpots = useMemo(
    () => spots.filter((s) => passesFilter(filters, s)),
    [spots, filters],
  );

  return { filters, toggleArea, toggleCategory, toggleFlag, setQuery, reset, visibleSpots };
}
