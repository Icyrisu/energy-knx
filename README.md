# Industrial 3-Phase Energy SCADA Dashboard

Aplikasi SCADA modern untuk pemantauan dan kontrol parameter listrik 3 fasa secara real-time dari dua Power Meter industri (**KWH BESAR** dan **KWH KECIL**, total 28 parameter monitoring) lengkap dengan komunikasi dua arah Modbus TCP (Read & Write), WebSocket, penyimpanan historis PostgreSQL, Node-RED gateway/simulator, dan orkestrasi Docker Compose yang telah dioptimasi seringan mungkin.

---

## 1. Daftar Layanan & Struktur Folder

```text
KNX_Web/
├── compose.yaml                # Orkestrasi 4 layanan Docker (database, backend, nodered, frontend)
├── .env.example                # Template variabel lingkungan sistem
├── package.json                # Root workspace monorepo (shared, backend, frontend)
├── docs/                       # Dokumentasi teknis terinci
│   ├── architecture.md         # Diagram arsitektur Mermaid & aliran data 2 arah
│   ├── api.md                  # Dokumentasi REST API, WebSocket, & Control endpoints
│   ├── device-configuration.md # Panduan pemetaan register Modbus TCP Read/Write
│   └── deployment.md           # Panduan deployment, resource limit & troubleshooting
├── shared/                     # Kontrak data TypeScript, Zod schemas, & DTO bersama
│   ├── src/parameters.ts       # 14 parameter kanonik & metadata meter
│   ├── src/telemetry.ts        # Validasi schema batch telemetry & control points
│   └── src/api.ts              # Schema request/response REST API
├── frontend/                   # Web SCADA UI (React, Vite, Tailwind CSS, shadcn/ui, ECharts)
│   ├── Dockerfile              # Multi-stage build ringan dengan Nginx Alpine Slim
│   ├── nginx.conf              # Reverse proxy /api & /ws ke backend
│   └── src/                    # Panel meter, control 2 arah, trend chart, histori, alarm, settings
├── backend/                    # REST API, WebSocket Server, & Proxy Modbus Control
│   ├── Dockerfile              # Node.js 22 Alpine dengan wget healthcheck
│   └── src/                    # Live store, history writer, alarm engine, control proxy
├── nodered/                    # Gateway Modbus TCP (Read/Write) & Simulator realistis
│   ├── Dockerfile              # nodered/node-red:4.0-minimal + node-red-contrib-modbus
│   ├── data/
│   │   ├── flows.json          # 5 Tab Flow (Register Map, Poller, Control, Sim, Sender)
│   │   └── settings.js         # Konfigurasi runtime Node-RED
│   └── README.md               # Dokumentasi flow Node-RED
└── database/                   # Migrasi SQL & panduan administrasi PostgreSQL 17
    ├── migrations/             # 001_init, 002_seed, 003_control_log
    └── README.md               # Dokumentasi backup & konfigurasi database
```

---

## 2. Parameter Monitoring & Kontrol 2 Arah

Sistem memonitor 2 meter listrik:
- `KWH BESAR` (`kwh-besar`, Meter 1, default Modbus Unit ID `1`)
- `KWH KECIL` (`kwh-kecil`, Meter 2, default Modbus Unit ID `2`)

Kedua meter berbagi 1 koneksi Modbus TCP gateway (IP dan port sama, dibedakan berdasarkan Slave/Unit ID).

### Parameter Monitoring (14 Parameter per Meter = Total 28 Parameter):
1. **Tegangan (Voltage)**: Voltage R (V), Voltage S (V), Voltage T (V)
2. **Arus (Current)**: Current R (A), Current S (A), Current T (A)
3. **Daya Aktif (Active Power)**: Watt R (W), Watt S (W), Watt T (W)
4. **Energi (Energy)**: KWH R (kWh), KWH S (kWh), KWH T (kWh)
5. **Total Ringkasan**: Total Watt (W), Total KWH (kWh)

