# REST & WebSocket API Documentation — Energy SCADA

Backend API melayani permintaan dari frontend web, menyediakan kontrol dua arah Modbus TCP, dan menerima ingestion data telemetry dari Node-RED.

Base URL internal: `http://backend:3000`  
Base URL frontend proxy: `http://localhost:8080/api`

---

## 1. System Health

### `GET /api/health`
Memeriksa status proses dan koneksi database PostgreSQL.

**Response 200 OK:**
```json
{
  "success": true,
  "status": "healthy",
  "db": "connected",
  "systemStatus": "healthy",
  "sourceMode": "simulation",
  "activeAlarms": 0,
  "uptimeSeconds": 1284,
  "serverTime": "2026-10-22T08:00:00.000Z"
}
```

---

## 2. Meters & Live Monitoring

### `GET /api/meters`
Mengambil daftar meter yang terkonfigurasi.

### `PATCH /api/meters/:meterId`
Memperbarui nama tampilan atau deskripsi meter.

### `GET /api/monitoring/latest`
Mengambil snapshot lengkap seluruh meter dan status sistem.

---

## 3. Two-Way Modbus Control

### `GET /api/control/points`
Mengambil daftar register kontrol yang tersedia untuk ditulis (disediakan oleh Node-RED melalui backend proxy).

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "relay_trip_reset",
      "name": "Trip Relay Reset",
      "meterId": "kwh-besar",
      "unitId": 1,
      "address": 100,
      "functionCode": "write-coil",
      "type": "boolean",
      "description": "Reset status trip breaker pada panel"
    },
    {
      "tag": "reset_max_demand",
      "name": "Reset Max Demand",
      "meterId": "kwh-besar",
      "unitId": 1,
      "address": 102,
      "functionCode": "write-holding-register",
      "type": "number",
      "min": 0,
      "max": 1,
      "description": "Tulis 1 untuk mereset catatan peak demand"
    }
  ]
}
```

### `POST /api/control/write`
Mengirim perintah penulisan nilai ke register Modbus TCP perangkat.

**Request Body:**
```json
{
  "meterId": "kwh-besar",
  "tag": "relay_trip_reset",
  "value": true,
  "operator": "Admin"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "logId": 1,
    "success": true,
    "message": "Command executed successfully"
  }
}
```

### `GET /api/control/logs`
Mengambil riwayat penulisan register kontrol dari tabel `control_log`.

**Query Parameters:**
- `meterId`: filter meter ID (opsional)
- `limit`: jumlah log (default: 50)

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2026-10-22T08:05:00.000Z",
      "meterId": "kwh-besar",
      "tag": "relay_trip_reset",
      "value": "true",
      "operator": "Admin",
      "success": true,
      "errorMessage": null
    }
  ]
}
```

---

## 4. Historical Data & CSV Export

### `GET /api/history`
Query data historis dengan filter dan paginasi server-side.

**Query Parameters:**
- `meterId`: `kwh-besar` | `kwh-kecil` (opsional)
- `from`: ISO Datetime string (opsional)
- `to`: ISO Datetime string (opsional)
- `page`: nomor halaman (default: 1)
- `pageSize`: ukuran halaman (default: 50, maks: 500)

### `GET /api/history/export.csv`
Menghasilkan stream file CSV yang siap diunduh oleh browser tanpa membebani memori backend.

---

## 5. Trend Analytics

### `GET /api/trends`
Query agregasi time-series untuk grafik visualisasi.

**Query Parameters:**
- `meterIds`: comma-separated string, contoh: `kwh-besar,kwh-kecil`
- `parameters`: comma-separated string, contoh: `totalWatt,voltageR`
- `from`: ISO Datetime (wajib)
- `to`: ISO Datetime (wajib)
- `bucket`: `1m` | `5m` | `15m` | `1h` | `1d` | `auto`

---

## 6. Alarms

- `GET /api/alarms`: Mengambil daftar alarm aktif.
- `GET /api/alarms/history`: Mengambil riwayat alarm masa lalu.
- `POST /api/alarms/:id/acknowledge`: Operator menandai telah mengetahui alarm.
- `GET /api/alarms/rules`: Daftar aturan threshold alarm.
- `PUT /api/alarms/rules/:id`: Memperbarui threshold atau mengaktifkan/menonaktifkan aturan alarm.

---

## 7. Internal Telemetry Ingestion (Node-RED)

### `POST /api/internal/telemetry`
Endpoint internal yang digunakan oleh Node-RED untuk mengirimkan batch telemetry.

**Headers:**
- `Content-Type: application/json`
- `X-Internal-Secret: <INTERNAL_API_SECRET>`

**Payload Body:**
```json
{
  "readings": [
    {
      "meterId": "kwh-besar",
      "timestamp": "2026-10-22T08:00:00.000Z",
      "connectionStatus": "online",
      "source": "simulation",
      "values": {
        "voltageR": 215.0,
        "voltageS": 222.1,
        "voltageT": 219.1,
        "currentR": 3.0,
        "currentS": 3.9,
        "currentT": 25.5,
        "wattR": 470.0,
        "wattS": 782.0,
        "wattT": 5616.0,
        "kwhR": 373.0,
        "kwhS": 313.0,
        "kwhT": 688.0,
        "totalWatt": 6868.0,
        "totalKwh": 1374.0
      }
    }
  ]
}
```
**Response:** `202 Accepted`

---

## 8. WebSocket Live Stream

Path: `/ws` (misal: `ws://localhost:8080/ws`)

**Pesan dari Server:**
1. `{ "type": "snapshot", "payload": { ...SystemStatusSnapshot... } }` saat client baru terhubung.
2. `{ "type": "telemetry", "payload": { ...MeterLiveSnapshot... } }` setiap detik saat pembacaan baru tiba.
3. `{ "type": "meter-status", "payload": { "meterId": "kwh-besar", "status": "online", "isStale": true } }` saat status meter berubah.
4. `{ "type": "alarm", "payload": { "id": 1, "meterId": "kwh-besar", "severity": "critical", ... } }` saat alarm aktif/cleared.
5. Heartbeat ping/pong setiap 30 detik untuk mendeteksi pemutusan koneksi diam-diam.
