"use client";

import React, { createContext, useContext, ReactNode } from 'react';
// API Repositories
import { ApiUserRepository } from '@/infrastructure/repositories/ApiUserRepository';
import { ApiAreaRepository } from '@/infrastructure/repositories/ApiAreaRepository';
import { ApiWarehouseRepository } from '@/infrastructure/repositories/ApiWarehouseRepository';
import { ApiWarehouseMovementRepository } from '@/infrastructure/repositories/ApiWarehouseMovementRepository';
import { ApiAssignmentHistoryRepository } from '@/infrastructure/repositories/ApiAssignmentHistoryRepository';
import { ApiAssignmentRepository } from '@/infrastructure/repositories/ApiAssignmentRepository';
import { ApiAuditLogRepository } from '@/infrastructure/repositories/ApiAuditLogRepository';
import { ApiUserEnablementHistoryRepository } from '@/infrastructure/repositories/ApiUserEnablementHistoryRepository';
import { ApiBoxRepository } from '@/infrastructure/repositories/ApiBoxRepository';
// Mock Repositories (mantener para módulos no conectados)
import { MockProductRepository } from '@/infrastructure/repositories/MockProductRepository';
import { MockProviderRepository } from '@/infrastructure/repositories/MockProviderRepository';
import { MockProjectRepository } from '@/infrastructure/repositories/MockProjectRepository';
// Interfaces
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { IWarehouseMovementRepository } from '@/domain/repositories/IWarehouseMovementRepository';
import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { IUserEnablementHistoryRepository } from '@/domain/repositories/IUserEnablementHistoryRepository';
import { IBoxRepository } from '@/domain/repositories/IBoxRepository';

interface Repositories {
  userRepo: IUserRepository;
  areaRepo: IAreaRepository;
  warehouseRepo: IWarehouseRepository;
  warehouseMovementRepo: IWarehouseMovementRepository;
  boxRepo: IBoxRepository;
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
    warehouseMovementRepo: new ApiWarehouseMovementRepository(),
    assignmentHistoryRepo: new ApiAssignmentHistoryRepository(),
    assignmentRepo: new ApiAssignmentRepository(),
    auditLogRepo: new ApiAuditLogRepository(),
    userEnablementHistoryRepo: new ApiUserEnablementHistoryRepository(),
    boxRepo: new ApiBoxRepository(), // ✅ AHORA USA API REAL
    // Repositorios Mock (pendientes de conectar)
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
