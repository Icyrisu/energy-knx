# Panduan Deployment & DevOps — Energy SCADA Dashboard

Panduan instalasi, pemeliharaan, alokasi memori, dan troubleshooting container Docker untuk sistem Energy SCADA.

---

## 1. Prasyarat Sistem

- **Sistem Operasi**: Linux, macOS, atau Windows dengan Docker Desktop / WSL2
- **Docker Engine**: versi >= 24.0.0
- **Docker Compose**: versi >= 2.20.0
- **Node.js** (opsional untuk pengembangan lokal tanpa Docker): versi >= 20.0.0

---

## 2. Struktur Layanan Container & Alokasi Resource

Sistem telah dioptimasi secara agresif agar berjalan sangat ringan di Docker dengan pembatasan memori ketat:

| Service Name | Image Dasar | Port Host | Batas Memori (RAM) | Deskripsi & Optimasi |
|---|---|---|---|---|
| `frontend` | `nginx:alpine-slim` | `8080` (HTTP) | **32 MB** | SPA React + Tailwind v4 + shadcn/ui. Bundel di-tree-shake dan di-gzip. Reverse proxy ke backend. |
| `backend` | `node:22-alpine` | `3000` (Opsional) | **160 MB** | Express + ws, connection pool pg max 5, in-memory alarm cache, healthcheck ringan via `wget`. |
| `nodered` | `nodered/node-red:4.0-minimal` | `1880` (Editor) | **256 MB** | Gateway Modbus TCP + 3-Phase Simulator. Volume `/data` di-bind langsung ke folder repositori. |
| `database` | `postgres:17-alpine` | Internal Only | **256 MB** | Database SCADA dengan `shared_buffers=32MB`, `max_connections=20`, `synchronous_commit=off`. |

**Total Alokasi Maksimal**: ~704 MB RAM (Jauh lebih ringan dibanding konfigurasi unconstrained sebelumnya).

---

## 3. Langkah Instalasi Cepat

1. Salin file environment:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan konfigurasi di `.env` (misalnya IP gateway Modbus jika terhubung ke perangkat fisik).
3. Build dan jalankan seluruh container:
   ```bash
   docker compose up -d --build
   ```
4. Periksa status kesehatan seluruh layanan:
   ```bash
   docker compose ps
   ```
5. Buka dashboard di browser Anda:
   - **SCADA Web Dashboard**: [http://localhost:8080](http://localhost:8080)
   - **Node-RED Web Editor**: [http://localhost:1880](http://localhost:1880)

---

## 4. Perintah Operasional Penting

### Melihat Log Layanan
```bash
# Seluruh log secara real-time
docker compose logs -f

# Hanya log backend
docker compose logs -f backend

# Hanya log Node-RED gateway
docker compose logs -f nodered
```

### Memeriksa Penggunaan CPU & RAM Real-Time
```bash
docker stats --no-stream
```

### Menghentikan Layanan (Data Tetap Aman di Volume)
```bash
docker compose down
```

### Merestart Layanan Tertentu
```bash
docker compose restart backend nodered
```

### Menjalankan Database Migration Manual (Opsional)
```bash
docker compose exec backend npm run migrate
```

---

## 5. Troubleshooting Masalah Umum

### 1. Database Connection Timeout
**Gejala**: `backend` keluar dengan status error saat startup karena tidak dapat terhubung ke database.  
**Penyebab**: Container database masih dalam proses inisialisasi awal.  
**Solusi**: `backend` telah dilengkapi mekanisme retry dengan backoff otomatis. Tunggu beberapa detik hingga database siap.

### 2. WebSocket Gagal Terhubung di Browser
**Gejala**: Indikator dashboard berwarna merah atau berstatus "reconnecting".  
**Solusi**: Pastikan Nginx reverse proxy mengalirkan header `Upgrade` dan `Connection` ke `backend:3000/ws`. Pengaturan ini sudah tersedia secara default di `frontend/nginx.conf`.

### 3. Node-RED Menampilkan Pesan 401 Unauthorized
**Gejala**: Node status berwarna merah dengan tulisan "Failed (HTTP 401)".  
**Solusi**: Pastikan nilai `INTERNAL_API_SECRET` di `.env` sama persis antara `backend` dan `nodered`.

### 4. Perubahan Flow Node-RED Hilang Setelah Restart
**Penyebab**: Node-RED menggunakan ephemeral storage atau named volume yang tidak sinkron.  
**Solusi**: Pada sistem ini, direktori `./nodered/data` di-bind mount langsung ke host. Setiap kali Anda menekan tombol **Deploy** di editor Node-RED, perubahan langsung tersimpan ke `nodered/data/flows.json`.
