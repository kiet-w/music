/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<T, Delegate> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: Delegate,
  ) {}

  protected async handlePrismaError(error: any): Promise<never> {
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

  async findMany(args?: any): Promise<T[]> {
    try {
      return await (this.delegate as any).findMany(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async findUnique(args: any): Promise<T | null> {
    try {
      return await (this.delegate as any).findUnique(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async count(args?: any): Promise<number> {
    try {
      return await (this.delegate as any).count(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async findFirst(args: any): Promise<T | null> {
    try {
      return await (this.delegate as any).findFirst(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async create(args: any): Promise<T> {
    try {
      return await (this.delegate as any).create(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async update(args: any): Promise<T> {
    try {
      return await (this.delegate as any).update(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async delete(args: any): Promise<T> {
    try {
      return await (this.delegate as any).delete(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }
}
