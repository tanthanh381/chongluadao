export type Difficulty = "Dễ" | "Trung bình" | "Khó" | "Rất khó";

export type Choice = {
  text: string;
  correct: boolean;
  moneyDelta: number;
  awarenessDelta: number;
  feedback: string;
};

export type Scenario = {
  id: number;
  title: string;
  category: string;
  difficulty: Difficulty;
  channel: string;
  icon: string;
  story: string;
  redFlags: string[];
  tip: string;
  evidence: string;
  choices: Choice[];
};

export const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Cuộc gọi ‘điều tra khẩn cấp’",
    category: "Mạo danh",
    difficulty: "Dễ",
    channel: "Điện thoại",
    icon: "☎",
    story: "Một người tự xưng là cán bộ điều tra đọc đúng tên và số CCCD của bạn. Họ nói tài khoản của bạn liên quan đường dây rửa tiền, yêu cầu chuyển toàn bộ tiền vào ‘tài khoản giám sát’ trong 30 phút.",
    redFlags: ["Hối thúc và đe doạ", "Yêu cầu chuyển tiền để xác minh", "Cấm kể cho người thân"],
    tip: "Cơ quan công an không điều tra qua điện thoại và không yêu cầu chuyển tiền vào tài khoản cá nhân.",
    evidence: "Ghi chú số điện thoại mạo danh",
    choices: [
      { text: "Tắt máy, gọi 113 hoặc công an địa phương qua số chính thức", correct: true, moneyDelta: 0, awarenessDelta: 4, feedback: "Chính xác. Bạn đã chủ động xác minh bằng một kênh độc lập." },
      { text: "Chuyển thử 5 triệu để chứng minh mình hợp tác", correct: false, moneyDelta: -5000000, awarenessDelta: -18, feedback: "Kẻ gian sẽ tiếp tục ép chuyển thêm. Không có ‘tài khoản giám sát’ cho người dân chuyển tiền." },
      { text: "Gửi ảnh CCCD và ảnh số dư để họ kiểm tra", correct: false, moneyDelta: 0, awarenessDelta: -12, feedback: "Thông tin này có thể bị dùng để mở tài khoản, vay tiền hoặc tạo kịch bản lừa đảo sâu hơn." },
    ],
  },
  {
    id: 2,
    title: "Đơn hàng hoàn tiền bất thường",
    category: "Mua sắm",
    difficulty: "Trung bình",
    channel: "Tin nhắn",
    icon: "▦",
    story: "Bạn nhận SMS có tên thương hiệu sàn thương mại điện tử, báo đơn hàng bị lỗi và gửi đường link nhận hoàn 1.850.000đ. Trang web giống ứng dụng thật và yêu cầu đăng nhập ngân hàng.",
    redFlags: ["Tên miền lạ", "Yêu cầu đăng nhập ngân hàng từ liên kết", "Khoản hoàn tiền không rõ nguồn"],
    tip: "Không mở link trong SMS. Hãy tự mở ứng dụng chính thức và kiểm tra trung tâm hỗ trợ.",
    evidence: "Ảnh chụp tên miền giả mạo",
    choices: [
      { text: "Mở ứng dụng chính thức và kiểm tra đơn hàng trong đó", correct: true, moneyDelta: 0, awarenessDelta: 5, feedback: "Đúng. Đi vào dịch vụ bằng ứng dụng hoặc địa chỉ bạn tự nhập giúp tránh trang giả." },
      { text: "Nhấn link nhưng chỉ xem, không nhập gì", correct: false, moneyDelta: 0, awarenessDelta: -8, feedback: "Trang độc hại vẫn có thể dẫn dụ tải tệp hoặc xin quyền nguy hiểm. Không nên mở." },
      { text: "Đăng nhập để xem tiền hoàn rồi đổi mật khẩu sau", correct: false, moneyDelta: -12000000, awarenessDelta: -22, feedback: "Mã đăng nhập và OTP có thể bị chiếm ngay trước khi bạn kịp đổi mật khẩu." },
    ],
  },
  {
    id: 3,
    title: "Người thân gọi video vay tiền",
    category: "Deepfake",
    difficulty: "Khó",
    channel: "Video call",
    icon: "◉",
    story: "Tài khoản của em trai gọi video, hình và giọng khá giống thật nhưng liên tục bị giật. Người này nói đang cấp cứu ở xa và cần bạn chuyển 25 triệu ngay cho một tài khoản lạ.",
    redFlags: ["Video ngắn và nhiễu", "Tài khoản nhận tiền không chính chủ", "Tình huống khẩn cấp gây hoảng loạn"],
    tip: "Đặt câu hỏi bí mật chỉ người thân biết, rồi gọi lại số điện thoại quen thuộc hoặc một người đang ở gần họ.",
    evidence: "Mẫu câu hỏi xác minh deepfake",
    choices: [
      { text: "Ngắt cuộc gọi và xác minh qua số quen thuộc cùng câu hỏi riêng", correct: true, moneyDelta: 0, awarenessDelta: 7, feedback: "Tuyệt vời. Xác minh đa kênh là cách phá vỡ kịch bản deepfake." },
      { text: "Chuyển một nửa trước vì đã nhìn thấy khuôn mặt", correct: false, moneyDelta: -12500000, awarenessDelta: -20, feedback: "Hình ảnh và giọng nói hiện có thể bị giả. Cảm giác quen thuộc không còn là bằng chứng đủ mạnh." },
      { text: "Yêu cầu họ gửi ảnh CCCD trong cuộc chat", correct: false, moneyDelta: 0, awarenessDelta: -10, feedback: "CCCD có thể đã bị đánh cắp cùng tài khoản. Hãy xác minh bằng kênh và bí mật khác." },
    ],
  },
  {
    id: 4,
    title: "Việc nhẹ – hoa hồng tăng dần",
    category: "Việc làm",
    difficulty: "Trung bình",
    channel: "Mạng xã hội",
    icon: "↗",
    story: "Một nhóm tuyển cộng tác viên cho bạn nhận 120.000đ sau nhiệm vụ đầu. Nhiệm vụ tiếp theo yêu cầu nạp 3 triệu để ‘tối ưu đơn’, hứa hoàn lại 4,2 triệu trong 10 phút.",
    redFlags: ["Nạp tiền để được làm việc", "Mồi lợi nhuận nhỏ ban đầu", "Cam kết lợi nhuận nhanh"],
    tip: "Công việc hợp pháp trả lương cho bạn; không yêu cầu bạn chuyển tiền để mở khoá thu nhập.",
    evidence: "Biên nhận khoản mồi ban đầu",
    choices: [
      { text: "Dừng tham gia, lưu bằng chứng và báo cáo nhóm", correct: true, moneyDelta: 0, awarenessDelta: 5, feedback: "Đúng. Khoản trả nhỏ đầu tiên là mồi để tạo lòng tin cho lần nạp lớn." },
      { text: "Nạp 3 triệu rồi rút cả vốn lẫn lời", correct: false, moneyDelta: -3000000, awarenessDelta: -16, feedback: "Sau lần này hệ thống thường báo lỗi và yêu cầu nạp thêm để ‘giải phóng tiền’." },
      { text: "Rủ thêm bạn để chia rủi ro", correct: false, moneyDelta: 0, awarenessDelta: -14, feedback: "Bạn có thể khiến người khác trở thành nạn nhân và làm thiệt hại lan rộng." },
    ],
  },
  {
    id: 5,
    title: "Mã QR thanh toán bị dán đè",
    category: "Thanh toán",
    difficulty: "Khó",
    channel: "Ngoài đời",
    icon: "⌗",
    story: "Tại bãi xe, nhân viên chỉ vào mã QR dán trên bảng. Tên người nhận hiện ra là một cá nhân không liên quan, nhưng người phía sau đang giục bạn thanh toán nhanh.",
    redFlags: ["QR có dấu hiệu dán đè", "Tên người nhận không khớp", "Áp lực từ đám đông"],
    tip: "Luôn đọc lại tên người nhận và số tiền trên màn hình xác nhận trước khi bấm chuyển.",
    evidence: "Ảnh mã QR dán đè",
    choices: [
      { text: "Dừng lại, hỏi quầy chính thức và đối chiếu tên người nhận", correct: true, moneyDelta: 0, awarenessDelta: 6, feedback: "Đúng. Kiểm tra người nhận là bước chặn cuối cùng trước khi tiền rời tài khoản." },
      { text: "Chuyển vì số tiền gửi xe không đáng kể", correct: false, moneyDelta: -500000, awarenessDelta: -9, feedback: "Khoản nhỏ vẫn là thiệt hại và QR giả có thể tự điền số tiền lớn hơn dự kiến." },
      { text: "Quét bằng một ứng dụng QR khác cho chắc", correct: false, moneyDelta: 0, awarenessDelta: -6, feedback: "Ứng dụng khác vẫn đọc cùng dữ liệu giả. Cần xác minh người nhận với đơn vị thu tiền." },
    ],
  },
  {
    id: 6,
    title: "Ứng dụng dịch vụ công ‘bản mới’",
    category: "Ứng dụng độc hại",
    difficulty: "Rất khó",
    channel: "Zalo",
    icon: "⬡",
    story: "Một tài khoản có ảnh đại diện cơ quan nhà nước gửi file cài đặt, nói bạn phải cập nhật ứng dụng để đồng bộ giấy tờ. Khi mở, ứng dụng xin quyền Trợ năng và đọc SMS.",
    redFlags: ["Cài ứng dụng ngoài kho chính thức", "Xin quyền Trợ năng", "Xin đọc SMS và thông báo"],
    tip: "Không cài file APK từ tin nhắn. Quyền Trợ năng có thể cho phép kẻ gian điều khiển điện thoại và đọc OTP.",
    evidence: "Danh sách quyền nguy hiểm",
    choices: [
      { text: "Huỷ cài đặt và tìm ứng dụng trên kho chính thức", correct: true, moneyDelta: 0, awarenessDelta: 8, feedback: "Chính xác. Nguồn cài đặt và quyền truy cập là hai tín hiệu quan trọng nhất." },
      { text: "Cài xong rồi tắt quyền sau", correct: false, moneyDelta: -35000000, awarenessDelta: -30, feedback: "Chỉ vài giây có quyền Trợ năng cũng đủ để mã độc thao tác ngân hàng và che màn hình." },
      { text: "Cho phép Trợ năng nhưng từ chối vị trí", correct: false, moneyDelta: -22000000, awarenessDelta: -25, feedback: "Trợ năng nguy hiểm hơn vị trí trong kịch bản này vì cho phép đọc và điều khiển giao diện." },
    ],
  },
  {
    id: 7,
    title: "Chuyên gia đầu tư trong phòng kín",
    category: "Đầu tư",
    difficulty: "Rất khó",
    channel: "Nhóm chat",
    icon: "◒",
    story: "Một ‘chuyên gia’ thường xuyên khoe lệnh thắng và mời bạn vào sàn riêng. Những thành viên khác liên tục gửi ảnh rút tiền thành công. Nhân viên hỗ trợ đề nghị nạp USDT để nhận thưởng 20%.",
    redFlags: ["Lợi nhuận được dàn dựng", "Sàn không rõ pháp nhân", "Nạp tiền mã hoá khó truy vết"],
    tip: "Ảnh lãi và lời chứng thực trong nhóm có thể do cùng một đường dây tạo ra. Hãy kiểm tra giấy phép độc lập.",
    evidence: "Sơ đồ nhóm chat dàn dựng",
    choices: [
      { text: "Không nạp, kiểm tra pháp nhân và cảnh báo người quen", correct: true, moneyDelta: 0, awarenessDelta: 9, feedback: "Đúng. Bạn đã tách quyết định đầu tư khỏi áp lực và bằng chứng do chính nhóm cung cấp." },
      { text: "Nạp mức tối thiểu để thử rút", correct: false, moneyDelta: -10000000, awarenessDelta: -18, feedback: "Kẻ gian có thể cho rút nhỏ để dụ bạn nạp lớn hơn; lần thử đầu không chứng minh sàn an toàn." },
      { text: "Tin vì trong nhóm có nhiều người xác nhận", correct: false, moneyDelta: -45000000, awarenessDelta: -28, feedback: "Các tài khoản đó có thể là ‘chim mồi’ do cùng một nhóm kiểm soát." },
    ],
  },
  {
    id: 8,
    title: "Bình chọn nhận mã OTP",
    category: "Chiếm tài khoản",
    difficulty: "Dễ",
    channel: "Messenger",
    icon: "✦",
    story: "Một người bạn nhờ bạn bình chọn cuộc thi. Sau khi bấm link, trang yêu cầu số điện thoại và mã OTP vừa gửi tới để xác nhận mỗi người chỉ bình chọn một lần.",
    redFlags: ["Xin OTP ngoài dịch vụ chính thức", "Tài khoản bạn bè có thể bị chiếm", "Link bình chọn lạ"],
    tip: "OTP là chìa khoá đăng nhập hoặc xác nhận giao dịch. Không đọc cho bất kỳ ai và không nhập vào trang lạ.",
    evidence: "Tin nhắn xin OTP",
    choices: [
      { text: "Không nhập OTP, gọi người bạn qua số điện thoại để báo", correct: true, moneyDelta: 0, awarenessDelta: 5, feedback: "Đúng. Bạn vừa bảo vệ tài khoản mình và giúp người bạn biết tài khoản của họ có thể đã bị chiếm." },
      { text: "Nhập OTP vì chỉ là bình chọn", correct: false, moneyDelta: 0, awarenessDelta: -20, feedback: "OTP đó có thể dùng để đăng nhập tài khoản của chính bạn." },
      { text: "Chụp màn hình OTP gửi cho bạn mình", correct: false, moneyDelta: 0, awarenessDelta: -22, feedback: "Không bao giờ chia sẻ OTP, kể cả với tài khoản quen thuộc." },
    ],
  },
  {
    id: 9,
    title: "Chuyển nhầm tiền rồi ép hoàn",
    category: "Tài chính",
    difficulty: "Khó",
    channel: "Ngân hàng",
    icon: "⇄",
    story: "Tài khoản bạn bất ngờ nhận 8 triệu với nội dung ‘cho vay 7 ngày’. Một người gọi đến yêu cầu hoàn vào tài khoản khác, nếu không sẽ tính lãi theo ngày và đăng thông tin của bạn lên mạng.",
    redFlags: ["Tài khoản hoàn tiền khác tài khoản gửi", "Gắn nội dung khoản vay", "Đe doạ, ép thời hạn"],
    tip: "Không tự chuyển trả. Hãy báo ngân hàng để họ tra soát và hoàn tiền đúng quy trình.",
    evidence: "Mã tra soát giao dịch",
    choices: [
      { text: "Giữ nguyên tiền và liên hệ ngân hàng để tra soát", correct: true, moneyDelta: 0, awarenessDelta: 7, feedback: "Đúng. Ngân hàng sẽ xác minh nguồn tiền và xử lý mà không tạo thêm giao dịch rủi ro." },
      { text: "Hoàn ngay vào tài khoản người gọi cung cấp", correct: false, moneyDelta: -8000000, awarenessDelta: -18, feedback: "Bạn có thể vừa chuyển tiền của mình cho kẻ gian trong khi giao dịch gốc vẫn bị khiếu nại." },
      { text: "Rút tiền mặt và chặn số", correct: false, moneyDelta: 0, awarenessDelta: -15, feedback: "Sử dụng khoản tiền không rõ nguồn có thể tạo rắc rối pháp lý. Cần báo ngân hàng." },
    ],
  },
  {
    id: 10,
    title: "Quỹ từ thiện giả sau thiên tai",
    category: "Quyên góp",
    difficulty: "Trung bình",
    channel: "Mạng xã hội",
    icon: "♡",
    story: "Một bài đăng lan truyền ảnh trẻ em vùng lũ và số tài khoản cá nhân, kêu gọi chuyển gấp trước nửa đêm. Bài viết tắt bình luận và không nêu đơn vị tổ chức.",
    redFlags: ["Không có đơn vị xác minh", "Tắt bình luận", "Ảnh có thể lấy từ sự kiện cũ"],
    tip: "Ưu tiên quỹ và tổ chức minh bạch, có thông tin pháp lý và báo cáo sử dụng tiền.",
    evidence: "Checklist kiểm tra quỹ từ thiện",
    choices: [
      { text: "Tìm tổ chức uy tín và kiểm tra nguồn gốc hình ảnh", correct: true, moneyDelta: 0, awarenessDelta: 5, feedback: "Đúng. Lòng tốt hiệu quả nhất khi đi cùng xác minh và minh bạch." },
      { text: "Chuyển một khoản nhỏ vì mục đích có vẻ tốt", correct: false, moneyDelta: -1000000, awarenessDelta: -10, feedback: "Khoản nhỏ của nhiều người có thể tạo thiệt hại lớn. Cần xác minh trước khi chuyển." },
      { text: "Chia sẻ bài trước, kiểm tra sau", correct: false, moneyDelta: 0, awarenessDelta: -12, feedback: "Chia sẻ làm tăng độ tin cậy giả và khiến thêm người có thể trở thành nạn nhân." },
    ],
  },
];

