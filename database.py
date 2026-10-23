"""
database.py — Markus E-Commerce Database Layer
SQLite-backed persistent database with ACID compliance, automated migrations,
and initial mock product seeding.
"""

import sqlite3
import json
import os
from datetime import datetime

DB_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(DB_DIR) == 'backend':
    DB_PATH = os.path.join(DB_DIR, '..', 'markus.db')
else:
    DB_PATH = os.path.join(DB_DIR, 'markus.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Products Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL NOT NULL,
        discount INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 100,
        gst_percent INTEGER DEFAULT 18,
        hsn TEXT DEFAULT '8537',
        gst_category TEXT DEFAULT 'Electronics',
        badges_json TEXT DEFAULT '[]',
        emoji TEXT DEFAULT '📦',
        tags_json TEXT DEFAULT '[]',
        description TEXT,
        specs_json TEXT DEFAULT '{}',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Orders Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        pincode TEXT NOT NULL,
        gstin TEXT,
        payment_method TEXT DEFAULT 'upi',
        payment_status TEXT DEFAULT 'completed',
        total_amount REAL NOT NULL,
        gst_amount REAL DEFAULT 0,
        items_json TEXT NOT NULL,
        status TEXT DEFAULT 'processing',
        awb_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 3. Custom Inquiries (Gerber & 3D Print orders)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        service_type TEXT NOT NULL, -- 'gerber' or '3dprint'
        customer_name TEXT,
        customer_phone TEXT NOT NULL,
        file_name TEXT,
        file_path TEXT,
        params_json TEXT DEFAULT '{}',
        estimated_price REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 4. Users Table (Admin & Customers)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()

    # Seed products if empty
    cursor.execute('SELECT COUNT(*) as count FROM products')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_products(conn)

    conn.close()

def seed_products(conn):
    initial_products = [
        {
            "id": "elec-001", "category": "electronics", "brand": "Markus Kits",
            "name": "Arduino Uno Starter Kit with 30+ Components",
            "price": 899, "original_price": 1499, "discount": 40,
            "rating": 4.7, "review_count": 312, "stock": 150, "gst_percent": 18,
            "hsn": "8537", "gst_category": "Electronic Components",
            "badges": ["bestseller"], "emoji": "⚡",
            "tags": ["arduino", "starter", "electronics", "kit"],
            "description": "Complete Arduino Uno kit with breadboard, LEDs, resistors, sensors, and full assembly guide video.",
            "specs": {"Microcontroller": "ATmega328P", "Voltage": "5V", "Digital I/O": "14", "Components": "30+"}
        },
        {
            "id": "elec-002", "category": "electronics", "brand": "Markus Kits",
            "name": "ESP32 WiFi + Bluetooth IoT Development Kit",
            "price": 649, "original_price": 999, "discount": 35,
            "rating": 4.8, "review_count": 198, "stock": 80, "gst_percent": 18,
            "hsn": "8471", "gst_category": "Electronic Components",
            "badges": ["new"], "emoji": "📡",
            "tags": ["esp32", "iot", "wifi", "bluetooth"],
            "description": "ESP32 development board with sensors, OLED display, and complete IoT project guide.",
            "specs": {"WiFi": "802.11 b/g/n", "Bluetooth": "4.2/BLE", "RAM": "520KB", "Flash": "4MB"}
        },
        {
            "id": "elec-003", "category": "electronics", "brand": "Markus Kits",
            "name": "Raspberry Pi 4B Complete Starter Kit 4GB",
            "price": 5499, "original_price": 6999, "discount": 21,
            "rating": 4.9, "review_count": 521, "stock": 25, "gst_percent": 18,
            "hsn": "8471", "gst_category": "Single Board Computer",
            "badges": ["hot"], "emoji": "🖥️",
            "tags": ["raspberry pi", "linux", "sbc"],
            "description": "Complete RPi 4 4GB kit with case, power supply, SD card pre-loaded with Raspberry Pi OS.",
            "specs": {"CPU": "Cortex-A72 1.8GHz", "RAM": "4GB", "USB": "2x USB 3.0", "Display": "Dual 4K HDMI"}
        },
        {
            "id": "elec-004", "category": "electronics", "brand": "Markus Kits",
            "name": "Sensor Pack — 37-in-1 Sensor Module Kit",
            "price": 599, "original_price": 999, "discount": 40,
            "rating": 4.5, "review_count": 421, "stock": 200, "gst_percent": 18,
            "hsn": "8542", "gst_category": "Electronic Sensors",
            "badges": [], "emoji": "🔬",
            "tags": ["sensor", "arduino", "kit", "modules"],
            "description": "37-piece sensor kit: temperature, humidity, IR, ultrasonic, gyro, and more.",
            "specs": {"Sensors": "37 types", "Compatibility": "Arduino/RPi", "Interface": "Digital/Analog", "Voltage": "3.3V/5V"}
        },
        {
            "id": "robot-001", "category": "robotics", "brand": "Markus Robo",
            "name": "Desk Robo — 6-DOF Desktop Robotic Arm Kit",
            "price": 2499, "original_price": 3999, "discount": 38,
            "rating": 4.9, "review_count": 284, "stock": 50, "gst_percent": 18,
            "hsn": "8479", "gst_category": "Robotic Kit",
            "badges": ["bestseller"], "emoji": "🦾",
            "tags": ["robot", "arm", "arduino", "diy"],
            "description": "Build your own 6-DOF desktop robotic arm. Arduino-powered with full assembly video guide.",
            "specs": {"Degrees of Freedom": "6-DOF", "Controller": "Arduino Nano", "Servos": "6x MG996R", "Payload": "200g"}
        },
        {
            "id": "robot-002", "category": "robotics", "brand": "Markus Robo",
            "name": "Octa Robo — 8-Leg Spider Robot Kit",
            "price": 3299, "original_price": 4999, "discount": 34,
            "rating": 4.8, "review_count": 156, "stock": 30, "gst_percent": 18,
            "hsn": "8479", "gst_category": "Robotic Kit",
            "badges": ["new"], "emoji": "🕷️",
            "tags": ["robot", "spider", "bluetooth", "servo"],
            "description": "Build an 8-legged spider robot with Bluetooth app control. Complete DIY kit with instructional video.",
            "specs": {"Legs": "8", "Servos": "16x SG90", "Controller": "ESP32", "Control": "Bluetooth App"}
        },
        {
            "id": "robot-003", "category": "robotics", "brand": "Markus Robo",
            "name": "Mini Racing Drone Kit — DIY Build & Fly",
            "price": 4299, "original_price": 6499, "discount": 34,
            "rating": 4.6, "review_count": 89, "stock": 20, "gst_percent": 18,
            "hsn": "8806", "gst_category": "Unmanned Aircraft",
            "badges": ["hot"], "emoji": "🚁",
            "tags": ["drone", "racing", "fpv", "diy"],
            "description": "Build your own racing drone from scratch. Includes frame, motors, ESCs, flight controller, and goggles.",
            "specs": {"Frame": "210mm", "Motors": "2204 2300KV", "Flight Time": "10-12 min", "Range": "500m"}
        },
        {
            "id": "print-001", "category": "3dprint", "brand": "Markus Print",
            "name": "Custom 3D Printed Enclosure — Any Design",
            "price": 299, "original_price": 499, "discount": 40,
            "rating": 4.7, "review_count": 445, "stock": 999, "gst_percent": 18,
            "hsn": "3926", "gst_category": "3D Printed Parts",
            "badges": ["new"], "emoji": "🖨️",
            "tags": ["3d print", "custom", "enclosure", "pla"],
            "description": "Upload your STL file and get a precision 3D printed part. PLA/ABS/PETG options. Pan-India shipping.",
            "specs": {"Material": "PLA / ABS / PETG", "Layer": "0.2mm", "Infill": "Custom", "Color": "20+ options"}
        },
        {
            "id": "pcb-001", "category": "gerber", "brand": "Markus PCB",
            "name": "Custom PCB Fabrication — 10x Boards (100x100mm)",
            "price": 499, "original_price": 799, "discount": 38,
            "rating": 4.9, "review_count": 89, "stock": 999, "gst_percent": 18,
            "hsn": "8534", "gst_category": "PCB",
            "badges": ["new"], "emoji": "📐",
            "tags": ["pcb", "gerber", "custom", "fabrication"],
            "description": "Upload your Gerber file, get 10 high-quality PCBs in 5-7 days. 1-4 layer support.",
            "specs": {"Layers": "1-4", "Min Track": "0.1mm", "Finish": "HASL/ENIG", "Delivery": "5-7 days"}
        },
        {
            "id": "laptop-001", "category": "laptops", "brand": "Certified Refurbished",
            "name": "Dell Latitude E7480 — i5 7th Gen, 8GB, 256GB SSD",
            "price": 16999, "original_price": 25000, "discount": 32,
            "rating": 4.5, "review_count": 203, "stock": 8, "gst_percent": 12,
            "hsn": "8471", "gst_category": "Laptop Computer",
            "badges": ["limited"], "emoji": "💻",
            "tags": ["laptop", "dell", "i5", "refurbished"],
            "description": "Certified refurbished Dell Latitude. Tested, cleaned, Windows 11 Pro installed. 6-month warranty.",
            "specs": {"CPU": "Intel i5-7300U", "RAM": "8GB DDR4", "SSD": "256GB", "Display": '14" FHD', "OS": "Windows 11 Pro"}
        },
        {
            "id": "fashion-001", "category": "fashion", "brand": "Markus Style",
            "name": "Maker Culture Oversized Hoodie — Circuit Print",
            "price": 799, "original_price": 1299, "discount": 38,
            "rating": 4.6, "review_count": 167, "stock": 200, "gst_percent": 5,
            "hsn": "6110", "gst_category": "Apparel",
            "badges": ["new"], "emoji": "👕",
            "tags": ["hoodie", "maker", "fashion", "circuit"],
            "description": "Soft cotton-blend hoodie with glow-in-dark circuit board print. Perfect for makers and geeks.",
            "specs": {"Material": "80% Cotton 20% Polyester", "Fit": "Oversized", "Print": "Glow in Dark", "Sizes": "S-3XL"}
        },
        {
            "id": "decor-001", "category": "homedecor", "brand": "Markus Home",
            "name": "LED Circuit Board Desk Lamp — Warm White",
            "price": 1299, "original_price": 1999, "discount": 35,
            "rating": 4.8, "review_count": 312, "stock": 75, "gst_percent": 18,
            "hsn": "9405", "gst_category": "Lamps & Lighting",
            "badges": ["bestseller"], "emoji": "💡",
            "tags": ["lamp", "led", "desk", "decor", "circuit"],
            "description": "Unique circuit-board-inspired desk lamp with warm/cool white modes. USB-powered, touch control.",
            "specs": {"Power": "10W LED", "Color Temp": "3000K/6500K", "Input": "USB-C 5V", "Modes": "3 brightness"}
        }
    ]

    cursor = conn.cursor()
    for p in initial_products:
        cursor.execute('''
        INSERT OR REPLACE INTO products (
            id, name, category, brand, price, original_price, discount,
            rating, review_count, stock, gst_percent, hsn, gst_category,
            badges_json, emoji, tags_json, description, specs_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p['id'], p['name'], p['category'], p['brand'], p['price'], p['original_price'], p['discount'],
            p['rating'], p['review_count'], p['stock'], p['gst_percent'], p['hsn'], p['gst_category'],
            json.dumps(p['badges']), p['emoji'], json.dumps(p['tags']), p['description'], json.dumps(p['specs'])
        ))

    # Add default admin user (markus_admin / admin123)
    cursor.execute('''
    INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', ('admin-01', 'Markus Superadmin', 'admin@markus.com', '8957271609', 'admin123', 'admin'))

    conn.commit()

# Product Helpers
def get_all_products(category=None, search=None):
    conn = get_db()
    cursor = conn.cursor()
    query = 'SELECT * FROM products WHERE 1=1'
    params = []

    if category:
        query += ' AND category = ?'
        params.append(category)

    if search:
        query += ' AND (name LIKE ? OR description LIKE ? OR tags_json LIKE ?)'
        wildcard = f'%{search}%'
        params.extend([wildcard, wildcard, wildcard])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d['badges'] = json.loads(d['badges_json'])
        d['tags'] = json.loads(d['tags_json'])
        d['specs'] = json.loads(d['specs_json'])
        result.append(d)
    return result

def get_product(product_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d['badges'] = json.loads(d['badges_json'])
    d['tags'] = json.loads(d['tags_json'])
    d['specs'] = json.loads(d['specs_json'])
    return d

# Order Helpers
def create_order(order_data):
    conn = get_db()
    cursor = conn.cursor()

    order_id = f"MRK-{datetime.now().strftime('%Y%m%d')}-{os.urandom(2).hex().upper()}"
    cust = order_data.get('customer', {})
    items = order_data.get('items', [])
    total = order_data.get('total', 0)
    gst = order_data.get('gst', 0)

    cursor.execute('''
    INSERT INTO orders (
        id, customer_name, customer_phone, customer_email,
        address, city, pincode, gstin, payment_method,
        payment_status, total_amount, gst_amount, items_json, status, awb_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        order_id,
        cust.get('name', 'Customer'),
        cust.get('phone', ''),
        cust.get('email', ''),
        cust.get('address', ''),
        cust.get('city', ''),
        cust.get('pincode', ''),
        cust.get('gstin', ''),
        order_data.get('paymentMethod', 'upi'),
        'completed',
        total,
        gst,
        json.dumps(items),
        'processing',
        f"BD-{os.urandom(4).hex().upper()}"
    ))

    # Reduce product stock
    for item in items:
        pid = item.get('productId')
        qty = item.get('quantity', 1)
        if pid:
            cursor.execute('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', (qty, pid))

    conn.commit()
    conn.close()
    return order_id

def get_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        d = dict(r)
        d['items'] = json.loads(d['items_json'])
        d['customer'] = {
            'name': d['customer_name'],
            'phone': d['customer_phone'],
            'email': d['customer_email'],
            'address': d['address'],
            'city': d['city'],
            'pincode': d['pincode'],
            'gstin': d['gstin']
        }
        orders.append(d)
    return orders

def get_order_by_id(order_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d['items'] = json.loads(d['items_json'])
    d['customer'] = {
        'name': d['customer_name'],
        'phone': d['customer_phone'],
        'email': d['customer_email'],
        'address': d['address'],
        'city': d['city'],
        'pincode': d['pincode'],
        'gstin': d['gstin']
    }
    return d

def update_order_status(order_id, new_status, awb=None):
    conn = get_db()
    cursor = conn.cursor()
    if awb:
        cursor.execute('UPDATE orders SET status = ?, awb_number = ? WHERE id = ?', (new_status, awb, order_id))
    else:
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
    conn.commit()
    conn.close()
    return True

# Inquiry Helpers
def create_inquiry(service_type, phone, name, file_name, file_path, params, est_price):
    conn = get_db()
    cursor = conn.cursor()
    inq_id = f"INQ-{datetime.now().strftime('%m%d')}-{os.urandom(2).hex().upper()}"
    cursor.execute('''
    INSERT INTO inquiries (id, service_type, customer_name, customer_phone, file_name, file_path, params_json, estimated_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (inq_id, service_type, name, phone, file_name, file_path, json.dumps(params), est_price))
    conn.commit()
    conn.close()
    return inq_id

def get_inquiries():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM inquiries ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d['params'] = json.loads(d['params_json'])
        res.append(d)
    return res

# Admin Stats
def get_admin_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as gross_revenue, COALESCE(SUM(gst_amount), 0) as total_gst FROM orders')
    row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'processing'")
    pending = cursor.fetchone()['pending_orders']

    cursor.execute("SELECT COUNT(*) as total_inquiries FROM inquiries")
    inquiries_count = cursor.fetchone()['total_inquiries']

    conn.close()
    return {
        "total_orders": row['total_orders'],
        "gross_revenue": round(row['gross_revenue'], 2),
        "total_gst": round(row['total_gst'], 2),
        "pending_orders": pending,
        "total_inquiries": inquiries_count
    }
