# Ebook Store

## Current State
New project, nothing built yet.

## Requested Changes (Diff)

### Add
- Public storefront where buyers can browse and purchase PDF ebooks
- Each ebook has a title, description, cover image, price, and a downloadable PDF file
- Stripe payment integration so buyers can pay by credit/debit card
- After successful payment, buyer gets a download link for the PDF
- Admin panel (login required) to upload new PDFs, set title/description/price, and manage existing listings
- Blob storage for storing PDF files and cover images

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Backend: ebook listing management (create, read, update, delete), Stripe checkout session creation, purchase verification, PDF download access control
2. Frontend: public storefront page listing all ebooks with cover, title, price, buy button; Stripe checkout flow; success page with download link; admin panel for uploading and managing ebooks
3. Blob storage for PDF files and cover images
4. Authorization for admin-only access to management panel
