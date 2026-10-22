FROM nodered/node-red:latest-minimal

USER root

# Install modbus palette into global node-red installation directory
RUN npm install --no-audit --no-fund --omit=dev node-red-contrib-modbus@5

USER node-red
EXPOSE 1880
