"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession } from "@/backend/auth";
import { categories, initialProducts, type Product } from "@/backend/catalog";

type CartItem = {
  productId: number;
  quantity: number;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: Product["category"];
  image: string;
  featured: boolean;
};

const emptyProductForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: "Ojos",
  image: "",
  featured: false,
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function productImage(product: Product) {
  return product.image || initialProducts.find((item) => item.id === product.id)?.image || initialProducts[0].image;
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-[#d41478]">
      <path
        fill="currentColor"
        d="M7 4a1 1 0 0 1 .95.68L8.78 7H20a1 1 0 0 1 .97 1.24l-1.5 6A1 1 0 0 1 18.5 15H10a1 1 0 0 1-.95-.68L7.22 9H5a1 1 0 1 1 0-2h1.78l.61-1.84A1 1 0 0 1 7 4Zm3.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer la imagen."));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export default function CatalogPage({ adminOnly = false }: { adminOnly?: boolean }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(80000);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  useEffect(() => {
    void fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Product[];
      })
      .then((nextProducts) => {
        if (nextProducts?.length) setProducts(nextProducts);
      });

    if (!adminOnly) return;

    void fetch("/api/auth/session")
      .then((response) => response.json())
      .then((nextSession: AuthSession | null) => {
        if (nextSession?.role === "admin") {
          setSession(nextSession);
        } else {
          router.replace("/admin");
        }
      })
      .catch(() => router.replace("/admin"));
  }, [adminOnly, router]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        const matchesCategory = category === "Todos" || product.category === category;
        const matchesPrice = product.price <= maxPrice;
        const matchesQuery =
          !normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesPrice && matchesQuery;
      })
      .sort((first, second) => {
        if (sortBy === "price-asc") return first.price - second.price;
        if (sortBy === "price-desc") return second.price - first.price;
        if (sortBy === "name") return first.name.localeCompare(second.name);
        return Number(second.featured) - Number(first.featured) || first.name.localeCompare(second.name);
      });
  }, [category, maxPrice, products, query, sortBy]);

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          if (!product) {
            return null;
          }

          return {
            ...item,
            product,
            subtotal: product.price * item.quantity,
          };
        })
        .filter((item): item is { productId: number; quantity: number; product: Product; subtotal: number } => item !== null),
    [cart, products],
  );

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.subtotal, 0),
    [cartItems],
  );

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => router.replace("/"));
  };

  const addToCart = (productId: number) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);

      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const buyNow = (product: Product) => {
    const message = `Hola, quiero comprar ${product.name} por ${formatPrice(product.price)}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const buyCart = () => {
    if (!cartItems.length) {
      return;
    }

    const lines = cartItems.map(
      (item) => `${item.quantity} x ${item.product.name} = ${formatPrice(item.subtotal)}`,
    );
    const message = [`Hola, quiero comprar:`, ...lines, `Total: ${formatPrice(cartTotal)}`].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const resetProductForm = () => {
    setSelectedProductId(null);
    setProductForm(emptyProductForm);
  };

  const editProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image: product.image,
      featured: Boolean(product.featured),
    });
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextProduct: Product = {
      id: selectedProductId ?? Date.now(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category,
      image: productForm.image || initialProducts[0].image,
      featured: productForm.featured,
    };

    if (!nextProduct.name || !nextProduct.description || !Number.isFinite(nextProduct.price)) {
      return;
    }

    const response = await fetch("/api/products", {
      method: selectedProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedProductId ? nextProduct : { ...nextProduct, id: undefined }),
    });

    if (!response.ok) return;
    const savedProduct = (await response.json()) as Product;
    setProducts((current) =>
      selectedProductId
        ? current.map((item) => (item.id === savedProduct.id ? savedProduct : item))
        : [savedProduct, ...current],
    );
    resetProductForm();
  };

  const deleteProduct = async (productId: number) => {
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId }),
    });

    if (!response.ok) return;
    setProducts((current) => current.filter((item) => item.id !== productId));
    setCart((current) => current.filter((item) => item.productId !== productId));

    if (selectedProductId === productId) {
      resetProductForm();
    }
  };

  const applyImageFromFile = (file: File) => {
    void readFileAsDataUrl(file).then((dataUrl) => {
      setProductForm((current) => ({ ...current, image: dataUrl }));
    });
  };

  const handleImagePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(event.clipboardData.items)
      .map((item) => item.getAsFile())
      .find((candidate): candidate is File => Boolean(candidate && candidate.type.startsWith("image/")));

    if (file) {
      event.preventDefault();
      applyImageFromFile(file);
    }
  };

  const isAdmin = session?.role === "admin";

  if (adminOnly && !isAdmin) {
    return null;
  }

  return (
    <main className="soft-scrollbar relative flex-1 overflow-hidden text-[#5b0c3d]">
      <div className="absolute inset-0 -z-10 opacity-75">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-[#f6a3d0] blur-3xl" />
        <div className="absolute right-[-3rem] top-40 h-64 w-64 rounded-full bg-[#ffdeec] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#d41478]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d41478]/30 to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="glass overflow-hidden rounded-[2.25rem] border border-white/60 p-5 shadow-[0_24px_90px_rgba(146,18,88,0.1)] lg:p-7">
          <div className="flex flex-col gap-4 border-b border-[#d41478]/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="heading-font max-w-4xl text-5xl leading-[0.85] text-[#d41478] sm:text-7xl lg:text-[6.5rem]">
                Magenta
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#7d345a] sm:text-base lg:text-lg">
                Ya estás dentro del catálogo. Podés ver productos, sumar al carrito o comprar al momento.
              </p>
            </div>

            <div className="relative flex justify-end">
              <button
                type="button"
                aria-label="Ver estado de cuenta"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d41478] text-white shadow-lg transition hover:bg-[#b20b5f]"
              >
                <PersonIcon />
              </button>
              {accountOpen ? (
                <div className="glass absolute right-0 top-14 z-10 w-64 rounded-2xl p-4 text-sm text-[#6b3151] shadow-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a4547b]">Cuenta</p>
                  <p className="mt-2 font-semibold text-[#6d1047]">{session?.name ?? "Invitado"}</p>
                  <p className="mt-1 text-xs text-[#8a5a78]">
                    {isAdmin ? "Administrador" : session ? "Inició con cuenta de Google" : "Estás navegando como invitado"}
                  </p>
                  {isAdmin ? (
                    <button type="button" onClick={logout} className="mt-4 w-full rounded-full border border-[#d41478]/20 px-4 py-2 text-xs font-semibold text-[#b20b5f]">
                      Cerrar sesión
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <label className="rounded-2xl border border-[#d41478]/15 bg-white/75 px-4 py-3 shadow-sm transition focus-within:border-[#d41478]/35 focus-within:bg-white">
              <span className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#a4547b]">
                Buscar por nombre o descripción
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="maquillaje, bolso, collar..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#be7b9e]"
              />
            </label>

            <label className="rounded-2xl border border-[#d41478]/15 bg-white/75 px-4 py-3 shadow-sm transition focus-within:border-[#d41478]/35 focus-within:bg-white">
              <span className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#a4547b]">
                Categoría
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
                className="w-full bg-transparent text-sm outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-[#d41478]/15 bg-white/75 px-4 py-3 shadow-sm transition focus-within:border-[#d41478]/35 focus-within:bg-white">
              <span className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#a4547b]">
                Ordenar
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio menor</option>
                <option value="price-desc">Precio mayor</option>
                <option value="name">Nombre</option>
              </select>
            </label>

            <label className="rounded-2xl border border-[#d41478]/15 bg-white/75 px-4 py-3 shadow-sm transition focus-within:border-[#d41478]/35 focus-within:bg-white">
              <span className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[#a4547b]">
                Precio máximo: {formatPrice(maxPrice)}
              </span>
              <input
                type="range"
                min="5000"
                max="80000"
                step="1000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="w-full accent-[#d41478]"
              />
            </label>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <section className="glass rounded-[2rem] p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                  Catálogo
                </p>
                <h2 className="heading-font text-4xl text-[#d41478]">Productos disponibles</h2>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <p className="text-sm text-[#7e4770]">
                  {filteredProducts.length} resultados según los filtros aplicados.
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen((current) => !current)}
                  className="inline-flex items-center gap-3 rounded-full border border-[#d41478]/20 bg-white px-4 py-2 text-sm font-semibold text-[#b20b5f] shadow-sm transition hover:bg-[#fff4fa]"
                  aria-expanded={cartOpen}
                  aria-controls="cart-panel"
                >
                  <CartIcon />
                  <span>Carrito</span>
                  {cartCount > 0 ? (
                    <span className="rounded-full bg-[#d41478] px-2.5 py-0.5 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            {cartOpen ? (
              <div
                id="cart-panel"
                className="mt-5 rounded-[1.6rem] border border-[#d41478]/12 bg-white/80 p-4 shadow-[0_18px_50px_rgba(163,16,95,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CartIcon />
                    <div>
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                        Carrito abierto
                      </p>
                      <h3 className="text-xl font-semibold text-[#6d1047]">
                        {cartCount > 0 ? `${cartCount} productos` : "Sin productos"}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="rounded-full border border-[#d41478]/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b20b5f]"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {cartItems.length ? (
                    cartItems.map((item) => (
                      <div key={item.productId} className="flex gap-3 rounded-2xl bg-[#fff7fb] p-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#6d1047]">{item.product.name}</p>
                          <p className="text-sm text-[#8a5a78]">{formatPrice(item.subtotal)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="h-8 w-8 rounded-full border border-[#d41478]/20 text-[#b20b5f]"
                            >
                              -
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="h-8 w-8 rounded-full border border-[#d41478]/20 text-[#b20b5f]"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="ml-auto text-xs font-bold uppercase tracking-[0.18em] text-[#b20b5f]"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d41478]/20 bg-white/70 p-5 text-sm text-[#8a5a78]">
                      El carrito está vacío.
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-[#ffd2e7] p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-[#8d114f]">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={buyCart}
                    className="mt-4 block w-full rounded-full bg-[#25d366] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Finalizar por WhatsApp
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.8rem] border border-[#d41478]/10 bg-white/85 shadow-[0_18px_40px_rgba(163,16,95,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(163,16,95,0.14)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#ffd1e6] via-[#f7a0c9] to-[#d41478]">
                    <img
                      src={productImage(product)}
                      alt={product.name}
                      className="h-full w-full object-cover opacity-95 transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#82164a]/45 via-transparent to-transparent" />
                    {product.featured ? (
                      <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#b20b5f]">
                        Destacado
                      </span>
                    ) : null}
                    <span className="absolute right-4 top-4 rounded-full bg-[#d41478] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white">
                      {product.category}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#6d1047]">{product.name}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#8a5a78]">{product.description}</p>
                      </div>
                      <div className="rounded-2xl bg-[#ffd2e7] px-3 py-2 text-right">
                        <div className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                          Precio
                        </div>
                        <div className="text-lg font-black text-[#b20b5f]">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="rounded-full bg-[#d41478] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                      >
                        Agregar al carrito
                      </button>
                      <button
                        type="button"
                        onClick={() => buyNow(product)}
                        className="rounded-full border border-[#d41478]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#b20b5f] transition hover:bg-[#fff4fa]"
                      >
                        Comprar
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          className="rounded-full border border-[#d41478]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#6d1047] transition hover:bg-[#fff4fa]"
                        >
                          Editar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            {isAdmin ? (
              <section id="admin-panel" className="glass rounded-[2rem] p-5 lg:p-6">
                <div>
                  <h2 className="heading-font text-3xl text-[#d41478]">Editor de catálogo</h2>
                </div>

                <form className="mt-5 space-y-3" onSubmit={saveProduct}>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                      Nombre
                    </span>
                    <input
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                      Descripción
                    </span>
                    <textarea
                      value={productForm.description}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                        Precio
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={productForm.price}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, price: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                        Categoría
                      </span>
                      <select
                        value={productForm.category}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            category: event.target.value as Product["category"],
                          }))
                        }
                        className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                      >
                        {categories
                          .filter((item): item is Product["category"] => item !== "Todos")
                          .map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                      Imagen de producto
                    </span>
                    <textarea
                      value={productForm.image}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, image: event.target.value }))
                      }
                      onPaste={handleImagePaste}
                      placeholder="Pega una URL o una imagen aquí"
                      rows={4}
                      className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="rounded-full border border-[#d41478]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b20b5f]"
                      >
                        Cargar desde computadora
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            applyImageFromFile(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm((current) => ({ ...current, image: "" }))}
                        className="rounded-full border border-[#d41478]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8f2457]"
                      >
                        Limpiar imagen
                      </button>
                    </div>
                  </label>

                  <div className="overflow-hidden rounded-[1.5rem] border border-[#d41478]/12 bg-white/75">
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#ffd1e6] via-[#f7a0c9] to-[#d41478]">
                      <img
                        src={productForm.image || initialProducts[0].image}
                        alt="Vista previa"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-[#7b4d68]">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, featured: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[#d41478]"
                    />
                    Marcar como destacado
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-[#d41478] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                    >
                      {selectedProductId ? "Actualizar producto" : "Agregar producto"}
                    </button>
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="rounded-full border border-[#d41478]/20 px-5 py-3 text-sm font-semibold text-[#b20b5f]"
                    >
                      Limpiar
                    </button>
                  </div>
                </form>

                <div className="mt-6 space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-2xl bg-white/75 p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={productImage(product)}
                          alt={product.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#6d1047]">{product.name}</p>
                          <p className="text-sm text-[#8a5a78]">{formatPrice(product.price)}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#a4547b]">
                            {product.category}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editProduct(product)}
                            className="rounded-full border border-[#d41478]/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b20b5f]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="rounded-full border border-[#d41478]/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8f2457]"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
