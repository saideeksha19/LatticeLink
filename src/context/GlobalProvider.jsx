import React from 'react';
import { UserProvider } from './UserContext';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
import { SecurityProvider } from './SecurityContext';
import { ChatProvider } from './ChatContext';
import { CollaborationProvider } from './CollaborationContext';
import { VaultProvider } from './VaultContext';

export const GlobalProvider = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <SettingsProvider>
          <SecurityProvider>
            <ChatProvider>
              <CollaborationProvider>
                <VaultProvider>
                  {children}
                </VaultProvider>
              </CollaborationProvider>
            </ChatProvider>
          </SecurityProvider>
        </SettingsProvider>
      </UserProvider>
    </AuthProvider>
  );
};
