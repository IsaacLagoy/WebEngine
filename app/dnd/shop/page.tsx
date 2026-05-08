"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShopItem, ShopItemData,
  readCollection, addToCollection, removeFromCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";

// ------------------------------------------------------------
// Field configs
// ------------------------------------------------------------

const SHOP_ITEM_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Name",        type: "text",   required: true },
  { key: "description", label: "Description", type: "text",   required: true },
  { key: "price",       label: "Price (gp)",  type: "number", required: true },
];

const SHOP_ITEM_DISPLAY_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Name" },
  { key: "description", label: "Description" },
  { key: "price",       label: "Price", render: (value) => `${Number(value).toLocaleString()} gp` },
];

const SHOP_ITEM_EDIT_FIELDS: FieldConfig[] = SHOP_ITEM_FIELDS;

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function ShopItemsPage() {
  const [items, setItems]                   = useState<ShopItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen]     = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem]           = useState<ShopItem | null>(null);
  const isAdmin = useIsAdmin();

  const loadItems = useCallback(async () => {
    try {
      const data = await readCollection<ShopItemData>("shopItems");
      setItems(data);
    } catch (err: any) {
      console.error("Error loading shop items:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  async function handleAddItem(data: ShopItemData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection("shopItems", { ...data, price: Number(data.price) }, id);
    await loadItems();
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await removeFromCollection("shopItems", itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      console.error("Error deleting shop item:", err);
      if (err?.code === "permission-denied") alert("Permission denied.");
    }
  }

  async function handleSaveItem(updated: ShopItemData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("shopItems", oldId);
    await addToCollection("shopItems", { ...updated, price: Number(updated.price) }, newId);
    await loadItems();
    setSelectedItem({ ...updated, price: Number(updated.price), id: newId });
  }

  const handleItemClick = (item: ShopItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  useEffect(() => { loadItems(); }, [loadItems]);

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Shop</h1>
          {isAdmin && (
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="bg-blue-600/60 hover:bg-blue-600 transition-all"
            >
              <Glass className="px-6 py-3 text-white font-semibold border">Add</Glass>
            </button>
          )}
        </div>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading shop items...</div>
        ) : items.length === 0 ? (
          <div className="text-white/70 text-lg">No items found.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Glass
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white font-semibold text-lg">{item.name}</div>
                    <div className="text-white/50 text-sm">{item.price.toLocaleString()} gp</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="bg-red-600/40 hover:bg-red-600/60 text-white transition-all -m-1.5"
                    >
                      <Glass className="w-10 h-10 flex items-center justify-center border-none">
                        x
                      </Glass>
                    </button>
                  )}
                </Glass>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal<ShopItemData>
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddItem}
        title="Add Shop Item"
        fields={SHOP_ITEM_FIELDS}
      />

      <DetailModal<ShopItem>
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedItem?.name || "Item Details"}
        data={selectedItem}
        fields={SHOP_ITEM_DISPLAY_FIELDS}
        editFields={isAdmin ? SHOP_ITEM_EDIT_FIELDS : undefined}
        onSave={
          isAdmin
            ? (updated) =>
                handleSaveItem(
                  {
                    name: updated.name,
                    description: updated.description,
                    price: updated.price,
                  },
                  selectedItem!.id
                )
            : undefined
        }
      />
    </main>
  );
}