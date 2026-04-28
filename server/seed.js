require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Table = require('./src/models/Table');
const Item = require('./src/models/Item');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Seeding database...');

  // Clear
  await User.deleteMany();
  await Table.deleteMany();
  await Item.deleteMany();

  // Users
  await User.create([
    { name: 'Admin User', email: 'admin@resto.com', password: 'admin123', role: 'admin' },
    { name: 'Cashier One', email: 'cashier@resto.com', password: 'cashier123', role: 'cashier' },
  ]);
  console.log('✅ Users seeded');

  // Tables
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({
      number: i,
      name: `T-${i}`,
      capacity: i <= 8 ? 4 : 6,
      section: i <= 4 ? 'AC Hall' : i <= 8 ? 'Main Hall' : 'Outdoor',
      status: 'available',
    });
  }
  await Table.insertMany(tables);
  console.log('✅ 12 tables seeded');

  // Menu Items
  const items = [
    // Starters
    { name: 'Paneer Tikka', category: 'Starters', price: 280, taxRate: 5, isVeg: true },
    { name: 'Chicken 65', category: 'Starters', price: 320, taxRate: 5, isVeg: false },
    { name: 'Veg Spring Rolls', category: 'Starters', price: 180, taxRate: 5, isVeg: true },
    { name: 'Fish Fry', category: 'Starters', price: 350, taxRate: 5, isVeg: false },
    { name: 'Mushroom Pepper Fry', category: 'Starters', price: 220, taxRate: 5, isVeg: true },

    // Main Course
    { name: 'Butter Chicken', category: 'Main Course', price: 380, taxRate: 5, isVeg: false },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 300, taxRate: 5, isVeg: true },
    { name: 'Dal Makhani', category: 'Main Course', price: 250, taxRate: 5, isVeg: true },
    { name: 'Chicken Biryani', category: 'Main Course', price: 350, taxRate: 5, isVeg: false },
    { name: 'Veg Biryani', category: 'Main Course', price: 280, taxRate: 5, isVeg: true },
    { name: 'Mutton Rogan Josh', category: 'Main Course', price: 450, taxRate: 5, isVeg: false },

    // Breads
    { name: 'Butter Naan', category: 'Breads', price: 60, taxRate: 5, isVeg: true },
    { name: 'Roti', category: 'Breads', price: 30, taxRate: 5, isVeg: true },
    { name: 'Paratha', category: 'Breads', price: 80, taxRate: 5, isVeg: true },
    { name: 'Puri', category: 'Breads', price: 50, taxRate: 5, isVeg: true },

    // Beverages
    { name: 'Mango Lassi', category: 'Beverages', price: 120, taxRate: 5, isVeg: true },
    { name: 'Fresh Lime Soda', category: 'Beverages', price: 80, taxRate: 5, isVeg: true },
    { name: 'Masala Chai', category: 'Beverages', price: 60, taxRate: 5, isVeg: true },
    { name: 'Cold Coffee', category: 'Beverages', price: 150, taxRate: 5, isVeg: true },
    { name: 'Mineral Water', category: 'Beverages', price: 40, taxRate: 0, isVeg: true },

    // Desserts
    { name: 'Gulab Jamun', category: 'Desserts', price: 100, taxRate: 5, isVeg: true },
    { name: 'Ice Cream (2 scoops)', category: 'Desserts', price: 120, taxRate: 5, isVeg: true },
    { name: 'Kheer', category: 'Desserts', price: 80, taxRate: 5, isVeg: true },
  ];
  await Item.insertMany(items);
  console.log(`✅ ${items.length} menu items seeded`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin: admin@resto.com | 🔑 Password: admin123');
  console.log('📧 Cashier: cashier@resto.com | 🔑 Password: cashier123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