export type KnowledgeCard = {
  icon: string;
  title: string;
  text: string;
};

export type SiteCopy = {
  productName: string;
  departmentName: string;
  libraryEyebrow: string;
  libraryTitle: string;
  coachEyebrow: string;
  knowledgeEyebrow: string;
  knowledgeTitle: string;
  knowledgeIntro: string;
  dashboardEyebrow: string;
  dashboardTitle: string;
  dashboardIntro: string;
  footerTagline: string;
  footerNotice: string;
};

export type SiteContent = {
  version: 1;
  copy: SiteCopy;
  scenarios: Scenario[];
  knowledgeCards: KnowledgeCard[];
};

export const knowledgeCards: KnowledgeCard[] = [
  { icon: "⏱", title: "Quy tắc 30 giây", text: "Dừng lại, hít thở và không hành động khi người lạ tạo cảm giác khẩn cấp." },
  { icon: "⌁", title: "Xác minh đa kênh", text: "Tự tìm số chính thức hoặc gọi người thân qua kênh khác, không dùng thông tin kẻ lạ cung cấp." },
  { icon: "⌾", title: "Giữ bí mật mã xác thực", text: "Mật khẩu, OTP, mã QR đăng nhập và mã khôi phục chỉ dành cho bạn." },
  { icon: "▣", title: "Kiểm tra trước khi chuyển", text: "Đọc lại người nhận, số tiền và nội dung trên màn hình xác nhận cuối cùng." },
  { icon: "⚑", title: "Lưu bằng chứng", text: "Chụp màn hình, lưu số điện thoại, đường link và mã giao dịch trước khi báo cáo." },
  { icon: "☏", title: "Kênh trợ giúp", text: "Liên hệ ngân hàng và công an gần nhất càng sớm càng tốt khi đã phát sinh thiệt hại." },
];

