# Markus launch checklist

## Included improvements
- Product cards use category-relevant photography with lazy loading and graceful fallback.
- Checkout validates required address, phone, and Indian PIN code fields.
- Card/NetBanking is not offered as an active payment path until a gateway is configured.
- Orders must be accepted by the backend; browser-only/offline order success has been removed.
- Backend recalculates order line prices and totals from the product catalogue and checks quantity/stock.
- Database no longer marks UPI orders as paid automatically; COD orders have a distinct payment status.
- Flask debug mode is disabled by default.

## Required before accepting real customers
1. **Replace catalogue content** in `backend/database.py` seed data with your verified SKUs, prices, tax rates, stock, product descriptions, and actual product photos. Existing seed products/ratings/review counts are starter/demo catalogue content and must not be represented as verified inventory or genuine customer reviews.
2. **Configure payments.** UPI checkout needs a verified merchant UPI ID and a server-side payment confirmation/reconciliation process. The page intentionally does not claim UPI payments are automatically verified. Card/NetBanking requires a provider such as Razorpay/Cashfree/PayU, credentials, webhook signature verification, and successful-payment callbacks.
3. Set a strong `SECRET_KEY` / authentication secrets via environment variables and review admin authentication before public deployment.
4. Configure HTTPS, production WSGI hosting, database backups, rate limiting, logging/monitoring, and restricted CORS.
5. Verify the business contact numbers, WhatsApp recipient, shipping fees/regions, return/refund policy, privacy policy, terms, GST details, and customer support information.
6. Test the complete customer and admin journey in staging: stock conflicts, duplicate submits, COD, failed payments, refunds/cancellations, order tracking, and mobile layouts.

## Run locally
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python server.py
```
Open `http://localhost:5000`.

**Important:** This archive is an improved launch candidate, not a claim of fully production-certified payment processing. Real payment gateways, verified inventory, legal/business details, and deployment secrets require the store owner's configuration.
