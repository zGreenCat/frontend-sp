import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Result, success, failure } from '@/shared/types/Result';

export class FinalizeProject {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<void>> {
    try {
      // Finalizar proyecto (cambiar status a 'FINALIZADO')
      await this.projectRepo.update(id, { status: 'FINALIZADO' }, tenantId);
      return success(undefined);
    } catch {
      return failure('Error al finalizar proyecto');
    }
  }
}
