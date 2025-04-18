// src/contexts/SessionRepositoryContext.tsx
import React, { createContext, useContext } from 'react';
import { ISessionRepository } from '../repositories/SessionRepository';

const SessionRepositoryContext = createContext<ISessionRepository | null>(null);

export const SessionRepositoryProvider: React.FC<React.PropsWithChildren<{ repo: ISessionRepository }>> = ({ repo, children }) => (
    <SessionRepositoryContext.Provider value={repo}>
        {children}
    </SessionRepositoryContext.Provider>
);

export const useSessionRepository = (): ISessionRepository => {
    const repo = useContext(SessionRepositoryContext);
    if (!repo) {
        throw new Error('useSessionRepository must be used within a SessionRepositoryProvider');
    }
    return repo;
};
