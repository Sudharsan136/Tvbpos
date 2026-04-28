import { Search, ShoppingCart, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useCartStore from '../../store/cartStore';

export default function MenuPanel() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    api.get('/items/categories').then((r) => setCategories(['All', ...r.data]));
    api.get('/items?available=true').then((r) => setItems(r.data));
  }, []);

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getQtyInCart = (id) => cartItems.find((i) => i._id === id)?.qty || 0;

  return (
    <div className="flex flex-col h-full bg-[#f9fafb]">
      {/* Search */}
      <div className="p-4 bg-white border-b border-[#f3f4f6]">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-sm placeholder-[#9ca3af] focus:outline-none focus:border-[#16a34a] focus:bg-white transition font-medium" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-[#f3f4f6] shrink-0">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-[#16a34a] text-white shadow-sm shadow-[#16a34a]/20'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#dcfce7] hover:text-[#15803d]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const qty = getQtyInCart(item._id);
            return (
              <button key={item._id} onClick={() => addItem(item)}
                className="text-left p-4 rounded-2xl bg-white border-2 border-[#e5e7eb] hover:border-[#16a34a] hover:shadow-md transition-all duration-150 group relative">
                {/* Veg indicator */}
                <div className={`absolute top-3 right-3 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                  item.isVeg ? 'border-[#16a34a]' : 'border-[#dc2626]'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
                </div>

                <p className="text-[#111827] text-sm font-bold pr-6 leading-tight">{item.name}</p>
                <p className="text-[#9ca3af] text-xs mt-0.5 font-medium">{item.category}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[#16a34a] font-extrabold">₹{item.price}</span>
                  {qty > 0 ? (
                    <span className="text-xs bg-[#16a34a] text-white px-2 py-0.5 rounded-full font-bold">{qty}×</span>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] group-hover:bg-[#16a34a] group-hover:border-[#16a34a] flex items-center justify-center transition">
                      <Plus size={14} className="text-[#16a34a] group-hover:text-white transition" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-[#9ca3af]">
              <ShoppingCart size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No items found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
