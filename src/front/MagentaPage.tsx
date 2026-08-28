"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categories, initialProducts, type Product } from "@/back/catalog";

type Role = "guest" | "user" | "admin";

type UserSession = {
  name: string;
  email: string;
  role: Role;
};

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

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: "Ojos",
  image: "",
  featured: false,
};

const ADMIN_EMAIL = "admin@magenta.com";
const ADMIN_PASSWORD = "magenta123";
const USER_EMAIL = "cliente@magenta.com";
const USER_PASSWORD = "magenta123";
const WHATSAPP_BASE_LINK = "https://wa.me/5490000000000";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function formatPrice(value: number) {
  return currencyFormatter.format(value);
}

export default function MagentaPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [maxPrice, setMaxPrice] = useState(60000);
  const [sortBy, setSortBy] = useState("featured");
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState(ADMIN_PASSWORD);
  const [notice, setNotice] = useState("Usá el login de demo para probar el panel.");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_FORM);
  const hasLoaded = useRef(false);

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("magenta-session");
      const storedCart = localStorage.getItem("magenta-cart");
      const storedProducts = localStorage.getItem("magenta-products");

      queueMicrotask(() => {
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }

        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }

        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        }

        hasLoaded.current = true;
      });
    } catch {
      console.warn("No se pudieron leer los datos guardados, se cargó el demo.");
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    localStorage.setItem("magenta-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    localStorage.setItem("magenta-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    if (session) {
      localStorage.setItem("magenta-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("magenta-session");
    }
  }, [session]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesPrice = product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesPrice;
    });

    return filtered.sort((left, right) => {
      switch (sortBy) {
        case "price-asc":
          return left.price - right.price;
        case "price-desc":
          return right.price - left.price;
        case "name":
          return left.name.localeCompare(right.name, "es");
        case "featured":
        default:
          return Number(right.featured) - Number(left.featured);
      }
    });
  }, [category, maxPrice, products, query, sortBy]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return null;
        }

        return {
          ...item,
          product,
          subtotal: product.price * item.quantity,
        };
      })
      .filter(Boolean) as Array<CartItem & { product: Product; subtotal: number }>;
  }, [cart, products]);

  const cartTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = loginEmail.trim().toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD;
    const isUser = normalizedEmail === USER_EMAIL && loginPassword === USER_PASSWORD;

    if (!isAdmin && !isUser) {
      setNotice("Credenciales inválidas. Probá con los accesos de demo.");
      return;
    }

    const nextSession: UserSession = {
      name: isAdmin ? "Administradora" : "Clienta demo",
      email: normalizedEmail,
      role: isAdmin ? "admin" : "user",
    };

    setSession(nextSession);
    setNotice(isAdmin ? "Sesión de admin iniciada." : "Sesión de cliente iniciada.");
  }

  function logout() {
    setSession(null);
    setNotice("Sesión cerrada.");
  }

  function addToCart(productId: number) {
    if (!session) {
      setNotice("Iniciá sesión para agregar productos al carrito.");
      return;
    }

    if (session.role === "admin") {
      setNotice("La cuenta admin administra el catálogo; usá una cuenta cliente para comprar.");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.productId === productId);

      if (existing) {
        return currentCart.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...currentCart, { productId, quantity: 1 }];
    });

    setNotice("Producto agregado al carrito.");
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  }

  function resetProductForm() {
    setSelectedProductId(null);
    setProductForm(EMPTY_FORM);
  }

  function editProduct(product: Product) {
    setSelectedProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image: product.image,
      featured: Boolean(product.featured),
    });
  }

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (session?.role !== "admin") {
      setNotice("Solo la cuenta admin puede modificar el catálogo.");
      return;
    }

    const nextProduct: Product = {
      id: selectedProductId ?? Date.now(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category,
      image: productForm.image.trim() || initialProducts[0].image,
      featured: productForm.featured,
    };

    if (!nextProduct.name || !nextProduct.description || Number.isNaN(nextProduct.price)) {
      setNotice("Completá nombre, descripción y precio para guardar el producto.");
      return;
    }

    setProducts((currentProducts) => {
      const exists = currentProducts.some((product) => product.id === nextProduct.id);

      return exists
        ? currentProducts.map((product) => (product.id === nextProduct.id ? nextProduct : product))
        : [nextProduct, ...currentProducts];
    });

    setNotice(selectedProductId ? "Producto actualizado." : "Producto agregado.");
    resetProductForm();
  }

  function deleteProduct(productId: number) {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));

    if (selectedProductId === productId) {
      resetProductForm();
    }

    setNotice("Producto eliminado.");
  }

  const checkoutText = encodeURIComponent(
    `Hola, quiero finalizar mi compra en Magenta. Total: ${formatPrice(cartTotal)}`,
  );
  const whatsappLink = `${WHATSAPP_BASE_LINK}?text=${checkoutText}`;

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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d41478]/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#b20b5f] shadow-sm">
                Beauty shop concept
              </div>
              <h1 className="heading-font max-w-4xl text-5xl leading-[0.85] text-[#d41478] sm:text-7xl lg:text-[6.5rem]">
                Magenta
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#7d345a] sm:text-base lg:text-lg">
                Catálogo de belleza y accesorios con imagen, nombre, descripción, precio,
                filtros por categoría y valor, carrito de compra y panel admin para editar
                productos. El checkout queda listo para tu link de WhatsApp.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f5173]">
                <span className="rounded-full bg-white/75 px-4 py-2">Catálogo premium</span>
                <span className="rounded-full bg-white/75 px-4 py-2">Panel de venta</span>
                <span className="rounded-full bg-white/75 px-4 py-2">Checkout WhatsApp</span>
              </div>
            </div>

            <div className="glass w-full max-w-md rounded-[1.85rem] p-4 text-sm text-[#6b3151] lg:p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[#b20b5f]">Estado del demo</span>
                <span className="rounded-full bg-[#ffd2e7] px-3 py-1 text-xs font-bold text-[#8d114f]">
                  {session ? session.role.toUpperCase() : "INVITADO"}
                </span>
              </div>
              <p className="mt-3 leading-6">{notice}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.18em] text-[#8f5173]">
                <div className="rounded-2xl bg-white/80 p-3">
                  <div className="text-[0.65rem]">Productos</div>
                  <div className="mt-1 text-lg font-bold text-[#d41478]">{products.length}</div>
                </div>
                <div className="rounded-2xl bg-white/80 p-3">
                  <div className="text-[0.65rem]">Carrito</div>
                  <div className="mt-1 text-lg font-bold text-[#d41478]">{cartCount}</div>
                </div>
              </div>
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
                onChange={(event) => setCategory(event.target.value)}
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
              <p className="text-sm text-[#7e4770]">
                {filteredProducts.length} resultados según los filtros aplicados.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.8rem] border border-[#d41478]/10 bg-white/85 shadow-[0_18px_40px_rgba(163,16,95,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(163,16,95,0.14)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#ffd1e6] via-[#f7a0c9] to-[#d41478]">
                    <img
                      src={product.image}
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

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="rounded-full bg-[#d41478] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                      >
                        Agregar al carrito
                      </button>
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#ac6d8e]">
                        {session?.role === "admin" ? "Modo admin" : "Modo compra"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="glass rounded-[2rem] p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                    Acceso
                  </p>
                  <h2 className="heading-font text-3xl text-[#d41478]">Login de demo</h2>
                </div>
                {session ? (
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full border border-[#d41478]/20 px-4 py-2 text-sm font-semibold text-[#b20b5f]"
                  >
                    Salir
                  </button>
                ) : null}
              </div>

              <form className="mt-5 space-y-3" onSubmit={login}>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Email
                  </span>
                  <input
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Contraseña
                  </span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#d41478] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                >
                  Entrar
                </button>
              </form>

              <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm text-[#7b4d68]">
                <p className="font-semibold text-[#b20b5f]">Credenciales de prueba</p>
                <p className="mt-1">Admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}</p>
                <p>Cliente: {USER_EMAIL} / {USER_PASSWORD}</p>
              </div>

              {session ? (
                <div className="mt-4 rounded-2xl bg-[#ffd2e7] p-4 text-sm text-[#7f124d]">
                  Sesión activa: <strong>{session.name}</strong> ({session.role})
                </div>
              ) : null}
            </section>

            <section className="glass rounded-[2rem] p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                    Compra
                  </p>
                  <h2 className="heading-font text-3xl text-[#d41478]">Carrito</h2>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                  {cartCount} items
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-3 rounded-2xl bg-white/80 p-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-16 w-16 rounded-2xl object-cover"
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
                    El carrito está vacío. Iniciá sesión como cliente y agregá productos.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-[#ffd2e7] p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-[#8d114f]">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-full bg-[#25d366] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Finalizar por WhatsApp
                </a>
                <p className="mt-3 text-xs text-[#8a5a78]">
                  Este enlace queda como base. Después podés reemplazar el número y el mensaje.
                </p>
              </div>
            </section>

            {session?.role === "admin" ? (
              <section className="glass rounded-[2rem] p-5 lg:p-6">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                    Administración
                  </p>
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
                      URL de imagen
                    </span>
                    <input
                      value={productForm.image}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, image: event.target.value }))
                      }
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>

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
                          src={product.image}
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
            ) : (
              <section className="glass rounded-[2rem] p-5 lg:p-6">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                  Panel admin
                </p>
                <h2 className="heading-font mt-2 text-3xl text-[#d41478]">Acceso restringido</h2>
                <p className="mt-3 text-sm leading-6 text-[#7e4770]">
                  Cuando la sesión sea de administradora, acá vas a poder agregar, editar y borrar
                  productos sin tocar el carrito de las clientas.
                </p>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}