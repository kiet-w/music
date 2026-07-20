# Songs & Jobs Architecture Documentation

Complete documentation for the Songs and Jobs modules in the backend application.

## Quick Start

- **Songs Module**: Manages music tracks, YouTube integration, and song metadata
- **Jobs Module**: Handles background job processing for YouTube conversion

## Documentation Structure

```
backend/docs/learn/
├── README.md (this file)
├── songs/                    # Songs module documentation
│   ├── 00-overview.md
│   ├── 01-controller.md
│   ├── 02-service.md
│   ├── 03-commands.md
│   ├── 04-queries.md
│   ├── 05-repository.md
│   ├── 06-helpers.md
│   ├── 07-dto.md
│   └── 08-constants.md
└── jobs/                     # Jobs module documentation
    ├── 00-overview.md
    ├── 01-module.md
    ├── 02-conversion-processor.md
    ├── 03-cleanup-service.md
    └── 04-metrics-service.md
└── diagrams/                 # Architecture diagrams
    ├── general/               # General system diagrams
    │   ├── mmd/               # Mermaid source files
    │   │   ├── 01-system-overview.mmd
    │   │   └── 06-module-dependencies.mmd
    │   └── svg/               # Rendered SVG files (high res, zoomable)
    │       ├── 01-system-overview.svg
    │       └── 06-module-dependencies.svg
    ├── songs/                 # Songs module diagrams
    │   ├── mmd/               # Mermaid source files
    │   │   ├── 02-http-request-flow.mmd
    │   │   ├── 07-database-state-machine.mmd
    │   │   └── 08-song-repository-class.mmd
    │   └── svg/               # Rendered SVG files (high res, zoomable)
    │       ├── 02-http-request-flow.svg
    │       ├── 07-database-state-machine.svg
    │       └── 08-song-repository-class.svg
    └── jobs/                  # Jobs module diagrams
        ├── mmd/               # Mermaid source files
        │   ├── 03-conversion-processor-flow.mmd
        │   ├── 04-cleanup-service-flow.mmd
        │   └── 05-metrics-service-flow.mmd
        └── svg/               # Rendered SVG files (high res, zoomable)
            ├── 03-conversion-processor-flow.svg
            ├── 04-cleanup-service-flow.svg
            └── 05-metrics-service-flow.svg
```

## 📊 Architecture Diagrams

All diagrams are organized in the [diagrams/](./diagrams/) folder by module:

- **[general/](./diagrams/general/)** - System-wide diagrams
- **[songs/](./diagrams/songs/)** - Songs module diagrams
- **[jobs/](./diagrams/jobs/)** - Jobs module diagrams

