import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const INBOX_STATUS_VALUES = ["open", "archived", "all"] as const;
export const INBOX_SORT_VALUES = ["newest", "name", "unread"] as const;

export const inboxFilterParsers = {
  iq: parseAsString.withDefault(""),
  istatus: parseAsStringLiteral(INBOX_STATUS_VALUES).withDefault("open"),
  isort: parseAsStringLiteral(INBOX_SORT_VALUES).withDefault("newest"),
};

export const inboxFiltersCache = createSearchParamsCache(inboxFilterParsers);
