'use client';
import { useState } from 'react';
import { LoadingPopup } from '@/components/atoms/ui/loading-popup';

export default function FriendCode() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="dark bg-[#09090B] min-h-screen text-white font-sans">
      
{/**/}
<div className="bg-[#09090B] rounded-3xl border border-white/10 p-8 w-full max-w-md flex flex-col gap-6 relative">
{/**/}
<button aria-label="Close" className="absolute top-6 right-6 text-[#71717A] hover:text-[#FFFFFF] transition-colors">
<span className="material-symbols-outlined">close</span>
</button>
{/**/}
<div className="flex flex-col items-center text-center gap-2">
<div className="w-12 h-12 rounded-full bg-[#1b211d] flex items-center justify-center mb-2 border border-white/10">
<span className="material-symbols-outlined text-[#FFFFFF] text-2xl" >key</span>
</div>
<h1 className="font-bold text-3xl text-[#FFFFFF]">Mã Kết Bạn</h1>
<p className="font-normal text-base text-[#71717A] max-w-xs">Chia sẻ mã ngắn gọn để kết bạn nhanh chóng</p>
</div>
{/**/}
<div className="bg-[#18181B] rounded-full p-1 flex border border-white/10">
<button className="flex-1 bg-[#27272A] text-[#FFFFFF] font-medium text-sm py-2 px-4 rounded-full transition-all">
                Lấy mã của tôi
            </button>
<button className="flex-1 text-[#71717A] font-medium text-sm py-2 px-4 rounded-full transition-all hover:text-[#FFFFFF]">
                Nhập mã kết bạn
            </button>
</div>
{/**/}
<div className="text-center py-4">
<p className="font-normal text-base text-[#71717A]">
                Bấm nút bên dưới để tạo Mã Kết Bạn. Bạn bè chỉ cần nhập mã này để kết bạn ngay lập tức mà không cần gõ link phức tạp!
            </p>
</div>
{/**/}
<button onClick={handleGenerateCode} className="w-full bg-[#059669] text-[#FFFFFF] font-medium text-sm py-4 rounded-2xl transition-transform active:-translate-y-px mt-2">
            Tạo Mã Kết Bạn Nhanh
        </button>
</div>

    <LoadingPopup isOpen={isLoading} text="Đang tạo mã kết bạn..." />
    </div>
  );
}