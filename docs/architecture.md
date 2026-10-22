# Arsitektur Sistem — Energy SCADA Dashboard

Dokumen ini menjelaskan rancangan arsitektur, topologi jaringan, aliran data real-time, kontrol dua arah, dan penyimpanan historis untuk sistem monitoring & kontrol listrik tiga fasa (2 meter × 14 parameter = 28 parameter).

---

## 1. Diagram Arsitektur

```mermaid
flowchart TD
    subgraph PhysicalField["Lapisan Perangkat Fisik / Gateway"]
        GW["Modbus TCP Gateway<br/>(1 IP &amp; Port Bersama)"]
        M1["Power Meter 1: KWH BESAR<br/>(Modbus Unit ID: 1)"]
        M2["Power Meter 2: KWH KECIL<br/>(Modbus Unit ID: 2)"]
        GW --- M1
        GW --- M2
    end

    subgraph DockerNetwork["Internal Docker Network: energy-net"]
        subgraph Gateway["nodered (:1880)"]
            NR_CFG["0. Register Map<br/>(Dynamic READ/WRITE Config)"]
            NR_POLL["1. Modbus Poller<br/>(modbus-flex-getter)"]
            NR_WRITE["2. Modbus Control<br/>(modbus-flex-writer)"]
            NR_SIM["3. 3-Phase Simulator<br/>(Synthetic 28 Parameters)"]
            NR_HTTP["4. Backend Sender<br/>(HTTP Telemetry Ingestion)"]
        end

        subgraph Backend["backend (:3000)"]
            BE_AUTH["Internal Auth<br/>(X-Internal-Secret)"]
            BE_STORE["In-Memory LiveStore<br/>(Staleness Tracker)"]
            BE_ALARM["Alarm Evaluator<br/>(Hysteresis Engine)"]
            BE_WS["WebSocket Server<br/>(/ws)"]
            BE_API["REST API Router<br/>(/api/*)"]
            BE_CTRL["Control Proxy Service<br/>(/api/control/*)"]
            BE_WRITER["History Writer Job<br/>(1 snapshot / menit)"]
        end

        subgraph Database["database (:5432)"]
            DB_SAMPLES[("telemetry_samples<br/>(14 param per record)")]
            DB_METERS[("meters")]
            DB_ALARMS[("alarm_rules &amp;<br/>alarm_events")]
            DB_CTRL[("control_log<br/>(Audit Penulisan Modbus)")]
            DB_SETTINGS[("app_settings")]
        end

        subgraph Frontend["frontend (:80 / host :8080)"]
            NGINX["Nginx Web Server &amp; Reverse Proxy"]
            SPA["React SCADA Dashboard SPA<br/>(Tailwind CSS + shadcn/ui)"]
        end
    end

    subgraph Client["Operator Browser"]
        BROWSER["SCADA Web Client<br/>(Desktop / Tablet)"]
    end

    %% Koneksi Fisik Modbus TCP
    NR_POLL <-->|Modbus TCP Read (FC3/FC4)| GW
    NR_WRITE -->|Modbus TCP Write (FC5/FC6/FC16)| GW

    %% Simulator & Poller ke Sender
    NR_SIM --> NR_HTTP
    NR_POLL --> NR_HTTP

    %% Aliran Telemetry ke Backend
    NR_HTTP -->|POST /api/internal/telemetry| BE_AUTH
    BE_AUTH --> BE_STORE
    BE_STORE --> BE_ALARM
    BE_STORE -->|Broadcast Live| BE_WS
    BE_STORE -.->|Periodic Flush| BE_WRITER
    BE_WRITER -->|SQL INSERT| DB_SAMPLES
    BE_ALARM -->|Raise / Clear Event| DB_ALARMS

    %% Aliran Kontrol 2-Arah
    BROWSER -->|POST /api/control/write| NGINX
    NGINX -->|Proxy /api/*| BE_API
    BE_API --> BE_CTRL
    BE_CTRL -->|Audit Log INSERT| DB_CTRL
    BE_CTRL -->|POST /modbus/write| NR_WRITE

    %% Query Historis & Relasi DB
    BE_API -->|Query| DB_SAMPLES
    BE_API -->|Read/Write| DB_METERS
    BE_API -->|Read/Write| DB_ALARMS
    BE_API -->|Read/Write| DB_SETTINGS
    BE_CTRL -->|Read Logs| DB_CTRL

    %% Frontend Proxy
    BROWSER -->|HTTP Request| NGINX
    NGINX -->|Serve Static SPA| SPA
    NGINX -->|Upgrade /ws| BE_WS
```

---

## 2. Prinsip dan Batasan Arsitektur

1. **Pemisahan Lapisan**:
   - Frontend **tidak pernah** mengakses database PostgreSQL secara langsung.
   - Frontend **tidak pernah** membuka socket Modbus TCP langsung ke perangkat lapangan.
   - Semua akses monitoring dan penulisan kontrol melewati REST API dan WebSocket dari `backend`.
2. **Kontrol Dua Arah yang Aman (Audited Control)**:
   - Setiap perintah penulisan register Modbus yang dikirim operator divalidasi dengan schema ketat.
   - Tindakan penulisan selalu dicatat di tabel audit `control_log` sebelum atau saat diteruskan ke Node-RED.
   - Node-RED mengeksekusi penulisan secara synchronous dan mengembalikan status ke backend.
3. **Gateway Bersama (Single TCP Client)**:
   - Kedua meter (KWH BESAR & KWH KECIL) berbagi satu gateway Modbus TCP (1 IP dan port).
   - Node-RED membedakan meter secara dinamis berdasarkan Slave/Unit ID (Unit ID 1 dan Unit ID 2).
4. **Guard Data Kosong (No Fake Data)**:
   - Pada mode perangkat fisik (`ENERGY_SOURCE_MODE=device`), jika konfigurasi register belum diatur (`address: null`), sistem tidak akan memancarkan data telemetry palsu. Status node di Node-RED menunjukkan keterangan bahwa register belum di-set.
5. **Efisiensi Sumber Daya Docker**:
   - Seluruh kontainer (`database`, `backend`, `nodered`, `frontend`) telah diatur batas penggunaan memorinya.
   - Backend menggunakan cache in-memory untuk status alarm guna menghindari loop kueri SQL berulang saat terjadi pelanggaran threshold.
   - Healthcheck backend menggunakan perintah ringan `wget` menggantikan spawn proses node.
