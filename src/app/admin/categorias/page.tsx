"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import { FolderTree, Plus, Edit3, Trash2, X, Check } from "lucide-react";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "package",
    order_index: "1",
  });
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleOpenCreate() {
    setEditingCategory(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      icon: "package",
      order_index: (categories.length + 1).toString(),
    });
    setShowModal(true);
  }

  function handleOpenEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "package",
      order_index: cat.order_index.toString(),
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    try {
      setSaving(true);
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

      const payload = {
        name: form.name,
        slug,
        description: form.description || null,
        icon: form.icon,
        order_index: parseInt(form.order_index) || 0,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      await loadCategories();
    } catch (err: any) {
      alert("Erro ao salvar categoria: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a categoria "${name}"? Os produtos vinculados a ela ficarão sem categoria.`)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  return (
    <div>
      <Header
        title="Categorias de Produtos"
        subtitle="Organize as seções do seu cardápio (Combos, Salgados, Bebidas, Sobremesas)"
        action={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Categoria
          </button>
        }
      />

      <div className="mt-8">
        <div className="bg-white rounded-2xl border border-[#f2dfca] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#fff7ee] border-b border-[#f2dfca] text-[#765c50] font-black uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Ordem</th>
                <th className="py-3.5 px-5">Nome da Categoria</th>
                <th className="py-3.5 px-5">Slug / URL</th>
                <th className="py-3.5 px-5">Descrição</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9ece0]">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#fff9f3] transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#765c50]">
                    #{cat.order_index}
                  </td>
                  <td className="py-3.5 px-5 font-black text-sm text-[#3c2116]">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-5 text-[#765c50]">
                    <code className="bg-[#fff2e5] px-2 py-0.5 rounded text-[11px] text-[#f65a00] font-mono">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="py-3.5 px-5 text-[#765c50]">
                    {cat.description || "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-[#3c2116] hover:bg-[#fff2e5]"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#f2dfca] relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-lg text-[#3c2116] mb-4">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combos Especiais"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  placeholder="1, 2, 3..."
                  value={form.order_index}
                  onChange={(e) => setForm((prev) => ({ ...prev, order_index: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Descrição da categoria..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#765c50] hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-bold shadow-md shadow-orange-950/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
