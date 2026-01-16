
/*
function ProductCard({ product }) {
  const { h } = window.App.VDOM;
  const { navigateTo } = window.App.Router;

  const variant = product.variants?.[0];

  return h("div", {
      className: "product-card",
      onClick: () => navigateTo(`/product/${product.slug}`)
    },
    h("img", {
      src: product.thumbnail_url || "/placeholder.png"
    }),
    h("h3", {}, product.name),
    variant
      ? h("p", {}, `${variant.price.toLocaleString()} ₫`)
      : h("p", {}, "Hết hàng")
  );
}


function ProductListPage() {
  const { h } = window.App.VDOM;
  const { useState, useEffect } = window.App.Hooks;

  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("public_products_view")
        .select(`
          *,
          variants:public_product_variants_view (
            id, price, stock
          )
        `);

      if (!error) setProducts(data);
    }
    fetchProducts();
  }, []);

  return h('h3', null, 'Danh sách sản phẩm',
    h("div", { className: "product-grid" },
      ...products.map(p =>
      h(ProductCard, { key: p.id, product: p })
    )// end map
  ));
}
*/
/*
css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.product-card {
  border: 1px solid #eee;
  padding: 12px;
  cursor: pointer;
}

*/



function ProductCard({ product }) {
  //const { h } = window.App.VDOM;
  //const { navigateTo } = window.App.Router;

  return h(
    "div",
    {
      className: "product-card",
      onClick: () => navigateTo(`/product/${product.slug}`)
    },
    h("img", {
      src: product.thumbnail_url || "/placeholder.png",
      alt: product.name
    }),
    h("h3", {}, product.name),
    product.min_price != null
      ? h("p", { className: "price" },
          `${Number(product.min_price).toLocaleString()} ₫`
        )
      : h("p", { className: "out-stock" }, "Hết hàng")
  );
}


function ProductListPage() {
  //const { h } = window.App.VDOM;
  //const { useState, useEffect } = window.App.Hooks;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      const { data, error } = await supabase
        .from("public_products_with_price_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && mounted) {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return h("p", {}, "Đang tải sản phẩm...");
  }

  return h(
    "div",
    {},
    h("h3", {}, "Danh sách sản phẩm"),
    h(
      "div",
      { className: "product-grid" },
      products.length === 0
        ? h("p", {}, "Chưa có sản phẩm")
        : products.map(p =>
            h(ProductCard, { key: p.id, product: p })
          )
    )
  );
}