### Kontrol Dua Arah (Modbus TCP Write):
Dashboard menyediakan halaman **Control** (`/control`) yang memungkinkan operator menulis perintah ke perangkat Modbus (misal: Relay Trip/Reset, Reset Maximum Demand, Setting CT Ratio, dsb.) secara aman:
- Permintaan dikirim dari browser via REST API Backend (`POST /api/control/write`).
- Backend memvalidasi input, mencatat aktivitas ke tabel audit `control_log` di PostgreSQL.
- Backend meneruskan perintah ke endpoint Node-RED (`POST /modbus/write`).
- Node-RED mengeksekusi penulisan register menggunakan node `modbus-flex-writer`.

---

## 3. Prasyarat Instalasi

Pastikan komputer host Anda telah terpasang:
- **Docker Engine** (versi 24.0 atau lebih baru)
- **Docker Compose** (versi 2.20 atau lebih baru)
- Port yang tidak bentrok di host:
  - `8080`: Frontend Web Dashboard
  - `1880`: Node-RED Flow Editor
  - `3000`: Backend API (opsional/eksternal)

---

## 4. Panduan Menjalankan Sistem

### Langkah 1: Persiapan Variabel Lingkungan
Salin file `.env.example` menjadi `.env`:
```powershell
Copy-Item .env.example .env
```
*(atau di Linux/macOS: `cp .env.example .env`)*

Periksa isi `.env`:
- `ENERGY_SOURCE_MODE=simulation` (default) atau `device`
- `MODBUS_HOST=192.168.1.100` (IP gateway Modbus TCP Anda)
- `MODBUS_PORT=502`
- `POLL_INTERVAL_MS=2000`

### Langkah 2: Menjalankan Seluruh Sistem dengan Docker Compose
Jalankan perintah berikut di root direktori proyek:
```bash
docker compose up -d --build
```
Proses ini akan menjalankan 4 kontainer yang sangat ringan:
1. `database` (PostgreSQL 17 Alpine dengan limit memori 256MB)
2. `backend` (Node.js 22 Alpine dengan limit memori 160MB, otomatis menjalankan migrasi SQL)
3. `nodered` (Node-RED minimal dengan palette `node-red-contrib-modbus`, limit memori 256MB)
4. `frontend` (Nginx Alpine Slim dengan limit memori 32MB)

### Langkah 3: Memeriksa Status Kontainer
Periksa bahwa seluruh container berstatus `Up` dan `healthy`:
```bash
docker compose ps
```

