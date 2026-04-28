import { create } from 'zustand';

const useTableStore = create((set, get) => ({
  tables: [],
  setTables: (tables) => set({ tables }),
  updateTableStatus: (tableId, status) =>
    set({
      tables: get().tables.map((t) =>
        t._id === tableId ? { ...t, status } : t
      ),
    }),
}));

export default useTableStore;
