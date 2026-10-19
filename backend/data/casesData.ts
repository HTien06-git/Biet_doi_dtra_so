// ============================================================================
// DATA/CASESDATA.TS – DỮ LIỆU VỤ ÁN CHO GAME "ĐỘI ĐIỀU TRA SỐ"
// ============================================================================

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Station {
  id: number;
  title: string;
  points: number;
  scenario: string;           // Bối cảnh tình huống
  sceneDescription: string;   // Mô tả hình ảnh hiện trường 2D
  question: string;           // Câu hỏi chính (hiển thị trên băng rôn vàng)
  isMultipleChoice: boolean;  // true = checkbox (chọn nhiều), false = radio (chọn 1)
  answers: Answer[];
  correctExplanation: string; // Giải thích khi đúng
  wrongHint: string;          // Gợi ý khi sai
  clue: {
    title: string;            // Tiêu đề manh mối
    content: string;          // Nội dung manh mối
  };
  evidence?: {                // Chứng cứ số cho kính lúp
    type: 'message' | 'document' | 'transaction' | 'screenshot' | 'timeline';
    title: string;
    content: string;
  }[];
}

export interface CaseData {
  id: number;
  caseNumber: string;         // "02", "03", "04", "05"
  title: string;
  subtitle: string;
  description: string;
  icon: string;               // emoji icon
  color: string;              // theme color
  stations: Station[];
  caseSummary: {
    conclusion: string;       // Kết luận điều tra
    safetyLesson: string;     // Bài học an toàn số
  };
}

export const GAME_CONFIG = {
  // Chế độ chơi: 'practice' = Luyện tập (mặc định), 'strict' = Thi đấu
  gameMode: 'practice' as 'practice' | 'strict',
  totalCases: 4,
  stationsPerCase: 5,
  maxPointsPerCase: 100,
  footerMessage: "TỈNH TÁO TRƯỚC THÔNG TIN – PHÂN TÍCH BẰNG CHỨNG – BẢO VỆ DỮ LIỆU – LÀM CHỦ KHÔNG GIAN MẠNG.",
};

