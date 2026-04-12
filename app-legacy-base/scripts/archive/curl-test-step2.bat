@echo off
set CUST_ID=23e79327-0e84-4c3e-98a8-514fa4e1960c

REM Step 2: Add Company Name
curl.exe -X POST http://localhost:3000/api/customers/%CUST_ID%/companies -H "Content-Type: application/json" -b cookies.txt -d "{\"name\": \"二帆安全設備\", \"taxId\": \"88776655\", \"isPrimary\": false}" > company.json
echo --- Step 2 Company Result ---
type company.json

REM Step 3: Add Contact
curl.exe -X POST http://localhost:3000/api/customers/%CUST_ID%/contacts -H "Content-Type: application/json" -b cookies.txt -d "{\"name\": \"王小明\", \"title\": \"採購\", \"phone\": \"0922-780-141\", \"email\": \"test@example.com\", \"isPrimary\": true}" > contact.json
echo.
echo --- Step 3 Contact Result ---
type contact.json
