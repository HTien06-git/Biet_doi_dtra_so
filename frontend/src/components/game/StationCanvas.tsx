// ============================================================================
// COMPONENTS/GAME/STATIONCANVAS.TSX
// DYNAMIC 2D STATION RENDERING ENGINE (CASE HUNTER ART STYLE)
// Động hóa toàn bộ: Scene Background, Character Sprite + Biểu cảm, Bong bóng thoại & Manh mối tương tác
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShieldAlert, FileText, QrCode, MessageSquare, PhoneCall,
  AlertTriangle, CheckCircle2, X, Sparkles, Shield, Eye, ExternalLink,
  Lock, ArrowRight, Activity
} from 'lucide-react';
import { StationConfig, ClueItem, CharacterExpression, BackgroundTheme } from '@/types/case';
import { getStationConfig } from '@/data/stationConfigs';
import { sounds } from '@/lib/sounds';

interface StationCanvasProps {
  caseId: number | string;
  stationIndex: number;
  onClueInspected?: (clue: ClueItem) => void;
}

export default function StationCanvas({ caseId, stationIndex, onClueInspected }: StationCanvasProps) {
  const config: StationConfig = getStationConfig(caseId, stationIndex);
  const [selectedClue, setSelectedClue] = useState<ClueItem | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedClue(null);
    };
    if (selectedClue) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClue]);

  const handleInspectClue = (clue: ClueItem) => {
    sounds.playMagnify();
    setSelectedClue(clue);
    if (onClueInspected) {
      onClueInspected(clue);
    }
  };

  const getClueIcon = (type: ClueItem['iconType']) => {
    switch (type) {
      case 'sos': return <ShieldAlert className="w-4 h-4 text-[#EF4444]" />;
      case 'pdf': return <FileText className="w-4 h-4 text-[#DC2626]" />;
      case 'qr': return <QrCode className="w-4 h-4 text-[#1A1AFF]" />;
      case 'chat_log': return <MessageSquare className="w-4 h-4 text-[#2563EB]" />;
      case 'call_log': return <PhoneCall className="w-4 h-4 text-[#D97706]" />;
      default: return <FileText className="w-4 h-4 text-[#059669]" />;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[360px] select-none overflow-hidden">
      
      {/* 1. DYNAMIC SCENE BACKGROUND THEMES */}
      <SceneBackground theme={config.backgroundTheme} />

      {/* 2. DYNAMIC CHARACTER SPRITE & EXPRESSIONS */}
      <div className="absolute left-2 sm:left-6 bottom-0 z-20 pointer-events-none">
        <DynamicCharacterSprite
          name={config.character.name}
          expression={config.character.expression}
        />
      </div>

      {/* 3. DYNAMIC COMIC SPEECH BUBBLE (Clean top zone - full width on mobile, left on desktop) */}
      <motion.div
        key={`${config.caseId}_${config.stationId}`}
        initial={{ scale: 0.85, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="absolute left-2 sm:left-24 top-2 sm:top-3 right-2 sm:right-auto z-25 sm:max-w-[240px] md:max-w-[270px]"
      >
        <div className="relative bg-white border-2 sm:border-3 border-[#1E293B] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 md:p-3 shadow-[0_3px_0_#1E293B] sm:shadow-[0_4px_0_#1E293B]">
          {/* Dialogue Tag */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block px-1.5 py-0.2 rounded-md bg-[#1A1AFF] text-white font-display font-black text-[8px] sm:text-[9px] uppercase tracking-wider">
              {config.character.name}
            </span>
            {config.character.roleTitle && (
              <span className="text-[8px] sm:text-[9px] font-bold text-[#64748B] truncate">
                · {config.character.roleTitle}
              </span>
            )}
          </div>

          <p className="text-[10.5px] sm:text-xs font-bold text-[#0F172A] leading-snug">
            {config.character.dialogueText}
          </p>

          {/* Comic speech bubble tail pointing to character */}
          <div className="absolute -bottom-2.5 left-6 sm:left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#1E293B]" />
          <div className="absolute -bottom-1.5 left-[26px] sm:left-[18px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      </motion.div>

      {/* 4. DYNAMIC INTERACTIVE CLUE TOKENS (Bottom-right on mobile, Top-right on desktop - ZERO overlap!) */}
      <div className="absolute right-2 sm:right-3.5 bottom-2 sm:top-3 sm:bottom-auto z-25 flex flex-col gap-1 sm:gap-1.5 items-end">
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 rounded-full bg-[#1E293B]/85 text-[#FDE047] text-[8px] sm:text-[9px] font-black uppercase tracking-wider backdrop-blur-xs shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
          MANH MỐI ({config.interactiveClues.length})
        </div>

        {config.interactiveClues.map((clue, idx) => (
          <motion.button
            key={clue.id}
            onClick={() => handleInspectClue(clue)}
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: idx * 0.08 + 0.05 }}
            whileHover={{ scale: 1.04, x: -2 }}
            whileTap={{ scale: 0.96 }}
            className="group relative flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/95 border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] hover:border-[#1A1AFF] hover:bg-[#F8FAFC] transition-all text-left backdrop-blur-sm cursor-pointer w-auto max-w-[130px] sm:max-w-[175px]"
            title="Click để soi chi tiết bằng chứng"
          >
            {/* Pulsing radar dot for interactivity */}
            <span className="absolute -top-1 -right-1 flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A1AFF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#1A1AFF]"></span>
            </span>

            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] border border-[#1E293B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DBEAFE] transition-colors">
              {getClueIcon(clue.iconType)}
            </div>

            <div className="min-w-0 pr-0.5">
              <span className="text-[9px] sm:text-[11px] font-display font-black text-[#0F172A] block leading-tight truncate group-hover:text-[#1A1AFF] transition-colors">
                {clue.label}
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-bold text-[#64748B] flex items-center gap-0.5">
                <Search className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#1A1AFF]" /> Soi chi tiết
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* 5. FORENSIC CLUE INSPECTOR MODAL (Full viewport modal, never clipped) */}
      <AnimatePresence>
        {selectedClue && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedClue(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg bg-white border-4 border-[#1E293B] rounded-2xl shadow-[0_12px_0_#1E293B] p-4 sm:p-5 relative my-auto max-h-[90vh] flex flex-col space-y-3"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Sticky Top Bar with Title & Close Button */}
              <div className="flex items-center justify-between border-b-2 border-[#CBD5E1] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1A1AFF] text-white flex items-center justify-center shadow-[0_2px_0_#000088] flex-shrink-0">
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#1A1AFF] tracking-wider block">
                      GIÁM ĐỊNH KỸ THUẬT SỐ
                    </span>
                    <h4 className="font-display font-black text-sm sm:text-base text-[#0F172A]">
                      {selectedClue.actionPayload.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClue(null)}
                  className="p-1.5 rounded-xl border-2 border-[#1E293B] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:translate-y-0.5 text-[#0F172A] transition-all cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* Scrollable Body Container */}
              <div className="overflow-y-auto pr-1 space-y-3 flex-1 max-h-[60vh]">
                {/* Risk Level Badge */}
                {selectedClue.actionPayload.riskLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#64748B]">Mức độ rủi ro:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedClue.actionPayload.riskLevel === 'critical'
                          ? 'bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626]'
                          : selectedClue.actionPayload.riskLevel === 'warning'
                          ? 'bg-[#FEF3C7] border border-[#D97706] text-[#D97706]'
                          : 'bg-[#ECFDF5] border border-[#059669] text-[#059669]'
                      }`}
                    >
                      {selectedClue.actionPayload.riskLevel === 'critical'
                        ? '🚨 Cực kỳ nguy hiểm'
                        : selectedClue.actionPayload.riskLevel === 'warning'
                        ? '⚠️ Đáng ngờ'
                        : '🛡️ An toàn'}
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs font-semibold text-[#334155] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border-2 border-[#E2E8F0]">
                  {selectedClue.actionPayload.description}
                </p>

                {/* Forensic Details List */}
                {selectedClue.actionPayload.details && selectedClue.actionPayload.details.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider block">
                      DẤU VẾT PHÂN TÍCH:
                    </span>
                    <ul className="space-y-1.5">
                      {selectedClue.actionPayload.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-xs font-bold text-[#0F172A] flex items-start gap-2">
                          <span className="text-[#1A1AFF] font-black text-sm leading-none">▸</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata Preview Box */}
                {selectedClue.actionPayload.previewData && (
                  <div className="p-3 rounded-xl bg-[#0F172A] text-white font-mono text-xs space-y-1.5 border-2 border-[#334155]">
                    <span className="text-[9px] font-bold uppercase text-[#94A3B8] tracking-wider block">
                      SIÊU DỮ LIỆU VIỄN THÔNG / HỆ THỐNG:
                    </span>
                    {selectedClue.actionPayload.previewData.sender && (
                      <div className="truncate">
                        Người gửi/Gọi: <strong className="text-[#FDE047]">{selectedClue.actionPayload.previewData.sender}</strong>
                      </div>
                    )}
                    {selectedClue.actionPayload.previewData.accountNumber && (
                      <div>
                        STK: <strong className="text-[#FDE047]">{selectedClue.actionPayload.previewData.accountNumber}</strong> ({selectedClue.actionPayload.previewData.bankName})
                      </div>
                    )}
                    {selectedClue.actionPayload.previewData.timestamp && (
                      <div>
                        Thời gian: <span className="text-[#38BDF8]">{selectedClue.actionPayload.previewData.timestamp}</span>
                      </div>
                    )}
                    {selectedClue.actionPayload.previewData.fileSize && (
                      <div>
                        Dung lượng: <span className="text-[#A7F3D0]">{selectedClue.actionPayload.previewData.fileSize}</span>
                      </div>
                    )}
                    {selectedClue.actionPayload.previewData.url && (
                      <div className="truncate text-[#F87171]">
                        URL: {selectedClue.actionPayload.previewData.url}
                      </div>
                    )}
                    {selectedClue.actionPayload.previewData.qrRawData && (
                      <div className="text-[10px] text-[#94A3B8] break-all bg-black/40 p-1.5 rounded">
                        Payload: {selectedClue.actionPayload.previewData.qrRawData}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Action Button */}
              <button
                onClick={() => setSelectedClue(null)}
                className="w-full py-2.5 btn-game btn-game-primary text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#000066] active:translate-y-0.5 cursor-pointer mt-1"
              >
                ĐÃ GHI NHẬN MANH MỐI
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 1. DYNAMIC SCENE BACKGROUNDS
// ============================================================================
function SceneBackground({ theme }: { theme: BackgroundTheme }) {
  switch (theme) {
    case 'bedroom':
      return (
        <svg viewBox="0 0 600 375" className="w-full h-full object-cover">
          {/* Walls */}
          <rect width="600" height="260" fill="#E2E8F0" />
          <line x1="0" y1="260" x2="600" y2="260" stroke="#1E293B" strokeWidth="4" />
          {/* Wall Wallpaper dots */}
          <pattern id="bed_dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#CBD5E1" />
          </pattern>
          <rect width="600" height="260" fill="url(#bed_dots)" />

          {/* Wooden Floor */}
          <rect y="260" width="600" height="115" fill="#D97706" />
          <path d="M0,295 L600,295 M0,335 L600,335" stroke="#92400E" strokeWidth="2.5" opacity="0.6" />

          {/* Window */}
          <rect x="220" y="25" width="130" height="110" rx="10" fill="#93C5FD" stroke="#1E293B" strokeWidth="3.5" />
          <path d="M220,80 L350,80 M285,25 L285,135" stroke="#1E293B" strokeWidth="3" />
          <rect x="205" y="15" width="160" height="14" rx="4" fill="#B45309" stroke="#1E293B" strokeWidth="3" />
          {/* Curtains */}
          <path d="M210,25 Q225,80 215,135 L205,135 Z" fill="#FDE047" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M360,25 Q345,80 355,135 L365,135 Z" fill="#FDE047" stroke="#1E293B" strokeWidth="2.5" />

          {/* Student Desk & Laptop */}
          <rect x="360" y="180" width="180" height="110" rx="8" fill="#FFFDF5" stroke="#1E293B" strokeWidth="3.5" />
          {/* Laptop */}
          <polygon points="410,210 465,210 480,235 395,235" fill="#94A3B8" stroke="#1E293B" strokeWidth="3" />
          <rect x="410" y="165" width="55" height="45" rx="4" fill="#1A1AFF" stroke="#1E293B" strokeWidth="3" />
          <rect x="415" y="170" width="45" height="35" rx="2" fill="#60A5FA" />
          {/* Desk Lamp */}
          <path d="M505,185 L505,150 L485,155" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M475,150 L500,140 L495,165 Z" fill="#EF4444" stroke="#1E293B" strokeWidth="3" />
        </svg>
      );

    case 'office':
      return (
        <svg viewBox="0 0 600 375" className="w-full h-full object-cover">
          {/* Office wall */}
          <rect width="600" height="250" fill="#F1F5F9" />
          <rect y="250" width="600" height="125" fill="#334155" />
          <line x1="0" y1="250" x2="600" y2="250" stroke="#1E293B" strokeWidth="4" />

          {/* Notice Board */}
          <rect x="180" y="30" width="160" height="100" rx="8" fill="#FEF3C7" stroke="#1E293B" strokeWidth="3.5" />
          <rect x="195" y="45" width="40" height="30" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          <rect x="250" y="55" width="45" height="55" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          <circle cx="215" cy="40" r="3" fill="#DC2626" />
          <circle cx="272" cy="50" r="3" fill="#2563EB" />

          {/* National Emblem / Security Badge Frame */}
          <rect x="375" y="35" width="70" height="85" rx="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
          <circle cx="410" cy="72" r="22" fill="#DC2626" stroke="#CA8A04" strokeWidth="2.5" />
          <polygon points="410,58 414,68 424,68 416,74 419,84 410,78 401,84 404,74 396,68 406,68" fill="#FDE047" />

          {/* Office Desk */}
          <rect x="280" y="195" width="280" height="95" rx="8" fill="#64748B" stroke="#1E293B" strokeWidth="4" />
          {/* Desk items */}
          <rect x="310" y="170" width="50" height="25" rx="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
          <circle cx="335" cy="182" r="7" fill="#DC2626" opacity="0.8" />
          {/* Computer Monitor */}
          <rect x="400" y="145" width="85" height="55" rx="5" fill="#1E293B" stroke="#1E293B" strokeWidth="3" />
          <rect x="405" y="150" width="75" height="45" rx="3" fill="#38BDF8" />
          <rect x="435" y="200" width="15" height="15" fill="#1E293B" />
        </svg>
      );

    case 'phone_screen':
      return (
        <svg viewBox="0 0 600 375" className="w-full h-full object-cover">
          {/* Dark backdrop */}
          <rect width="600" height="375" fill="#0F172A" />

          {/* Huge Smartphone Frame in Center */}
          <rect x="180" y="15" width="240" height="345" rx="28" fill="#1E293B" stroke="#38BDF8" strokeWidth="4" />
          <rect x="190" y="25" width="220" height="325" rx="22" fill="#FFFFFF" />

          {/* Phone Status Bar */}
          <rect x="190" y="25" width="220" height="24" fill="#0F172A" />
          <text x="210" y="41" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">11:42</text>
          <text x="365" y="41" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">5G 82%</text>

          {/* Fake Messaging App Header */}
          <rect x="190" y="49" width="220" height="38" fill="#1A1AFF" />
          <circle cx="215" cy="68" r="12" fill="#FDE047" />
          <text x="235" y="66" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">BAN CHUYÊN ÁN C02</text>
          <text x="235" y="78" fill="#93C5FD" fontSize="8" fontFamily="sans-serif">Đang hoạt động...</text>

          {/* Chat bubbles on phone */}
          <rect x="200" y="98" width="165" height="42" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
          <text x="210" y="114" fill="#DC2626" fontSize="9" fontWeight="bold">LỆNH BẮT KHẨN CẤP</text>
          <text x="210" y="128" fill="#334155" fontSize="8">Chuyển 50tr vào STK tạm giữ...</text>

          <rect x="245" y="150" width="155" height="36" rx="10" fill="#DC2626" />
          <text x="255" y="165" fill="#FFFFFF" fontSize="9" fontWeight="bold">CẤM GỌI ĐIỆN CHO AI!</text>
          <text x="255" y="177" fill="#FEF08A" fontSize="8">Bắt giữ trong vòng 24 giờ</text>
        </svg>
      );

    case 'bank_interface':
      return (
        <svg viewBox="0 0 600 375" className="w-full h-full object-cover">
          {/* Tech Banking Background */}
          <rect width="600" height="375" fill="#0F172A" />

          {/* Grid lines */}
          <path d="M0,75 L600,75 M0,150 L600,150 M0,225 L600,225 M0,300 L600,300" stroke="#1E293B" strokeWidth="1.5" />
          <path d="M150,0 L150,375 M300,0 L300,375 M450,0 L450,375" stroke="#1E293B" strokeWidth="1.5" />

          {/* ATM / Online Banking Screen UI */}
          <rect x="120" y="35" width="360" height="305" rx="18" fill="#FFFFFF" stroke="#1E293B" strokeWidth="4" />
          <rect x="120" y="35" width="360" height="45" rx="14" fill="#1A1AFF" />
          <text x="140" y="63" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">CỔNG THANH TOÁN 24/7 - XÁC THỰC</text>

          {/* Red Alert warning bar */}
          <rect x="135" y="90" width="330" height="35" rx="8" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
          <text x="150" y="112" fill="#DC2626" fontSize="11" fontWeight="bold">⚠️ YÊU CẦU CHUYỂN TIỀN VÀO TÀI KHOẢN TẠM GIỮ</text>

          {/* Beneficiary Card */}
          <rect x="135" y="135" width="330" height="90" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <text x="150" y="158" fill="#64748B" fontSize="10" fontWeight="bold">TÀI KHOẢN THỤ HƯỞNG:</text>
          <text x="150" y="178" fill="#0F172A" fontSize="14" fontWeight="bold" fontFamily="monospace">10488923412 - MB BANK</text>
          <text x="150" y="198" fill="#1A1AFF" fontSize="12" fontWeight="bold">CHỦ TK: NGUYEN VAN THANG (CÁ NHÂN)</text>

          {/* Warning Stamp */}
          <rect x="180" y="240" width="240" height="40" rx="8" fill="#DC2626" />
          <text x="200" y="265" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">KHÔNG CÓ TÀI KHOẢN CÔNG AN CÁ NHÂN!</text>
        </svg>
      );

    case 'cyber_lab':
      return (
        <svg viewBox="0 0 600 375" className="w-full h-full object-cover">
          {/* Cyber Lab Dark Blue */}
          <rect width="600" height="375" fill="#030712" />

          {/* Cyber grid */}
          <defs>
            <linearGradient id="cyber_beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1A1AFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1A1AFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect y="180" width="600" height="4" fill="url(#cyber_beam)" />

          {/* Central Holographic Radar Screen */}
          <circle cx="340" cy="170" r="100" fill="none" stroke="#1E293B" strokeWidth="3" />
          <circle cx="340" cy="170" r="70" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="340" cy="170" r="40" fill="none" stroke="#38BDF8" strokeWidth="2" />
          <line x1="240" y1="170" x2="440" y2="170" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="340" y1="70" x2="340" y2="270" stroke="#38BDF8" strokeWidth="1.5" />

          {/* Target malware blips */}
          <circle cx="310" cy="130" r="6" fill="#EF4444" className="animate-ping" />
          <circle cx="310" cy="130" r="4" fill="#EF4444" />
          <circle cx="380" cy="200" r="5" fill="#F59E0B" />

          {/* Terminal Box on Side */}
          <rect x="20" y="30" width="160" height="150" rx="8" fill="#111827" stroke="#1E293B" strokeWidth="2.5" />
          <rect x="20" y="30" width="160" height="20" rx="6" fill="#1E293B" />
          <circle cx="32" cy="40" r="3" fill="#EF4444" />
          <circle cx="42" cy="40" r="3" fill="#F59E0B" />
          <circle cx="52" cy="40" r="3" fill="#10B981" />
          <text x="30" y="68" fill="#10B981" fontSize="9" fontFamily="monospace">$ scan_apk --file</text>
          <text x="30" y="84" fill="#EF4444" fontSize="9" fontFamily="monospace">TROJAN DETECTED!</text>
          <text x="30" y="100" fill="#38BDF8" fontSize="8" fontFamily="monospace">SHA: a8f2...99bc</text>
          <text x="30" y="116" fill="#94A3B8" fontSize="8" fontFamily="monospace">Risk: CRITICAL</text>
        </svg>
      );
  }
}

// ============================================================================
// 2. DYNAMIC CHARACTER SPRITES WITH 5 EMOTIONAL EXPRESSIONS
// ============================================================================
function DynamicCharacterSprite({
  name,
  expression
}: {
  name: string;
  expression: CharacterExpression;
}) {
  return (
    <motion.div
      animate={
        expression === 'fearful'
          ? { x: [-2, 2, -2], y: [0, -1, 0] }
          : expression === 'shocked'
          ? { y: [0, -4, 0], scale: [1, 1.02, 1] }
          : { y: [0, -3, 0] }
      }
      transition={{ duration: expression === 'fearful' ? 0.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-20 sm:w-32 h-32 sm:h-44 relative"
    >
      <svg viewBox="0 0 140 180" className="w-full h-full drop-shadow-md">
        {/* Detective Coat / Victim Clothing */}
        {expression === 'investigating' ? (
          // DETECTIVE TRENCH COAT
          <g id="detective_body">
            {/* Coat Body */}
            <path d="M40,95 L30,175 L110,175 L100,95 Z" fill="#D97706" stroke="#1E293B" strokeWidth="4" />
            {/* Lapels */}
            <path d="M40,95 L70,135 L100,95 L80,95 L70,115 L60,95 Z" fill="#B45309" stroke="#1E293B" strokeWidth="3.5" />
            {/* Shirt & Tie */}
            <polygon points="63,95 77,95 73,125 70,130 67,125" fill="#DC2626" stroke="#1E293B" strokeWidth="2" />
            {/* Belt */}
            <rect x="35" y="140" width="70" height="10" fill="#92400E" stroke="#1E293B" strokeWidth="2.5" />
            <rect x="65" y="138" width="10" height="14" rx="2" fill="#FDE047" stroke="#1E293B" strokeWidth="2" />
          </g>
        ) : (
          // CASUAL VICTIM HOODIE / SHIRT
          <g id="victim_body">
            <path d="M42,95 L35,175 L105,175 L98,95 Z" fill="#3B82F6" stroke="#1E293B" strokeWidth="4" />
            <path d="M45,95 Q70,120 95,95 Z" fill="#1D4ED8" stroke="#1E293B" strokeWidth="3" />
            {/* Mobile phone in hand */}
            <rect x="85" y="125" width="22" height="35" rx="5" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5" />
            <rect x="88" y="129" width="16" height="27" rx="3" fill="#38BDF8" />
          </g>
        )}

        {/* Head & Neck */}
        <rect x="62" y="80" width="16" height="18" fill="#FDE047" stroke="#1E293B" strokeWidth="3.5" />
        <circle cx="70" cy="58" r="32" fill="#FDE047" stroke="#1E293B" strokeWidth="4" />

        {/* Hair / Detective Hat */}
        {expression === 'investigating' ? (
          // FEDORA HAT
          <g id="fedora">
            <ellipse cx="70" cy="38" rx="46" ry="12" fill="#92400E" stroke="#1E293B" strokeWidth="4" />
            <path d="M38,36 C38,15 102,15 102,36 Z" fill="#B45309" stroke="#1E293B" strokeWidth="4" />
            <rect x="39" y="32" width="62" height="8" fill="#1A1AFF" />
          </g>
        ) : (
          // CARTOON HAIR
          <path d="M40,55 C40,25 100,25 100,55 C95,38 45,38 40,55 Z" fill="#78350F" stroke="#1E293B" strokeWidth="3.5" />
        )}

        {/* EXPRESSION RENDERING ENGINE */}
        {expression === 'fearful' && (
          <g id="exp_fearful">
            {/* Worried Eyebrows */}
            <path d="M52,48 Q58,42 66,48" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M74,48 Q82,42 88,48" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Wide Shaking Eyes */}
            <ellipse cx="58" cy="57" rx="6" ry="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="58" cy="57" r="3" fill="#1E293B" />
            <ellipse cx="82" cy="57" rx="6" ry="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="82" cy="57" r="3" fill="#1E293B" />
            {/* Wavy quivering mouth */}
            <path d="M60,74 Q65,71 70,74 Q75,77 80,74" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Sweat Drops */}
            <path d="M96,44 Q99,50 96,54 Q93,50 96,44 Z" fill="#38BDF8" stroke="#1E293B" strokeWidth="1.5" />
          </g>
        )}

        {expression === 'shocked' && (
          <g id="exp_shocked">
            {/* High Arched Eyebrows */}
            <path d="M50,42 Q58,35 66,42" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M74,42 Q82,35 90,42" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Giant O-shaped Eyes */}
            <circle cx="58" cy="55" r="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="58" cy="55" r="3" fill="#1E293B" />
            <circle cx="82" cy="55" r="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="82" cy="55" r="3" fill="#1E293B" />
            {/* O-shaped Gasping Mouth */}
            <ellipse cx="70" cy="74" rx="7" ry="9" fill="#1E293B" />
            {/* Sweat Drop */}
            <path d="M42,48 Q45,54 42,58 Q39,54 42,48 Z" fill="#38BDF8" stroke="#1E293B" strokeWidth="1.5" />
          </g>
        )}

        {expression === 'suspicious' && (
          <g id="exp_suspicious">
            {/* One raised eyebrow, one squint */}
            <path d="M52,43 Q60,37 66,45" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M74,48 Q82,48 88,48" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Squinted Eye & Open Eye */}
            <ellipse cx="58" cy="56" rx="6" ry="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="58" cy="56" r="2.5" fill="#1E293B" />
            <path d="M76,57 Q82,53 88,57" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Smirk Mouth */}
            <path d="M62,73 Q70,72 78,70" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        )}

        {expression === 'investigating' && (
          <g id="exp_investigating">
            {/* Determined Eyebrows */}
            <path d="M52,47 L66,51" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <path d="M74,51 L88,47" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            {/* Sharp Eyes */}
            <ellipse cx="59" cy="57" rx="5" ry="5.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="60" cy="57" r="2.5" fill="#1E293B" />
            <ellipse cx="81" cy="57" rx="5" ry="5.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <circle cx="80" cy="57" r="2.5" fill="#1E293B" />
            {/* Confident Line Mouth */}
            <line x1="64" y1="72" x2="76" y2="72" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {expression === 'neutral' && (
          <g id="exp_neutral">
            <path d="M54,47 Q60,45 66,47" stroke="#1E293B" strokeWidth="3" fill="none" />
            <path d="M74,47 Q80,45 86,47" stroke="#1E293B" strokeWidth="3" fill="none" />
            <circle cx="59" cy="56" r="4" fill="#1E293B" />
            <circle cx="81" cy="56" r="4" fill="#1E293B" />
            {/* Friendly Smile */}
            <path d="M62,70 Q70,77 78,70" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </motion.div>
  );
}
