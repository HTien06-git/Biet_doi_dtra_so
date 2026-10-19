// ============================================================================
// DATA/STATIONCONFIGS.TS – DYNAMIC STATION CONFIGURATIONS & STORY ASSETS
// ============================================================================
import { StationConfig } from '@/types/case';

export const STATION_CONFIGS: Record<string, StationConfig> = {
  // ==========================================================================
  // CASE 01: CUỘC GỌI TỰ XƯNG CÔNG AN (5 TRẠM)
  // ==========================================================================
  'case_01_1': {
    caseId: 'case_01',
    stationId: 1,
    title: 'Truy tìm cuộc gọi lạ',
    victimName: 'Minh (Sinh viên KTX)',
    character: {
      name: 'Minh',
      roleTitle: 'Nạn nhân bị đe dọa',
      expression: 'fearful',
      dialogueText: 'Họ tự xưng là cán bộ điều tra C02, dọa sẽ bắt giữ em trong 24 giờ vì liên quan đường dây rửa tiền... Em hoang mang quá anh ơi!',
    },
    backgroundTheme: 'bedroom',
    ambientSoundEffect: 'phone_ring',
    interactiveClues: [
      {
        id: 'clue_02_1_call',
        label: 'Nhật ký cuộc gọi lạ',
        iconType: 'call_log',
        actionPayload: {
          title: 'Chi tiết cuộc gọi di động rác',
          category: 'Viễn thông',
          description: 'Số gọi đến: +84 912 884 XXX. Cuộc gọi kéo dài 12 phút 34 giây từ số di động cá nhân không đăng ký chính chủ.',
          riskLevel: 'critical',
          details: [
            'Đầu số di động thông thường, không phải tổng đài cơ quan nhà nước (113, 069...).',
            'Sử dụng công nghệ VoIP giả lập tổng đài ảo xuyên biên giới.',
            'Cố tình gọi vào giờ trưa nhằm đánh úp tâm lý lúc nạn nhân thiếu tỉnh táo.'
          ],
          previewData: {
            sender: '+84 912 884 XXX',
            timestamp: '11:42:18 Hôm nay',
          }
        }
      },
      {
        id: 'clue_02_1_sms',
        label: 'Tin nhắn Telegram',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Đoạn chat yêu cầu bí mật',
          category: 'Mạng xã hội',
          description: 'Kẻ giả mạo yêu cầu chuyển sang kênh Telegram bí mật để gửi "lệnh bắt giam khẩn cấp".',
          riskLevel: 'critical',
          details: [
            'Cơ quan công an chỉ làm việc trực tiếp tại trụ sở, KHÔNG BAO GIỜ gửi lệnh bắt qua Telegram.',
            'Yêu cầu "tuyệt đối không nói với ai" nhằm cô lập nạn nhân khỏi sự trợ giúp của người thân.'
          ],
          previewData: {
            sender: 'Cán bộ thụ lý - Hùng',
            timestamp: '11:45:00 Hôm nay',
          }
        }
      },
      {
        id: 'clue_02_1_sos',
        label: 'Cảnh báo cô lập',
        iconType: 'sos',
        actionPayload: {
          title: 'Bẫy tâm lý cô lập',
          category: 'Cảnh báo an ninh',
          description: 'Thủ thuật tâm lý kinh điển: Đe dọa hình sự + Khẩn cấp + Ép giữ bí mật để nạn nhân không kịp kiểm chứng.',
          riskLevel: 'warning',
          details: [
            'Bước 1: Tạo sợ hãi bằng tội danh nghiêm trọng.',
            'Bước 2: Cắt đứt liên lạc với gia đình, bạn bè.',
            'Bước 3: Thúc ép chuyển tiền thần tốc.'
          ]
        }
      }
    ]
  },

  'case_01_2': {
    caseId: 'case_01',
    stationId: 2,
    title: 'Kiểm tra giấy triệu tập giả mạo',
    victimName: 'Minh',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Điều tra viên kỹ thuật số',
      expression: 'investigating',
      dialogueText: 'Hãy soi kỹ dấu mộc đỏ, quốc huy và căn cứ pháp lý trên tờ giấy này. Đối tượng lừa đảo thường dùng Photoshop ghép mộc cẩu thả!',
    },
    backgroundTheme: 'office',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_02_2_pdf',
        label: 'Giấy triệu tập số 458/QĐ',
        iconType: 'pdf',
        actionPayload: {
          title: 'Tệp hình ảnh "Lệnh bắt giữ & Triệu tập.pdf"',
          category: 'Văn bản giả mạo',
          description: 'Tài liệu gửi qua mạng có định dạng ảnh scan giả mạo con dấu Công an TP.HCM.',
          riskLevel: 'critical',
          details: [
            'Sai thể thức văn bản hành chính nhà nước (Font chữ Times New Roman lỗi chân, thụt lề sai quy chuẩn Nghị định 30/2020/NĐ-CP).',
            'Hình con dấu viền mờ nhòe, màu đỏ bệt do dùng phần mềm chỉnh sửa ảnh cắt ghép.',
            'Viện dẫn điều luật đã hết hiệu lực từ năm 2015.'
          ],
          previewData: {
            fileSize: '1.4 MB',
            url: 'https://cdn.dts.gov.vn/fake-subpoena-sample.pdf'
          }
        }
      },
      {
        id: 'clue_02_2_doc',
        label: 'Mẫu dấu đối chiếu chuẩn',
        iconType: 'document',
        actionPayload: {
          title: 'Quy chuẩn con dấu lực lượng CAND',
          category: 'Tài liệu đối chiếu',
          description: 'Quy định chuẩn về con dấu tròn và thẩm quyền ký phát hành lệnh bắt, giấy triệu tập.',
          riskLevel: 'safe',
          details: [
            'Con dấu CAND thật có đường kính chuẩn, mực in sắc nét từ con dấu cơ học.',
            'Giấy triệu tập thật phải được gửi qua đường bưu điện hoặc do Cảnh sát khu vực trao trực tiếp.'
          ]
        }
      }
    ]
  },

  'case_01_3': {
    caseId: 'case_01',
    stationId: 3,
    title: 'Giải mã tài khoản tạm giữ',
    victimName: 'Minh',
    character: {
      name: 'Minh',
      roleTitle: 'Nạn nhân bị ép chuyển tiền',
      expression: 'shocked',
      dialogueText: 'Họ yêu cầu em chuyển 50 triệu vào số tài khoản này ngay lập tức để "thanh tra dòng tiền trong sạch", xong việc sẽ hoàn trả!',
    },
    backgroundTheme: 'bank_interface',
    ambientSoundEffect: 'heartbeat',
    interactiveClues: [
      {
        id: 'clue_02_3_bank',
        label: 'STK cá nhân nhận tiền',
        iconType: 'call_log',
        actionPayload: {
          title: 'Tài khoản ngân hàng thụ hưởng lạ',
          category: 'Tài chính số',
          description: 'Ngân hàng Thương mại Cổ phần X - Số tài khoản: 10488923412 - Tên người nhận: NGUYEN VAN THANG.',
          riskLevel: 'critical',
          details: [
            'Tài khoản đích là TÀI KHOẢN CÁ NHÂN, hoàn toàn KHÔNG PHẢI tài khoản của Kho bạc Nhà nước hay Cơ quan điều tra.',
            'Cơ quan nhà nước chỉ mở tài khoản tại Kho bạc Nhà nước, KHÔNG mở tài khoản thương mại cá nhân để thu tiền tạm giữ.',
            'Dạng tài khoản "rác" (mua bán lại thông tin CCCD từ người dân vùng sâu vùng xa).'
          ],
          previewData: {
            accountNumber: '10488923412',
            bankName: 'NHTMCP Quân Đội (MB Bank)',
            sender: 'NGUYEN VAN THANG'
          }
        }
      },
      {
        id: 'clue_02_3_qr',
        label: 'Mã QR thanh toán nhanh',
        iconType: 'qr',
        actionPayload: {
          title: 'Mã VietQR chuyển khoản nhanh 24/7',
          category: 'Mã thanh toán số',
          description: 'Mã QR nén thông tin tài khoản đích nhằm hạn chế việc nạn nhân đọc kỹ tên chủ tài khoản.',
          riskLevel: 'critical',
          details: [
            'Tự động điền nội dung: "MINH DONG TIEN THANH TRA".',
            'Chuyển tiền qua QR 24/7 tiền sẽ đi ngay tức khắc trong vài giây, không thể hủy ngang.'
          ],
          previewData: {
            qrRawData: '00020101021238540010A000000727012400069704220110104889234125204601153037045802VN...'
          }
        }
      }
    ]
  },

  'case_01_4': {
    caseId: 'case_01',
    stationId: 4,
    title: 'Bảo toàn chứng cứ số',
    victimName: 'Minh',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Chuyên gia giám định số',
      expression: 'investigating',
      dialogueText: 'Đừng xóa tin nhắn hay chặn vội! Chúng ta phải chụp lại màn hình, lưu ghi âm cuộc gọi và trích xuất nhật ký viễn thông làm chứng cứ cho cơ quan công an.',
    },
    backgroundTheme: 'cyber_lab',
    ambientSoundEffect: 'keyboard_type',
    interactiveClues: [
      {
        id: 'clue_02_4_log',
        label: 'Nhật ký ghi âm cuộc gọi',
        iconType: 'chat_log',
        actionPayload: {
          title: 'File ghi âm 12m34s và chuỗi SMS',
          category: 'Chứng cứ điện tử',
          description: 'Bằng chứng ghi âm thể hiện giọng điệu hăm dọa, thúc ép chuyển tiền và hướng dẫn xóa dấu vết.',
          riskLevel: 'safe',
          details: [
            'Được bảo toàn nguyên vẹn mã băm SHA-256 để đảm bảo giá trị chứng cứ tố tụng.',
            'Lưu trữ siêu dữ liệu (Metadata): Thời gian, trạm phát sóng BTS kết nối.'
          ]
        }
      },
      {
        id: 'clue_02_4_doc',
        label: 'Biên bản bảo toàn dữ liệu',
        iconType: 'document',
        actionPayload: {
          title: 'Biên bản niêm phong chứng cứ điện tử',
          category: 'Pháp lý tố tụng',
          description: 'Quy trình thu thập chứng cứ hợp pháp theo Bộ luật Tố tụng Hình sự.',
          riskLevel: 'safe',
          details: [
            'Không chỉnh sửa, không dùng app thu âm ngoài luồng làm thay đổi cấu trúc file.',
            'Sao chép ra 2 bản lưu trữ vật lý độc lập (USB / Ổ cứng ngoài).'
          ]
        }
      }
    ]
  },

  'case_01_5': {
    caseId: 'case_01',
    stationId: 5,
    title: 'Hành động an toàn & Trình báo',
    victimName: 'Minh',
    character: {
      name: 'Minh',
      roleTitle: 'Điều tra viên hoàn tất vụ án',
      expression: 'neutral',
      dialogueText: 'Em đã bình tĩnh lại rồi! Giờ em sẽ gọi trực tiếp đến đường dây nóng 113 và đến ngay Công an phường gần nhất để trình báo!',
    },
    backgroundTheme: 'office',
    ambientSoundEffect: 'siren',
    interactiveClues: [
      {
        id: 'clue_02_5_sos',
        label: 'Đường dây nóng tố giác 113',
        iconType: 'sos',
        actionPayload: {
          title: 'Tổng đài phản ứng nhanh & Phòng ngừa tội phạm công nghệ cao',
          category: 'Liên hệ khẩn cấp',
          description: 'Kênh tiếp nhận chính thống của Bộ Công an và Công an 63 tỉnh thành.',
          riskLevel: 'safe',
          details: [
            'Đường dây nóng Phòng An ninh mạng (A05 - Bộ Công an): 069.234.8560.',
            'Tổng đài khẩn cấp: 113 hoặc Công an phường / xã sở tại.',
            'Tổng đài phản ánh tin nhắn rác, cuộc gọi rác: 156 / 5656 (miễn phí).'
          ]
        }
      }
    ]
  },

  // ==========================================================================
  // CASE 02: BẪY TUYỂN DỤNG "VIỆC NHẸ LƯƠNG CAO" (5 TRẠM)
  // ==========================================================================
  'case_02_1': {
    caseId: 'case_02',
    stationId: 1,
    title: 'Lời mời việc làm béo bở',
    victimName: 'Lan (Mẹ bỉm sữa / Sinh viên làm thêm)',
    character: {
      name: 'Lan',
      roleTitle: 'Người tìm việc làm thêm',
      expression: 'suspicious',
      dialogueText: 'Họ nhắn tin trên mạng tuyển người xem video TikTok với chốt đơn ảo, mỗi ngày được 500k - 2 triệu mà chỉ cần dùng điện thoại...',
    },
    backgroundTheme: 'phone_screen',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_03_1_chat',
        label: 'Tin nhắn mời chào hấp dẫn',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Tin nhắn rác qua Zalo / iMessage',
          category: 'Tin tuyển dụng lừa đảo',
          description: '"Công việc online tại nhà: Like video, tương tác bài viết nhận ngay 50.000đ/lần. Không cần bằng cấp, thu nhập 15-30 triệu/tháng".',
          riskLevel: 'critical',
          details: [
            'Mức thù lao phi lý so với công sức thực tế bỏ ra.',
            'Người tuyển dụng giấu danh tính, không có trụ sở công ty rõ ràng.'
          ]
        }
      },
      {
        id: 'clue_03_1_qr',
        label: 'Mã QR vào nhóm Telegram',
        iconType: 'qr',
        actionPayload: {
          title: 'Mã mời tham gia "Phòng nhiệm vụ VIP"',
          category: 'Liên kết chuyển hướng',
          description: 'Mã QR dẫn vào group Telegram có hàng trăm "chân gỗ" đang khoe tiền thưởng nhận được.',
          riskLevel: 'warning',
          details: [
            'Các tài khoản trong nhóm đa phần là tài khoản ảo (bot) tự tương tác tạo hiệu ứng đám đông.',
            'Bẫy tâm lý FOMO (sợ bỏ lỡ cơ hội làm giàu nhanh).'
          ]
        }
      }
    ]
  },

  'case_02_2': {
    caseId: 'case_02',
    stationId: 2,
    title: 'Miếng mồi câu đầu tiên',
    victimName: 'Lan',
    character: {
      name: 'Lan',
      roleTitle: 'Bị dẫn dụ nạp tiền',
      expression: 'shocked',
      dialogueText: 'Nhiệm vụ đầu tiên em like 3 video thì họ chuyển cho em 150.000đ thật! Nhưng sang nhiệm vụ 2, họ bắt nạp 2 triệu để mở khóa đơn hàng!',
    },
    backgroundTheme: 'bank_interface',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_03_2_bank',
        label: 'Giao dịch nhận 150k mồi nhử',
        iconType: 'call_log',
        actionPayload: {
          title: 'Giao dịch "thả con tép bắt con tôm"',
          category: 'Thao túng tài chính',
          description: 'Số tiền 150.000đ chuyển đến từ tài khoản cá nhân của kẻ lừa đảo nhằm tạo dựng lòng tin tuyệt đối.',
          riskLevel: 'warning',
          details: [
            'Kẻ lừa đảo sẵn sàng trích ngân sách nhỏ để câu nạn nhân vào bẫy lớn hơn.',
            'Ngay sau đó sẽ yêu cầu nạp số tiền gấp 10 - 20 lần để "nhận hoa hồng khủng".'
          ]
        }
      }
    ]
  },

  'case_02_3': {
    caseId: 'case_02',
    stationId: 3,
    title: 'Bẫy nạp tiền nhiệm vụ VIP',
    victimName: 'Lan',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Chuyên viên an toàn số',
      expression: 'investigating',
      dialogueText: 'Xem kỹ màn hình này! Chúng báo "hệ thống bị lỗi cú pháp" và yêu cầu Lan phải nạp thêm 30 triệu nữa mới được rút toàn bộ tiền về. Đây là cái bẫy không đáy!',
    },
    backgroundTheme: 'cyber_lab',
    ambientSoundEffect: 'heartbeat',
    interactiveClues: [
      {
        id: 'clue_03_3_chat',
        label: 'Tin nhắn ép nạp tiền bù',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Hàng loạt lý do vô lý giữ tiền',
          category: 'Kịch bản tống tiền',
          description: '"Bạn nhập sai nội dung chuyển khoản", "Tài khoản bị đóng băng thuế thu nhập cá nhân 10%", "Cần nâng cấp lên VIP 3 để rút".',
          riskLevel: 'critical',
          details: [
            'Càng nạp càng mất, hệ thống ảo sẽ không bao giờ nhả tiền ra.',
            'Nạn nhân thường vì tiếc số tiền đã nạp mà mù quáng vay mượn thêm nạp vào.'
          ]
        }
      }
    ]
  },

  'case_02_4': {
    caseId: 'case_02',
    stationId: 4,
    title: 'Phát hiện ứng dụng độc hại APK',
    victimName: 'Lan',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Kỹ sư phân tích mã độc',
      expression: 'investigating',
      dialogueText: 'File cài đặt "Shopee_Affiliate_Vip.apk" mà chúng gửi cho Lan chứa trojan đánh cắp mã OTP và quyền trợ năng Accessibility Service!',
    },
    backgroundTheme: 'cyber_lab',
    ambientSoundEffect: 'keyboard_type',
    interactiveClues: [
      {
        id: 'clue_03_4_apk',
        label: 'File APK độc hại',
        iconType: 'document',
        actionPayload: {
          title: 'Mã độc gián điệp Android (Spyware)',
          category: 'An ninh ứng dụng di động',
          description: 'Ứng dụng giả danh sàn TMĐT, yêu cầu cấp quyền đọc SMS, danh bạ và quyền kiểm soát màn hình (Accessibility).',
          riskLevel: 'critical',
          details: [
            'Cho phép hacker chiếm quyền điều khiển điện thoại từ xa lúc nửa đêm.',
            'Tự động đọc mã OTP ngân hàng và chuyển sạch tiền trong tài khoản.'
          ]
        }
      }
    ]
  },

  'case_02_5': {
    caseId: 'case_02',
    stationId: 5,
    title: 'Cắt lỗ & Xử lý sự cố',
    victimName: 'Lan',
    character: {
      name: 'Lan',
      roleTitle: 'Nạn nhân tỉnh ngộ',
      expression: 'neutral',
      dialogueText: 'Em đã ngắt mạng Wifi, gỡ app độc hại, gọi hotline ngân hàng khóa thẻ và sao kê toàn bộ để đi báo cơ quan công an!',
    },
    backgroundTheme: 'bedroom',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_03_5_sos',
        label: 'Quy trình ứng cứu khẩn cấp',
        iconType: 'sos',
        actionPayload: {
          title: '3 Bước ngăn chặn thiệt hại khi cài app lạ',
          category: 'Ứng phó sự cố',
          description: 'Hành động ngay trong vòng 5 phút đầu tiên sau khi nghi ngờ bị chiếm quyền điện thoại.',
          riskLevel: 'safe',
          details: [
            '1. Bật ngay Chế độ máy bay (Airplane mode) hoặc tháo SIM, tắt Wifi.',
            '2. Dùng máy khác gọi tổng đài ngân hàng yêu cầu TẠM KHÓA tài khoản và internet banking.',
            '3. Khôi phục cài đặt gốc điện thoại (Factory reset) để triệt tiêu mã độc ngầm.'
          ]
        }
      }
    ]
  },

  // ==========================================================================
  // CASE 03: GIAN LẬN SÀN THƯƠNG MẠI ĐIỆN TỬ & HOÀN TIỀN (5 TRẠM)
  // ==========================================================================
  'case_03_1': {
    caseId: 'case_03',
    stationId: 1,
    title: 'Cuộc gọi thông báo trúng thưởng',
    victimName: 'Bác Hùng (Cán bộ hưu trí)',
    character: {
      name: 'Bác Hùng',
      roleTitle: 'Người cao tuổi mua sắm online',
      expression: 'suspicious',
      dialogueText: 'Có người gọi bảo đơn hàng máy đo huyết áp của tôi được tặng quà tri ân 1 chiếc xe máy SH hoặc 50 triệu tiền mặt...',
    },
    backgroundTheme: 'bedroom',
    ambientSoundEffect: 'phone_ring',
    interactiveClues: [
      {
        id: 'clue_04_1_call',
        label: 'Ghi âm cuộc gọi tri ân giả',
        iconType: 'call_log',
        actionPayload: {
          title: 'Chiêu trò tri ân khách hàng thân thiết',
          category: 'Gian lận viễn thông',
          description: 'Kẻ lừa đảo nắm chính xác tên, địa chỉ và món hàng bác Hùng vừa mua trên mạng để tạo lòng tin.',
          riskLevel: 'warning',
          details: [
            'Dữ liệu mua hàng bị rò rỉ từ khâu giao hàng (shipper) hoặc nhân viên shop online.',
            'Đòi hỏi nộp "thuế thu nhập trúng thưởng 10%" trước khi nhận giải.'
          ]
        }
      }
    ]
  },

  'case_03_2': {
    caseId: 'case_03',
    stationId: 2,
    title: 'Bẫy đường link nhận tiền hoàn',
    victimName: 'Bác Hùng',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Chuyên gia an ninh web',
      expression: 'investigating',
      dialogueText: 'Bác nhìn kỹ đường link này: "shopee-vn-hoantien.com-gift.top", hoàn toàn không phải tên miền chính thức shopee.vn!',
    },
    backgroundTheme: 'phone_screen',
    ambientSoundEffect: 'keyboard_type',
    interactiveClues: [
      {
        id: 'clue_04_2_link',
        label: 'Tên miền Phishing giả mạo',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Trang web mạo danh giao diện sàn TMĐT',
          category: 'Tấn công giả mạo (Phishing)',
          description: 'Trang web nhái giao diện đăng nhập ngân hàng yêu cầu nhập User, Mật khẩu và mã OTP Smart.',
          riskLevel: 'critical',
          details: [
            'Tên miền đăng ký tại nước ngoài qua dịch vụ ẩn danh.',
            'Giao diện nhái giống 99% khiến người lớn tuổi rất dễ mắc bẫy nhập thông tin thẻ.'
          ]
        }
      }
    ]
  },

  'case_03_3': {
    caseId: 'case_03',
    stationId: 3,
    title: 'Đánh cắp mã OTP giao dịch',
    victimName: 'Bác Hùng',
    character: {
      name: 'Bác Hùng',
      roleTitle: 'Nạn nhân bị dẫn dụ đọc OTP',
      expression: 'fearful',
      dialogueText: 'Kẻ xưng là tổng đài viên bảo tôi đọc mã 6 số vừa gửi về máy để "xác thực hoàn tiền", đọc xong thì tài khoản bị trừ 20 triệu!',
    },
    backgroundTheme: 'bank_interface',
    ambientSoundEffect: 'heartbeat',
    interactiveClues: [
      {
        id: 'clue_04_3_otp',
        label: 'Tin nhắn Brandname OTP',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Nội dung SMS OTP trừ tiền',
          category: 'Tin nhắn xác thực',
          description: '"Ma OTP la 482910 xac thuc giao dich thanh toan 20.000.000 VND tai VNPAY. KHONG chia se cho bat ky ai".',
          riskLevel: 'critical',
          details: [
            'Nội dung tin nhắn ghi rõ là XÁC THỰC GIAO DỊCH TRỪ TIỀN, không phải nhận tiền hoàn.',
            'Ngân hàng không bao giờ yêu cầu khách hàng đọc OTP cho nhân viên.'
          ]
        }
      }
    ]
  },

  'case_03_4': {
    caseId: 'case_03',
    stationId: 4,
    title: 'Truy vết dòng tiền tẩu tán',
    victimName: 'Bác Hùng',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Điều tra viên tài chính số',
      expression: 'investigating',
      dialogueText: 'Số tiền 20 triệu vừa bị chia nhỏ chuyển qua 3 ví điện tử và mua thẻ cào nạp game online trong vòng chưa đầy 2 phút!',
    },
    backgroundTheme: 'cyber_lab',
    ambientSoundEffect: 'keyboard_type',
    interactiveClues: [
      {
        id: 'clue_04_4_flow',
        label: 'Sơ đồ dòng tiền tẩu tán',
        iconType: 'document',
        actionPayload: {
          title: 'Kỹ thuật "rửa tiền" qua cổng thanh toán',
          category: 'Dữ liệu điều tra',
          description: 'Đối tượng dùng tài khoản trung gian chuyển sang ví điện tử và nạp mua tiền ảo game.',
          riskLevel: 'critical',
          details: [
            'Thời gian tẩu tán cực nhanh (dưới 180 giây).',
            'Cần báo ngay cho bộ phận gian lận ngân hàng để phối hợp tra soát khẩn cấp.'
          ]
        }
      }
    ]
  },

  'case_03_5': {
    caseId: 'case_03',
    stationId: 5,
    title: 'Khiếu nại ngân hàng & Khóa thẻ',
    victimName: 'Bác Hùng',
    character: {
      name: 'Bác Hùng',
      roleTitle: 'Người tiêu dùng an toàn',
      expression: 'neutral',
      dialogueText: 'Tôi đã liên hệ ngân hàng lập biên bản tra soát và đổi ngay mật khẩu các tài khoản. Một bài học cảnh giác đắt giá!',
    },
    backgroundTheme: 'office',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_04_5_doc',
        label: 'Đơn yêu cầu tra soát ngân hàng',
        iconType: 'document',
        actionPayload: {
          title: 'Mẫu phiếu yêu cầu tra soát giao dịch gian lận',
          category: 'Thủ tục pháp lý ngân hàng',
          description: 'Hồ sơ pháp lý nộp cho chi nhánh ngân hàng phát hành thẻ để truy thu nếu kịp thời.',
          riskLevel: 'safe',
          details: [
            'Thời hạn tra soát tiêu chuẩn từ 30 - 45 ngày.',
            'Cung cấp kèm ảnh chụp màn hình tin nhắn, cuộc gọi và biên lai giao dịch.'
          ]
        }
      }
    ]
  },

  // ==========================================================================
  // CASE 04: BẪY SÀN ĐẦU TƯ TÀI CHÍNH / TIỀN ẢO (5 TRẠM)
  // ==========================================================================
  'case_04_1': {
    caseId: 'case_04',
    stationId: 1,
    title: 'Nhóm chuyên gia đọc lệnh',
    victimName: 'Tuấn (Nhà đầu tư cá nhân F0)',
    character: {
      name: 'Tuấn',
      roleTitle: 'Nhà đầu tư mới tham gia thị trường',
      expression: 'suspicious',
      dialogueText: 'Trong nhóm "Hội Kéo Về Bờ", ngày nào cũng có "Thầy" đọc lệnh cam kết lợi nhuận 20%/ngày, bao lỗ 100%...',
    },
    backgroundTheme: 'phone_screen',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_05_1_chat',
        label: 'Nhóm chat Telegram "Đầu tư VIP"',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Hội đồng chuyên gia tài chính dởm',
          category: 'Lừa đảo đầu tư trực tuyến',
          description: 'Các nick ảo liên tục đăng ảnh chụp màn hình số dư hàng trăm triệu, sổ đỏ và xe sang.',
          riskLevel: 'warning',
          details: [
            'Cam kết lãi suất không tưởng (20% - 30%/tháng hoặc theo ngày).',
            'Không có bất kỳ kênh đầu tư hợp pháp nào đảm bảo "bao lỗ 100%".'
          ]
        }
      }
    ]
  },

  'case_04_2': {
    caseId: 'case_04',
    stationId: 2,
    title: 'Sàn giao dịch nhái quốc tế',
    victimName: 'Tuấn',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Chuyên gia an ninh tài chính',
      expression: 'investigating',
      dialogueText: 'Sàn này là sàn "bo" (quyền chọn nhị phân) do một nhóm lừa đảo tự viết mã nguồn, máy chủ đặt ở nước ngoài và can thiệp được hoàn toàn tỷ giá nến!',
    },
    backgroundTheme: 'cyber_lab',
    ambientSoundEffect: 'keyboard_type',
    interactiveClues: [
      {
        id: 'clue_05_2_doc',
        label: 'Báo cáo kỹ thuật sàn chui',
        iconType: 'document',
        actionPayload: {
          title: 'Mã nguồn can thiệp biểu đồ nến',
          category: 'Kỹ thuật gian lận sàn ảo',
          description: 'Hệ thống backend có nút bấm "Chỉnh nến thắng/thua" cho từng tài khoản người chơi cụ thể.',
          riskLevel: 'critical',
          details: [
            'Ban đầu chỉnh cho nạn nhân thắng lớn để say men chiến thắng.',
            'Khi nạn nhân nạp số tiền lớn sẽ cho nến quay xe "cháy tài khoản".'
          ]
        }
      }
    ]
  },

  'case_04_3': {
    caseId: 'case_04',
    stationId: 3,
    title: 'Bẫy kẹt lệnh rút tiền',
    victimName: 'Tuấn',
    character: {
      name: 'Tuấn',
      roleTitle: 'Nhà đầu tư hoang mang',
      expression: 'fearful',
      dialogueText: 'Tài khoản em đang hiển thị lãi 500 triệu, nhưng khi em bấm rút tiền thì sàn báo "lệnh rút bị treo, cần đóng thêm 100 triệu tiền thuế quốc tế"!',
    },
    backgroundTheme: 'bank_interface',
    ambientSoundEffect: 'heartbeat',
    interactiveClues: [
      {
        id: 'clue_05_3_bank',
        label: 'Yêu cầu đóng thuế phi lý',
        iconType: 'call_log',
        actionPayload: {
          title: 'Kịch bản thu phí khống',
          category: 'Tống tiền tài chính',
          description: 'Bắt đóng phí xác minh danh tính, phí chống rửa tiền, phí hoa hồng chuyên gia trước khi mở khóa ví.',
          riskLevel: 'critical',
          details: [
            'Tiền lãi trên màn hình chỉ là những con số ảo do admin gõ vào.',
            'Mỗi lần đóng thêm tiền là nạn nhân lại mất thêm tiền thật cho kẻ gian.'
          ]
        }
      }
    ]
  },

  'case_04_4': {
    caseId: 'case_04',
    stationId: 4,
    title: 'Sập web & Xóa nhóm phi tang',
    victimName: 'Tuấn',
    character: {
      name: 'Tuấn',
      roleTitle: 'Nạn nhân bàng hoàng',
      expression: 'shocked',
      dialogueText: 'Sáng nay trang web sàn đã không vào được nữa, nhóm Telegram bị xóa sạch và admin đã chặn số em hoàn toàn!',
    },
    backgroundTheme: 'bedroom',
    ambientSoundEffect: 'siren',
    interactiveClues: [
      {
        id: 'clue_05_4_log',
        label: 'Dấu vết website biến mất',
        iconType: 'chat_log',
        actionPayload: {
          title: 'Trang web báo lỗi "Error 521: Web server is down"',
          category: 'Dấu vết tội phạm',
          description: 'Kẻ cầm đầu đã đánh sập máy chủ, tẩu tán tài sản và chuẩn bị đổi tên sàn mới để lừa đợt người tiếp theo.',
          riskLevel: 'critical',
          details: [
            'Vòng đời trung bình của sàn lừa đảo chỉ kéo dài từ 3 - 6 tháng.',
            'Cần thu thập lịch sử nộp tiền ngân hàng để phục vụ công tác điều tra khởi tố.'
          ]
        }
      }
    ]
  },

  'case_04_5': {
    caseId: 'case_04',
    stationId: 5,
    title: 'Bài học đầu tư & Báo cáo A05',
    victimName: 'Tuấn',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Chuyên gia tư vấn pháp luật',
      expression: 'neutral',
      dialogueText: 'Tại Việt Nam, chưa có bất kỳ sàn giao dịch tiền ảo nào được cấp phép hoạt động. Hãy luôn ghi nhớ: Lợi nhuận cao luôn đi kèm rủi ro cực đại!',
    },
    backgroundTheme: 'office',
    ambientSoundEffect: 'notification',
    interactiveClues: [
      {
        id: 'clue_05_5_doc',
        label: 'Cảnh báo của Ủy ban Chứng khoán',
        iconType: 'document',
        actionPayload: {
          title: 'Khuyến cáo nhà đầu tư trước các mô hình Ponzi',
          category: 'Khuyến cáo chính thức',
          description: 'Văn bản cảnh báo các dấu hiệu nhận diện mô hình lừa đảo đa cấp nhị phân và tiền mã hóa trái phép.',
          riskLevel: 'safe',
          details: [
            'Chỉ đầu tư qua các tổ chức tài chính được Ngân hàng Nhà nước và Bộ Tài chính cấp phép.',
            'Tuyệt đối không ủy thác tiền cho các "chuyên gia" không rõ danh tính trên mạng.'
          ]
        }
      }
    ]
  }
};

