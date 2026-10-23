#!/usr/bin/env python3
"""
server.py — Markus E-Commerce Production Server
Full-stack server providing REST API endpoints, automated database initialization,
secure file uploads (Gerber & 3D models), order processing, GST calculation,
and static website hosting on a single port.
"""

import os
import json
import urllib.parse
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import local database module (works whether database.py is at root or in backend/)
import sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from database import (
        init_db,
        get_all_products,
        get_product,
        create_order,
        get_orders,
        get_order_by_id,
        update_order_status,
        create_inquiry,
        get_inquiries,
        get_admin_stats
    )
except ImportError:
    from backend.database import (
        init_db,
        get_all_products,
        get_product,
        create_order,
        get_orders,
        get_order_by_id,
        update_order_status,
        create_inquiry,
        get_inquiries,
        get_admin_stats
    )

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
GERBER_UPLOAD_DIR = os.path.join(UPLOAD_DIR, 'gerber')
THREED_UPLOAD_DIR = os.path.join(UPLOAD_DIR, '3dmodels')

# Ensure upload directories exist
os.makedirs(GERBER_UPLOAD_DIR, exist_ok=True)
os.makedirs(THREED_UPLOAD_DIR, exist_ok=True)

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 60 * 1024 * 1024  # 60MB max upload limit

ALLOWED_GERBER = {'.zip', '.rar', '.tar', '.7z', '.tgz'}
ALLOWED_3D = {'.stl', '.obj', '.step', '.3mf', '.iges', '.stp'}

# Initialize database on startup
init_db()

# ====================================================================
# STATIC FILE SERVING (Hosts the entire Markus frontend on same port)
# ====================================================================
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/index.html')
def serve_index_explicit():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'pages'), filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ====================================================================
# REST API: SYSTEM HEALTH
# ====================================================================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "platform": "Markus Multi-Category E-Commerce Platform",
        "version": "1.0.0",
        "currency": "INR",
        "whatsapp_support": "8957271609",
        "whatsapp_3d": "8468013826",
        "whatsapp_pcb": "8765450399"
    })

# ====================================================================
# REST API: PRODUCTS
# ====================================================================
@app.route('/api/products', methods=['GET'])
def list_products():
    category = request.args.get('category')
    search = request.args.get('search')
    products = get_all_products(category=category, search=search)
    return jsonify({"success": True, "count": len(products), "products": products})

@app.route('/api/products/<product_id>', methods=['GET'])
def single_product(product_id):
    product = get_product(product_id)
    if not product:
        return jsonify({"success": False, "message": "Product not found"}), 404
    return jsonify({"success": True, "product": product})

