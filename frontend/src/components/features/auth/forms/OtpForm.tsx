'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyOtp, resendOtp } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

interface OtpFormProps {
  email: string;
  onSuccess: () => void;
  t?: any;
}

export function OtpForm({ email, onSuccess, t }: OtpFormProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Mã OTP phải bao gồm 6 chữ số');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyOtp({ email, otp: otp.trim() });
      if (response.accessToken && response.user) {
        useAuthStore.getState().setSession(response.accessToken, response.user);
      }
      toast.success('Xác thực email thành công!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendOtp(email);
      toast.success(res.message || 'Đã gửi lại mã OTP');
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground">Xác thực tài khoản</h3>
        <p className="text-sm text-muted-foreground">
          Mã OTP 6 chữ số đã được gửi tới email: <span className="font-semibold text-primary">{email}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 text-center">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
          Nhập mã OTP (6 chữ số)
        </label>
        <Input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="text-center text-2xl font-mono tracking-[0.5em] h-14 font-bold"
          autoFocus
          required
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Đang xác thực...' : 'Xác thực Email'}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
        >
          {resending ? 'Đang gửi...' : 'Chưa nhận được mã? Gửi lại OTP'}
        </button>
      </div>
    </form>
  );
}