Each folder contains:
- **mmd/** - Mermaid source files (for editing)
- **svg/** - Rendered SVG files (high resolution, zoomable)

### General Diagrams

- **[01-system-overview](./diagrams/general/svg/01-system-overview.svg)** - Overall system architecture showing all modules and infrastructure
- **[06-module-dependencies](./diagrams/general/svg/06-module-dependencies.svg)** - Module dependency relationships

### Songs Module Diagrams

- **[02-http-request-flow](./diagrams/songs/svg/02-http-request-flow.svg)** - HTTP request flow through Songs module with deduplication logic
- **[07-database-state-machine](./diagrams/songs/svg/07-database-state-machine.svg)** - Track.url state machine (pending → processing → completed)
- **[08-song-repository-class](./diagrams/songs/svg/08-song-repository-class.svg)** - SongRepository class diagram with BaseRepository inheritance

### Jobs Module Diagrams

- **[03-conversion-processor-flow](./diagrams/jobs/svg/03-conversion-processor-flow.svg)** - ConversionProcessor job processing flow with retry logic
- **[04-cleanup-service-flow](./diagrams/jobs/svg/04-cleanup-service-flow.svg)** - CleanupService scheduled tasks for orphaned jobs and temp files
- **[05-metrics-service-flow](./diagrams/jobs/svg/05-metrics-service-flow.svg)** - JobsMetricsService Prometheus metrics collection

### Regenerating SVGs

All SVGs are rendered at high resolution (1600х1200, scale 2) for better zooming. To regenerate:

```bash
# Regenerate all diagrams
cd backend/docs/learn/diagrams
for dir in general songs jobs; do
  for file in $dir/mmd/*.mmd; do
    basename=$(basename "$file" .mmd)
    mmdc -i "$file" -o "$dir/svg/${basename}.svg" -w 1600 -H 1200 -s 2
  done
done

# Or regenerate specific module
cd backend/docs/learn/diagrams/songs/mmd
for file in *.mmd; do
  basename=$(basename "$file" .mmd)
  mmdc -i "$file" -o "../svg/${basename}.svg" -w 1600 -H 1200 -s 2
done
```

## Songs Module Documentation

### Overview
- [Songs Overview](./songs/00-overview.md) - Introduction and architecture pattern

### Core Components
- [Controller](./songs/01-controller.md) - HTTP API layer and endpoints
- [Service](./songs/02-service.md) - Service orchestrator layer

### CQRS Implementation
- [Commands](./songs/03-commands.md) - Write operations (create, delete, move)
- [Queries](./songs/04-queries.md) - Read operations (list, find)

### Data Layer
- [Repository](./songs/05-repository.md) - Database access and queries
- [Helpers](./songs/06-helpers.md) - Utility services (mapper, validation)
- [DTOs](./songs/07-dto.md) - Data transfer objects and validation
- [Constants](./songs/08-constants.md) - Configuration constants

## Jobs Module Documentation

### Overview
- [Jobs Overview](./jobs/00-overview.md) - Introduction and job queue pattern

### Core Components
- [Module](./jobs/01-module.md) - BullMQ configuration and Redis setup
- [Conversion Processor](./jobs/02-conversion-processor.md) - YouTube to MP3 conversion
- [Cleanup Service](./jobs/03-cleanup-service.md) - Scheduled cleanup tasks
- [Metrics Service](./jobs/04-metrics-service.md) - Prometheus metrics and monitoring

## Key Concepts

### CQRS Pattern
Separation of read and write operations for better scalability and maintainability.

### Job Queue Pattern
Async processing of long-running tasks using BullMQ and Redis.

### Repository Pattern
Abstraction layer over database operations for consistency and testability.

### Deduplication Strategy
Three-level deduplication to prevent duplicate YouTube downloads.

## Architecture Flow

### Create Song from YouTube
```
Client → Controller → Service → CommandBus → Handler → Repository → Database
                                                              ↓
                                                         BullMQ Queue
                                                              ↓
                                                         Redis
                                                              ↓
                                                    ConversionProcessor
                                                              ↓
                                                    Downloader → Storage
                                                              ↓
                                                         Database Update
```

### List Songs
```
Client → Controller → Service → QueryBus → Handler → Repository → Database
```

## Technology Stack

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Job Queue**: BullMQ
- **Message Broker**: Redis
- **Storage**: Supabase Storage
- **Monitoring**: Prometheus
- **Logging**: Pino

## Environment Variables

### Redis (Required for Jobs)
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Database
```bash
DATABASE_URL=postgresql://...
```

### Supabase
```bash
SUPABASE_URL=...
SUPABASE_KEY=...
```

## Development

### Running the Application
```bash
cd backend
npm install
npm run start:dev
```

### Running Tests
```bash
npm run test
npm run test:e2e
```

### Running Workers
Jobs module requires worker processes to run:
```bash
npm run start:worker
```

## Troubleshooting

### Common Issues

**Jobs not processing**
- Check Redis is running
- Verify worker process is started
- Check processor logs for errors

**YouTube conversion failing**
- Verify yt-dlp binary exists
- Check network connectivity
- Review processor logs

**Queue backlog increasing**
- Check worker concurrency setting
- Verify processor is registered
- Scale workers if needed

## Related Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: 2026-07-09
