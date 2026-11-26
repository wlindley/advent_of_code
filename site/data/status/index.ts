import { combineYearStatuses, type StatusDocument, type YearStatus } from '../status';

const yearModules = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<string, YearStatus>;

export function loadStatusDocument(): StatusDocument {
  return combineYearStatuses(Object.values(yearModules));
}
