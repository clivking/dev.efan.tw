@echo off
REM Step 1: Login
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\": \"cliv\", \"password\": \"0982\"}" -c cookies.txt > login_res.json
echo --- Step 1 Login Result ---
type login_res.json

REM Step 2: Create Customer 1
curl.exe -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -b cookies.txt -d "{\"name\": \"測試客戶 1\", \"companyName\": \"測試公司 1\", \"taxId\": \"12345671\", \"phone\": \"0922780141\"}" > cust1.json
echo.
echo --- Step 2 Customer 1 Result ---
type cust1.json

REM Step 2: Create Customer 2
curl.exe -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -b cookies.txt -d "{\"name\": \"測試客戶 2\", \"companyName\": \"測試公司 2\", \"taxId\": \"12345672\", \"phone\": \"0922780142\"}" > cust2.json
echo.
echo --- Step 2 Customer 2 Result ---
type cust2.json
