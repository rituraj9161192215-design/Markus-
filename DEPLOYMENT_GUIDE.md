# 🚀 MARKUS E-COMMERCE PLATFORM — COMPLETE DEPLOYMENT & BUSINESS GUIDE

Yeh guide aapko Markus Store ko **apne computer par chalane**, **cloud par 100% FREE deploy karne**, aur **business shuru karne** ka pura step-by-step process batati hai.

---

## 📁 Project Architecture (Full-Stack Backend + Frontend)

```
Markus/
├── server.py              # 🚀 Production Server (Flask REST APIs + Static Website Host)
├── markus.db              # 🗄️ SQLite Database (Products, Orders, Custom Inquiries, Users)
├── requirements.txt       # 📦 Python Dependencies (flask, flask-cors, gunicorn)
├── Procfile               # ☁️ Cloud Procfile (Render / Railway / Heroku)
├── render.yaml            # ⚡ 1-Click Render.com Blueprint
├── start_server.bat       # 🖱️ 1-Click Windows Local Server Launcher
│
├── backend/
│   └── database.py        # Database schema, GST calculations, seed products, order queries
│
├── uploads/               # 📁 Permanent Server Storage for Uploaded Files
│   ├── gerber/            # Stored Gerber ZIP / PCB design files
│   └── 3dmodels/          # Stored STL / OBJ / STEP 3D print models
│
├── css/                   # Styling & Animations
│   ├── main.css           # Flipkart-style dark theme & responsive styles
│   └── animations.css     # Micro-interactions, ripples, and reveals
│
├── js/                    # Client Application Logic
│   ├── store.js           # Live REST API store integration & cart state
│   ├── main.js            # UPI QR Generator & GST Tax Invoice Generator
│   ├── auth.js            # Customer & Admin authentication
│   ├── security.js        # XSS sanitization, GSTIN/Phone input validators
│   └── products.js        # Dynamic product grid renderer
│
├── pages/                 # Full Category & Utility Pages
│   ├── admin.html         # 📊 Admin Dashboard (Revenue, Orders, Inquiries, Stock)
│   ├── cart.html          # 🛒 Shopping Cart with Coupon & GST calculation
│   ├── checkout.html      # 💳 256-bit SSL Checkout with UPI QR & Address Capture
│   ├── order-success.html # 🎉 Order Confirmation & GST Invoice download
│   ├── track.html         # 🚚 Live Shipment Tracking timeline
│   ├── orders.html        # 📄 Order History & 1-Click Tax Invoice Printing
│   ├── wishlist.html      # ❤️ Saved items
│   ├── category-electronics.html  # ⚡ Components & Kits
│   ├── category-robotics.html     # 🦾 Robos, Drones & Kits
│   ├── category-gerber.html       # 📐 Gerber ZIP Upload & PCB Quotes
│   ├── category-3dprint.html      # 🖨️ 3D Model STL Upload & Quotes
│   ├── category-fashion.html      # 👕 Maker Lifestyle Apparel
│   ├── category-homedecor.html    # 💡 Tech & Ambient Home Decors
│   └── category-laptops.html      # 💻 2nd Hand Certified Laptops
│
└── index.html             # 🏠 Main Storefront
```

---

## 1. Local Testing (Apne Computer Par Kaise Chalayein)

Aapko bas **1-Click** karna hai:

1. **Folder kholein:** `c:\Users\Rituraj\OneDrive\Desktop\Markus`
2. **`start_server.bat`** file par double-click karein.
3. Server start ho jayega!
4. Browser me open karein:
   - **Storefront:** `http://localhost:5000`
   - **Admin Panel:** `http://localhost:5000/pages/admin.html`

*(Alternative command terminal se: `python server.py`)*

---

## 2. Cloud Par FREE Deploy Kaise Karein (Render.com par 5 Minutes Me)

**Render.com** par Python + SQLite + Full Website **100% Free** host hoti hai with HTTPS SSL Security:

### Step 1: GitHub par Code Upload Karein
1. [github.com](https://github.com) par free account banayein aur ek naya repository banayein (e.g. `markus-store`).
2. Is Markus folder ki sabhi files ko us repository me push/upload kar dein.

### Step 2: Render.com par Connect Karein
1. [render.com](https://render.com) par free Sign In karein.
2. Dashboard me **"New +"** -> **"Web Service"** select karein.
3. Apna GitHub repository (`markus-store`) connect karein.
4. Settings fill karein:
   - **Name:** `markus-store`
   - **Region:** Singapore / Frankfurt
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
   - **Instance Type:** `Free`
5. **"Create Web Service"** par click karein!

Aapko 2 minute ke andar aapki **live production URL** mil jayegi (e.g. `https://markus-store.onrender.com`).

---

## 3. Apne Custom Domain (e.g. markus.in / markusstore.com) Se Connect Karna

Agar aapke paas domain hai (GoDaddy / Namecheap / Hostinger):
1. Render.com me apne Web Service ke **Settings** -> **Custom Domains** me jayein.
2. Apna domain daalein (e.g. `www.markus.in`).
3. Render aapko ek `CNAME` record dega.
4. Apne GoDaddy / Hostinger ke DNS settings me jakar woh `CNAME` paste kar dein.
5. Render automatically **Free SSL Certificate (HTTPS 🔒)** activate kar dega!

---

## 4. Business Operations & WhatsApp Integration

Aapke platforms me business ke liye sabhi numbers configure hain:

| Service / Action | Connected Number / ID | Kaha Set Hai |
|---|---|---|
| **UPI Direct Payment** | `8957271609@upi` | Checkout page par QR code & Mobile UPI |
| **Order Alerts to Owner** | `8957271609` | Naya order aane par automatic WhatsApp Alert |
| **3D Print Custom Orders** | `8468013826` | 3D print page & Header button |
| **PCB Custom Orders** | `8765450399` | Gerber page & Header button |
| **General WhatsApp Support** | `8957271609` | Floating chat icon |

### Jab Customer Order Karta Hai:
1. Customer checkout par details bharta hai aur UPI se pay karta hai.
2. Order database me save ho jata hai (`MRK-YYYYMMDD-XXXX`).
3. Customer ko turant **GST Tax Invoice (PDF)** mil jata hai.
4. Store Admin ke liye pre-formatted WhatsApp message ready ho jata hai.
5. Admin dashboard (`/pages/admin.html`) par live status dikhta hai jahan se aap **Shipped / Delivered** mark kar sakte hain aur tracking AWB number dal sakte hain.

---

## 5. Uploaded Gerber & 3D Print Files Kaha Milengi?
Jab koi customer custom PCB ya 3D model upload karta hai:
- Files server ke `uploads/gerber/` aur `uploads/3dmodels/` folder me safely save ho jati hain.
- Aap **Admin Panel (`/pages/admin.html`)** me jakar **"Custom 3D & Gerber PCB Inquiries"** table se direct **"📥 Download File"** par click karke file inspect kar sakte hain aur quotation finalize kar sakte hain!

---

🎉 **Aapka Markus E-Commerce Business Platform ab 100% production-ready aur deployable hai!**