export const defaultSiteContent: SiteContent = {
  version: 1,
  copy: {
    productName: "KHIÊN SỐ",
    departmentName: "IT SECURITY",
    libraryEyebrow: "THƯ VIỆN TÌNH HUỐNG",
    libraryTitle: "Chọn một thử thách",
    coachEyebrow: "HDBANK · IT SECURITY",
    knowledgeEyebrow: "HDBANK · IT SECURITY",
    knowledgeTitle: "Sáu thói quen nhỏ, một lớp giáp lớn.",
    knowledgeIntro: "Cẩm nang an toàn số giúp bạn nhận ra áp lực, kiểm tra danh tính và giữ quyền kiểm soát trước mọi giao dịch.",
    dashboardEyebrow: "HDBANK · IT SECURITY",
    dashboardTitle: "Dashboard nhận thức an toàn",
    dashboardIntro: "Góc nhìn tổng hợp phục vụ báo cáo CISO trên dữ liệu tập trung của toàn bộ người dùng.",
    footerTagline: "Khiên Số · Đào tạo nhận thức an toàn thông tin",
    footerNotice: "Không nhập dữ liệu ngân hàng. Tài khoản và kết quả được bảo vệ trên Supabase.",
  },
  scenarios,
  knowledgeCards,
};

const difficultyValues: Difficulty[] = ["Dễ", "Trung bình", "Khó", "Rất khó"];

