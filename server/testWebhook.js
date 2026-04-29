const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Item = require('./src/models/Item');
  const item = await Item.findOne();
  
  if (!item) {
    console.log("No items found in DB.");
    process.exit(1);
  }

  async function testWebhook(source) {
    const payload = {
      source: source,
      externalOrderId: `${source.toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
      items: [
        {
          item: item._id,
          name: item.name,
          price: item.price,
          qty: 2,
          taxRate: item.taxRate
        }
      ]
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders/webhook/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`✅ [${source}] Webhook response:`, data);
    } catch (err) {
      console.error(`❌ [${source}] Error:`, err.message);
    }
  }

  await testWebhook('zomato');
  await testWebhook('swiggy');
  
  process.exit(0);
}

run();