export const CASES_DATA: CaseData[] = [
  // ========================================================================
  // VỤ ÁN 02: CUỘC GỌI TỰ XƯNG CÔNG AN
  // ========================================================================
  {
    id: 2,
    caseNumber: "02",
    title: "Cuộc gọi tự xưng công an",
    subtitle: "Nhận diện cuộc gọi giả mạo",
    description: "Nhận diện cuộc gọi giả mạo, kiểm tra giấy triệu tập, bảo toàn chứng cứ số và xử lý an toàn.",
    icon: "📞",
    color: "#E74C3C",
    stations: [
      {
        id: 1,
        title: "Truy tìm cuộc gọi lạ",
        points: 15,
        scenario: "Minh, sinh viên năm 2, nhận cuộc gọi từ số di động lạ (+84 912 XXX XXX). Người bên kia tự xưng là \"Đại úy Nguyễn Văn Hùng – Phòng Cảnh sát điều tra Công an TP.HCM\", nói rằng Minh đang bị điều tra vì liên quan đến đường dây rửa tiền xuyên quốc gia. Người gọi đe dọa sẽ bắt giữ Minh trong 24 giờ nếu không hợp tác, yêu cầu giữ bí mật tuyệt đối với gia đình và chuyển sang ứng dụng nhắn tin Telegram để \"bảo mật thông tin\". Sau đó, người gọi yêu cầu Minh chuyển 50 triệu đồng vào \"tài khoản tạm giữ của cơ quan điều tra\" và tuyệt đối không được gọi điện kiểm chứng qua tổng đài hoặc đến trực tiếp công an.",
        sceneDescription: "Phòng ký túc xá sinh viên. Minh ngồi trên giường, tay cầm điện thoại với biểu cảm lo lắng. Trên màn hình điện thoại hiển thị số gọi đến lạ. Bong bóng thoại từ điện thoại có chữ 'CÔNG AN ĐIỀU TRA'. Xung quanh có sách vở, laptop mở trên bàn.",
        question: "Chọn hai dấu hiệu đáng ngờ nhất trong cuộc gọi Minh nhận được?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Người gọi yêu cầu giữ bí mật và đe dọa bắt giữ để gây áp lực tâm lý", isCorrect: true },
          { id: "B", text: "Người gọi sử dụng điện thoại di động thay vì số cố định", isCorrect: false },
          { id: "C", text: "Người gọi yêu cầu chuyển tiền và không cho Minh kiểm chứng qua kênh chính thức", isCorrect: true },
          { id: "D", text: "Cuộc gọi diễn ra vào buổi sáng giờ hành chính", isCorrect: false },
        ],
        correctExplanation: "Chính xác! Hai dấu hiệu đáng ngờ nhất là: (1) Yêu cầu giữ bí mật và đe dọa bắt giữ – đây là thủ thuật gây áp lực tâm lý đặc trưng của kẻ lừa đảo nhằm cô lập nạn nhân. (2) Yêu cầu chuyển tiền và cấm kiểm chứng – cơ quan chức năng thực sự không bao giờ yêu cầu chuyển tiền qua điện thoại hoặc cấm công dân xác minh thông tin.",
        wrongHint: "Hãy tập trung vào những hành vi bất thường mà cơ quan chức năng thực sự KHÔNG BAO GIỜ làm. Cơ quan công an có yêu cầu chuyển tiền qua điện thoại không? Họ có cấm người dân xác minh thông tin không?",
        clue: {
          title: "Manh mối #1: Dấu hiệu cuộc gọi giả mạo",
          content: "Cuộc gọi sử dụng số di động cá nhân thay vì tổng đài. Kẻ giả mạo sử dụng 3 kỹ thuật tâm lý: đe dọa, tạo khẩn cấp và cô lập nạn nhân khỏi người thân. Quy tắc vàng: Cơ quan chức năng KHÔNG BAO GIỜ yêu cầu chuyển tiền qua điện thoại.",
        },
        evidence: [
          {
            type: 'message',
            title: 'Lịch sử cuộc gọi',
            content: '📞 Cuộc gọi đến: +84 912 XXX XXX\n⏰ Thời lượng: 12 phút 34 giây\n📍 Không thuộc danh bạ tổng đài công an\n⚠️ Số điện thoại di động cá nhân, không phải số cơ quan nhà nước',
          },
          {
            type: 'document',
            title: 'Nội dung yêu cầu đáng ngờ',
            content: '1. "Giữ bí mật tuyệt đối, không nói cho ai"\n2. "Chuyển tiền vào tài khoản tạm giữ"\n3. "Không được gọi xác minh"\n4. "Sẽ bị bắt trong 24h nếu không hợp tác"',
          },
        ],
      },
      {
        id: 2,
        title: "Giải mã giấy triệu tập giả",
        points: 15,
        scenario: "Sau cuộc gọi, kẻ giả mạo gửi cho Minh qua Telegram một file PDF có tiêu đề \"GIẤY TRIỆU TẬP KHẨN CẤP\" mang logo Bộ Công an. Tuy nhiên, khi Minh quan sát kỹ, nhận thấy: Giấy triệu tập ghi sai tên đơn vị thành \"Phòng Cảnh sát Hình sự điều tra số 9\" (không tồn tại), số văn bản có dạng \"ST-2024/XXXX\" không đúng quy cách, và thiếu dấu đỏ (con dấu chính thức) của cơ quan. Giấy yêu cầu Minh cung cấp số CMND/CCCD, số tài khoản ngân hàng và mật khẩu Internet Banking.",
        sceneDescription: "Màn hình điện thoại zoom lớn hiển thị file PDF 'Giấy Triệu Tập'. Logo Bộ Công an bị mờ/méo. Có gạch đỏ đánh dấu các điểm sai: tên đơn vị sai, thiếu dấu đỏ, định dạng số văn bản lạ. Minh đang chỉ tay vào các điểm đáng ngờ.",
        question: "Đâu là dấu hiệu rõ ràng nhất cho thấy giấy triệu tập là GIẢ MẠO?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Giấy được gửi qua Telegram thay vì gửi trực tiếp hoặc qua đường công văn chính thức", isCorrect: false },
          { id: "B", text: "Giấy yêu cầu cung cấp mật khẩu Internet Banking – thông tin mà cơ quan chức năng không bao giờ thu thập", isCorrect: true },
          { id: "C", text: "Giấy có logo Bộ Công an nhưng hơi mờ", isCorrect: false },
          { id: "D", text: "Giấy được gửi vào ban đêm", isCorrect: false },
        ],
        correctExplanation: "Dấu hiệu rõ ràng nhất là yêu cầu cung cấp mật khẩu Internet Banking. KHÔNG có cơ quan nhà nước nào được phép yêu cầu công dân cung cấp mật khẩu tài khoản ngân hàng. Đây là thông tin bảo mật cá nhân tuyệt đối.",
        wrongHint: "Hãy nghĩ xem: Cơ quan chức năng cần gì để điều tra? Họ có cần mật khẩu ngân hàng của bạn không? Đâu là thông tin mà KHÔNG ai có quyền yêu cầu bạn cung cấp?",
        clue: {
          title: "Manh mối #2: Nhận diện giấy triệu tập giả",
          content: "Giấy triệu tập thật phải: (1) Được gửi trực tiếp hoặc qua bưu điện, (2) Có đầy đủ dấu đỏ, chữ ký, (3) Ghi đúng tên đơn vị, số hiệu văn bản theo quy định. Đặc biệt: KHÔNG BAO GIỜ yêu cầu cung cấp mật khẩu ngân hàng.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Phân tích file PDF',
            content: '📄 Tên file: GIAY_TRIEU_TAP_KHAN.pdf\n🔍 Metadata: Tạo bởi "Canva" - không phải phần mềm cơ quan nhà nước\n❌ Thiếu dấu đỏ chính thức\n❌ Đơn vị "Phòng CS Hình sự ĐT số 9" - KHÔNG TỒN TẠI\n❌ Yêu cầu mật khẩu Internet Banking',
          },
        ],
      },
      {
        id: 3,
        title: "Phân tích chứng cứ số",
        points: 20,
        scenario: "Minh quyết định bảo toàn bằng chứng. Em đã chụp lại toàn bộ cuộc trò chuyện trên Telegram, lưu file PDF giấy triệu tập giả, ghi lại số điện thoại gọi đến. Tuy nhiên, Minh không chắc nên làm gì tiếp theo. Bạn bè Minh khuyên nên: (A) Đăng lên mạng xã hội để cảnh báo mọi người, (B) Xóa hết tin nhắn và chặn số để an toàn, (C) Trình báo cơ quan công an gần nhất kèm toàn bộ bằng chứng đã lưu.",
        sceneDescription: "Minh ngồi trước laptop, trên màn hình hiển thị các file screenshot đã chụp, tin nhắn Telegram, file PDF. Bên cạnh có 3 bong bóng thoại từ 3 người bạn với 3 lời khuyên khác nhau (đăng Facebook, xóa tin nhắn, báo công an).",
        question: "Minh nên xử lý chứng cứ số như thế nào để đúng quy trình?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Đăng toàn bộ bằng chứng lên mạng xã hội để cảnh báo cộng đồng", isCorrect: false },
          { id: "B", text: "Xóa hết tin nhắn và chặn số điện thoại để tránh bị làm phiền", isCorrect: false },
          { id: "C", text: "Bảo toàn nguyên vẹn bằng chứng và trình báo cơ quan công an kèm đầy đủ chứng cứ", isCorrect: true },
          { id: "D", text: "Gọi lại số điện thoại đó để đối chất trực tiếp", isCorrect: false },
        ],
        correctExplanation: "Cách xử lý đúng là bảo toàn nguyên vẹn tất cả bằng chứng (không xóa, không chỉnh sửa) và trình báo cơ quan công an kèm đầy đủ chứng cứ. Đăng lên mạng xã hội có thể vô tình tiết lộ thông tin cá nhân hoặc làm mất giá trị pháp lý của chứng cứ.",
        wrongHint: "Nghĩ về giá trị pháp lý của bằng chứng. Nếu xóa đi thì còn gì để cơ quan điều tra làm việc? Nếu đăng lên mạng xã hội, bạn có kiểm soát được thông tin cá nhân của mình không?",
        clue: {
          title: "Manh mối #3: Quy trình bảo toàn chứng cứ số",
          content: "3 bước bảo toàn chứng cứ số: (1) Chụp màn hình/quay video toàn bộ nội dung, (2) Lưu trữ an toàn, không chỉnh sửa hoặc xóa, (3) Trình báo cơ quan chức năng kèm đầy đủ bằng chứng gốc. KHÔNG tự ý phát tán lên mạng xã hội.",
        },
        evidence: [
          {
            type: 'screenshot',
            title: 'Danh sách chứng cứ đã thu thập',
            content: '✅ 5 screenshot cuộc trò chuyện Telegram\n✅ File PDF giấy triệu tập giả\n✅ Số điện thoại: +84 912 XXX XXX\n✅ Thời gian cuộc gọi: 09:15 ngày XX/XX/2024\n✅ Thông tin tài khoản ngân hàng kẻ gian cung cấp',
          },
        ],
      },
      {
        id: 4,
        title: "Truy tìm dấu vết giả mạo",
        points: 20,
        scenario: "Cơ quan công an tiếp nhận trình báo của Minh. Điều tra viên cho biết đây là thủ đoạn lừa đảo phổ biến và phân tích thêm: Số điện thoại gọi cho Minh sử dụng SIM rác đăng ký bằng giấy tờ giả. Tài khoản Telegram \"Đại úy Hùng\" được tạo cách đây chỉ 3 ngày. Tài khoản ngân hàng nhận tiền đứng tên một người khác ở tỉnh khác (có thể là tài khoản mua lại). Trong tuần qua có 12 nạn nhân khác trình báo với thủ đoạn tương tự.",
        sceneDescription: "Văn phòng điều tra công an. Bảng phân tích với bản đồ kết nối: SIM rác → Telegram 3 ngày tuổi → tài khoản ngân hàng đứng tên người lạ → 12 nạn nhân khác. Điều tra viên thật đang trình bày, Minh ngồi nghe.",
        question: "Điểm mấu chốt nào cho thấy đây là lừa đảo CÓ TỔ CHỨC, không phải hành vi đơn lẻ?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Kẻ gian sử dụng SIM rác khó truy vết", isCorrect: false },
          { id: "B", text: "Tài khoản Telegram mới tạo 3 ngày", isCorrect: false },
          { id: "C", text: "Có 12 nạn nhân khác với cùng kịch bản, tài khoản nhận tiền đứng tên người khác – cho thấy đường dây có phân công vai trò", isCorrect: true },
          { id: "D", text: "Cuộc gọi được thực hiện bằng điện thoại di động", isCorrect: false },
        ],
        correctExplanation: "Việc có 12 nạn nhân bị lừa cùng kịch bản và tài khoản nhận tiền đứng tên người khác (tài khoản mua lại) cho thấy đây là đường dây lừa đảo có tổ chức, với sự phân công vai trò: người gọi điện, người cung cấp tài khoản, người rút tiền.",
        wrongHint: "Một kẻ lừa đảo đơn lẻ có thể dùng SIM rác hoặc Telegram mới. Nhưng yếu tố nào cho thấy có NHIỀU người cùng tham gia và phối hợp trong đường dây này?",
        clue: {
          title: "Manh mối #4: Dấu hiệu lừa đảo có tổ chức",
          content: "Đường dây lừa đảo có tổ chức thường có: (1) Nhiều nạn nhân với cùng kịch bản, (2) Sử dụng tài khoản ngân hàng \"mua lại\" để nhận tiền rồi rút ngay, (3) Phân công vai trò rõ ràng: người gọi, người nhận tiền, người rút tiền. SIM rác và tài khoản ẩn danh chỉ là công cụ.",
        },
        evidence: [
          {
            type: 'timeline',
            title: 'Dòng thời gian điều tra',
            content: '📅 3 ngày trước: Tài khoản Telegram "Đại úy Hùng" được tạo\n📅 2 ngày trước: 5 nạn nhân đầu tiên bị gọi\n📅 1 ngày trước: 7 nạn nhân tiếp theo\n📅 Hôm nay: Minh nhận cuộc gọi - là nạn nhân thứ 13\n💰 Tổng tiền 12 nạn nhân đã chuyển: ~2.4 tỷ VNĐ',
          },
        ],
      },
      {
        id: 5,
        title: "Phá án và bảo vệ nạn nhân",
        points: 30,
        scenario: "Minh đã trình báo kịp thời và không mất tiền. Nhưng em lo lắng vì đã cung cấp họ tên đầy đủ và số CCCD qua Telegram cho kẻ giả mạo. Điều tra viên hướng dẫn Minh các bước bảo vệ tiếp theo. Câu hỏi cuối cùng: Minh cần thực hiện TẤT CẢ các bước nào sau đây để bảo vệ bản thân sau khi đã lộ thông tin cá nhân?",
        sceneDescription: "Minh đứng trước bảng checklist lớn với các bước bảo vệ. Điều tra viên đứng bên cạnh đánh dấu tick. Trên bảng có các biểu tượng: khóa bảo mật, ứng dụng ngân hàng, tín dụng, cảnh báo.",
        question: "Sau khi đã lỡ cung cấp thông tin cá nhân (họ tên, CCCD) cho kẻ lừa đảo, Minh cần làm gì?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Đổi mật khẩu tất cả tài khoản ngân hàng, email, mạng xã hội và bật xác thực 2 lớp", isCorrect: true },
          { id: "B", text: "Thông báo cho ngân hàng để giám sát giao dịch bất thường và tạm khóa tài khoản nếu cần", isCorrect: true },
          { id: "C", text: "Chỉ cần chặn số điện thoại kẻ lừa đảo là đủ an toàn", isCorrect: false },
          { id: "D", text: "Cảnh báo người thân, bạn bè về thủ đoạn lừa đảo để tránh bị lợi dụng thông tin của mình", isCorrect: true },
        ],
        correctExplanation: "Khi đã lộ thông tin cá nhân, Minh cần thực hiện ĐỒNG THỜI: (1) Đổi mật khẩu toàn bộ tài khoản + bật 2FA, (2) Thông báo ngân hàng giám sát giao dịch, (3) Cảnh báo người thân. Chỉ chặn số điện thoại là KHÔNG ĐỦ vì kẻ gian đã có thông tin cá nhân và có thể dùng để mở tài khoản giả, vay tín dụng đen nhân danh Minh.",
        wrongHint: "Kẻ lừa đảo đã có họ tên và số CCCD của Minh. Chỉ chặn số điện thoại có ngăn được kẻ gian sử dụng thông tin đó không? Hãy nghĩ về tất cả các cách kẻ gian có thể lạm dụng thông tin cá nhân đã bị lộ.",
        clue: {
          title: "Manh mối #5: Bảo vệ sau khi lộ thông tin",
          content: "Checklist bảo vệ khi lộ thông tin cá nhân: ✅ Đổi mật khẩu tất cả tài khoản + bật 2FA, ✅ Liên hệ ngân hàng giám sát giao dịch, ✅ Cảnh báo người thân phòng kẻ gian mạo danh, ✅ Theo dõi lịch sử tín dụng CIC, ✅ Tiếp tục phối hợp cơ quan điều tra.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Thông tin đã bị lộ',
            content: '⚠️ Họ và tên đầy đủ: Đã cung cấp\n⚠️ Số CCCD: Đã cung cấp\n⚠️ Số điện thoại: Đã hiển thị\n✅ Mật khẩu ngân hàng: CHƯA cung cấp\n✅ Tiền: CHƯA chuyển',
          },
        ],
      },
    ],
    caseSummary: {
      conclusion: "Vụ án cuộc gọi giả mạo công an đã được phá thành công. Minh đã nhận diện kịp thời các dấu hiệu lừa đảo, bảo toàn chứng cứ đúng cách và trình báo cơ quan chức năng. Đường dây lừa đảo sử dụng SIM rác, giấy triệu tập giả và tài khoản ngân hàng mua lại để hoạt động có tổ chức.",
      safetyLesson: "CƠ QUAN CHỨC NĂNG KHÔNG BAO GIỜ: yêu cầu chuyển tiền qua điện thoại, đe dọa bắt giữ để ép buộc, cấm xác minh thông tin, yêu cầu mật khẩu ngân hàng. Khi nhận cuộc gọi đáng ngờ: DỪNG – KIỂM TRA – TRÌNH BÁO.",
    },
  },

  // ========================================================================
  // VỤ ÁN 03: BỨC ẢNH RIÊNG TƯ LAN TRUYỀN
  // ========================================================================
  {
    id: 3,
    caseNumber: "03",
    title: "Bức ảnh riêng tư lan truyền",
    subtitle: "Bảo vệ quyền riêng tư trực tuyến",
    description: "Bảo vệ quyền riêng tư, thu thập chứng cứ hợp pháp và không quy trách nhiệm khi chưa đủ căn cứ.",
    icon: "📸",
    color: "#9B59B6",
    stations: [
      {
        id: 1,
        title: "Hiện trường số",
        points: 15,
        scenario: "Lan, học sinh lớp 11, hoảng hốt phát hiện một bức ảnh riêng tư của mình đang được chia sẻ trong nhóm chat lớp trên Zalo lúc 20:45 tối. Ảnh chụp Lan trong phòng riêng với góc chụp cho thấy người chụp dùng camera từ xa hoặc ai đó đã truy cập được vào điện thoại/camera cá nhân. Nhiều bạn trong lớp đã xem và bình luận. Lan vô cùng xấu hổ và muốn xóa mọi dấu vết.",
        sceneDescription: "Phòng ngủ của Lan. Lan ngồi ôm gối, biểu cảm hoảng sợ nhìn vào điện thoại. Trên màn hình hiện tin nhắn nhóm chat với các biểu tượng mắt 👀 và bình luận. Đồng hồ trên tường chỉ 20:45.",
        question: "Lan vừa phát hiện ảnh riêng tư bị lan truyền. Việc ĐẦU TIÊN Lan nên làm là gì?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Chụp màn hình bảo toàn bằng chứng (ảnh, người gửi, thời gian, nhóm chat) trước khi bất kỳ ai xóa", isCorrect: true },
          { id: "B", text: "Nhắn tin trong nhóm yêu cầu mọi người xóa ảnh ngay lập tức", isCorrect: false },
          { id: "C", text: "Tìm ngay người đã gửi ảnh và đối chất trực tiếp", isCorrect: false },
          { id: "D", text: "Rời khỏi nhóm chat để không phải thấy bình luận", isCorrect: false },
        ],
        correctExplanation: "Việc đầu tiên và quan trọng nhất là BẢO TOÀN BẰNG CHỨNG bằng cách chụp màn hình ghi lại: ảnh, tài khoản người gửi, thời gian gửi, tên nhóm chat, các bình luận. Nếu yêu cầu xóa trước, bằng chứng có thể bị mất và khó truy cứu trách nhiệm sau này.",
        wrongHint: "Hãy nghĩ theo logic điều tra: Nếu bạn yêu cầu xóa hoặc rời nhóm, bằng chứng sẽ ra sao? Bước nào giúp bảo toàn quyền lợi pháp lý của Lan nhất?",
        clue: {
          title: "Manh mối #1: Bảo toàn hiện trường số",
          content: "Ảnh xuất hiện trong nhóm lúc 20:45, nhưng đây chưa chắc là thời điểm phát tán đầu tiên. Thời điểm nhìn thấy ảnh không đủ xác định nguồn ban đầu; cần bảo toàn dữ liệu thay vì tiếp tục lan truyền ảnh.",
        },
        evidence: [
          {
            type: 'screenshot',
            title: 'Thông tin nhóm chat',
            content: '📱 Nhóm: "Lớp 11A2 – Zalo"\n👥 Thành viên: 42 người\n🕐 Ảnh xuất hiện: 20:45\n👁️ Đã xem: 28 người\n💬 Bình luận: 15 tin nhắn',
          },
        ],
      },
      {
        id: 2,
        title: "Phân tích tin nhắn",
        points: 15,
        scenario: "Sau khi Lan bảo toàn bằng chứng, cô kiểm tra kỹ hơn nhóm chat. Phát hiện ảnh được gửi bởi tài khoản \"Phong Nguyen\" lúc 20:32 – sớm hơn 13 phút so với thời điểm Lan nhìn thấy (20:45). Tuy nhiên, Phong là bạn thân của Lan và nói rằng mình không gửi, điện thoại bị người khác mượn lúc 20:00-20:40 khi đi vệ sinh ở quán net. Cần xác minh thêm.",
        sceneDescription: "Giao diện tin nhắn Zalo mở rộng. Tin nhắn từ 'Phong Nguyen' lúc 20:32 có ảnh. Phong đứng bên cạnh giơ tay phân trần. Bong bóng thoại: 'Tớ không gửi! Ai đó dùng điện thoại của tớ!'. Trên bàn ở quán net có điện thoại của Phong.",
        question: "Tài khoản \"Phong Nguyen\" gửi ảnh lúc 20:32, nhưng Phong nói điện thoại bị mượn. Kết luận nào sau đây là PHÙ HỢP nhất?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Phong chắc chắn là người phát tán ảnh vì ảnh gửi từ tài khoản của Phong", isCorrect: false },
          { id: "B", text: "Phong vô tội vì đã nói điện thoại bị mượn", isCorrect: false },
          { id: "C", text: "Cần xác minh thêm: kiểm tra camera quán net, nhân chứng, lịch sử đăng nhập thiết bị để xác định ai thực sự thao tác", isCorrect: true },
          { id: "D", text: "Nên bỏ qua vì Phong là bạn thân của Lan", isCorrect: false },
        ],
        correctExplanation: "Không thể vội kết luận Phong có tội hay vô tội chỉ dựa trên 1 dữ kiện. Tài khoản gửi ảnh là của Phong, nhưng cần xác minh: camera an ninh quán net, nhân chứng thấy ai dùng điện thoại, lịch sử đăng nhập/IP. Đây là nguyên tắc \"suy đoán vô tội\" – chưa đủ chứng cứ thì chưa kết luận.",
        wrongHint: "Trong điều tra, một bằng chứng duy nhất có đủ để kết luận không? Nguyên tắc suy đoán vô tội có nghĩa gì? Hãy nghĩ về những chứng cứ khác cần thu thập.",
        clue: {
          title: "Manh mối #2: Xác minh tài khoản nghi vấn",
          content: "Tài khoản nghi vấn gửi ảnh lúc 20:32, sớm hơn 20:45; cần xác minh tài khoản có bị người khác sử dụng không. Nguyên tắc suy đoán vô tội: Chưa đủ chứng cứ → chưa kết luận ai là thủ phạm.",
        },
        evidence: [
          {
            type: 'timeline',
            title: 'Dòng thời gian sự kiện',
            content: '🕐 20:00 – Phong đến quán net, để điện thoại trên bàn\n🕐 20:15 – Phong đi vệ sinh (khoảng 5-10 phút?)\n🕐 20:32 – Ảnh được gửi từ tài khoản Phong\n🕐 20:40 – Phong quay lại bàn\n🕐 20:45 – Lan phát hiện ảnh trong nhóm',
          },
        ],
      },
      {
        id: 3,
        title: "Dựng lại diễn biến",
        points: 20,
        scenario: "Điều tra tiếp, phát hiện thêm các dữ kiện: (1) Camera quán net cho thấy có một người ngồi cùng bàn Phong, cầm điện thoại của Phong lúc 20:30. (2) Bức ảnh riêng tư của Lan có trong thư mục ảnh đã xóa gần đây trên điện thoại của Phong – nhưng Phong nói không biết ảnh này. (3) Ảnh gốc có metadata cho thấy được chụp bằng camera trước của điện thoại Phong vào ngày trước đó, khi Phong đến nhà Lan chơi.",
        sceneDescription: "Bảng phân tích bằng chứng. Camera quán net hiển thị hình người lạ cầm điện thoại. Ảnh metadata hiển thị thông tin: thiết bị, ngày chụp, vị trí GPS. Sơ đồ kết nối: điện thoại Phong → ảnh chụp → người lạ gửi.",
        question: "Với các dữ kiện mới, diễn biến nào có khả năng nhất?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Phong chụp ảnh Lan khi đến nhà chơi, sau đó người khác lấy điện thoại Phong và gửi ảnh lên nhóm", isCorrect: true },
          { id: "B", text: "Lan tự chụp ảnh và gửi cho Phong", isCorrect: false },
          { id: "C", text: "Người lạ ở quán net hack điện thoại Phong từ xa", isCorrect: false },
          { id: "D", text: "Ảnh được tạo bằng AI deepfake", isCorrect: false },
        ],
        correctExplanation: "Metadata cho thấy ảnh được chụp bằng camera trước điện thoại Phong khi Phong ở nhà Lan → Phong đã chụp (có thể lén). Camera quán net cho thấy người khác cầm điện thoại Phong lúc 20:30 → người này gửi ảnh lúc 20:32. Vụ án có 2 người liên quan: Phong (chụp) và người ở quán net (phát tán).",
        wrongHint: "Hãy kết hợp 3 dữ kiện: (1) Metadata ảnh cho biết thiết bị và thời gian chụp, (2) Camera quán net cho thấy ai cầm điện thoại, (3) Thời gian gửi ảnh. Ghép các mảnh ghép lại với nhau.",
        clue: {
          title: "Manh mối #3: Dựng lại diễn biến từ dữ liệu số",
          content: "Metadata ảnh (EXIF data) là bằng chứng số quan trọng, chứa: thiết bị chụp, ngày/giờ, vị trí GPS. Kết hợp với camera an ninh giúp dựng lại diễn biến chính xác. Vụ án có thể có nhiều người liên quan với vai trò khác nhau.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Phân tích Metadata ảnh (EXIF)',
            content: '📸 Thiết bị: iPhone 13 (của Phong)\n📅 Ngày chụp: XX/XX/2024, 16:42\n📍 Vị trí GPS: [Địa chỉ nhà Lan]\n🔄 Camera: Camera trước (selfie mode)\n📐 Góc chụp: Từ phía trước, khoảng cách ~1.5m',
          },
        ],
      },
      {
        id: 4,
        title: "Truy tìm dấu vết số",
        points: 20,
        scenario: "Vụ việc được trình báo nhà trường và cơ quan chức năng. Qua điều tra, xác định: (1) Phong thừa nhận đã chụp ảnh Lan khi đến nhà chơi nhưng \"chỉ để ngắm, không định phát tán\". (2) Người ngồi cùng bàn ở quán net là Tuấn, cùng lớp, đã mở điện thoại Phong (không khóa màn hình) và gửi ảnh vào nhóm. Câu hỏi: Trong vụ việc này, ai vi phạm pháp luật và vi phạm điều gì?",
        sceneDescription: "Phòng họp nhà trường. Phong và Tuấn ngồi hai bên, đầu cúi. Giữa bàn là các chứng cứ: điện thoại, screenshot. Thầy hiệu trưởng và một cán bộ công an ngồi đối diện. Bảng trắng ghi 'AI VI PHẠM?'.",
        question: "Ai vi phạm pháp luật trong vụ việc này?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Phong – vi phạm quyền riêng tư khi chụp ảnh Lan mà không được đồng ý", isCorrect: true },
          { id: "B", text: "Tuấn – vi phạm khi truy cập điện thoại người khác trái phép và phát tán ảnh riêng tư", isCorrect: true },
          { id: "C", text: "Chỉ Tuấn vi phạm vì là người gửi ảnh lên nhóm", isCorrect: false },
          { id: "D", text: "Không ai vi phạm vì đây chỉ là trò đùa giữa bạn bè", isCorrect: false },
        ],
        correctExplanation: "CẢ HAI đều vi phạm: Phong vi phạm quyền hình ảnh/quyền riêng tư khi chụp ảnh Lan trong không gian riêng tư mà không được đồng ý (Điều 32 BLDS 2015). Tuấn vi phạm khi: (1) Truy cập điện thoại người khác trái phép, (2) Phát tán hình ảnh riêng tư mà không được đồng ý (có thể cấu thành tội phát tán thông tin cá nhân theo Luật An ninh mạng).",
        wrongHint: "Hãy xét hành vi của từng người: Phong chụp ảnh trong không gian riêng tư của Lan – có cần sự đồng ý không? Tuấn dùng điện thoại người khác và gửi ảnh – đó có phải hành vi hợp pháp không? 'Chỉ để ngắm' có phải lý do hợp pháp?",
        clue: {
          title: "Manh mối #4: Trách nhiệm pháp lý về quyền riêng tư",
          content: "Quyền hình ảnh (Điều 32 BLDS 2015): Việc sử dụng hình ảnh cá nhân phải được sự đồng ý. Chụp ảnh người khác trong không gian riêng tư mà không đồng ý = vi phạm. Phát tán ảnh riêng tư = vi phạm Luật An ninh mạng. KHÔNG có ngoại lệ cho \"trò đùa\" hay \"chỉ để ngắm\".",
        },
        evidence: [
          {
            type: 'document',
            title: 'Lời khai Phong & Tuấn',
            content: '📝 Phong: "Em chụp khi đến nhà Lan chơi, chỉ để ngắm thôi, không định gửi cho ai"\n📝 Tuấn: "Em thấy ảnh trong điện thoại Phong, tưởng gửi cho vui thôi, không nghĩ nghiêm trọng"\n❌ Cả hai không nhận thức được hành vi vi phạm pháp luật',
          },
        ],
      },
      {
        id: 5,
        title: "Kết luận vụ án, bảo vệ nạn nhân",
        points: 30,
        scenario: "Vụ việc đã được làm rõ. Bây giờ, trong vai trò điều tra viên, bạn cần đưa ra khuyến nghị tổng hợp để bảo vệ Lan và phòng ngừa tình huống tương tự. Lan hiện đang bị các bạn trong lớp trêu chọc, xì xào bàn tán. Một số bạn còn chia sẻ ảnh sang các nhóm khác.",
        sceneDescription: "Lan đứng giữa, xung quanh là các biểu tượng bảo vệ: lá chắn pháp lý, điện thoại hỗ trợ tâm lý, nhóm bạn tốt. Phía sau là màn hình hiển thị ảnh đang bị xóa khỏi các nhóm. Biểu ngữ: 'DỪNG CHIA SẺ – BẢO VỆ NẠN NHÂN'.",
        question: "Để bảo vệ Lan một cách toàn diện, cần thực hiện những bước nào?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Yêu cầu nền tảng Zalo gỡ bỏ ảnh và khóa tài khoản phát tán; yêu cầu các nhóm chat xóa ảnh", isCorrect: true },
          { id: "B", text: "Hỗ trợ tâm lý cho Lan, kết nối với chuyên gia tư vấn và giáo viên chủ nhiệm", isCorrect: true },
          { id: "C", text: "Đăng bài lên mạng xã hội phản đối để gây áp lực dư luận", isCorrect: false },
          { id: "D", text: "Giáo dục toàn trường về quyền riêng tư và trách nhiệm khi chia sẻ hình ảnh người khác", isCorrect: true },
        ],
        correctExplanation: "Bảo vệ nạn nhân cần 3 mặt: (1) PHÁP LÝ – yêu cầu nền tảng gỡ ảnh, xử lý người vi phạm; (2) TÂM LÝ – hỗ trợ tư vấn cho Lan, không để Lan bị cô lập; (3) PHÒNG NGỪA – giáo dục cộng đồng về quyền riêng tư. KHÔNG đăng lên mạng xã hội vì sẽ khuếch đại thêm sự việc và gây tổn thương cho Lan.",
        wrongHint: "Bảo vệ nạn nhân không chỉ là xử lý bằng chứng mà cần cả hỗ trợ tâm lý và phòng ngừa. Đăng lên mạng xã hội có thực sự giúp Lan hay sẽ khiến nhiều người biết đến hơn?",
        clue: {
          title: "Manh mối #5: Bảo vệ nạn nhân toàn diện",
          content: "Bảo vệ nạn nhân bị phát tán ảnh riêng tư cần 3 trụ cột: (1) Pháp lý: Báo cáo nền tảng, trình báo cơ quan chức năng; (2) Tâm lý: Hỗ trợ chuyên gia, không để nạn nhân bị cô lập; (3) Giáo dục: Nâng cao nhận thức cộng đồng. TUYỆT ĐỐI KHÔNG tiếp tục lan truyền dưới bất kỳ lý do nào.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Báo cáo tình trạng Lan',
            content: '😢 Tâm lý: Lo lắng, xấu hổ, không muốn đến trường\n📱 Ảnh đã lan sang 3 nhóm chat khác\n👥 Một số bạn trêu chọc, đặt biệt danh\n⚠️ Cần can thiệp khẩn cấp',
          },
        ],
      },
    ],
    caseSummary: {
      conclusion: "Có dấu hiệu phát tán ảnh riêng tư khi chưa được đồng ý. Phong vi phạm quyền hình ảnh khi chụp lén, Tuấn vi phạm khi truy cập trái phép điện thoại và phát tán. Chuỗi thời gian và dữ liệu tài khoản là căn cứ ban đầu để tiếp tục xác minh, chưa đủ khẳng định một cá nhân cụ thể là thủ phạm duy nhất.",
      safetyLesson: "QUYỀN RIÊNG TƯ LÀ QUYỀN CON NGƯỜI: (1) Không chụp ảnh người khác trong không gian riêng tư khi chưa được đồng ý, (2) Không phát tán hình ảnh riêng tư của người khác dưới bất kỳ lý do nào, (3) Khi phát hiện vi phạm: bảo toàn bằng chứng và trình báo, (4) Hỗ trợ nạn nhân thay vì bàn tán, chia sẻ tiếp.",
    },
  },

  // ========================================================================
  // VỤ ÁN 04: BẪY CỘNG TÁC VIÊN CHỐT ĐƠN
  // ========================================================================
  {
    id: 4,
    caseNumber: "04",
    title: "Bẫy cộng tác viên chốt đơn",
    subtitle: "Nhận diện lừa đảo việc làm online",
    description: "Nhận diện yêu cầu ứng tiền bất thường và truy vết giao dịch trong bẫy tuyển cộng tác viên.",
    icon: "🛒",
    color: "#E67E22",
    stations: [
      {
        id: 1,
        title: "Tin tuyển dụng hấp dẫn",
        points: 15,
        scenario: "Hà, sinh viên năm 3, thấy bài đăng trên Facebook: \"Tuyển CTV chốt đơn online, thu nhập 200-500K/ngày, chỉ cần điện thoại, không cần kinh nghiệm, làm tại nhà.\" Hà liên hệ qua link Telegram và được \"Quản lý Tuyết\" giải thích: công việc là vào các sàn thương mại điện tử chốt đơn ảo để tăng doanh số cho shop, hoa hồng 10-20% mỗi đơn. Để bắt đầu, Hà cần đăng ký tài khoản trên một website có giao diện giống Shopee.",
        sceneDescription: "Màn hình điện thoại hiển thị bài đăng Facebook hấp dẫn với tiền bay ra, emoji tiền 💰. Bên cạnh là giao diện Telegram với 'Quản lý Tuyết' avatar hình cô gái xinh đẹp. Website giả mạo Shopee hiện bên dưới với URL đáng ngờ.",
        question: "Đâu là dấu hiệu đáng ngờ nhất trong lời mời việc này?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Công việc chỉ cần điện thoại, không cần kinh nghiệm", isCorrect: false },
          { id: "B", text: "Thu nhập cam kết 200-500K/ngày – quá cao cho công việc đơn giản, và website giống Shopee nhưng KHÔNG PHẢI Shopee chính thức", isCorrect: true },
          { id: "C", text: "Liên hệ qua Telegram thay vì gọi điện", isCorrect: false },
          { id: "D", text: "Bài đăng trên Facebook", isCorrect: false },
        ],
        correctExplanation: "Thu nhập 200-500K/ngày (6-15 triệu/tháng) cho công việc chỉ cần bấm điện thoại là PHI THỰC TẾ. Kết hợp với website mạo danh sàn thương mại điện tử = dấu hiệu lừa đảo cổ điển. Các sàn uy tín không tuyển \"CTV chốt đơn ảo\" qua Telegram.",
        wrongHint: "Hãy so sánh: mức lương tối thiểu vùng hiện tại khoảng 150-200K/ngày cho lao động chính thức. Một công việc 'chỉ cần bấm điện thoại' mà trả gấp 2-3 lần – có hợp lý không?",
        clue: {
          title: "Manh mối #1: Nhận diện tin tuyển dụng lừa đảo",
          content: "3 dấu hiệu tin tuyển dụng giả: (1) Thu nhập phi thực tế so với công việc, (2) Yêu cầu đăng ký trên website giả mạo (URL khác với sàn chính thức), (3) Liên hệ qua kênh không chính thức (Telegram, Zalo cá nhân). Shopee/Lazada/TikTok Shop KHÔNG BAO GIỜ tuyển CTV chốt đơn ảo.",
        },
        evidence: [
          {
            type: 'screenshot',
            title: 'Phân tích bài đăng tuyển dụng',
            content: '📱 Bài đăng Facebook từ tài khoản "Việc Làm Online"\n⚠️ Tài khoản mới tạo 2 tuần, 0 bạn bè chung\n💰 "200-500K/ngày" = 6-15tr/tháng cho việc bấm điện thoại\n🔗 Link website: sh0pee-partner.com (KHÔNG PHẢI shopee.vn)\n📞 Liên hệ: Telegram @QuanLyTuyet',
          },
        ],
      },
      {
        id: 2,
        title: "Đơn hàng đầu tiên – Mồi nhử",
        points: 15,
        scenario: "Hà đăng ký tài khoản trên website giả. \"Quản lý Tuyết\" hướng dẫn: Để chốt đơn đầu tiên, Hà cần ứng trước 200.000đ tiền hàng vào tài khoản trên hệ thống, sau khi đơn hoàn thành sẽ được hoàn 200.000đ + 40.000đ hoa hồng (20%). Hà làm theo và thật sự nhận lại 240.000đ sau 10 phút! Lần 2, Tuyết giao đơn 500.000đ – Hà ứng tiền và cũng nhận lại 600.000đ. Hà bắt đầu tin tưởng.",
        sceneDescription: "Giao diện app giả mạo hiển thị: Đơn hàng #1 – 200K → Hoàn 240K ✅. Đơn hàng #2 – 500K → Hoàn 600K ✅. Hà mỉm cười nhìn số dư tăng lên. Bên cạnh là 'Quản lý Tuyết' gửi tin nhắn khen ngợi với emoji hoa 🌸.",
        question: "Tại sao kẻ lừa đảo cho Hà nhận tiền thật ở các đơn đầu tiên?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Vì đây là công việc hợp pháp và Hà xứng đáng được trả tiền", isCorrect: false },
          { id: "B", text: "Đây là kỹ thuật \"thả con tép bắt con tôm\" – cho lãi nhỏ ban đầu để xây dựng lòng tin, rồi lừa số tiền lớn hơn", isCorrect: true },
          { id: "C", text: "Kẻ lừa đảo bị lỗi hệ thống nên vô tình chuyển tiền", isCorrect: false },
          { id: "D", text: "Quản lý Tuyết thương Hà vì là sinh viên", isCorrect: false },
        ],
        correctExplanation: "Đây là kỹ thuật \"thả mồi\" kinh điển: Cho nạn nhân lãi nhỏ 2-3 lần đầu để xây dựng lòng tin hoàn toàn, sau đó giao đơn hàng giá trị lớn để chiếm đoạt. Số tiền trả ban đầu (40K + 100K = 140K) chỉ là chi phí \"đầu tư\" để lừa số tiền gấp nhiều lần.",
        wrongHint: "Nếu công việc thật sự dễ dàng và lãi cao như vậy, tại sao không phải ai cũng giàu? Hãy nghĩ: kẻ lừa đảo chi ra 140K lãi suất – chúng kỳ vọng thu lại bao nhiêu từ Hà?",
        clue: {
          title: "Manh mối #2: Kỹ thuật thả mồi (Advance Fee Fraud)",
          content: "\"Thả con tép bắt con tôm\": Kẻ lừa đảo đầu tư nhỏ (trả lãi đơn đầu tiên) để thu lợi lớn (chiếm đoạt ở đơn sau). Quy luật: Đơn càng sau → số tiền yêu cầu ứng càng lớn → đến khi nạn nhân không thể rút tiền.",
        },
        evidence: [
          {
            type: 'transaction',
            title: 'Lịch sử giao dịch của Hà',
            content: '💳 Đơn 1: Ứng 200K → Nhận 240K (+40K lãi) ✅\n💳 Đơn 2: Ứng 500K → Nhận 600K (+100K lãi) ✅\n📊 Tổng đã ứng: 700K\n📊 Tổng đã nhận: 840K\n📊 Lãi thực: +140K\n⚠️ Kẻ lừa đảo đã "đầu tư" 140K để xây lòng tin',
          },
        ],
      },
      {
        id: 3,
        title: "Cái bẫy sập xuống",
        points: 20,
        scenario: "Sau 2 đơn thành công, \"Quản lý Tuyết\" giao đơn \"VIP\" giá 5 triệu đồng với hoa hồng 1 triệu. Hà ứng 5 triệu. Tuy nhiên, hệ thống báo \"lỗi đơn hàng\" – cần ứng thêm 3 triệu \"phí xử lý\" để mở khóa tiền. Hà chuyển thêm 3 triệu. Hệ thống lại báo \"thuế doanh nghiệp\" – cần thêm 2 triệu. Khi Hà nói hết tiền, Tuyết giới thiệu Hà vay nóng qua app để \"ứng nốt, về sẽ nhận cả gốc lẫn lãi\".",
        sceneDescription: "Giao diện app giả hiển thị lỗi đỏ: 'ĐƠN HÀNG BỊ KHÓA – NẠP THÊM ĐỂ MỞ'. Hà ngồi lo lắng, ví tiền mở ra trống rỗng. Tin nhắn Tuyết: 'Cứ nạp thêm, chị bảo đảm em sẽ nhận lại hết 😊'. Mũi tên chỉ vào vòng xoáy: nạp thêm → lỗi mới → nạp thêm.",
        question: "Khi hệ thống liên tục yêu cầu nạp thêm tiền để \"mở khóa\" tiền cũ, đây là dấu hiệu của chiêu trò gì?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Lỗi kỹ thuật thông thường của hệ thống", isCorrect: false },
          { id: "B", text: "Chiêu trò \"vòng xoáy nạp tiền\" – luôn tạo lý do mới để nạn nhân tiếp tục chuyển tiền, mỗi lần nhiều hơn", isCorrect: true },
          { id: "C", text: "Quy trình thuế doanh nghiệp hợp pháp", isCorrect: false },
          { id: "D", text: "Quản lý Tuyết đang cố giúp Hà giải quyết", isCorrect: false },
        ],
        correctExplanation: "Đây là \"vòng xoáy nạp tiền\" (Payment Loop Scam): Mỗi khi nạn nhân chuyển tiền, hệ thống tạo \"lỗi\" hoặc \"phí\" mới yêu cầu nạp thêm. Mục đích: vắt kiệt tiền nạn nhân. KHÔNG BAO GIỜ có chuyện cần nạp thêm tiền để nhận lại tiền của mình.",
        wrongHint: "Hãy nghĩ đơn giản: Nếu hệ thống nợ bạn 5 triệu, tại sao bạn phải nạp thêm 3 triệu để nhận? Lỗi kỹ thuật thật sự thì ai phải trả chi phí sửa lỗi – khách hàng hay công ty?",
        clue: {
          title: "Manh mối #3: Vòng xoáy nạp tiền",
          content: "Quy tắc vàng: KHÔNG BAO GIỜ cần nạp thêm tiền để nhận lại tiền của mình. Nếu hệ thống yêu cầu liên tục nạp thêm với các lý do khác nhau (lỗi đơn, thuế, phí xử lý), đó là lừa đảo. DỪNG NGAY và không chuyển thêm bất kỳ đồng nào.",
        },
        evidence: [
          {
            type: 'transaction',
            title: 'Vòng xoáy nạp tiền',
            content: '💳 Đơn VIP: Ứng 5,000,000đ\n❌ "Lỗi đơn hàng" → Ứng thêm 3,000,000đ\n❌ "Thuế doanh nghiệp" → Ứng thêm 2,000,000đ\n📊 Tổng đã mất: 10,000,000đ\n🔴 Tiền có thể rút: 0đ\n⚠️ Tiếp theo: Gợi ý vay nóng qua app',
          },
        ],
      },
      {
        id: 4,
        title: "Truy vết giao dịch",
        points: 20,
        scenario: "Hà nhận ra bị lừa và trình báo công an. Điều tra viên phân tích giao dịch ngân hàng: (1) 5 triệu chuyển vào tài khoản Nguyễn Văn A – Vietcombank. (2) 3 triệu chuyển vào tài khoản Trần Thị B – Techcombank. (3) 2 triệu chuyển vào tài khoản Lê Văn C – MBBank. Ba tài khoản đều mở tại 3 ngân hàng khác nhau, 3 tỉnh khác nhau, có dấu hiệu là tài khoản mua lại. Tiền được rút ATM ngay sau khi nhận.",
        sceneDescription: "Bảng phân tích điều tra: 3 tài khoản ngân hàng khác nhau được kết nối bằng mũi tên. Mỗi tài khoản có nhãn: tên, ngân hàng, tỉnh. Dấu tích đỏ: 'Tài khoản mua lại'. Đồng hồ bên cạnh mỗi giao dịch cho thấy tiền bị rút ngay sau khi nhận.",
        question: "Tại sao kẻ lừa đảo sử dụng NHIỀU tài khoản ngân hàng ở các tỉnh khác nhau?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Vì chúng có nhiều nhân viên ở các tỉnh khác nhau", isCorrect: false },
          { id: "B", text: "Vì giới hạn chuyển tiền mỗi tài khoản", isCorrect: false },
          { id: "C", text: "Để phân tán dòng tiền, gây khó khăn cho việc truy vết và phong tỏa tài khoản kịp thời", isCorrect: true },
          { id: "D", text: "Vì mỗi ngân hàng có ưu đãi khác nhau", isCorrect: false },
        ],
        correctExplanation: "Kẻ lừa đảo sử dụng nhiều tài khoản ở các ngân hàng/tỉnh khác nhau (thường là tài khoản mua lại) để PHÂN TÁN DÒNG TIỀN. Điều này khiến: (1) Khó phong tỏa kịp (phải liên hệ nhiều ngân hàng), (2) Khó truy vết chủ thật (tài khoản đứng tên người khác), (3) Tiền bị rút ATM ngay – mất khả năng thu hồi.",
        wrongHint: "Nếu chỉ dùng 1 tài khoản, khi bị phong tỏa thì toàn bộ tiền sẽ bị giữ lại. Nhưng nếu chia ra 3 tài khoản ở 3 nơi khác nhau thì sao? Hãy nghĩ về tốc độ phản ứng của cơ quan điều tra.",
        clue: {
          title: "Manh mối #4: Kỹ thuật phân tán dòng tiền",
          content: "Kẻ lừa đảo chuyên nghiệp luôn phân tán dòng tiền qua nhiều tài khoản mua lại ở các ngân hàng/tỉnh thành khác nhau. Tiền được rút ATM ngay sau khi nhận. Bài học: Khi phát hiện bị lừa, BÁO NGAY cho ngân hàng và công an trong vòng 1 giờ đầu tiên – đây là \"giờ vàng\" để phong tỏa tài khoản.",
        },
        evidence: [
          {
            type: 'transaction',
            title: 'Bản đồ dòng tiền',
            content: '💰 5,000,000đ → TK Nguyễn Văn A (VCB – Hà Nội) → Rút ATM sau 8 phút\n💰 3,000,000đ → TK Trần Thị B (TCB – Đà Nẵng) → Rút ATM sau 12 phút\n💰 2,000,000đ → TK Lê Văn C (MBB – TP.HCM) → Rút ATM sau 5 phút\n⚠️ Cả 3 TK đều có dấu hiệu mua lại: mở tài khoản < 1 tháng, không có lịch sử giao dịch trước đó',
          },
        ],
      },
      {
        id: 5,
        title: "Kết luận và phòng tránh",
        points: 30,
        scenario: "Qua vụ án của Hà, cơ quan điều tra phát hiện đường dây lừa đảo đã lừa hơn 200 nạn nhân với tổng số tiền chiếm đoạt trên 3 tỷ đồng. Câu hỏi cuối cùng: Là điều tra viên an ninh mạng, hãy xác định TẤT CẢ các dấu hiệu mà người dân cần cảnh giác để không trở thành nạn nhân của các bẫy \"cộng tác viên chốt đơn\".",
        sceneDescription: "Bảng cảnh báo lớn với biểu tượng tam giác cảnh báo. Xung quanh là các thẻ dấu hiệu lừa đảo. Hà đứng bên cạnh đã thoát nạn, mỉm cười cầm lá chắn bảo vệ. Phía dưới: con số 200 nạn nhân, 3 tỷ VNĐ.",
        question: "Dấu hiệu nào cho thấy đó là bẫy lừa đảo \"cộng tác viên chốt đơn\"?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Yêu cầu ứng tiền trước để \"chốt đơn\" – công việc thật không bao giờ yêu cầu nhân viên bỏ tiền túi", isCorrect: true },
          { id: "B", text: "Thu nhập cam kết quá cao so với công việc đơn giản, sử dụng website giả mạo sàn thương mại điện tử", isCorrect: true },
          { id: "C", text: "Cho lãi nhỏ ban đầu rồi yêu cầu ứng số tiền ngày càng lớn", isCorrect: true },
          { id: "D", text: "Công việc được đăng tuyển trên mạng xã hội – đây luôn là lừa đảo", isCorrect: false },
        ],
        correctExplanation: "3 dấu hiệu vàng của bẫy CTV chốt đơn: (1) Yêu cầu ứng tiền trước – công việc chân chính trả lương cho bạn, không thu tiền từ bạn; (2) Thu nhập phi thực tế + website giả mạo; (3) Cho lãi nhỏ ban đầu rồi tăng dần (thả mồi). Lưu ý: Không phải TẤT CẢ việc làm trên mạng xã hội đều là lừa đảo – cần phân biệt dựa trên các dấu hiệu cụ thể.",
        wrongHint: "Có nhiều công việc online hợp pháp được đăng trên mạng xã hội. Vấn đề không phải ở kênh đăng tuyển mà ở YÊU CẦU ỨNG TIỀN và MỨC THU NHẬP PHI THỰC TẾ. Hãy chọn đúng các dấu hiệu đặc trưng của lừa đảo.",
        clue: {
          title: "Manh mối #5: Bộ quy tắc nhận diện bẫy CTV",
          content: "QUY TẮC VÀNG: (1) KHÔNG BAO GIỜ ứng tiền trước để nhận việc, (2) Thu nhập 200-500K/ngày cho việc bấm điện thoại = PHI THỰC TẾ, (3) Website yêu cầu nạp tiền ≠ sàn TMĐT thật, (4) Cho lãi nhỏ trước = kỹ thuật thả mồi, (5) Liên tục yêu cầu nạp thêm = vòng xoáy chiếm đoạt.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Thống kê vụ án',
            content: '📊 Tổng nạn nhân: 200+ người\n💰 Tổng thiệt hại: >3 tỷ VNĐ\n👤 Nạn nhân chủ yếu: Sinh viên, người lao động tìm việc\n🔗 Đường dây hoạt động: 6 tháng\n🏦 Số tài khoản ngân hàng mua lại: 47 tài khoản\n📱 Số trang web giả mạo: 12 domain',
          },
        ],
      },
    ],
    caseSummary: {
      conclusion: "Đường dây lừa đảo \"cộng tác viên chốt đơn\" sử dụng kỹ thuật thả mồi (cho lãi nhỏ), website giả mạo sàn TMĐT và vòng xoáy nạp tiền để chiếm đoạt. Tiền bị phân tán qua nhiều tài khoản mua lại ở các tỉnh thành khác nhau và rút ATM ngay.",
      safetyLesson: "VIỆC LÀM THẬT KHÔNG BAO GIỜ YÊU CẦU BẠN BỎ TIỀN TÚI: (1) Không ứng tiền trước cho bất kỳ công việc nào, (2) Thu nhập phi thực tế = lừa đảo, (3) Cho lãi ban đầu = thả mồi, (4) Kiểm tra URL website chính xác, (5) Trình báo ngay khi phát hiện – \"giờ vàng\" đầu tiên rất quan trọng.",
    },
  },

  // ========================================================================
  // VỤ ÁN 05: ỨNG DỤNG ĐẦU TƯ SINH LỜI MỖI NGÀY
  // ========================================================================
  {
    id: 5,
    caseNumber: "05",
    title: "Ứng dụng đầu tư sinh lời mỗi ngày",
    subtitle: "Phân biệt số dư ảo và tiền thật",
    description: "Phân biệt số dư hiển thị trên ứng dụng lừa đảo với tiền thật có thể rút.",
    icon: "📈",
    color: "#27AE60",
    stations: [
      {
        id: 1,
        title: "Lời mời đầu tư hấp dẫn",
        points: 15,
        scenario: "Đức, nhân viên văn phòng 28 tuổi, được bạn thân giới thiệu ứng dụng đầu tư \"GoldTrade Pro\" – quảng cáo lãi suất 2-5% MỖI NGÀY (tương đương 60-150%/tháng). App có giao diện chuyên nghiệp với biểu đồ tăng trưởng liên tục đi lên, hiển thị hàng nghìn người dùng đang \"kiếm tiền mỗi ngày\". Bạn thân của Đức đã đầu tư 10 triệu và \"rút thành công\" 12 triệu sau 1 tuần. Đức được mời tham gia với khoản đầu tư tối thiểu 5 triệu đồng.",
        sceneDescription: "Giao diện app GoldTrade Pro sang trọng: nền đen-vàng gold, biểu đồ tăng trưởng xanh đi lên liên tục, con số '2-5% lãi/ngày' nhấp nháy. Đức và bạn thân đang ngồi cafe, bạn khoe màn hình hiển thị số dư tăng. Xung quanh có biểu tượng vàng, kim cương.",
        question: "Lãi suất 2-5%/ngày (60-150%/tháng) của GoldTrade Pro cho thấy điều gì?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Đây là cơ hội đầu tư tốt vì bạn thân đã rút tiền thành công", isCorrect: false },
          { id: "B", text: "Lãi suất phi thực tế, vượt xa mọi hình thức đầu tư hợp pháp – dấu hiệu đặc trưng của mô hình Ponzi/lừa đảo", isCorrect: true },
          { id: "C", text: "App có giao diện chuyên nghiệp nên đáng tin cậy", isCorrect: false },
          { id: "D", text: "Nên đầu tư ít trước để thử", isCorrect: false },
        ],
        correctExplanation: "Lãi suất 2-5%/ngày = 730-1825%/năm. So sánh: lãi suất ngân hàng ~5-8%/NĂM, quỹ đầu tư tốt nhất ~15-20%/NĂM. Lãi suất phi thực tế là dấu hiệu #1 của mô hình Ponzi – dùng tiền người sau trả lãi người trước. Bạn thân rút được tiền = đang ở giai đoạn \"thả mồi\", chưa phải lúc sập.",
        wrongHint: "So sánh: Ngân hàng trả 5-8%/NĂM. Warren Buffett (nhà đầu tư giỏi nhất thế giới) đạt ~20%/NĂM. App này hứa 60-150%/THÁNG. Có thực sự hợp lý không? Việc bạn thân rút được tiền có chứng minh app an toàn không?",
        clue: {
          title: "Manh mối #1: Nhận diện lãi suất phi thực tế",
          content: "Bảng so sánh lãi suất: Ngân hàng: 5-8%/năm. Quỹ đầu tư uy tín: 10-20%/năm. GoldTrade Pro: 730-1825%/năm = PHI THỰC TẾ. Quy tắc: Lãi suất càng cao → rủi ro càng lớn → khả năng lừa đảo càng cao. Mô hình Ponzi: dùng tiền người mới trả lãi người cũ.",
        },
        evidence: [
          {
            type: 'document',
            title: 'So sánh lãi suất',
            content: '📊 BẢNG SO SÁNH LÃI SUẤT/NĂM:\n🏦 Ngân hàng gửi tiết kiệm: 5-8%\n📈 Quỹ đầu tư uy tín: 10-20%\n📉 Chứng khoán trung bình: 8-12%\n⚠️ GoldTrade Pro: 730-1,825%\n🚨 → Phi thực tế, dấu hiệu Ponzi',
          },
        ],
      },
      {
        id: 2,
        title: "Số dư ảo trên ứng dụng",
        points: 15,
        scenario: "Đức đầu tư 10 triệu đồng. Sau 5 ngày, app hiển thị số dư đã tăng lên 12.5 triệu (lãi 2.5 triệu = 25%). Đức thử rút 2 triệu – rút thành công! Phấn khởi, Đức nạp thêm 30 triệu. Sau 10 ngày, app hiển thị số dư 48 triệu. Nhưng khi Đức thử rút 20 triệu, hệ thống báo: \"Cần nâng cấp lên gói VIP (nạp thêm 20 triệu) để mở khóa rút tiền số lượng lớn.\" Đức cũng nhận thấy nút \"Rút tiền\" thường bị lỗi vào ban đêm.",
        sceneDescription: "Giao diện app GoldTrade Pro: số dư hiện 48,000,000đ bằng chữ vàng to. Nhưng khi nhấn 'Rút tiền', hiện popup: 'Nâng cấp VIP – Nạp 20tr để mở khóa'. So sánh hai bên: BÊN TRÁI - số dư app (48tr, chữ vàng), BÊN PHẢI - tiền thật trong tài khoản ngân hàng (8tr, chữ đỏ nhỏ).",
        question: "Số dư 48 triệu hiển thị trên app GoldTrade Pro thực chất là gì?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Tiền thật của Đức đang sinh lời trong app", isCorrect: false },
          { id: "B", text: "Con số ảo do hệ thống hiển thị – Đức không thể rút số tiền này, chỉ là dữ liệu giả trên giao diện", isCorrect: true },
          { id: "C", text: "Tiền đang bị tạm giữ và sẽ được giải phóng khi nâng cấp VIP", isCorrect: false },
          { id: "D", text: "Tiền thật nhưng cần đợi kỳ hạn", isCorrect: false },
        ],
        correctExplanation: "Số dư 48 triệu trên app là CON SỐ ẢO – chỉ là dữ liệu hiển thị trên giao diện, không liên quan đến tiền thật. App cho rút số nhỏ (2 triệu) ban đầu để tạo lòng tin, nhưng khi rút số lớn sẽ đặt ra điều kiện mới (nâng cấp VIP = nạp thêm tiền). Phân biệt: SỐ DƯ APP ≠ TIỀN THẬT CÓ THỂ RÚT.",
        wrongHint: "Hãy tự hỏi: Nếu 48 triệu là tiền thật, tại sao Đức không thể rút? \"Nâng cấp VIP\" bằng cách nạp thêm tiền – nghe có giống \"vòng xoáy nạp tiền\" không? Sự khác biệt giữa \"số trên màn hình\" và \"tiền trong tài khoản ngân hàng\" là gì?",
        clue: {
          title: "Manh mối #2: Phân biệt số dư ảo và tiền thật",
          content: "SỐ DƯ TRÊN APP ≠ TIỀN THẬT. App lừa đảo hiển thị con số ảo tăng liên tục để nạn nhân tưởng đang lãi. Nhưng khi rút: (1) Cho rút nhỏ ban đầu (thả mồi), (2) Chặn rút lớn bằng điều kiện mới, (3) Nút rút tiền \"lỗi\" thường xuyên. Tiền thật duy nhất = số tiền bạn đã nạp vào.",
        },
        evidence: [
          {
            type: 'screenshot',
            title: 'So sánh số dư',
            content: '📱 Số dư GoldTrade Pro: 48,000,000đ (CHỮ VÀNG TO)\n🏦 Số dư ngân hàng thật: -40,000,000đ (ĐÃ CHUYỂN VÀO APP)\n✅ Đã rút thành công: 2,000,000đ (thả mồi)\n❌ Yêu cầu rút 20,000,000đ: BỊ CHẶN\n⚠️ Điều kiện mới: Nạp thêm 20tr "nâng cấp VIP"',
          },
        ],
      },
      {
        id: 3,
        title: "Khi app biến mất",
        points: 20,
        scenario: "Sau 1 tháng, Đức đã nạp tổng cộng 80 triệu đồng vào GoldTrade Pro. App hiển thị số dư \"128 triệu\". Một sáng thức dậy, Đức phát hiện: (1) App GoldTrade Pro không mở được, hiển thị lỗi \"server maintenance\". (2) Website goldtradepro.com hiện trang trắng. (3) Tài khoản Telegram \"Tư vấn viên\" đã xóa tất cả tin nhắn và biến mất. (4) Bạn thân cũng mất liên lạc với \"cộng đồng đầu tư\". (5) Kiểm tra App Store/Google Play: app đã bị gỡ.",
        sceneDescription: "Đức hoảng hốt nhìn điện thoại: app hiện lỗi 'Server Maintenance', website trang trắng, tin nhắn Telegram 'Tài khoản đã bị xóa'. Xung quanh là các biểu tượng vỡ: biểu đồ gãy, tiền bay đi, dấu X đỏ. Đức ôm đầu tuyệt vọng.",
        question: "Khi app đầu tư đột ngột biến mất, Đức nên làm gì ĐẦU TIÊN?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Chờ app hoạt động trở lại vì có thể chỉ là bảo trì hệ thống", isCorrect: false },
          { id: "B", text: "Bảo toàn mọi bằng chứng (screenshot, biên lai chuyển tiền, tin nhắn) và trình báo công an + ngân hàng ngay lập tức", isCorrect: true },
          { id: "C", text: "Tìm kiếm app tương tự để đầu tư gỡ vốn", isCorrect: false },
          { id: "D", text: "Đăng lên mạng xã hội tố cáo", isCorrect: false },
        ],
        correctExplanation: "Khi app biến mất, đây là giai đoạn \"exit scam\" – kẻ lừa đảo đã thu đủ tiền và biến mất. Hành động đầu tiên: (1) BẢO TOÀN BẰNG CHỨNG (screenshot giao diện, biên lai chuyển tiền, tin nhắn, thông tin tài khoản), (2) Trình báo công an, (3) Báo ngân hàng phong tỏa giao dịch. KHÔNG chờ đợi và KHÔNG tìm app khác.",
        wrongHint: "App đầu tư hợp pháp có bao giờ biến mất qua đêm kèm toàn bộ kênh liên lạc bị xóa không? Đây không phải 'bảo trì' – đây là dấu hiệu kẻ lừa đảo đã chạy trốn. Hành động nhanh nhất để bảo vệ quyền lợi là gì?",
        clue: {
          title: "Manh mối #3: Dấu hiệu Exit Scam",
          content: "Exit Scam = kẻ lừa đảo thu đủ tiền rồi biến mất. Dấu hiệu: (1) App đột ngột không truy cập được, (2) Website sập, (3) Kênh liên lạc bị xóa, (4) App bị gỡ khỏi Store. Khi phát hiện: BẢO TOÀN BẰNG CHỨNG → BÁO CÔNG AN → BÁO NGÂN HÀNG. Thời gian là yếu tố quyết định.",
        },
        evidence: [
          {
            type: 'timeline',
            title: 'Dòng thời gian sự kiện',
            content: '📅 Tháng 1: App ra mắt, hoạt động bình thường\n📅 Tháng 1-3: Thu hút hàng nghìn người dùng, cho rút tiền nhỏ\n📅 Tháng 3: Bắt đầu hạn chế rút tiền (yêu cầu VIP)\n📅 Ngày X: App sập hoàn toàn - Exit Scam\n💰 Ước tính thiệt hại: Hàng chục tỷ đồng',
          },
        ],
      },
      {
        id: 4,
        title: "Phân tích mô hình lừa đảo",
        points: 20,
        scenario: "Cơ quan điều tra phân tích mô hình hoạt động của GoldTrade Pro: (1) Tiền nạp từ nhà đầu tư mới được dùng để trả lãi cho nhà đầu tư cũ (mô hình Ponzi). (2) App không có hoạt động đầu tư thực tế nào – không giao dịch vàng, chứng khoán hay bất kỳ tài sản nào. (3) \"Lãi suất\" hiển thị trên app chỉ là con số được lập trình sẵn, tăng tự động mỗi ngày. (4) Khi số người nạp mới giảm, hệ thống không đủ tiền trả lãi → exit scam.",
        sceneDescription: "Sơ đồ Ponzi lớn: Mũi tên vòng tròn - tiền người mới → trả lãi người cũ → thu hút thêm người mới. Bên cạnh: code nguồn app với dòng 'balance = balance * 1.03' (tăng 3% tự động). Phía dưới: biểu đồ dòng tiền vào-ra, đến điểm 'sập'.",
        question: "Đặc điểm cốt lõi nào phân biệt mô hình Ponzi với đầu tư hợp pháp?",
        isMultipleChoice: false,
        answers: [
          { id: "A", text: "Mô hình Ponzi có giao diện app đẹp hơn", isCorrect: false },
          { id: "B", text: "Mô hình Ponzi không có hoạt động kinh doanh/đầu tư thực tế – lợi nhuận đến từ tiền của người tham gia sau, không từ giá trị tạo ra", isCorrect: true },
          { id: "C", text: "Mô hình Ponzi có lãi suất thấp hơn ngân hàng", isCorrect: false },
          { id: "D", text: "Mô hình Ponzi luôn bị phát hiện ngay", isCorrect: false },
        ],
        correctExplanation: "Đặc điểm cốt lõi của Ponzi: KHÔNG CÓ HOẠT ĐỘNG KINH DOANH THỰC TẾ. Tiền \"lãi\" trả cho người cũ = tiền nạp vào từ người mới. Khi không đủ người mới → sập. Đầu tư hợp pháp tạo lợi nhuận từ hoạt động kinh doanh thực (sản xuất, giao dịch tài sản, cung cấp dịch vụ).",
        wrongHint: "Hãy nghĩ: Tiền lãi từ đâu ra? Trong đầu tư thật, lợi nhuận đến từ hoạt động kinh doanh (bán hàng, cho vay, tăng giá tài sản). Trong GoldTrade Pro, app KHÔNG giao dịch gì cả – vậy tiền lãi đến từ đâu?",
        clue: {
          title: "Manh mối #4: Cấu trúc mô hình Ponzi",
          content: "Mô hình Ponzi: (1) Hứa lãi suất cao phi thực tế, (2) KHÔNG có hoạt động kinh doanh/đầu tư thực, (3) Tiền người mới = lãi người cũ, (4) Tất yếu sụp đổ khi hết người mới. Cách nhận diện: Hỏi 'Tiền lãi đến từ hoạt động gì cụ thể?' – nếu không trả lời được = cảnh báo đỏ.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Phân tích kỹ thuật app',
            content: '🔍 Code app GoldTrade Pro:\n- Số dư = số tiền nạp × hệ số tăng tự động\n- Không có API kết nối sàn giao dịch nào\n- Không có hoạt động mua/bán vàng, chứng khoán\n- "Biểu đồ tăng trưởng" = animation CSS, không phải dữ liệu thật\n- Nút "Rút tiền" bị disable khi số dư > ngưỡng nhất định',
          },
        ],
      },
      {
        id: 5,
        title: "Bài học đầu tư an toàn",
        points: 30,
        scenario: "Tổng kết vụ án: GoldTrade Pro là ứng dụng đầu tư lừa đảo hoạt động theo mô hình Ponzi, đã chiếm đoạt hơn 50 tỷ đồng từ 3,000+ nạn nhân trước khi exit scam. Câu hỏi cuối: Là điều tra viên an ninh mạng, hãy xác định TẤT CẢ các nguyên tắc mà người dân cần tuân thủ để tự bảo vệ trước các ứng dụng đầu tư lừa đảo.",
        sceneDescription: "Bảng quy tắc vàng đầu tư an toàn. Đức đứng bên cạnh cầm cuốn sách 'Đầu tư thông minh'. Xung quanh là biểu tượng lá chắn, ổ khóa bảo mật, dấu tích xanh. Phía dưới: \"50 tỷ VNĐ – 3000+ nạn nhân – Đừng để mình là người tiếp theo\".",
        question: "Nguyên tắc nào giúp nhận diện và phòng tránh ứng dụng đầu tư lừa đảo?",
        isMultipleChoice: true,
        answers: [
          { id: "A", text: "Kiểm tra giấy phép hoạt động: app đầu tư hợp pháp phải có giấy phép từ Ủy ban Chứng khoán/Ngân hàng Nhà nước", isCorrect: true },
          { id: "B", text: "Lãi suất cam kết cố định >20%/năm mà không có rủi ro = cảnh báo đỏ, vì mọi đầu tư đều có rủi ro", isCorrect: true },
          { id: "C", text: "Nên tin tưởng khi bạn bè/người thân giới thiệu vì họ đã kiểm chứng", isCorrect: false },
          { id: "D", text: "Phân biệt \"số dư trên app\" với \"tiền thật rút được\" – thử rút toàn bộ trước khi nạp thêm", isCorrect: true },
        ],
        correctExplanation: "3 nguyên tắc vàng: (1) Kiểm tra giấy phép – app đầu tư hợp pháp PHẢI có giấy phép từ cơ quan quản lý (UBCK, NHNN); (2) Lãi suất phi thực tế = cảnh báo đỏ – mọi đầu tư đều có rủi ro; (3) Phân biệt số dư ảo và tiền thật. Lưu ý: Bạn bè/người thân cũng có thể là nạn nhân đang ở giai đoạn \"thả mồi\" – họ tin thật nhưng chưa biết mình bị lừa.",
        wrongHint: "Bạn bè giới thiệu không đảm bảo an toàn – họ cũng có thể là nạn nhân đang ở giai đoạn được \"thả mồi\". Mô hình Ponzi lan truyền chủ yếu qua giới thiệu người thân, bạn bè. Hãy dựa vào bằng chứng khách quan (giấy phép, mô hình kinh doanh) chứ không dựa vào lòng tin.",
        clue: {
          title: "Manh mối #5: Bộ quy tắc đầu tư an toàn",
          content: "QUY TẮC ĐẦU TƯ AN TOÀN: (1) Kiểm tra giấy phép tại sse.com.vn hoặc sbv.gov.vn, (2) Lãi suất >20%/năm cam kết không rủi ro = CẢNH BÁO ĐỎ, (3) Số dư trên app ≠ tiền thật, (4) Rút thử TOÀN BỘ trước khi nạp thêm, (5) Không tin chỉ vì người thân giới thiệu – họ cũng có thể bị lừa, (6) Mọi đầu tư đều có rủi ro – ai hứa không rủi ro = lừa đảo.",
        },
        evidence: [
          {
            type: 'document',
            title: 'Thống kê vụ án GoldTrade Pro',
            content: '📊 Tổng nạn nhân: 3,000+ người\n💰 Tổng thiệt hại: >50 tỷ VNĐ\n👤 Nạn nhân: Nhân viên VP, sinh viên, người nghỉ hưu\n🔗 Thời gian hoạt động: 4 tháng trước khi exit scam\n📱 App không có giấy phép từ bất kỳ cơ quan quản lý nào\n🌐 Server đặt tại nước ngoài',
          },
        ],
      },
    ],
    caseSummary: {
      conclusion: "GoldTrade Pro là ứng dụng đầu tư lừa đảo theo mô hình Ponzi. App không có hoạt động đầu tư thực tế, số dư hiển thị là con số ảo, lãi trả cho người cũ lấy từ tiền người mới nạp vào. Khi không đủ người mới, kẻ lừa đảo thực hiện exit scam – xóa app, xóa kênh liên lạc, biến mất cùng 50 tỷ đồng.",
      safetyLesson: "ĐẦU TƯ AN TOÀN = ĐẦU TƯ CÓ HIỂU BIẾT: (1) Kiểm tra giấy phép hoạt động hợp pháp, (2) Lãi suất phi thực tế = lừa đảo, (3) Số dư trên app ≠ tiền thật có thể rút, (4) Không tin chỉ vì người quen giới thiệu, (5) Mọi đầu tư đều có rủi ro – cam kết không rủi ro = dấu hiệu lừa đảo, (6) Khi phát hiện: bảo toàn chứng cứ và trình báo ngay.",
    },
  },
];
