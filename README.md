# Inventory & Sales Management System - Backend

## **1. Setup and Installation**

### **Prerequisites**
- **Node.js** (v16+)
- **MongoDB** (Ensure it is running locally at `mongodb://localhost:27017`)

### **Installation Steps**
1.  Navigate to the server directory: `cd server`
2.  Install dependencies: `npm install`
3.  Configure environment variables: Create/Edit `.env` (already created for you).
4.  Run the server: `npm run dev`

---

## **2. Running Automated Tests**
To run the Jest tests:
```bash
npm test
```

---

## **3. API Testing with CURL**

### **A. User Registration**
```bash
curl -X POST https://server-1-a19b.onrender.com/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Admin", "email": "admin@example.com", "password": "password123"}'
```

### **B. User Login**
(Save the returned `token` to use in subsequent requests)
```bash
curl -X POST https://server-1-a19b.onrender.com/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "password123"}'
```

### **C. Create Product**
(Replace `YOUR_TOKEN_HERE` with the token from Step B)
```bash
curl -X POST https://server-1-a19b.onrender.com/api/products \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Product", "productId": "TP001", "category": "Electronics", "price": 100, "quantity": 50, "unit": "pcs", "thresholdValue": 5}'
```

### **D. Buy Simulation**
(Replace `PRODUCT_ID` and `YOUR_TOKEN_HERE`)
```bash
curl -X POST https://server-1-a19b.onrender.com/api/products/PRODUCT_ID/buy \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"quantity": 2}'
```

### **E. Get Statistics**
```bash
curl -X GET https://server-1-a19b.onrender.com/api/stats/summary \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## **4. Core Modules Summary**
- **Authentication:** JWT-based login/signup with role assumptions.
- **Inventory:** CRUD, search, pagination, and bulk CSV upload.
- **Invoices:** Auto-generated on purchase, tracking paid/unpaid status.
- **Analytics:** Data for dashboard cards, sales graphs, and top products.
- **Cron Jobs:** Hourly stock status checks for "Out of Stock" products.
