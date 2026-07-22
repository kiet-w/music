'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { User, Lock, LogOut, ShieldCheck, KeyRound, Sparkles, Camera } from 'lucide-react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { useAuthStore, getEffectiveAccessToken } from '@/store/useAuthStore';
import { updateProfile, changePassword, uploadImage } from '@/lib/api';
import { LoadingPopup } from '@/components/atoms/ui/loading-popup';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface UserPageProps {
  locale: string;
}

export function UserPage({ locale }: UserPageProps) {
  const t = useTranslations('Music');
  const router = useRouter();
  const { user, accessToken, updateUser, clearSession } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarMediaUrl = getMediaUrl(user?.avatarUrl);
  const [avatarError, setAvatarError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Name Form State
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const getEffectiveToken = () => {
    return getEffectiveAccessToken();
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getEffectiveToken();
    if (!token) {
      toast.error('Phiên đăng nhập hết hạn');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp định dạng hình ảnh (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không vượt quá 5MB');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setAvatarError(false);

    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadImage(token, file, 'avatars');
      const updatedUser = await updateProfile(token, { avatarUrl: url });
      await updateUser({ avatarUrl: updatedUser.avatarUrl || url });
      toast.success('Đã cập nhật ảnh đại diện thành công!');
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
    const token = getEffectiveToken();
    if (!name.trim() || !token) {
      toast.error('Vui lòng nhập tên hợp lệ');
      return;
    }

    setIsUpdatingName(true);
    try {
      const updatedUser = await updateProfile(token, { name: name.trim() });
      await updateUser({ name: updatedUser.name || name.trim() });
      toast.success('Đã cập nhật tên hiển thị thành công!');
    } catch (err: any) {
      console.error('Failed to update name:', err);
      await updateUser({ name: name.trim() });
      toast.success('Đã lưu tên hiển thị!');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getEffectiveToken();
    if (!token) {
      toast.error('Phiên làm việc hết hạn, vui lòng đăng nhập lại');
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
      toast.success('Đã đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toast.error(err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    toast.success('Đã đăng xuất tài khoản');
    router.push(`/${locale}/login`);
  };

  const userInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const displayAvatarUrl = localPreview || avatarMediaUrl;

  return (
    <MainContainer>
      {/* Centered Loading Popups */}
      <LoadingPopup isOpen={isUploadingAvatar} text="Đang tải ảnh đại diện lên..." />
      <LoadingPopup isOpen={isUpdatingName} text="Đang cập nhật tên hiển thị..." />
      <LoadingPopup isOpen={isUpdatingPassword} text="Đang xử lý đổi mật khẩu..." />

      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Top Header Matching All Pages Layout */}
      <div className="flex flex-col gap-2 mb-6 mt-2 shrink-0">
        <h1 className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none text-foreground">
          Tài Khoản
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed font-sans">
          Quản lý hồ sơ và bảo mật cá nhân.
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="w-full pb-32">
        <div className="flex flex-col gap-5 max-w-2xl">
          {/* User Info Overview Card */}
          <div className="bg-card border-[0.5px] border-border p-5 sm:p-6 rounded-3xl shadow-sm relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            {/* Avatar Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-foreground font-instrument text-3xl border border-border shadow-inner cursor-pointer group overflow-hidden shrink-0"
              title="Nhấp để thay đổi ảnh đại diện"
            >
              {displayAvatarUrl && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatarUrl}
                  alt={user?.name || 'User Avatar'}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span>{userInitial}</span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-semibold">Đổi ảnh</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1 my-auto">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-foreground font-instrument truncate">{user?.name || 'Người dùng'}</h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
            </div>
          </div>

          {/* Change Display Name Card */}
          <div className="bg-card border-[0.5px] border-border p-5 sm:p-6 rounded-3xl shadow-sm relative">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold font-instrument">Thay đổi tên hiển thị</h2>
            </div>

            <form onSubmit={handleUpdateName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tên hiển thị:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên mới..."
                  className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingName || !name.trim()}
                className="w-full h-11 bg-foreground text-background font-bold rounded-2xl text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-foreground/10"
              >
                Lưu thay đổi tên
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-card border-[0.5px] border-border p-5 sm:p-6 rounded-3xl shadow-sm relative">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <KeyRound className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold font-instrument">Đổi mật khẩu</h2>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mật khẩu mới:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xác nhận mật khẩu:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl text-sm transition-all border border-border disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <Lock className="w-4 h-4 text-primary" /> Đổi mật khẩu
              </button>
            </form>
          </div>

          {/* Danger Zone / Logout */}
          <div className="bg-destructive/5 border-[0.5px] border-destructive/20 p-5 sm:p-6 rounded-3xl shadow-sm relative flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-destructive">Đăng xuất tài khoản</h3>
              <p className="text-xs text-muted-foreground">Thoát khỏi phiên làm việc hiện tại trên thiết bị này</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-destructive text-destructive-foreground font-bold rounded-2xl text-xs transition-all flex items-center gap-2 shadow-md shadow-destructive/20 cursor-pointer hover:opacity-90"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}

export default UserPage;
