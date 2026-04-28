const KOT = require('../models/KOT');

const registerKotSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins a room based on their role
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`📡 ${socket.id} joined room: ${room}`);
    });

    // Kitchen marks a KOT item as done
    socket.on('kot_item_done', async ({ kotId, itemIndex }) => {
      try {
        const kot = await KOT.findById(kotId);
        if (!kot) return;

        kot.items[itemIndex].status = 'done';

        // Check if all items are done
        const allDone = kot.items.every((i) => i.status === 'done');
        if (allDone) kot.status = 'completed';
        else if (kot.items.some((i) => i.status === 'done')) kot.status = 'in-progress';

        await kot.save();

        // Notify all clients of the update
        io.emit('kot_updated', {
          kotId: kot._id,
          items: kot.items,
          status: kot.status,
        });

        console.log(`✅ KOT ${kot.kotNumber} item ${itemIndex} marked done`);
      } catch (err) {
        console.error('kotSocket error:', err.message);
      }
    });

    // Kitchen marks entire KOT as done
    socket.on('kot_complete', async ({ kotId }) => {
      try {
        const kot = await KOT.findByIdAndUpdate(
          kotId,
          { status: 'completed', 'items.$[].status': 'done' },
          { new: true }
        );
        if (kot) io.emit('kot_updated', { kotId: kot._id, status: 'completed', items: kot.items });
      } catch (err) {
        console.error('kotSocket error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = registerKotSocket;
