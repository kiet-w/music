import { Injectable, BadRequestException } from '@nestjs/common';
import { Album, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class AlbumRepository extends BaseRepository<
  Album,
  Prisma.AlbumDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.album);
  }

  /**
   * Find a single album scoped exclusively to a specific user.
   */
  async findOneForUser(
    id: string,
    userId: string,
  ): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });
  }

  /**
   * Find all albums scoped to a specific user with pagination.
   */
  async findAllForUser(
    userId: string,
    skip: number = 0,
    take: number = 50,
  ) {
    const [total, albums] = await Promise.all([
      this.prisma.album.count({ where: { userId } }),
      this.prisma.album.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tracks: true },
          },
        },
      }),
    ]);
    return { total, albums };
  }

  /**
   * Find album by title scoped to a user.
   */
  async findByUserAndTitle(
    userId: string,
    title: string,
  ): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        userId,
        title,
      },
    });
  }

  /**
   * Find default album scoped to a user.
   */
  async findDefault(userId: string): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  /**
   * Find album by title and artist scoped to a specific user.
   */
  async findByTitleAndArtistForUser(
    userId: string,
    title: string,
    artist?: string,
  ): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        userId,
        title,
        ...(artist ? { artist } : {}),
      },
    });
  }

  /**
   * Update an album scoped strictly to a user.
   */
  async updateOneForUser(
    id: string,
    userId: string,
    data: Prisma.AlbumUpdateInput,
  ): Promise<Album | null> {
    const existing = await this.findOneForUser(id, userId);
    if (!existing) return null;

    return this.prisma.album.update({
      where: { id: existing.id },
      data,
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });
  }

  /**
   * Delete an album scoped strictly to a user.
   */
  async deleteOneForUser(id: string, userId: string): Promise<Album | null> {
    const existing = await this.findOneForUser(id, userId);
    if (!existing) return null;

    if (existing.isDefault) {
      throw new BadRequestException('Cannot delete the default album');
    }

    return this.prisma.album.delete({
      where: { id: existing.id },
    });
  }
}