### Langkah 4: Membuka Aplikasi di Browser
- **Energy SCADA Web Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Node-RED Flow Editor**: [http://localhost:1880](http://localhost:1880)
- **Backend API Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 5. Fitur Utama & Tampilan Dashboard (Minimalis Modern)

Antarmuka SCADA dirancang dengan estetika minimalis modern (mengacu pada inspirasi Benkei Dashboard) yang mengutamakan fungsi, kebersihan visual, dan kaidah **Anti-Slop Industrial UI**:
- **Sidebar Fleksibel**: Dapat dibuka/tutup (`Expanded` 256px vs `Collapsed` 80px yang hanya menyisakan icon terpusat), dilengkapi tooltip interaktif dan drawer responsif untuk perangkat mobile/tablet.
- **Dukungan Tema Terintegrasi**: Pilihan mode Gelap (*Dark*) dan Terang (*Light*) dengan kontras standar industri (WCAG compliant) yang dapat berganti instan dan tersimpan di memori browser.
- **Indikator Tunggal Jujur**: Menghapus label simulasi dekoratif, badge "Live", dan animasi kedip berlebih. Digantikan oleh **1 penanda status koneksi tunggal** untuk Gateway Modbus TCP (`Modbus TCP • Connected` / `Modbus TCP • Offline`).
- **Bebas Emote/Slop**: Menghilangkan seluruh dekorasi emoji yang tidak perlu dan mempertahankan tampilan profesional kelas instrumen industri.

### Struktur 4 Halaman Utama:
1. **Dashboard Utama (`/`)**:
   - Tiga kartu metrik eksekutif di bagian atas (*Total Active Power*, *Total Active Energy*, dan *Load Split Ratio*).
   - Panel kembar **KWH BESAR** dan **KWH KECIL** menampilkan seluruh 28 parameter listrik 3 fasa secara terstruktur (Tegangan, Arus, Daya Aktif, dan Energi per fasa R, S, T, dan Total).
   - Grafik area halus *Power Trend* 24 jam serta ringkasan energi terintegrasi berbasis ECharts.
2. **Analytics (`/analytics`)**:
   - Menggabungkan pemantauan tren interaktif dan log historis dalam satu tampilan terpadu.
   - Grafik tren multi-meter & multi-parameter dengan preset rentang waktu (`1h`, `6h`, `24h`, `7d`, `30d`) dan slider *dataZoom*.
   - Tabel histori telemetri terperinci dengan filter meter, paginasi cepat di sisi server, dan tombol **Export CSV**.
3. **Control (`/control`)**:
   - Panel kontrol dua arah Modbus TCP untuk relay on/off dan penulisan nilai register (setpoint).
   - Umpan balik status eksekusi instan (berhasil/gagal disertai pesan error perangkat).
   - Tabel audit log riwayat penulisan (*audit trail*) yang mencatat timestamp, operator, tag, nilai, dan status penulisan ke database.
4. **Settings (`/settings`)**:
   - **Tab System & Display**: Konfigurasi penamaan meter, deskripsi, zona waktu tampilan (*Asia/Jakarta*), timeout data kedaluwarsa (*stale*), dan pemilih tema visual (Dark/Light).
   - **Tab Alarm Thresholds**: Pengaturan batas ambang alarm Overvoltage, Undervoltage, dan Overcurrent dengan validasi otomatis dan penyimpanan ke database.

---

## 6. Operasional & Pemeliharaan Docker

### Melihat Log Real-Time
```bash
# Semua service
docker compose logs -f

# Hanya log backend
docker compose logs -f backend

# Hanya log gateway Node-RED
docker compose logs -f nodered
```

### Memantau Penggunaan Resource (CPU & Memori)
```bash
docker stats --no-stream
```

### Menghentikan Layanan
```bash
docker compose down
```

### Restart Layanan Tertentu
```bash
docker compose restart backend nodered
```

### Reset Data Bersih Secara Sengaja
> [!CAUTION]
> Perintah berikut akan menghapus seluruh data pengukuran historis yang tersimpan!
```bash
docker compose down -v
docker compose up -d
```

---

## 7. Beralih ke Perangkat Power Meter Nyata

Secara default, sistem berjalan dalam mode **Simulasi Realistis** (`ENERGY_SOURCE_MODE=simulation`).

Ketika Anda siap menghubungkan Power Meter fisik:
1. Pastikan IP gateway Modbus TCP dapat dijangkau oleh komputer host/Docker.
2. Di file `.env`, atur:
   ```env
   ENERGY_SOURCE_MODE=device
   MODBUS_HOST=192.168.1.100   # Ganti dengan IP Gateway Modbus Anda
   MODBUS_PORT=502
   POLL_INTERVAL_MS=2000
   ```
3. Buka web editor Node-RED di [http://localhost:1880](http://localhost:1880).
4. Masuk ke **Tab 0: Register Map**, klik ganda node **Init Register Map**, dan isi alamat register (`address`) sesuai manual perangkat meter Anda (panduan langkah demi langkah tersedia di [docs/device-configuration.md](docs/device-configuration.md)).
5. Klik tombol **Deploy** di pojok kanan atas Node-RED.
6. Perubahan langsung tersimpan secara permanen ke file `nodered/data/flows.json` karena folder data di-bind mount langsung ke repositori.

---

## 8. Panduan Troubleshooting

| Masalah | Kemungkinan Penyebab | Tindakan Solusi |
|---|---|---|
| Dashboard menampilkan badge **Disconnected** | WebSocket tidak dapat menjangkau backend | Periksa log `docker compose logs backend`. Pastikan container backend berstatus healthy. |
| Angka meter berstatus **Stale** | Tidak ada data baru dalam 10 detik | Periksa container `nodered`. Pada mode `device`, jika register belum diatur (`address: null`), data tidak akan dipancarkan untuk menghindari data palsu. |
| Node-RED log error 401 | Secret token tidak cocok | Samakan nilai `INTERNAL_API_SECRET` di `.env` lalu restart container. |
| Modbus Client timeout / error | IP/Port gateway Modbus salah atau tidak terjangkau | Pastikan `MODBUS_HOST` dan `MODBUS_PORT` di `.env` sudah benar dan perangkat aktif. |
| Database connection error saat startup | PostgreSQL masih inisialisasi | Backend memiliki fungsi retry otomatis hingga database siap. |
