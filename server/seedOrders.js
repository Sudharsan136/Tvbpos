require('dotenv').config();
const mongoose = require('mongoose');

const Order = require('./src/models/Order');
const Item = require('./src/models/Item');
const Table = require('./src/models/Table');
const User = require('./src/models/User');

const seedOrders = async () => {
  console.log('🔌 Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing orders
  console.log('🧹 Clearing old orders...');
  await Order.deleteMany();
  console.log('✅ Old orders cleared');

  // Fetch reference data
  const items = await Item.find({});
  const tables = await Table.find({});
  const users = await User.find({});

  if (items.length === 0 || tables.length === 0 || users.length === 0) {
    console.error('❌ Missing seeded database entries. Please run npm run seed (or node seed.js) first!');
    process.exit(1);
  }

  const cashier = users.find(u => u.role === 'cashier') || users[0];
  const admin = users.find(u => u.role === 'admin') || users[0];

  console.log('🌱 Seed details:');
  console.log(`- Items: ${items.length}`);
  console.log(`- Tables: ${tables.length}`);
  console.log(`- Cashier: ${cashier.name}`);

  const mockOrders = [];
  const paymentModes = ['cash', 'card', 'upi', 'split'];
  const orderTypes = ['dine_in', 'takeaway', 'online'];
  const sources = ['pos', 'swiggy', 'zomato'];

  const now = new Date();
  
  // Seed 180 orders spread over the last 30 days
  console.log('📦 Generating 180 realistic orders...');
  
  let billCounter = 1000;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    // Generate between 4 and 10 orders per day
    const numOrdersToday = Math.floor(Math.random() * 7) + 4;
    
    for (let i = 0; i < numOrdersToday; i++) {
      const orderDate = new Date();
      orderDate.setDate(now.getDate() - dayOffset);

      // Distribute hours realistically to simulate peak lunch & dinner rushes:
      // - Lunch: 12 PM - 3 PM (hours 12, 13, 14)
      // - Dinner: 7 PM - 10 PM (hours 19, 20, 21)
      // - Afternoon/Slack: random other hours
      const period = Math.random();
      let hour = 12;
      if (period < 0.35) {
        // Lunch rush
        hour = [12, 13, 14][Math.floor(Math.random() * 3)];
      } else if (period < 0.85) {
        // Dinner rush
        hour = [19, 20, 21, 22][Math.floor(Math.random() * 4)];
      } else {
        // Afternoon/Slack
        hour = [15, 16, 17, 18][Math.floor(Math.random() * 4)];
      }

      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      orderDate.setHours(hour, minute, second);

      // Select random 1 to 4 unique items
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedItems = [];
      const usedItemIndices = new Set();

      while (selectedItems.length < numItems) {
        const itemIdx = Math.floor(Math.random() * items.length);
        if (!usedItemIndices.has(itemIdx)) {
          usedItemIndices.add(itemIdx);
          selectedItems.push(items[itemIdx]);
        }
      }

      // Format items subdocuments
      const orderItems = selectedItems.map(item => {
        const qty = Math.floor(Math.random() * 3) + 1; // Qty 1-3
        return {
          item: item._id,
          name: item.name,
          price: item.price,
          taxRate: item.taxRate || 5,
          qty,
          notes: Math.random() < 0.15 ? 'Extra spicy' : '',
          kotSent: true
        };
      });

      // Calculate Financials
      let subtotal = 0;
      let taxAmount = 0;
      
      orderItems.forEach(oi => {
        const itemTotal = oi.price * oi.qty;
        subtotal += itemTotal;
        taxAmount += parseFloat((itemTotal * (oi.taxRate / 100)).toFixed(2));
      });

      // CGST/SGST splitting
      const cgst = parseFloat((taxAmount / 2).toFixed(2));
      const sgst = parseFloat((taxAmount / 2).toFixed(2));

      // Discounts (10% discount on 20% of orders)
      const hasDiscount = Math.random() < 0.20;
      const discountPercent = hasDiscount ? 10 : 0;
      const discountAmount = hasDiscount ? parseFloat((subtotal * 0.1).toFixed(2)) : 0;

      const taxableAmount = subtotal - discountAmount;
      const grandTotal = Math.round(taxableAmount + taxAmount);

      // Order Type & Source
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      
      let source = 'pos';
      if (orderType === 'online') {
        source = sources[Math.floor(Math.random() * (sources.length - 1)) + 1]; // swiggy or zomato
      } else {
        source = 'pos';
      }

      // Assign Table for Dine In
      let tableId = null;
      if (orderType === 'dine_in') {
        const randomTable = tables[Math.floor(Math.random() * tables.length)];
        tableId = randomTable._id;
      }

      const paymentMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];
      billCounter++;

      mockOrders.push({
        billNumber: `BILL-${billCounter}`,
        table: tableId,
        customer: null,
        items: orderItems,
        orderType,
        source,
        externalOrderId: source !== 'pos' ? `EXT-${Math.floor(Math.random() * 900000) + 100000}` : null,
        subtotal,
        discountPercent,
        discountAmount,
        taxableAmount,
        cgst,
        sgst,
        taxAmount,
        grandTotal,
        paymentMode,
        amountPaid: grandTotal,
        changeReturned: 0,
        status: 'paid',
        createdBy: Math.random() < 0.7 ? cashier._id : admin._id,
        paidAt: orderDate,
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }
  }

  // Insert mock orders
  console.log('💾 Inserting orders to database...');
  await Order.insertMany(mockOrders);
  console.log(`🎉 Successfully seeded ${mockOrders.length} historical sales orders!`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
};

seedOrders().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
