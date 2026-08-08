export function getUserStatusText(isOnline?: boolean, lastSeen?: string | Date | null): { text: string; isOnline: boolean } {
  if (isOnline) {
    return { text: 'Online', isOnline: true };
  }

  if (!lastSeen) {
    return { text: 'Offline', isOnline: false };
  }

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - lastSeenDate.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return { text: 'Hoạt động Vừa xong', isOnline: false };
  }

  if (diffMinutes < 60) {
    return { text: `Hoạt động ${diffMinutes} phút trước`, isOnline: false };
  }

  if (diffHours < 24) {
    return { text: `Hoạt động ${diffHours} giờ trước`, isOnline: false };
  }

  return { text: `Hoạt động ${diffDays} ngày trước`, isOnline: false };
}