# ====================================================================
# REST API: FILE UPLOADS (Gerber & 3D Print STL Files)
# ====================================================================
@app.route('/api/upload/gerber', methods=['POST'])
def upload_gerber():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part in request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_GERBER:
        return jsonify({"success": False, "message": f"Invalid format. Allowed: {', '.join(ALLOWED_GERBER)}"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"gerber_{os.urandom(4).hex()}_{filename}"
    save_path = os.path.join(GERBER_UPLOAD_DIR, unique_name)
    file.save(save_path)

    relative_url = f"/uploads/gerber/{unique_name}"
    return jsonify({
        "success": True,
        "message": "Gerber file uploaded successfully",
        "fileName": filename,
        "uniqueName": unique_name,
        "fileUrl": relative_url,
        "sizeBytes": os.path.getsize(save_path)
    })

@app.route('/api/upload/3dmodel', methods=['POST'])
def upload_3dmodel():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part in request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_3D:
        return jsonify({"success": False, "message": f"Invalid format. Allowed: {', '.join(ALLOWED_3D)}"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"3d_{os.urandom(4).hex()}_{filename}"
    save_path = os.path.join(THREED_UPLOAD_DIR, unique_name)
    file.save(save_path)

    relative_url = f"/uploads/3dmodels/{unique_name}"
    return jsonify({
        "success": True,
        "message": "3D Model file uploaded successfully",
        "fileName": filename,
        "uniqueName": unique_name,
        "fileUrl": relative_url,
        "sizeBytes": os.path.getsize(save_path)
    })

# ====================================================================
# REST API: INQUIRIES (Gerber & 3D Print Custom Quotes)
# ====================================================================
@app.route('/api/inquiries', methods=['POST'])
def submit_inquiry():
    data = request.get_json(force=True) or {}
    service_type = data.get('service_type', 'pcb')
    phone = data.get('customer_phone', '')
    name = data.get('customer_name', 'Customer')
    file_name = data.get('file_name', '')
    file_path = data.get('file_path', '')
    params = data.get('params', {})
    est_price = data.get('estimated_price', 0)

    if not phone:
        return jsonify({"success": False, "message": "Customer phone is required"}), 400

    inq_id = create_inquiry(service_type, phone, name, file_name, file_path, params, est_price)
    return jsonify({"success": True, "inquiryId": inq_id, "message": "Inquiry recorded"})

@app.route('/api/inquiries', methods=['GET'])
def list_inquiries():
    inquiries = get_inquiries()
    return jsonify({"success": True, "inquiries": inquiries})

# ====================================================================
# REST API: ORDERS & CHECKOUT
# ====================================================================
@app.route('/api/orders', methods=['POST'])
def place_order_api():
    data = request.get_json(force=True) or {}
    customer = data.get('customer', {})
    items = data.get('items', [])
    payment_method = str(data.get('paymentMethod', 'cod')).lower()
    if payment_method not in {'cod', 'upi'}:
        return jsonify({"success": False, "message": "This payment method is not currently supported."}), 400
    if not customer.get('name') or not customer.get('phone') or not customer.get('address') or not customer.get('city') or not customer.get('pincode'):
        return jsonify({"success": False, "message": "Complete delivery address is required."}), 400
    if not isinstance(items, list) or not items or len(items) > 50:
        return jsonify({"success": False, "message": "Cart items are invalid or empty."}), 400

    # Recalculate totals using server-side catalogue data, not browser-submitted prices.
    trusted_items = []
    server_total = 0.0
    gst_total = 0.0
    for item in items:
        if not isinstance(item, dict):
            return jsonify({"success": False, "message": "Invalid cart item."}), 400
        pid = str(item.get('productId', ''))
        try:
            qty = int(item.get('quantity', 0))
        except (TypeError, ValueError):
            qty = 0
        product = get_product(pid)
        if not product or qty < 1 or qty > 20:
            return jsonify({"success": False, "message": "A cart item is invalid. Please refresh your cart."}), 400
        stock = int(product.get('stock', 0))
        if qty > stock:
            return jsonify({"success": False, "message": f"Insufficient stock for {product.get('name', 'an item')}."}), 409
        price = float(product.get('price', 0))
        rate = float(product.get('gst_percent', 18))
        server_total += price * qty
        gst_total += (price * qty) * rate / (100 + rate)
        trusted_items.append({**item, 'productId': pid, 'name': product.get('name', item.get('name', 'Item')), 'price': price, 'quantity': qty})
    data['items'] = trusted_items
    data['total'] = round(server_total, 2)
    data['gst'] = round(gst_total, 2)
    total = data['total']
    order_id = create_order(data)

    # Generate Store WhatsApp Alert Link
    item_summary = ", ".join([f"{i.get('name', 'Item')} x{i.get('quantity', 1)}" for i in items])
    wa_msg = (
        f"🚨 *NEW ORDER RECEIVED - MARKUS STORE*\n\n"
        f"📦 *Order ID:* {order_id}\n"
        f"👤 *Customer:* {customer.get('name')} ({customer.get('phone')})\n"
        f"📍 *Address:* {customer.get('address')}, {customer.get('city')} - {customer.get('pincode')}\n"
        f"🛒 *Items:* {item_summary}\n"
        f"💰 *Total:* ₹{total:,.2f} ({data.get('paymentMethod', 'UPI').upper()})\n\n"
        f"Please prepare for packaging & dispatch!"
    )
    wa_alert_url = f"https://wa.me/918957271609?text={urllib.parse.quote(wa_msg)}"

    return jsonify({
        "success": True,
        "orderId": order_id,
        "message": "Order placed and confirmed successfully",
        "waAlertUrl": wa_alert_url
    }), 201

@app.route('/api/orders', methods=['GET'])
def list_orders_api():
    orders = get_orders()
    return jsonify({"success": True, "count": len(orders), "orders": orders})

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_single_order(order_id):
    order = get_order_by_id(order_id)
    if not order:
        return jsonify({"success": False, "message": "Order not found"}), 404
    return jsonify({"success": True, "order": order})

@app.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status_api(order_id):
    data = request.get_json(force=True) or {}
    new_status = data.get('status')
    awb = data.get('awb')
    if not new_status:
        return jsonify({"success": False, "message": "Status is required"}), 400

    success = update_order_status(order_id, new_status, awb)
    return jsonify({"success": success, "message": "Order status updated"})

# ====================================================================
# REST API: ADMIN OPERATIONS & ANALYTICS
# ====================================================================
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    stats = get_admin_stats()
    return jsonify({"success": True, "stats": stats})

# ====================================================================
# MAIN ENTRYPOINT
# ====================================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f"🚀 MARKUS E-COMMERCE SERVER RUNNING")
    print(f"🌐 Local Store URL:   http://localhost:{port}")
    print(f"📊 Admin Dashboard:   http://localhost:{port}/pages/admin.html")
    print(f"💬 Direct WhatsApp:   8957271609 / 8468013826 / 8765450399")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=False)