/**
 * Helper to retrieve StationConfig safely by caseId and stationIndex (1-indexed or 0-indexed)
 */
export function getStationConfig(caseIdOrNumber: number | string, stationIndexOrId: number): StationConfig {
  const normalizedCaseNumber = typeof caseIdOrNumber === 'number'
    ? (caseIdOrNumber < 10 ? `case_0${caseIdOrNumber}` : `case_${caseIdOrNumber}`)
    : (caseIdOrNumber.startsWith('case_') ? caseIdOrNumber : `case_${caseIdOrNumber}`);

  // stationIndex could be 0..4 or 1..5
  const stationId = stationIndexOrId >= 1 && stationIndexOrId <= 5 ? stationIndexOrId : stationIndexOrId + 1;
  const key = `${normalizedCaseNumber}_${stationId}`;

  if (STATION_CONFIGS[key]) {
    return STATION_CONFIGS[key];
  }

  // Fallback for legacy case numbers (e.g., case 5 -> case 4)
  if (normalizedCaseNumber === 'case_05') {
    const legacyKey = `case_04_${stationId}`;
    if (STATION_CONFIGS[legacyKey]) return STATION_CONFIGS[legacyKey];
  }

  // Fallback default config if custom config not present
  return {
    caseId: normalizedCaseNumber,
    stationId,
    title: `Trạm điều tra #${stationId}`,
    victimName: 'Nạn nhân',
    character: {
      name: 'Thám tử Số',
      roleTitle: 'Điều tra viên kỹ thuật',
      expression: 'investigating',
      dialogueText: 'Hãy phân tích kỹ các bằng chứng số tại hiện trường để tìm ra chân tướng sự việc!',
    },
    backgroundTheme: 'bedroom',
    interactiveClues: [
      {
        id: `clue_default_${stationId}`,
        label: `Manh mối Trạm ${stationId}`,
        iconType: 'document',
        actionPayload: {
          title: 'Chứng cứ số đang được phân tích',
          description: 'Tài liệu điện tử trích xuất từ hiện trường vụ án.',
          riskLevel: 'warning',
          details: ['Đang kết nối giám định an ninh mạng...']
        }
      }
    ]
  };
}
