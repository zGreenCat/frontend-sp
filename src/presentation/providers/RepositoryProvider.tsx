"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { MockUserRepository } from '@/infrastructure/repositories/MockUserRepository';
import { MockAreaRepository } from '@/infrastructure/repositories/MockAreaRepository';
import { MockWarehouseRepository } from '@/infrastructure/repositories/MockWarehouseRepository';
import { MockBoxRepository } from '@/infrastructure/repositories/MockBoxRepository';
import { MockProductRepository } from '@/infrastructure/repositories/MockProductRepository';
import { MockProviderRepository } from '@/infrastructure/repositories/MockProviderRepository';
import { MockProjectRepository } from '@/infrastructure/repositories/MockProjectRepository';
import { MockAssignmentHistoryRepository } from '@/infrastructure/repositories/MockAssignmentHistoryRepository';

interface Repositories {
  userRepo: MockUserRepository;
  areaRepo: MockAreaRepository;
  warehouseRepo: MockWarehouseRepository;
  boxRepo: MockBoxRepository;
  productRepo: MockProductRepository;
  providerRepo: MockProviderRepository;
  projectRepo: MockProjectRepository;
  assignmentHistoryRepo: MockAssignmentHistoryRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

export const RepositoryProvider = ({ children }: { children: ReactNode }) => {
  const repos: Repositories = {
    userRepo: new MockUserRepository(),
    areaRepo: new MockAreaRepository(),
    warehouseRepo: new MockWarehouseRepository(),
    boxRepo: new MockBoxRepository(),
    productRepo: new MockProductRepository(),
    providerRepo: new MockProviderRepository(),
    projectRepo: new MockProjectRepository(),
    assignmentHistoryRepo: new MockAssignmentHistoryRepository(),
  };

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepositories = () => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within RepositoryProvider');
  }
  return context;
};
