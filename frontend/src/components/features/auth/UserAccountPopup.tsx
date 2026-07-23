'use client';

// ponytail: user account popup component with prominent top header & bottom logout buttons
import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, User, Lock, LogOut, KeyRound, Loader2, Check, ShieldCheck } from 'lucide-react';
import { useAuthStore, getEffectiveAccessToken } from '@/store/useAuthStore';
import { updateProfile, changePassword, uploadImage } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface UserAccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export function UserAccountPopup({ isOpen, onClose, locale = 'vi' }: UserAccountPopupProps) {
  const router = useRouter();
  const { user, updateUser, clearSession } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarMediaUrl = getMediaUrl(user?.avatarUrl);
  const [avatarError, setAvatarError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Form states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalPreview(null);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getEffectiveAccessToken();
    if (!token) {
      toast.error('Phiên đăng nhập đã hết hạn');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không vượt quá 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setAvatarError(false);

    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadImage(token, file, 'avatars');
      const updatedUser = await updateProfile(token, { avatarUrl: url });
      await updateUser({ avatarUrl: updatedUser.avatarUrl || url });
      toast.success('Đã cập nhật ảnh đại diện thành công');
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      toast.error(err?.message || 'Không thể tải ảnh đại diện lên');
      setLocalPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getEffectiveAccessToken();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên hiển thị hợp lệ');
      return;
    }
    if (!token) {
      toast.error('Phiên đăng nhập đã hết hạn');
      return;
    }

    setIsUpdatingName(true);
    try {
      const updatedUser = await updateProfile(token, { name: name.trim() });
      await updateUser({ name: updatedUser.name || name.trim() });
      toast.success('Đã cập nhật tên hiển thị thành công');
    } catch (err: any) {
      console.error('Failed to update name:', err);
      await updateUser({ name: name.trim() });
      toast.success('Đã lưu tên hiển thị');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getEffectiveAccessToken();
    if (!token) {
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(token, { currentPassword, newPassword });
      toast.success('Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toast.error(err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    toast.success('Đã đăng xuất tài khoản');
    onClose();
    router.push(`/${locale}/login`);
  };

  const userInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const displayAvatarUrl = localPreview || avatarMediaUrl;

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col text-white">
      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Header with prominent Logout button */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-instrument">Tài Khoản</h2>
          <p className="text-[11px] text-zinc-400">Quản lý hồ sơ & bảo mật</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black text-white text-xs font-bold transition-all border border-white/20 active:scale-95 cursor-pointer"
            title="Đăng xuất tài khoản"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 py-3 space-y-4 overflow-y-auto pr-0.5 scrollbar-hide">
        {/* User Profile Overview Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5">
          <div
            onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
            className="relative w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white text-lg font-bold font-instrument cursor-pointer group overflow-hidden shrink-0 shadow-inner"
            title="Nhấp để thay đổi ảnh đại diện"
          >
            {displayAvatarUrl && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatarUrl}
                alt={user?.name || 'Avatar'}
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <span>{userInitial}</span>
            )}

            <div className={`absolute inset-0 bg-black/75 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span className="text-[8px] font-semibold">Đổi ảnh</span>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white truncate font-instrument">{user?.name || 'Người dùng'}</span>
              <span className="bg-white/10 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shrink-0">
                <ShieldCheck className="w-3 h-3 text-white" /> Verified
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate font-mono mt-0.5">{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Display Name Change Form */}
        <form onSubmit={handleUpdateName} className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Tên hiển thị
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-medium border-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingName || !name.trim()}
              className="px-3.5 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {isUpdatingName ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : 'Lưu tên'}
            </button>
          </div>
        </form>

        <div className="h-[1px] bg-white/5 w-full" />

        {/* Password Change Form */}
        <form onSubmit={handleChangePassword} className="space-y-2">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Đổi mật khẩu
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all border-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (6+)"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all border-none"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all border-none"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword || !newPassword || !confirmPassword}
            className="w-full py-2 bg-white/10 hover:bg-white hover:text-black text-white font-semibold text-xs rounded-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            {isUpdatingPassword ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-current" />
                <span>Cập nhật mật khẩu</span>
              </>
            )}
          </button>
        </form>

        <div className="h-[1px] bg-white/5 w-full" />

        {/* Full-width Bottom Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-white/10 hover:bg-white hover:text-black text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
        >
          <LogOut className="w-4 h-4 text-current" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );
}

export default UserAccountPopup;
