import { PrismaService } from '../../prisma/prisma.service';
export declare abstract class BaseRepository<T, Delegate> {
    protected readonly prisma: PrismaService;
    protected readonly delegate: Delegate;
    constructor(prisma: PrismaService, delegate: Delegate);
    findMany(args?: any): Promise<T[]>;
    findUnique(args: any): Promise<T | null>;
    create(args: any): Promise<T>;
    update(args: any): Promise<T>;
    delete(args: any): Promise<T>;
}
