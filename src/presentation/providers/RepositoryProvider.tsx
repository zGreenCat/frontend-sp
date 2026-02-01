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
import { ApiProductRepository } from '@/infrastructure/repositories/ApiProductRepository';
import { ApiUnitOfMeasureRepository } from '@/infrastructure/repositories/ApiUnitOfMeasureRepository';
import { ApiCurrencyRepository } from '@/infrastructure/repositories/ApiCurrencyRepository';
import { ApiMaterialCategoryRepository } from '@/infrastructure/repositories/ApiMaterialCategoryRepository';
// Mock Repositories (mantener para módulos no conectados)
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
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IUnitOfMeasureRepository } from '@/domain/repositories/IUnitOfMeasureRepository';
import { ICurrencyRepository } from '@/domain/repositories/ICurrencyRepository';
import { IMaterialCategoryRepository } from '@/domain/repositories/IMaterialCategoryRepository';

/**
 * Repositorios disponibles en la aplicación
 */
interface Repositories {
  userRepo: IUserRepository;
  areaRepo: IAreaRepository;
  warehouseRepo: IWarehouseRepository;
  warehouseMovementRepo: IWarehouseMovementRepository;
  boxRepo: IBoxRepository;
  productRepo: IProductRepository; // ✅ Repositorio unificado de productos
  unitOfMeasureRepo: IUnitOfMeasureRepository;
  currencyRepo: ICurrencyRepository;
  materialCategoryRepo: IMaterialCategoryRepository;
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
    boxRepo: new ApiBoxRepository(),
    
    // ✅ Repositorio unificado de productos (fachada sobre equipments, materials, spare-parts)
    productRepo: new ApiProductRepository(),
    
    // ✅ Catálogos de productos
    unitOfMeasureRepo: new ApiUnitOfMeasureRepository(),
    currencyRepo: new ApiCurrencyRepository(),
    materialCategoryRepo: new ApiMaterialCategoryRepository(),
    
    // Repositorios Mock (pendientes de conectar)
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
