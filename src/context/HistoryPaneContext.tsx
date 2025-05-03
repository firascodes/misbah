"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface HistoryPaneContextType {
  isHistoryPaneOpen: boolean;
  toggleHistoryPane: () => void;
  openHistoryPane: () => void;
  closeHistoryPane: () => void;
}

const HistoryPaneContext = createContext<HistoryPaneContextType | undefined>(undefined);

export const HistoryPaneProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHistoryPane = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openHistoryPane = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeHistoryPane = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <HistoryPaneContext.Provider value={{ isHistoryPaneOpen: isOpen, toggleHistoryPane, openHistoryPane, closeHistoryPane }}>
      {children}
    </HistoryPaneContext.Provider>
  );
};

export const useHistoryPane = () => {
  const context = useContext(HistoryPaneContext);
  if (context === undefined) {
    throw new Error('useHistoryPane must be used within a HistoryPaneProvider');
  }
  return context;
};