function isText(value: unknown, maxLength = 5000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function normalizeSiteContent(value: unknown): SiteContent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SiteContent>;
  if (!candidate.copy || typeof candidate.copy !== "object") return null;
  const copy = candidate.copy as Partial<SiteCopy>;
  const copyKeys: Array<keyof SiteCopy> = [
    "productName", "departmentName", "libraryEyebrow", "libraryTitle", "coachEyebrow",
    "knowledgeEyebrow", "knowledgeTitle", "knowledgeIntro", "dashboardEyebrow",
    "dashboardTitle", "dashboardIntro", "footerTagline", "footerNotice",
  ];
  if (copyKeys.some((key) => !isText(copy[key], key.endsWith("Intro") || key === "footerNotice" ? 1000 : 180))) return null;
  if (!Array.isArray(candidate.scenarios) || candidate.scenarios.length < 1 || candidate.scenarios.length > 100) return null;
  const ids = new Set<number>();
  const validScenarios = candidate.scenarios.every((scenario) => {
    if (!scenario || typeof scenario !== "object") return false;
    if (!Number.isInteger(scenario.id) || scenario.id < 1 || scenario.id > 100 || ids.has(scenario.id)) return false;
    ids.add(scenario.id);
    return isText(scenario.title, 160)
      && isText(scenario.category, 80)
      && difficultyValues.includes(scenario.difficulty)
      && isText(scenario.channel, 80)
      && isText(scenario.icon, 12)
      && isText(scenario.story, 3000)
      && Array.isArray(scenario.redFlags) && scenario.redFlags.length >= 1 && scenario.redFlags.length <= 8
      && scenario.redFlags.every((flag) => isText(flag, 220))
      && isText(scenario.tip, 1000)
      && isText(scenario.evidence, 300)
      && Array.isArray(scenario.choices) && scenario.choices.length === 3
      && scenario.choices.filter((choice) => choice.correct).length === 1
      && scenario.choices.every((choice) => isText(choice.text, 500)
        && typeof choice.correct === "boolean"
        && Number.isInteger(choice.moneyDelta) && Math.abs(choice.moneyDelta) <= 300_000_000
        && Number.isInteger(choice.awarenessDelta) && Math.abs(choice.awarenessDelta) <= 100
        && isText(choice.feedback, 1200));
  });
  if (!validScenarios) return null;
  if (!Array.isArray(candidate.knowledgeCards) || candidate.knowledgeCards.length < 1 || candidate.knowledgeCards.length > 24) return null;
  if (!candidate.knowledgeCards.every((card) => isText(card.icon, 12) && isText(card.title, 160) && isText(card.text, 1200))) return null;
  return {
    version: 1,
    copy: copy as SiteCopy,
    scenarios: candidate.scenarios,
    knowledgeCards: candidate.knowledgeCards,
  };
}
