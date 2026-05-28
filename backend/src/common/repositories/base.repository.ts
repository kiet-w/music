/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<T, Delegate> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: Delegate,
  ) {}

  async findMany(args?: any): Promise<T[]> {
    return (this.delegate as any).findMany(args);
  }

  async findUnique(args: any): Promise<T | null> {
    return (this.delegate as any).findUnique(args);
  }

  async create(args: any): Promise<T> {
    return (this.delegate as any).create(args);
  }

  async update(args: any): Promise<T> {
    return (this.delegate as any).update(args);
  }

  async delete(args: any): Promise<T> {
    return (this.delegate as any).delete(args);
  }
}
