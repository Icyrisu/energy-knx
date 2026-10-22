# database — PostgreSQL Storage Service

Layanan database PostgreSQL 17 Alpine untuk menyimpan konfigurasi meter, data historis pengukuran energi (28 parameter), data alarm, audit log kontrol Modbus (`control_log`), dan pengaturan aplikasi.

## Ketentuan Arsitektur

1. **Single Source of Truth untuk Migrasi**:
   File migrasi SQL disimpan di `database/migrations/`:
   - `001_init.sql`: Schema tabel dasar (`meters`, `telemetry_samples`, `alarm_rules`, `alarm_events`, `app_settings`).
   - `002_seed.sql`: Data awal default untuk KWH BESAR, KWH KECIL, dan alarm rules.
   - `003_control_log.sql`: Tabel audit log penulisan perintah kontrol Modbus TCP.
   
   Backend (`backend`) secara otomatis menjalankan migrasi ini saat startup bila `MIGRATE_ON_START=true`.

2. **Keamanan Jaringan**:
   Container `database` hanya bergabung ke internal Docker network `energy-net`. Port database (`5432`) **tidak diekspos** ke host secara publik untuk mencegah akses tidak sah.

3. **Optimalisasi Memori**:
   Konfigurasi PostgreSQL di `compose.yaml` telah disetel seringan mungkin dengan parameter:
   - `shared_buffers=32MB`
   - `max_connections=20`
   - `work_mem=2MB`
   - `synchronous_commit=off`
   - Limit memori container: `256MB`

4. **Persistensi Data**:
   Data database disimpan di Docker named volume `database-data`. Data tetap aman saat container direstart atau di-recreate.

---

## Backup & Restore Data

### Membuat Backup (Dump)
```bash
docker compose exec database pg_dump -U energy_user -d energy_scada -F c -b -v -f /tmp/backup.dump
docker compose cp database:/tmp/backup.dump ./backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Backup
```bash
docker compose cp ./backup.dump database:/tmp/backup.dump
docker compose exec database pg_restore -U energy_user -d energy_scada -v /tmp/backup.dump
```

### Reset Data Bersih (Peringatan: Menghapus seluruh data historis)
```bash
docker compose down -v
docker compose up -d
```
> Catatan: Perintah `docker compose down -v` akan menghapus named volume `database-data`. Gunakan hanya jika Anda ingin mengulang dari database kosong.
