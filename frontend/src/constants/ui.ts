/**
 * UI Constants
 * 
 * Centralized constants for UI-related values like messages, labels, and configuration.
 * This helps maintain consistency and makes localization easier in the future.
 */

export const UI_MESSAGES = {
  LOADING: 'Loading...',
  NO_DATA: 'No data available',
  ERROR_GENERIC: 'An error occurred',
  SUCCESS_SAVE: 'Saved successfully',
  SUCCESS_DELETE: 'Deleted successfully',
  SUCCESS_CREATE: 'Created successfully',
  SUCCESS_UPDATE: 'Updated successfully',
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
} as const;

export const FORM_LABELS = {
  EMAIL: 'Email Address',
  PASSWORD: 'Password',
  NAME: 'Name',
  DESCRIPTION: 'Description',
  ROLE: 'Role',
  PERMISSION: 'Permission',
  STATUS: 'Status',
  ACTIONS: 'Actions',
  CREATED_AT: 'Created',
  REQUIRED: 'Required field',
} as const;

export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 300,
} as const;
