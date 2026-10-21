"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Product, Category } from "@/types/database";
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Sparkles,
  DollarSign,
  Upload,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Quick edit price state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>("");

  // Modal State for New / Edit Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    cost_price: "",
    unit_type: "combo",
    units_count: "5",
    image_url: "",
    is_active: true,
    is_featured: false,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (catData) setCategories(catData);

      const { data: prodData, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .order("order_index", { ascending: true });

      if (prodData) {
        setProducts(prodData);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle active/inactive
  async function toggleProductStatus(product: Product) {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (error) throw error;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  }

  // Quick Price Save
  async function saveQuickPrice(productId: string) {
    const num = parseFloat(newPriceValue);
    if (isNaN(num) || num < 0) {
      alert("Preço inválido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({ price: num })
        .eq("id", productId);

      if (error) throw error;
      setProducts((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, price: num } : item))
      );
      setEditingPriceId(null);
    } catch (err: any) {
      alert("Erro ao atualizar preço: " + err.message);
    }
  }

  // Handle Image Upload directly to Supabase Storage ('produtos' bucket)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada ultrapassa o limite de 5MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setUploadError("");

      const fileExt = file.name.split(".").pop();
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const filePath = `${Date.now()}_${cleanFileName}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("produtos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("produtos").getPublicUrl(filePath);

      setProductForm((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      console.error("Erro no upload da imagem:", err);
      setUploadError("Falha ao subir imagem: " + (err.message || "Tente novamente."));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  // Open modal for Create
  function handleOpenCreate() {
    setEditingProduct(null);
    setUploadError("");
    setProductForm({
      name: "",
      category_id: categories[0]?.id || "",
      description: "",
      price: "",
      cost_price: "",
      unit_type: "combo",
      units_count: "5",
      image_url: "",
      is_active: true,
      is_featured: false,
    });
    setShowProductModal(true);
  }

  // Open modal for Edit
  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setUploadError("");
    setProductForm({
      name: product.name,
      category_id: product.category_id || "",
      description: product.description || "",
      price: product.price.toString(),
      cost_price: product.cost_price ? product.cost_price.toString() : "",
      unit_type: product.unit_type || "combo",
      units_count: product.units_count.toString(),
      image_url: product.image_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setShowProductModal(true);
  }

  // Save or Update Product
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Informe o nome e o preço do produto.");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: productForm.name,
        category_id: productForm.category_id || null,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : 0,
        unit_type: productForm.unit_type,
        units_count: parseInt(productForm.units_count) || 1,
        image_url: productForm.image_url || null,
        is_active: productForm.is_active,
        is_featured: productForm.is_featured,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
      }

      setShowProductModal(false);
      await loadData();
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete Product
  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  return (
    <div>
      <Header
        title="Produtos & Valores"
        subtitle="Gerencie o cardápio, combos de coxinhas, valores e fotos"
        action={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Novo Produto
          </button>
        }
      />

      <div className="mt-8 space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#765c50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar pelo nome do combo ou salgado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e8d2bd] bg-[#fffdf9] focus:outline-[#f65a00]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-[#765c50] whitespace-nowrap">
              Categoria:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#e8d2bd] bg-[#fffdf9] font-bold text-[#3c2116] focus:outline-[#f65a00] w-full md:w-auto"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const isEditingPrice = editingPriceId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border ${
                  product.is_active ? "border-[#f2dfca]" : "border-gray-200 opacity-60"
                } p-5 shadow-sm flex flex-col justify-between transition-all`}
              >
                <div>
                  {/* Product Image preview if available */}
                  {product.image_url ? (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-amber-50 border border-amber-100 relative group">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-xl mb-3 bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center text-stone-400">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <ImageIcon className="w-4 h-4 opacity-50" />
                        <span>Sem foto cadastrada</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#f65a00] bg-[#fff2e5] px-2 py-0.5 rounded-md">
                        {product.unit_type === "combo"
                          ? `Combo ${product.units_count} un`
                          : product.unit_type}
                      </span>
                      <h4 className="font-black text-base text-[#3c2116] mt-1.5">
                        {product.name}
                      </h4>
                    </div>

                    {/* Status Pill */}
                    <button
                      onClick={() => toggleProductStatus(product)}
                      title={product.is_active ? "Clique para pausar no cardápio" : "Clique para ativar"}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        product.is_active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {product.is_active ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" /> Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-gray-500" /> Pausado
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[#765c50] mt-2 line-clamp-2 min-h-[32px]">
                    {product.description || "Sem descrição informada."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#f7e9dc] flex items-center justify-between">
                  {/* Price Section with Quick Edit */}
                  <div>
                    <span className="text-[10px] font-bold text-[#765c50] uppercase block">
                      Valor de Venda
                    </span>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#f65a00]">R$</span>
                        <input
                          type="number"
                          step="0.5"
                          autoFocus
                          value={newPriceValue}
                          onChange={(e) => setNewPriceValue(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs font-black border border-[#f65a00] rounded focus:outline-none"
                        />
                        <button
                          onClick={() => saveQuickPrice(product.id)}
                          className="p-1 rounded bg-[#f65a00] text-white hover:bg-[#e04e00]"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-[#f65a00]">
                          {Number(product.price).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <button
                          onClick={() => {
                            setEditingPriceId(product.id);
                            setNewPriceValue(product.price.toString());
                          }}
                          className="text-[10px] text-[#765c50] hover:text-[#f65a00] p-1 underline"
                          title="Edição rápida de valor"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 rounded-xl text-[#765c50] hover:text-[#f65a00] hover:bg-[#fff2e5] transition-colors"
                      title="Editar detalhes e foto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-2 rounded-xl text-[#765c50] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Criar / Editar Produto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#f2dfca] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#f2dfca]">
              <h3 className="font-black text-lg text-[#3c2116]">
                {editingProduct ? "Editar Produto" : "Novo Produto / Combo"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Nome do Item / Combo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo 15 Coxinhas"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                />
              </div>

              {/* Upload de Imagem Direto para o Supabase Storage */}
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1.5">
                  Foto do Produto
                </label>
                
                {productForm.image_url ? (
                  <div className="relative rounded-2xl border border-[#e8d2bd] overflow-hidden bg-[#fffdf9] p-3 flex items-center gap-4">
                    <img
                      src={productForm.image_url}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-[#e8d2bd] bg-white flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto Carregada
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f65a00] hover:bg-[#e04e00] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm">
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>Trocar Foto</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setProductForm((prev) => ({ ...prev, image_url: "" }))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className={`cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed ${
                    uploadingImage ? "border-[#f65a00] bg-orange-50/50" : "border-[#e8d2bd] hover:border-[#f65a00] bg-[#fffdf9]"
                  } transition-all`}>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-[#f65a00]">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-bold">Subindo foto para o Supabase...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#f65a00] flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-[#3c2116]">
                          Clique para escolher uma foto do seu dispositivo
                        </p>
                        <p className="text-[11px] text-[#765c50]">
                          PNG, JPG, WEBP até 5 MB
                        </p>
                      </div>
                    )}
                  </label>
                )}

                {uploadError && (
                  <p className="text-xs font-semibold text-red-600 mt-1.5">{uploadError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Categoria
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, category_id: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Tipo de Venda
                  </label>
                  <select
                    value={productForm.unit_type}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, unit_type: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  >
                    <option value="combo">Combo (múltiplas unidades)</option>
                    <option value="unidade">Unidade individual</option>
                    <option value="porcao">Porção</option>
                    <option value="bebida">Bebida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    placeholder="Ex: 12.00"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold text-[#f65a00] focus:outline-[#f65a00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="Ex: 4.50"
                    value={productForm.cost_price}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, cost_price: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Qtd. no Combo
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 5, 10, 20"
                    value={productForm.units_count}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, units_count: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva o sabor, acompanhamentos ou detalhes..."
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3c2116]">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="w-4 h-4 text-[#f65a00] rounded accent-[#f65a00]"
                  />
                  <span>Disponível no Cardápio</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3c2116]">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, is_featured: e.target.checked }))
                    }
                    className="w-4 h-4 text-[#f65a00] rounded accent-[#f65a00]"
                  />
                  <span>Destaque / Mais Vendido</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#765c50] hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-bold shadow-md shadow-orange-950/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
