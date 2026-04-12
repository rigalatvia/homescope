@echo off
set ALL_PROXY=
set HTTP_PROXY=
set HTTPS_PROXY=
set GIT_HTTP_PROXY=
set GIT_HTTPS_PROXY=
set NO_PROXY=localhost,127.0.0.1,::1
set DDF_TOKEN_URL=https://identity.crea.ca/connect/token
set DDF_LISTINGS_URL=https://ddfapi.realtor.ca/odata/v1/Property
set DDF_REPLICATION_URL=https://ddfapi.realtor.ca/odata/v1/Property/PropertyReplication()
set DDF_CLIENT_ID=L1cQpAbKSYgQsOMSkXdz6YOF
set DDF_CLIENT_SECRET=my2WNrsA7hss8C5RXRH6U562
set DDF_SCOPE=DDFApi_Read
set MLS_CONNECTOR_KIND=ddf-treb
set MLS_SOURCE_SYSTEM=toronto-board-ddf
set MLS_SYNC_ADMIN_TOKEN=temp-sync-token-2026-04-11
cd /d C:\YanGinzburgProject
start "" /b npm run dev > .tmp-ddf-dev.log 2>&1
timeout /t 30 >nul
curl.exe -sS -X POST http://localhost:3000/api/admin/mls-sync -H "Content-Type: application/json" -H "x-admin-sync-token: temp-sync-token-2026-04-11" --data "{\"mode\":\"full\",\"connectorKind\":\"ddf-treb\"}"
echo.
