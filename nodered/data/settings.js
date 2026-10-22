module.exports = {
  uiPort: process.env.PORT || 1880,
  debugMaxLength: 1000,
  flowFile: 'flows.json',
  flowFilePretty: true,
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || 'node-red-credential-secret-key-32chars',

  functionGlobalContext: {
    env: {
      BACKEND_URL: process.env.BACKEND_URL || 'http://backend:3000',
      INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET || 'energy-scada-internal-secret-token-change-in-prod',
      ENERGY_SOURCE_MODE: process.env.ENERGY_SOURCE_MODE || 'modbus',
      TELEMETRY_INTERVAL_MS: parseInt(process.env.TELEMETRY_INTERVAL_MS || '1000', 10),

      POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '1000', 10),
      MODBUS_HOST: process.env.MODBUS_HOST || '127.0.0.1',
      MODBUS_PORT: parseInt(process.env.MODBUS_PORT || '502', 10),
    },
  },

  exportGlobalContextKeys: false,
  logging: {
    console: {
      level: 'info',
      metrics: false,
      audit: false,
    },
  },
  editorTheme: {
    projects: {
      enabled: false,
    },
    header: {
      title: 'Energy SCADA Node-RED Modbus Gateway',
    },
  },
};
