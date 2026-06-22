# P2-2: JWT Schema Migration
Updated `JwtAuthGuard` to assign `UserRole.USER` as a fallback role when decoding old tokens that lack the `role` field. This prevents locking out old users while maintaining secure access control.
