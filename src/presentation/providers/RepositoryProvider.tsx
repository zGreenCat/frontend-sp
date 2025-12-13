"use client";

import React, { createContext, useContext, ReactNode } from 'react';
// API Repositories
import { ApiUserRepository } from '@/infrastructure/repositories/ApiUserRepository';
import { ApiAreaRepository } from '@/infrastructure/repositories/ApiAreaRepository';
import { ApiWarehouseRepository } from '@/infrastructure/repositories/ApiWarehouseRepository';
import { ApiAssignmentHistoryRepository } from '@/infrastructure/repositories/ApiAssignmentHistoryRepository';
import { ApiAssignmentRepository } from '@/infrastructure/repositories/ApiAssignmentRepository';
import { ApiAuditLogRepository } from '@/infrastructure/repositories/ApiAuditLogRepository';
import { ApiUserEnablementHistoryRepository } from '@/infrastructure/repositories/ApiUserEnablementHistoryRepository';
// Mock Repositories (mantener para módulos no conectados)
import { MockBoxRepository } from '@/infrastructure/repositories/MockBoxRepository';
import { MockProductRepository } from '@/infrastructure/repositories/MockProductRepository';
import { MockProviderRepository } from '@/infrastructure/repositories/MockProviderRepository';
import { MockProjectRepository } from '@/infrastructure/repositories/MockProjectRepository';
// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { IUserEnablementHistoryRepository } from '@/domain/repositories/IUserEnablementHistoryRepository';

interface Repositories {
  userRepo: IUserRepository;
  areaRepo: IAreaRepository;
  warehouseRepo: IWarehouseRepository;
  boxRepo: MockBoxRepository;
  productRepo: MockProductRepository;
  providerRepo: MockProviderRepository;
  projectRepo: MockProjectRepository;
  assignmentHistoryRepo: IAssignmentHistoryRepository;
  assignmentRepo: IAssignmentRepository;
  auditLogRepo: IAuditLogRepository;
  userEnablementHistoryRepo: IUserEnablementHistoryRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

export const RepositoryProvider = ({ children }: { children: ReactNode }) => {
  const repos: Repositories = {
    // Repositorios conectados al backend real
    userRepo: new ApiUserRepository(),
    areaRepo: new ApiAreaRepository(),
    warehouseRepo: new ApiWarehouseRepository(),
    assignmentHistoryRepo: new ApiAssignmentHistoryRepository(),
    assignmentRepo: new ApiAssignmentRepository(),
    auditLogRepo: new ApiAuditLogRepository(),
    userEnablementHistoryRepo: new ApiUserEnablementHistoryRepository(),
    // Repositorios Mock (pendientes de conectar)
    boxRepo: new MockBoxRepository(),
    productRepo: new MockProductRepository(),
    providerRepo: new MockProviderRepository(),
    projectRepo: new MockProjectRepository(),
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
