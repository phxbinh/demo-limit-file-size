

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

  return h("div", { className: "product-grid" },
    products.map(p =>
      h(ProductCard, { key: p.id, product: p })
    )
  );
}

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