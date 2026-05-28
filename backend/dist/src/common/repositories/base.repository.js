"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    prisma;
    delegate;
    constructor(prisma, delegate) {
        this.prisma = prisma;
        this.delegate = delegate;
    }
    async findMany(args) {
        return this.delegate.findMany(args);
    }
    async findUnique(args) {
        return this.delegate.findUnique(args);
    }
    async create(args) {
        return this.delegate.create(args);
    }
    async update(args) {
        return this.delegate.update(args);
    }
    async delete(args) {
        return this.delegate.delete(args);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map