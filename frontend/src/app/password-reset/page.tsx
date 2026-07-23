'use client';
import { useState } from 'react';
import { LoadingPopup } from '@/components/ui/loading-popup';
import { useKeyboardMode } from '@/hooks/useKeyboardMode';

export default function PasswordReset() {
  useKeyboardMode('none');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Giả lập thời gian xử lý API
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="dark bg-[#09090B] min-h-screen text-white font-sans">
      
{/**/}
<header className="bg-[#09090B] text-[#FFFFFF] border-b border-[#FFFFFF] fixed top-0 w-full z-50">
<div className="max-w-[400px] mx-auto px-edge-margin h-16 flex items-center justify-between">
<button aria-label="Go back" className="text-[#FFFFFF] hover:bg-primary hover:text-[#09090B] active:translate-y-px transition-transform p-2 -ml-2">
<span className="material-symbols-outlined">arrow_back</span>
</button>
<h1 className="font-semibold text-2xl text-[#FFFFFF] uppercase tracking-tighter">XÁC THỰC</h1>
<div className="w-10"></div> {/**/}
</div>
</header>
{/**/}
<main className="flex-grow pt-24 pb-32 px-edge-margin w-full max-w-md mx-auto flex flex-col space-y-stack-lg">
{/**/}
<section className="flex flex-col space-y-stack-sm text-left">
<h2 className="font-bold-mobile md:font-bold text-3xl-mobile md:text-3xl text-[#FFFFFF]">
                Đặt lại mật khẩu (Bắt buộc)
            </h2>
<p className="font-normal text-base text-[#c8c5ca]">
                Đang xử lý đặt lại mật khẩu cho tài khoản lpokmoppokid@gmail.com
            </p>
</section>
{/**/}
<form onSubmit={handleSubmit} className="flex flex-col space-y-stack-lg w-full">
{/**/}
<div className="flex flex-col space-y-stack-sm border-b border-secondary pb-4">
<span className="font-medium text-sm text-[#c8c5ca] uppercase">Tài khoản</span>
<span className="font-mono font-medium text-lg tracking-widest text-[#FFFFFF]">lpokmoppokid@gmail.com</span>
</div>
{/**/}
<div className="flex flex-col space-y-stack-sm relative">
<label className="font-medium text-sm text-[#FFFFFF] uppercase" htmlFor="otp">Mã xác thực OTP (6 chữ số)</label>
<input autoComplete="off" className="bg-[#09090B] border border-[#FFFFFF] text-[#FFFFFF] font-mono font-medium text-lg tracking-widest p-3 focus:border-[#FFFFFF] rounded-none w-full tracking-widest text-center" id="otp" maxLength={6} name="otp" required={true} type="text"/>
<button className="text-[#c8c5ca] hover:text-[#FFFFFF] font-medium text-sm uppercase text-right pt-2 transition-colors" type="button">
                    Gửi lại OTP
                </button>
</div>
{/**/}
<div className="flex flex-col space-y-stack-sm">
<label className="font-medium text-sm text-[#FFFFFF] uppercase" htmlFor="new-password">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
<input className="bg-[#09090B] border border-[#FFFFFF] text-[#FFFFFF] font-normal text-lg p-3 focus:border-[#FFFFFF] rounded-none w-full" id="new-password" minLength={8} name="new-password" required={true} type="password"/>
</div>
{/**/}
<div className="flex flex-col space-y-stack-sm">
<label className="font-medium text-sm text-[#FFFFFF] uppercase" htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
<input className="bg-[#09090B] border border-[#FFFFFF] text-[#FFFFFF] font-normal text-lg p-3 focus:border-[#FFFFFF] rounded-none w-full" id="confirm-password" minLength={8} name="confirm-password" required={true} type="password"/>
</div>
{/**/}
<div className="pt-4 flex flex-col space-y-stack-md">
<button className="bg-[#FFFFFF] text-[#09090B] font-medium text-sm uppercase p-4 w-full text-center hover:bg-[#09090B] hover:text-[#FFFFFF] hover:border hover:border-[#FFFFFF] active:translate-y-px transition-all rounded-none btn-active" type="submit">
                    Xác nhận đổi mật khẩu
                </button>
<p className="font-medium text-sm text-[#c8c5ca] text-center">
                    Yêu cầu bắt buộc: Hoàn tất đặt lại mật khẩu để tiếp tục sử dụng hệ thống.
                </p>
</div>
</form>
</main>
{/**/}
{/**/}
{/**/}
{/**/}
<nav className="bg-[#09090B] border-t border-[#FFFFFF] fixed bottom-0 w-full z-50 md:hidden">
<div className="max-w-[400px] mx-auto flex justify-around items-center py-4">
<button aria-label="Home" className="text-[#FFFFFF] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center group">
<span className="material-symbols-outlined text-[24px]">home</span>
</button>
<button aria-label="Reset Password Active" className="bg-[#FFFFFF] text-[#09090B] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center">
<span className="material-symbols-outlined text-[24px]" >lock_reset</span>
</button>
<button aria-label="Profile" className="text-[#FFFFFF] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center group">
<span className="material-symbols-outlined text-[24px]">person</span>
</button>
</div>
</nav>
{/**/}
<nav className="hidden md:flex bg-[#09090B] border-t border-[#FFFFFF] fixed bottom-0 w-full z-50">
<div className="max-w-[400px] mx-auto flex justify-around items-center py-4 w-full">
<button aria-label="Home" className="text-[#FFFFFF] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center group">
<span className="material-symbols-outlined text-[24px]">home</span>
</button>
<button aria-label="Reset Password Active" className="bg-[#FFFFFF] text-[#09090B] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center">
<span className="material-symbols-outlined text-[24px]" >lock_reset</span>
</button>
<button aria-label="Profile" className="text-[#FFFFFF] p-2 hover:bg-[#FFFFFF] hover:text-[#09090B] active:translate-y-px transition-all flex flex-col items-center group">
<span className="material-symbols-outlined text-[24px]">person</span>
</button>
</div>
</nav>
<script dangerouslySetInnerHTML={{ __html: `
  const otpInput = document.getElementById('otp');
  if (otpInput) {
    otpInput.addEventListener('input', function (e) {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }
` }} />

    <LoadingPopup isOpen={isLoading} text="Đang xác nhận đổi mật khẩu..." />
    </div>
  );
}