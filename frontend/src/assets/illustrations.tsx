// ============================================================================
// ASSETS: HÌNH MINH HỌA HOẠT HÌNH 2D CHUẨN PHONG CÁCH "CASE HUNTER"
// Nét vẽ viền đen đậm (Bold Outlines), biểu cảm sinh động, màu sắc tươi sáng
// ============================================================================
import React from 'react';

// 1. Nhân vật Điều tra viên / Thám tử nhí lém lỉnh cầm kính lúp
export function DetectiveIllustration({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background Comic Burst Glow */}
      <circle cx="100" cy="100" r="85" fill="#FFEAA7" stroke="#331A05" strokeWidth="4" />
      <path d="M100 15L108 55M100 185L92 145M15 100L55 108M185 100L145 92" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

      {/* Áo Choàng Thám Tử (Trench Coat) */}
      <path d="M60 145C60 120 75 110 100 110C125 110 140 120 140 145L148 190H52L60 145Z" fill="#F59E0B" stroke="#331A05" strokeWidth="4" strokeLinejoin="round" />
      {/* Cổ áo măng-tô */}
      <path d="M85 112L70 135L92 138L100 115L108 138L130 135L115 112" fill="#D97706" stroke="#331A05" strokeWidth="3" />
      {/* Cà vạt xanh */}
      <path d="M96 122L104 122L106 148L100 156L94 148L96 122Z" fill="#2563EB" stroke="#331A05" strokeWidth="3" />

      {/* Đầu nhân vật */}
      <ellipse cx="100" cy="85" rx="32" ry="30" fill="#FEF3C7" stroke="#331A05" strokeWidth="4" />

      {/* Mũ Thám tử (Deerstalker hat) */}
      <path d="M62 76C62 50 80 40 100 40C120 40 138 50 138 76H62Z" fill="#B45309" stroke="#331A05" strokeWidth="4" />
      <path d="M52 76C52 74 148 74 148 76C148 82 52 82 52 76Z" fill="#92400E" stroke="#331A05" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="40" r="5" fill="#FEF3C7" stroke="#331A05" strokeWidth="3" />

      {/* Mắt to tròn hoạt hình */}
      <ellipse cx="88" cy="84" rx="7" ry="9" fill="#1E293B" />
      <circle cx="86" cy="81" r="2.5" fill="#FFFFFF" />
      <ellipse cx="112" cy="84" rx="7" ry="9" fill="#1E293B" />
      <circle cx="110" cy="81" r="2.5" fill="#FFFFFF" />

      {/* Má hồng hoạt hình */}
      <ellipse cx="78" cy="92" rx="5" ry="3" fill="#F87171" opacity="0.7" />
      <ellipse cx="122" cy="92" rx="5" ry="3" fill="#F87171" opacity="0.7" />

      {/* Miệng cười tự tin */}
      <path d="M94 96C97 101 103 101 106 96" stroke="#331A05" strokeWidth="3" strokeLinecap="round" />

      {/* Tay cầm Kính Lúp Phóng Đại */}
      <path d="M125 130L145 110" stroke="#331A05" strokeWidth="6" strokeLinecap="round" />
      <circle cx="152" cy="102" r="24" fill="#93C5FD" fillOpacity="0.4" stroke="#331A05" strokeWidth="5" />
      <circle cx="152" cy="102" r="20" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M142 92L148 98M160 108L166 114" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 2. Nạn nhân đang hốt hoảng trước điện thoại/máy tính
export function VictimIllustration({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="85" fill="#FEE2E2" stroke="#331A05" strokeWidth="4" />
      
      {/* Giọt mồ hôi hốt hoảng */}
      <path d="M60 60C60 60 52 70 52 75C52 79 55 82 60 82C65 82 68 79 68 75C68 70 60 60 60 60Z" fill="#60A5FA" stroke="#331A05" strokeWidth="2.5" />
      <path d="M142 65C142 65 136 73 136 77C136 80 138 82 142 82C146 82 148 80 148 77C148 73 142 65 142 65Z" fill="#60A5FA" stroke="#331A05" strokeWidth="2" />

      {/* Thân nhân vật */}
      <path d="M68 145C68 125 80 115 100 115C120 115 132 125 132 145L138 190H62L68 145Z" fill="#14B8A6" stroke="#331A05" strokeWidth="4" strokeLinejoin="round" />

      {/* Khuôn mặt hoang mang */}
      <ellipse cx="100" cy="85" rx="30" ry="28" fill="#FEF3C7" stroke="#331A05" strokeWidth="4" />
      
      {/* Tóc rối */}
      <path d="M70 75C68 55 85 45 100 45C118 45 132 55 130 75C125 65 115 62 100 62C85 62 75 65 70 75Z" fill="#334155" stroke="#331A05" strokeWidth="3" />

      {/* Mắt hình xoắn ốc / hoang mang */}
      <circle cx="88" cy="84" r="9" fill="#FFFFFF" stroke="#331A05" strokeWidth="3" />
      <circle cx="88" cy="84" r="4" fill="#331A05" />
      <circle cx="112" cy="84" r="9" fill="#FFFFFF" stroke="#331A05" strokeWidth="3" />
      <circle cx="112" cy="84" r="4" fill="#331A05" />

      {/* Lông mày nhăn lo lắng */}
      <path d="M80 73L94 77M120 73L106 77" stroke="#331A05" strokeWidth="3.5" strokeLinecap="round" />

      {/* Miệng há hốc chữ O sợ hãi */}
      <ellipse cx="100" cy="98" rx="8" ry="10" fill="#EF4444" stroke="#331A05" strokeWidth="3" />

      {/* Điện thoại rung bần bật trên tay */}
      <rect x="115" y="118" width="30" height="48" rx="6" fill="#1E293B" stroke="#331A05" strokeWidth="3.5" transform="rotate(-15 115 118)" />
      <rect x="119" y="124" width="22" height="34" rx="3" fill="#F87171" stroke="#331A05" strokeWidth="2" transform="rotate(-15 119 124)" />
      <path d="M148 110L158 106M155 125L165 128" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 3. Khung cảnh căn phòng hiện trường 2D Case Hunter hoàn chỉnh (2D Room Stage)
export function CaseHunterRoomStage({
  caseId,
  stationIndex: _stationIndex,
  onInspectItem,
}: {
  caseId: number;
  stationIndex: number;
  onInspectItem?: () => void;
}) {
  return (
    <div className="relative w-full h-[240px] sm:h-[280px] bg-[#FFFBEB] rounded-2xl overflow-hidden border-4 border-[#4A2C11] select-none shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]">
      {/* 1. Tường phòng kem sáng với họa tiết sọc giấy dán tường hoạt hình */}
      <div
        className="absolute inset-0 h-[65%]"
        style={{
          background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(245, 158, 11, 0.08) 32px, rgba(245, 158, 11, 0.08) 64px)',
        }}
      >
        {/* Khung tranh điều tra trên tường */}
        <div className="absolute top-4 left-6 w-14 h-18 bg-white border-2 border-[#4A2C11] rounded-lg p-1 shadow-sm rotate-[-3deg]">
          <div className="w-full h-full bg-[#BFDBFE] border border-[#4A2C11] rounded flex items-center justify-center text-[10px] font-black text-[#1E3A8A]">
            HỒ SƠ
          </div>
        </div>

        {/* Đồng hồ treo tường hoạt hình */}
        <div className="absolute top-4 right-8 w-11 h-11 bg-white border-3 border-[#4A2C11] rounded-full flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4A2C11]" />
          <div className="absolute w-0.5 h-3 bg-[#4A2C11] -top-1" />
          <div className="absolute w-3 h-0.5 bg-[#EF4444] -right-1" />
        </div>
      </div>

      {/* 2. Sàn gỗ nâu sẫm lát chéo (Parquet Wooden Floor) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%] border-t-4 border-[#4A2C11]"
        style={{
          background: 'linear-gradient(180deg, #A0522D 0%, #6E3813 100%)',
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0, 0, 0, 0.15) 48px, rgba(0, 0, 0, 0.15) 50px)',
        }}
      />

      {/* 3. Bàn làm việc bằng gỗ trong phòng */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[220px] sm:w-[260px] h-[75px] bg-[#D97706] border-3 border-[#4A2C11] rounded-xl shadow-[0_4px_0_#4A2C11] flex items-center justify-around px-4">
        {/* Laptop / Điện thoại khả nghi phát sáng */}
        <button
          onClick={onInspectItem}
          className="relative group p-1 bg-white border-2 border-[#4A2C11] rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all"
          title="Bấm để soi bằng chứng khả nghi!"
        >
          {(caseId === 1 || caseId === 2) ? (
            <div className="w-10 h-7 bg-[#1E293B] rounded flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
              📞 SOS
            </div>
          ) : (
            <div className="w-10 h-7 bg-[#3B82F6] rounded flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
              💻 LINK
            </div>
          )}
          {/* Glowing clue dot */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF4444]"></span>
          </span>
        </button>

        {/* Cốc cà phê thám tử */}
        <div className="w-6 h-8 bg-white border-2 border-[#4A2C11] rounded-md relative flex items-center justify-center">
          <div className="w-1.5 h-3 border-2 border-[#4A2C11] rounded-r-md absolute -right-2 top-2" />
          <div className="w-3 h-0.5 bg-[#4A2C11]" />
        </div>

        {/* Giấy tờ hồ sơ nghi vấn */}
        <button
          onClick={onInspectItem}
          className="p-1.5 bg-[#FFFBEB] border-2 border-[#4A2C11] rounded shadow-sm rotate-6 hover:scale-110 transition-all"
        >
          <div className="text-[10px] font-black text-[#8D230F]">TÀI LIỆU</div>
        </button>
      </div>

      {/* 4. Nhân vật Nạn Nhân ngồi sau bàn toát mồ hôi & Bong bóng suy nghĩ */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        {/* Bong bóng suy nghĩ (Thought Bubble) */}
        <div className="bg-white border-2 border-[#4A2C11] rounded-xl px-2.5 py-1 text-[11px] font-black text-[#8D230F] shadow-sm mb-1 animate-bounce">
          💭 &quot;Công an thật hay lừa đảo?!&quot;
        </div>
        <VictimIllustration className="w-24 h-24 sm:w-28 sm:h-28" />
      </div>

      {/* 5. Thám tử nhí quan sát ở góc trái */}
      <div className="absolute bottom-2 left-2 pointer-events-none">
        <DetectiveIllustration className="w-20 h-20 sm:w-24 sm:h-24" />
      </div>
    </div>
  );
}

// 4. Con dấu phá án đỏ SOLVED phong cách comic
export function SolvedStamp({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="60" cy="60" r="54" stroke="#DC2626" strokeWidth="6" strokeDasharray="6 3" />
      <circle cx="60" cy="60" r="46" stroke="#DC2626" strokeWidth="3" />
      <text x="60" y="52" textAnchor="middle" fill="#DC2626" fontWeight="900" fontSize="14" letterSpacing="1" fontFamily="Impact, sans-serif">
        ĐÃ PHÁ ÁN
      </text>
      <text x="60" y="75" textAnchor="middle" fill="#DC2626" fontWeight="900" fontSize="20" letterSpacing="2" fontFamily="Impact, sans-serif">
        SOLVED
      </text>
      <polygon points="60,82 62,87 67,87 63,90 65,95 60,92 55,95 57,90 53,87 58,87" fill="#DC2626" />
    </svg>
  );
}
