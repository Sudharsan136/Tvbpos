import { forwardRef } from 'react';

const PrintableReceipt = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const date = new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-sm leading-tight" style={{ width: '300px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="font-extrabold text-xl mb-1">Topi Vappa Biriyani</h1>
        <p className="text-xs">123 Food Street, Food City</p>
        <p className="text-xs">Ph: +91 9876543210</p>
        <p className="text-xs mt-1 font-bold border-b border-black pb-2">GSTIN: 33ABCDE1234F1Z5</p>
      </div>

      {/* Meta Info */}
      <div className="mb-4 text-xs border-b border-black pb-2">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span className="font-bold">{order.billNumber || 'Pending'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="font-bold uppercase">
            {order.orderType === 'online' ? order.source : `Dine-In (T-${order.table?.number || ''})`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{order.createdBy?.name || 'Admin'}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left pb-1 font-bold w-1/2">Item</th>
            <th className="text-center pb-1 font-bold w-1/6">Qty</th>
            <th className="text-right pb-1 font-bold w-1/6">Rate</th>
            <th className="text-right pb-1 font-bold w-1/6">Amt</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300 border-dashed">
              <td className="py-1 break-words">{item.name}</td>
              <td className="text-center py-1">{item.qty}</td>
              <td className="text-right py-1">{item.price}</td>
              <td className="text-right py-1">{item.price * item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-xs border-t-2 border-black pt-2 mb-4 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{order.subtotal?.toFixed(2)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Discount ({order.discountPercent}%):</span>
            <span>- ₹{order.discountAmount?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>CGST (2.5%):</span>
          <span>₹{order.cgst?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST (2.5%):</span>
          <span>₹{order.sgst?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-extrabold text-base border-t border-black mt-1 pt-1">
          <span>GRAND TOTAL:</span>
          <span>₹{order.grandTotal?.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs border-t border-black pt-4">
        <p className="font-bold">Thank you for visiting!</p>
        <p>Please come again.</p>
        <p className="mt-2 text-[10px] text-gray-500">Software by Antigravity POS</p>
      </div>
    </div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;
