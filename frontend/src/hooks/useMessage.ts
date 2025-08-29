/**
 * useMessage Hook
 * 
 * A custom hook for managing success/error messages with automatic dismissal.
 * Provides a clean API for showing and hiding messages throughout the app.
 * 
 * @example
 * const { message, messageType, showMessage, clearMessage } = useMessage();
 * 
 * showMessage('Success!', 'success');
 * showMessage('Error occurred', 'error');
 */

import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface UseMessageReturn {
  message: string;
  messageType: MessageType;
  showMessage: (text: string, type?: MessageType) => void;
  clearMessage: () => void;
}

export const useMessage = (): UseMessageReturn => {
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<MessageType>('info');

  const showMessage = useCallback((text: string, type: MessageType = 'info') => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    messageType,
    showMessage,
    clearMessage,
  };
};
