import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<
  T,
  Delegate extends {
    findMany(args?: any): Promise<T[]>;
    findUnique(args: any): Promise<T | null>;
    findFirst(args?: any): Promise<T | null>;
    create(args: any): Promise<T>;
    update(args: any): Promise<T>;
    delete(args: any): Promise<T>;
    count(args?: any): Promise<number>;
  }
> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: Delegate,
  ) {}

  protected async handlePrismaError(error: unknown): Promise<never> {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target = (error.meta?.target as string[]) || ['unknown'];
          throw new ConflictException(
            `Record with this ${target.join(', ')} already exists`,
          );
        }
        case 'P2025':
          throw new NotFoundException(
            error.meta?.cause || 'Record not found',
          );
        case 'P2003':
          throw new BadRequestException('Foreign key constraint failed');
        default:
          throw new InternalServerErrorException(
            `Database error: ${error.code}`,
          );
      }
    }
    throw error;
  }

  async findMany(args?: Parameters<Delegate['findMany']>[0]): Promise<T[]> {
    try {
      return await this.delegate.findMany(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async findUnique(args: Parameters<Delegate['findUnique']>[0]): Promise<T | null> {
    try {
      return await this.delegate.findUnique(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async count(args?: Parameters<Delegate['count']>[0]): Promise<number> {
    try {
      return await this.delegate.count(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async findFirst(args?: Parameters<Delegate['findFirst']>[0]): Promise<T | null> {
    try {
      return await this.delegate.findFirst(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async create(args: Parameters<Delegate['create']>[0]): Promise<T> {
    try {
      return await this.delegate.create(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async update(args: Parameters<Delegate['update']>[0]): Promise<T> {
    try {
      return await this.delegate.update(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async delete(args: Parameters<Delegate['delete']>[0]): Promise<T> {
    try {
      return await this.delegate.delete(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }
}
