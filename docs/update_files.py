import sys

# 1. Update useOfflineStorage.ts
with open('frontend/src/hooks/useOfflineStorage.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "export function useOfflineStorage() {\n  const [offlineTracks, setOfflineTracks] = useState<Set<string>>(new Set());",
    "export function useOfflineStorage() {\n  const [offlineTracks, setOfflineTracks] = useState<Set<string>>(new Set());\n  const isSupported = Capacitor.getPlatform() !== 'web';"
)

content = content.replace(
    "  // Load initial state\n  useEffect(() => {\n    const checkExistingFiles = async () => {\n      try {",
    "  // Load initial state\n  useEffect(() => {\n    if (!isSupported) return;\n    const checkExistingFiles = async () => {\n      try {"
)

content = content.replace(
    "  const downloadTrack = useCallback(async (trackId: string, url: string) => {\n    try {\n      // Ensure directory exists",
    "  const downloadTrack = useCallback(async (trackId: string, url: string) => {\n    if (!isSupported) return false;\n    try {\n      // Ensure directory exists"
)

content = content.replace(
    "  const removeTrack = useCallback(async (trackId: string) => {\n    try {",
    "  const removeTrack = useCallback(async (trackId: string) => {\n    if (!isSupported) return false;\n    try {"
)

content = content.replace(
    "  const getLocalUri = useCallback(async (trackId: string): Promise<string | null> => {\n    try {\n      if (!offlineTracks.has(trackId)) return null;",
    "  const getLocalUri = useCallback(async (trackId: string): Promise<string | null> => {\n    if (!isSupported) return null;\n    try {\n      if (!offlineTracks.has(trackId)) return null;"
)

content = content.replace(
    "  return {\n    offlineTracks,\n    downloadTrack,\n    removeTrack,\n    getLocalUri,\n  };",
    "  return {\n    offlineTracks,\n    downloadTrack,\n    removeTrack,\n    getLocalUri,\n    isSupported,\n  };"
)

with open('frontend/src/hooks/useOfflineStorage.ts', 'w') as f:
    f.write(content)

print("Updated useOfflineStorage.ts")

# 2. Update Library.tsx
with open('frontend/src/components/molecules/Library/Library.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const { offlineTracks, downloadTrack, removeTrack, getLocalUri } = useOfflineStorage();",
    "const { offlineTracks, downloadTrack, removeTrack, getLocalUri, isSupported } = useOfflineStorage();"
)

content = content.replace(
    """                    {isDownloading ? (
                      <Loader2 size={14} className="text-primary animate-spin mr-1" />
                    ) : isDownloaded ? (
                      <div className="flex items-center gap-1" title="Downloaded for offline">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-orange-500/20 hover:text-orange-500"
                          onClick={(e) => handleRemoveOffline(e, track.id)}
                          title="Remove Download"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => handleDownload(e, track)}
                        title="Download for Offline"
                      >
                        <Download size={14} />
                      </Button>
                    )}""",
    """                    {isSupported !== false && (isDownloading ? (
                      <Loader2 size={14} className="text-primary animate-spin mr-1" />
                    ) : isDownloaded ? (
                      <div className="flex items-center gap-1" title="Downloaded for offline">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-orange-500/20 hover:text-orange-500"
                          onClick={(e) => handleRemoveOffline(e, track.id)}
                          title="Remove Download"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => handleDownload(e, track)}
                        title="Download for Offline"
                      >
                        <Download size={14} />
                      </Button>
                    ))}"""
)

with open('frontend/src/components/molecules/Library/Library.tsx', 'w') as f:
    f.write(content)

print("Updated Library.tsx")

# 3. Create docs/p2-6-readme.md
import os
os.makedirs('docs', exist_ok=True)
with open('docs/p2-6-readme.md', 'w') as f:
    f.write("""# P2-6: useOfflineStorage - Guard web platform

## Objective
Prevent memory and storage issues on the web platform caused by `useOfflineStorage` loading entire MP3 files as base64 strings into memory (which it does because Capacitor's `convertFileSrc` doesn't work for audio on web).

## Implementation Plan
1. **Update `useOfflineStorage.ts`:**
   - Detect if the current platform is 'web' using `Capacitor.getPlatform() === 'web'`.
   - Add an `isSupported` boolean flag (`!isWeb`).
   - Short-circuit `downloadTrack`, `removeTrack`, `getLocalUri`, and the initial load `useEffect` if the platform is web.
   - Expose `isSupported` from the hook.

2. **Update `Library.tsx`:**
   - Destructure `isSupported` from the `useOfflineStorage` hook.
   - Conditionally render the offline download/remove buttons only if `isSupported` is true.

3. **Completion:**
   - Document the changes in this README and merge `p2-6-useofflinestorage-guard` to `main`.
""")

print("Created docs/p2-6-readme.md")
