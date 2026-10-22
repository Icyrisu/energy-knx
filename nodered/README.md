# nodered — Industrial Modbus TCP Gateway & Simulator

Layanan integrasi perangkat berbasis Node-RED 4.0 (menggunakan base image minimalis `nodered/node-red:4.0-minimal` dan palette resmi `node-red-contrib-modbus`) untuk:
1. Membaca parameter listrik 3-fasa dari Power Meter industri via Modbus TCP (Read).
2. Mengeksekusi perintah kontrol ke perangkat Modbus TCP (Write).
3. Mensimulasikan nilai telemetry (28 parameter) secara realistis saat perangkat fisik belum terhubung.

---

## Arsitektur 5 Tab Flow Node-RED

Flow terstruktur dalam 5 tab independen yang bersih:

1. **Tab 0: 0. Register Map**
   - Mendefinisikan tabel terpusat untuk konfigurasi **READ** (parameter telemetry yang dibaca) dan **WRITE** (titik kontrol yang dapat ditulis).
   - Menyediakan titik konfigurasi register yang dinamis (jumlah register dapat ditambah atau dikurangi dengan mudah).
   - Menginisialisasi `global.registerMap` saat Node-RED startup.

2. **Tab 1: 1. Modbus Poller (Read)**
   - Menggunakan node **`modbus-flex-getter`** yang terhubung ke satu client node **`energy-modbus-client`** (IP Gateway Modbus bersama).
   - Melakukan polling setiap `POLL_INTERVAL_MS` (default 2000ms).
   - Membaca register untuk Meter 1 (Unit ID 1) dan Meter 2 (Unit ID 2).
   - Dilengkapi **Device Guard**: Jika register belum di-set (`address: null`), poller tidak memancarkan data palsu dan menampilkan status *"register belum di-set"*.
   - Menerapkan decoder data: float32-be, float32-le, int16, uint16, int32, atau custom multiplier.

3. **Tab 2: 2. Modbus Control (Write)**
   - Menyediakan endpoint HTTP internal:
     - `GET /modbus/points`: Mengembalikan daftar register kontrol yang tersedia.
     - `POST /modbus/write`: Menerima perintah penulisan register dari Backend.
   - Menggunakan node **`modbus-flex-writer`** untuk menulis nilai (Coil, Holding Register, FC 5, 6, 15, atau 16) ke perangkat Modbus fisik.
   - Mengembalikan response JSON status sukses/gagal secara synchronous ke Backend.

4. **Tab 3: 3. 3-Phase Simulator**
   - Menghasilkan nilai live 14 parameter untuk `KWH BESAR` dan 14 parameter untuk `KWH KECIL` setiap detik saat `ENERGY_SOURCE_MODE=simulation`.
   - Menghasilkan fluktuasi sinusoidal dinamis dengan cosinus fasa realistis.

5. **Tab 4: 4. Backend Sender**
   - Menerima batch telemetry (28 parameter) baik dari Tab 1 (Device) maupun Tab 3 (Simulator).
   - Mengirimkan data via HTTP POST ke backend: `http://backend:3000/api/internal/telemetry`.
   - Menggunakan header keamanan `X-Internal-Secret`.

---

## Konfigurasi Modbus TCP Fisik

Panduan lengkap mengenai cara mengatur register dan menambahkan parameter baru tersedia di [docs/device-configuration.md](../docs/device-configuration.md).

### Langkah Cepat Pengaturan Register:
1. Akses editor Node-RED di host: [http://localhost:1880](http://localhost:1880).
2. Buka **Tab 0: Register Map**, klik dua kali pada node **Init Register Map**.
3. Masukkan nomor register manual perangkat Anda pada array `READ` atau `WRITE`.
4. Jika IP gateway berbeda dari default, ubah konfigurasi node client `energy-modbus-client` atau sesuaikan environment variable `MODBUS_HOST` dan `MODBUS_PORT` di `.env`.
5. Klik **Deploy**. Konfigurasi langsung tersimpan ke `./nodered/data/flows.json` karena volume `/data` di-mount langsung ke direktori repositori.
