Steppinstyle POS System
A modern, responsive Point of Sale (POS) system built with React for shoe stores. This application helps manage inventory, process sales, and generate daily sales reports.

Features
🛍️ Sales Management
Process shoe sales with size selection

Multiple payment methods (Cash, M-Pesa, Card)

Real-time inventory updates

Sales summary and confirmation

📦 Inventory Management
Add new shoe products with detailed size inventory (6-12 including half sizes)

Edit stock quantities in real-time

Delete products with confirmation

Visual stock indicators (red for out-of-stock, yellow for low stock, green for available)

📊 Reports & Analytics
Daily sales tracking

Revenue calculation

Export sales data to CSV

Payment method breakdown

💾 Data Persistence
Automatic local storage saving

Data persists between browser sessions

Getting Started
Prerequisites
Node.js (v14 or higher)

npm or yarn

Installation
Clone or download the project files

Install dependencies:

bash
npm install
Start the development server:

bash
npm start
Open http://localhost:3000 to view the app in your browser

Usage
Making a Sale
Navigate to the "Make Sale" tab

Select a product from the dropdown

Choose an available size

Adjust quantity using +/- buttons or input

Select payment method

Review the sale summary

Click "COMPLETE SALE" to finalize

Managing Inventory
Go to the "Manage Inventory" tab

Click "Add New Product" to create new items

Fill in product name, price, and stock quantities for each size

Click the edit icon (✏️) next to any product to modify stock levels

Click the trash icon (🗑️) to remove a product (with confirmation)

Generating Reports
Visit the "Sales Reports" tab

View today's sales in a detailed table

Click "Export CSV" to download today's sales data

Data Structure
Products
javascript
{
  id: Number,
  name: String,
  price: Number,
  sizes: {
    6: Number, 6.5: Number, 7: Number, 7.5: Number,
    8: Number, 8.5: Number, 9: Number, 9.5: Number,
    10: Number, 10.5: Number, 11: Number, 11.5: Number,
    12: Number
  },
  dateAdded: String (ISO date)
}
Sales
javascript
{
  id: Number,
  product: String,
  size: String,
  quantity: Number,
  unitPrice: Number,
  total: Number,
  paymentMethod: String,
  timestamp: String (ISO date)
}
Browser Compatibility
This app works in all modern browsers that support:

ES6+ JavaScript features

CSS Grid and Flexbox

Local Storage API

Technologies Used
React 18 with Hooks (useState, useEffect)

Lucide React (for icons)

Tailwind CSS (for styling)

Local Storage (for data persistence)

Customization
You can easily customize:

Color scheme by modifying Tailwind classes

Shoe sizes by updating the sizes object in the code

Currency symbol by replacing the "$" throughout the code

Payment methods by updating the options in the select input

Troubleshooting
If data isn't persisting, check if your browser allows local storage

If the app doesn't load, ensure all dependencies are properly installed

Future Enhancements
Potential improvements for this system:

User authentication

Backend integration

Advanced reporting with charts

Barcode scanning support

Customer management

Multi-day sales reports

Inventory alerts for low stock

License
This project is open source and available under the MIT License.
