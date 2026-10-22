import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('Energy SCADA Backend API Endpoints', () => {
  const app = createApp();

  it('rejects /api/internal/telemetry without secret header with 401', async () => {
    const res = await request(app)
      .post('/api/internal/telemetry')
      .send({ readings: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects /api/internal/telemetry with invalid secret with 401', async () => {
    const res = await request(app)
      .post('/api/internal/telemetry')
      .set('X-Internal-Secret', 'wrong-secret-token')
      .send({ readings: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects /api/internal/telemetry with valid secret but malformed body with 400', async () => {
    const res = await request(app)
      .post('/api/internal/telemetry')
      .set('X-Internal-Secret', env.INTERNAL_API_SECRET)
      .send({ invalidField: true });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts valid telemetry batch with 202', async () => {
    const sampleBatch = {
      readings: [
        {
          meterId: 'kwh-besar',
          timestamp: new Date().toISOString(),
          connectionStatus: 'online',
          source: 'simulation',
          values: {
            voltageR: 215.0,
            voltageS: 222.1,
            voltageT: 219.1,
            currentR: 3.0,
            currentS: 3.9,
            currentT: 25.5,
            wattR: 470.0,
            wattS: 782.0,
            wattT: 5616.0,
            kwhR: 373.0,
            kwhS: 313.0,
            kwhT: 688.0,
            totalWatt: 6868.0,
            totalKwh: 1374.0,
          },
        },
      ],
    };

    const res = await request(app)
      .post('/api/internal/telemetry')
      .set('X-Internal-Secret', env.INTERNAL_API_SECRET)
      .send(sampleBatch);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accepted).toBe(1);
  });

  it('serves /api/monitoring/latest with all 2 meters configured', async () => {
    const res = await request(app).get('/api/monitoring/latest');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meters).toBeDefined();
    expect(res.body.data.meters['kwh-besar']).toBeDefined();
    expect(res.body.data.meters['kwh-kecil']).toBeDefined();
  });

  it('handles unknown routes with clean 404 response', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
