import { useEffect, useState } from "react";
import AdminOrdersPanel from "../components/AdminOrdersPanel.jsx";
import PromoCodesPanel from "../components/PromoCodesPanel.jsx";
import { categories, categoryLabel } from "../data/products.js";
import { fetchProfiles, updateProfileRole } from "../services/authApi.js";
import { formatPrice, randomPalette, readImageFiles, slug } from "../utils/format.js";
import { cardBackground, ProductImage } from "../utils/productVisuals.jsx";

export default function AdminPage({ products, currentUser, showToast, addProduct, updateProduct, removeProduct }) {
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const customProducts = products.filter((product) => product.custom);

  useEffect(() => {
    if (editingProduct) {
      setActiveTab("products");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingProduct]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      setLoadingProfiles(true);
      try {
        const data = await fetchProfiles();
        if (isMounted) setProfiles(data);
      } catch (error) {
        console.error(error);
        showToast("Nao foi possivel carregar usuarios. Verifique as policies de profiles.");
      } finally {
        if (isMounted) setLoadingProfiles(false);
      }
    }

    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const changeRole = async (profileId, role) => {
    try {
      const updatedProfile = await updateProfileRole(profileId, role);
      setProfiles((current) => current.map((profile) => profile.id === updatedProfile.id ? updatedProfile : profile));
      showToast(role === "admin" ? "Usuario promovido a admin." : "Admin removido do usuario.");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel alterar permissao. Verifique as policies de profiles.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const team = data.get("team").trim();
    const sizes = data.getAll("sizes");
    const mainUploadedImage = (await readImageFiles(form.mainImageFile.files))[0] || "";
    const mainImageUrl = data.get("mainImageUrl").trim();
    const uploadedImages = await readImageFiles(form.imageFile.files);
    const imageUrls = data.get("imageUrl")
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);
    const previousImages = editingProduct?.images?.length ? editingProduct.images : (editingProduct?.image ? [editingProduct.image] : []);
    const mainImage = mainUploadedImage || mainImageUrl || editingProduct?.image || previousImages[0] || "";
    const images = [mainImage, ...uploadedImages, ...imageUrls].filter(Boolean);
    const finalImages = images.length ? images : previousImages;
    const productPayload = {
      id: editingProduct?.id || `${slug(team)}-${Date.now()}`,
      name: data.get("name").trim(),
      team,
      category: data.get("category"),
      season: data.get("season").trim(),
      price: Number(data.get("price")),
      type: data.get("type"),
      audience: data.get("audience"),
      sizes: sizes.length ? sizes : ["M"],
      image: mainImage || finalImages[0] || "",
      images: finalImages,
      colors: editingProduct?.colors || randomPalette(team),
      description: data.get("description").trim(),
      featured: editingProduct?.featured || false,
      custom: true,
      source: editingProduct?.source || "local",
    };

    if (editingProduct) {
      await updateProduct(productPayload);
      setEditingProduct(null);
    } else {
      await addProduct(productPayload);
    }
    form.reset();
  };

  const cancelEdit = (event) => {
    event.currentTarget.form.reset();
    setEditingProduct(null);
  };

  return (
    <section className="page active">
      <div className="page-title compact">
        <span className="eyebrow">Administracao</span>
        <h1>Painel admin</h1>
        <p>Gerencie produtos, acompanhe pedidos, crie cupons e controle permissoes.</p>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Areas do painel admin">
        {[
          ["products", "Produtos"],
          ["orders", "Pedidos"],
          ["promos", "Cupons"],
          ["users", "Usuarios"],
        ].map(([tab, label]) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <div className="admin-layout">
          <form className="admin-form" onSubmit={submit} key={editingProduct?.id || "new-product"}>
            <label>Nome da camisa<input required name="name" placeholder="Camisa Oficial Home 2026" defaultValue={editingProduct?.name || ""} /></label>
            <label>Time ou selecao<input required name="team" placeholder="Nome do clube ou selecao" defaultValue={editingProduct?.team || ""} /></label>
            <label>Categoria
              <select required name="category" defaultValue={editingProduct?.category || categories[0]}>
                {categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
              </select>
            </label>
            <label>Temporada<input required name="season" placeholder="2026/27" defaultValue={editingProduct?.season || ""} /></label>
            <label>Preco<input required type="number" min="1" step="0.01" name="price" placeholder="249.90" defaultValue={editingProduct?.price || ""} /></label>
            <label>Tipo
              <select required name="type" defaultValue={editingProduct?.type || "Torcedor"}>{["Torcedor", "Jogador", "Retro"].map((type) => <option key={type}>{type}</option>)}</select>
            </label>
            <label>Publico
              <select required name="audience" defaultValue={editingProduct?.audience || "Masculino"}>{["Masculino", "Feminino", "Infantil"].map((audience) => <option key={audience}>{audience}</option>)}</select>
            </label>
            <fieldset>
              <legend>Tamanhos disponiveis</legend>
              {["P", "M", "G", "GG"].map((size, index) => (
                <label key={size}>
                  <input type="checkbox" name="sizes" value={size} defaultChecked={editingProduct ? editingProduct.sizes.includes(size) : index < 3} />
                  {size}
                </label>
              ))}
            </fieldset>
            <label className="wide">URL da imagem principal<input name="mainImageUrl" placeholder="Imagem que aparece na pagina inicial" defaultValue={editingProduct?.image || ""} /></label>
            <label>Upload da imagem principal<input type="file" name="mainImageFile" accept="image/*" /></label>
            <label className="wide">URLs da galeria<textarea name="imageUrl" rows="3" placeholder="Imagens extras, uma URL por linha ou separadas por virgula" defaultValue={(editingProduct?.images?.length ? editingProduct.images.slice(1) : []).filter(Boolean).join("\n")}></textarea></label>
            <label>Upload da galeria<input type="file" name="imageFile" accept="image/*" multiple /></label>
            <label className="wide">Descricao<textarea required name="description" rows="5" placeholder="Detalhes do tecido, modelagem e inspiracao da camisa" defaultValue={editingProduct?.description || ""}></textarea></label>
            <button className="button primary full" type="submit">{editingProduct ? "Salvar alteracoes" : "Cadastrar camisa"}</button>
            {editingProduct && <button className="button ghost full" type="button" onClick={cancelEdit}>Cancelar edicao</button>}
          </form>

          <div className="admin-preview">
            <h2>Produtos cadastrados</h2>
            <div className="admin-products">
              {customProducts.length ? customProducts.map((product) => (
                <article className="mini-product" key={product.id}>
                  <div className="cart-thumb" style={{ "--card-bg": cardBackground(product) }}><ProductImage product={product} compact /></div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.team} - {product.season}</p>
                    <strong>{formatPrice(product.price)}</strong>
                    <div className="mini-product-actions">
                      <button className="button ghost" type="button" onClick={() => setEditingProduct(product)}>Editar</button>
                      <button className="button ghost danger" type="button" onClick={() => removeProduct(product.id)}>Remover</button>
                    </div>
                  </div>
                </article>
              )) : <div className="empty-state">Nenhuma camisa cadastrada ainda.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && <AdminOrdersPanel showToast={showToast} />}
      {activeTab === "promos" && <PromoCodesPanel showToast={showToast} />}

      {activeTab === "users" && (
        <section className="admin-users-panel">
          <div>
            <span className="eyebrow">Usuarios</span>
            <h2>Permissoes de admin</h2>
            <p>Promova clientes cadastrados para liberar acesso a esta area administrativa.</p>
          </div>
          <div className="admin-users-list">
            {loadingProfiles && <div className="empty-state">Carregando usuarios...</div>}
            {!loadingProfiles && profiles.length ? profiles.map((profile) => {
              const isCurrentUser = profile.id === currentUser?.id;
              const isProfileAdmin = profile.role === "admin";
              return (
                <article className="admin-user-card" key={profile.id}>
                  <div>
                    <h3>{profile.name || "Usuario sem nome"}</h3>
                    <p>{profile.email}</p>
                    <span>{isProfileAdmin ? "Admin" : "Cliente"}</span>
                  </div>
                  <button
                    className={`button ${isProfileAdmin ? "ghost danger" : "dark"}`}
                    type="button"
                    disabled={isCurrentUser && isProfileAdmin}
                    onClick={() => changeRole(profile.id, isProfileAdmin ? "customer" : "admin")}
                  >
                    {isProfileAdmin ? "Remover admin" : "Tornar admin"}
                  </button>
                </article>
              );
            }) : null}
            {!loadingProfiles && !profiles.length && <div className="empty-state">Nenhum usuario cadastrado ainda.</div>}
          </div>
        </section>
      )}
    </section>
  );
}
