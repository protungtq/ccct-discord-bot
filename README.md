# Bot Discord CCCT — v0.1.4

Bot discord.js nhiều chức năng cho cộng đồng CCCT, viết dạng module: mỗi tính năng một file trong `src/commands` / `src/events`, dữ liệu lưu file JSON (`data/db.json`).

## Tính năng đã có

| Tính năng | Cách dùng |
|---|---|
| Điểm danh + chuỗi ngày | `/diemdanh` — thưởng XP, giữ streak cộng thêm (theo giờ Việt Nam) |
| XP / Level | Chat được cộng XP (cooldown 60s); xem bằng `/rank` |
| Bảng xếp hạng | `/top` — chọn XP / lượt mời / điểm danh |
| Đếm lượt mời | Tự động: member vào qua link mời của ai thì người đó +1; rời server thì -1 |
| Giftcode | Admin nạp mã `/giftcode them`; member nhận `/giftcode nhan` hoặc nút bấm từ `/giftcode panel` — mỗi người 1 mã/chiến dịch, chống nhận trùng. **Phát chặt theo role:** admin `/giftcode khoa` đặt role được nhận cho chiến dịch (tối đa 3 role, cần 1 trong các role là đủ), `/giftcode mokhoa` mở lại cho mọi người; chiến dịch không khóa thì ai cũng nhận được |
| Ticket hỗ trợ/partner | Admin đăng `/ticket panel`; member bấm nút mở kênh riêng với BQT, đóng bằng nút trong kênh |
| Mini game đoán số | Admin `/doanso batdau`; member chat số để đoán, bot gợi ý lớn/nhỏ, đoán đúng +100 XP |
| Quay thưởng | Admin `/quay` — random từ tập người điểm danh hôm nay hoặc toàn bộ thành viên |
| Thông báo | Admin `/thongbao` — đăng embed thông báo |
| Welcome | Tự chào member mới ở kênh chào mừng |
| Chống spam/lọc link | >5 tin/5 giây → timeout 60s + ghi mod-log; lọc link bật trong `.env` (`LINK_FILTER=on`) |

Quyền Admin của bot = có quyền Administrator của Discord **hoặc** có role tên `Admin` / `Mod` (đổi được trong `.env`).

## Chuẩn bị (làm 1 lần, ~10 phút)

1. Vào https://discord.com/developers/applications → **New Application** → đặt tên (VD: CCCT Bot).
2. Mục **Bot**: bấm **Reset Token** → copy **Token**. Đây là chìa khóa của bot: chỉ gửi qua két bảo mật, không dán vào chat/email công khai.
3. Vẫn mục **Bot**, bật 2 công tắc **Privileged Gateway Intents**: `SERVER MEMBERS INTENT` và `MESSAGE CONTENT INTENT`.
4. Mục **General Information**: copy **Application ID** (= CLIENT_ID).
5. Mời bot vào server test: mở link sau, thay `CLIENT_ID` bằng Application ID của bạn:
   `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot%20applications.commands&permissions=1099511721008`
   (Bộ quyền tối thiểu: xem/gửi tin, nhúng embed, quản lý kênh để tạo ticket, timeout, đọc invites. Giai đoạn test muốn nhanh thì dùng `permissions=8` = Administrator, nhưng không nên để lâu dài.)

## Chạy bot

```bash
cp .env.example .env   # rồi điền DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm install
npm run deploy         # đăng ký lệnh slash vào server (GUILD_ID trong .env)
npm start
```

- `GUILD_ID`: ID server test (bật Developer Mode trong Discord: Cài đặt → Nâng cao → Developer Mode, rồi chuột phải vào server → Copy Server ID). Đăng ký theo server thì lệnh có hiệu lực ngay; để trống = đăng ký toàn cục, chờ tới 1 giờ.
- Tạo sẵn 2 role tên **Admin** và **Mod** trong server cho đội quản trị.
- Kiểm tra nhanh không cần token: `npm run check` (nạp thử mọi module + chạy thử logic giftcode).

## Dữ liệu & backup

Toàn bộ dữ liệu nằm ở `data/db.json` (điểm danh, XP, kho giftcode, ticket). Backup = copy file này. Bot ghi file kiểu atomic (file tạm + đổi tên) nên đang chạy cũng copy an toàn.

## Treo bot 24/7

```bash
npm install -g pm2
pm2 start src/index.js --name ccct-bot
pm2 save
pm2 startup   # để bot tự sống lại khi máy khởi động lại
```

Chạy trên VPS Linux rẻ (Ubuntu) là ổn định nhất; chạy trên PC cá nhân thì máy tắt là bot offline.

## Deploy qua GitHub lên nền tảng host (gói Founder Free)

Repo này chứa code nguồn để nền tảng host tự `npm install` rồi chạy `npm start`:
- Nối repo này vào nền tảng (Deploy from GitHub), chọn profile Discord bot / Node.js.
- Điền biến môi trường trên nền tảng (không commit file `.env` vào repo): `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` (để trống = đăng ký lệnh toàn cục), `WELCOME_CHANNEL_ID`, `MOD_LOG_CHANNEL_ID`, `TICKET_CATEGORY_ID`, `LINK_FILTER`, `ADMIN_ROLES`.
- Lệnh slash đã đăng ký lên Discord từ lần deploy trước nên không cần chạy `npm run deploy` lại, trừ khi thêm/sửa lệnh.
- Dữ liệu (`data/db.json`) không nằm trong repo — copy file này từ máy đang chạy sang nền tảng khi chuyển host, và đừng chạy 2 bot cùng 1 token cùng lúc.

## Lộ trình tiếp theo (chưa làm)

- `/tuong` tra cứu tướng — chờ dữ liệu tướng từ NPH (công bố từ 1/11).
- Panel điểm danh bằng nút bấm cạnh tranh với bản lệnh.
- Chuyển lớp dữ liệu JSON → SQLite khi cộng đồng lớn (vài nghìn member).
