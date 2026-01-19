function ProductDetailPage({ params }) {
  const { h } = window.App.VDOM;
  const { useState, useEffect } = window.App.Hooks;

  const slug = params?.slug;

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  // Load dữ liệu sản phẩm + biến thể
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) {
      setError("Không tìm thấy sản phẩm");
      setLoading(false);
      return;
    }

    async function fetchProductDetail() {
      try {
        setLoading(true);
        setError(null);

        // 1. Lấy thông tin sản phẩm chính
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("id, name, slug, thumbnail_url, description, category_id")
          .eq("slug", slug)
          .single();

        if (productError || !productData) {
          throw new Error("Không tìm thấy sản phẩm");
        }

        setProduct(productData);

        // 2. Lấy tất cả biến thể + thuộc tính
        const { data: variantRows, error: variantError } = await supabase
          .from("public_product_variants_with_attrs_view")
          .select("variant_id, price, stock, attribute_code, attribute_value")
          .eq("product_id", productData.id);

        if (variantError) throw variantError;

        const grouped = groupVariants(variantRows);
        setVariants(grouped);

      } catch (err) {
        setError(err.message || "Có lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetail();
  }, [slug]);

  // ────────────────────────────────────────────────
  // Tự động tìm variant khớp khi người dùng chọn thuộc tính
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!variants.length || Object.keys(selectedAttrs).length === 0) {
      setSelectedVariant(null);
      return;
    }

    const matchedVariant = variants.find(variant =>
      Object.entries(selectedAttrs).every(([attrCode, selectedVal]) => 
        variant.attrs[attrCode] === selectedVal
      )
    );

    setSelectedVariant(matchedVariant || null);
  }, [selectedAttrs, variants]);

  // ────────────────────────────────────────────────
  // Computed values
  // ────────────────────────────────────────────────
  const attributes = collectAttributes(variants);
  const hasSelectedAllAttrs = Object.keys(attributes).every(code => 
    selectedAttrs[code] !== undefined
  );

  const priceDisplay = selectedVariant
    ? `${Number(selectedVariant.price).toLocaleString('vi-VN')} ₫`
    : hasSelectedAllAttrs
      ? "Hết hàng"
      : "Vui lòng chọn đầy đủ tùy chọn";

  const stockDisplay = selectedVariant
    ? selectedVariant.stock > 0
      ? `Còn ${selectedVariant.stock} sản phẩm`
      : "Hết hàng"
    : null;

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  if (loading) {
    return h("div", { className: "product-detail-loading" },
      h("div", { className: "spinner" }),
      h("p", {}, "Đang tải thông tin sản phẩm...")
    );
  }

  if (error || !product) {
    return h("div", { className: "product-detail-error" },
      h("h2", {}, "Không tìm thấy sản phẩm"),
      h("p", {}, error || "Sản phẩm có thể đã bị xóa hoặc không tồn tại."),
      h("a", { href: "/", className: "btn-back" }, "← Quay về trang chủ")
    );
  }

  return h(
    "div",
    { className: "product-detail container" },

    // Hero / Main image + name
    h("div", { className: "product-hero" },
      h("div", { className: "product-image-wrapper" },
        h("img", {
          src: product.thumbnail_url || "/assets/images/placeholder-large.svg",
          alt: product.name,
          className: "product-main-image",
          loading: "lazy",
          onerror: e => { e.target.src = "/assets/images/placeholder-large.svg"; }
        })
      ),

      h("div", { className: "product-info" },
        h("h1", { className: "product-title" }, product.name),
        
        selectedVariant &&
          h("div", { className: "product-price-block" },
            h("span", { className: "current-price" }, priceDisplay),
            stockDisplay && h("span", { className: "stock-info" }, stockDisplay)
          )
      )
    ),

    // Attribute selectors
    h("div", { className: "attributes-section" },
      ...Object.entries(attributes).map(([code, values]) =>
        h("div", { className: "attribute-group", key: code },
          h("label", { className: "attribute-label" }, code.toUpperCase()),
          h("div", { className: "attribute-options" },
            ...values.map(value =>
              h("button", {
                key: value,
                className: `attr-btn ${selectedAttrs[code] === value ? "active" : ""}`,
                onclick: () => setSelectedAttrs(prev => ({ ...prev, [code]: value })),
                type: "button"
              }, value)
            )
          )
        )
      )
    ),

    // Additional info (description, etc.)
    product.description &&
      h("div", { className: "product-description" },
        h("h3", {}, "Mô tả sản phẩm"),
        h("div", { innerHTML: product.description }) // nếu description là HTML
        // hoặc nếu là text thuần: h("p", {}, product.description)
      ),

    // Call to action
    h("div", { className: "product-actions" },
      h("button", {
        className: `btn-add-to-cart ${!selectedVariant || selectedVariant.stock <= 0 ? "disabled" : ""}`,
        disabled: !selectedVariant || selectedVariant.stock <= 0,
        onclick: () => {
          // Gọi hàm thêm vào giỏ hàng của bạn
          window.App.Cart?.addItem?.(selectedVariant.id, 1);
        }
      }, "Thêm vào giỏ hàng")
    )
  );
}

// ────────────────────────────────────────────────
// Helper functions (giữ nguyên logic nhưng viết sạch hơn)
// ────────────────────────────────────────────────
function groupVariants(rows = []) {
  const map = {};

  for (const row of rows) {
    const vid = row.variant_id;
    if (!map[vid]) {
      map[vid] = {
        id: vid,
        price: row.price,
        stock: row.stock,
        attrs: {}
      };
    }
    map[vid].attrs[row.attribute_code] = row.attribute_value;
  }

  return Object.values(map);
}

function collectAttributes(variants) {
  const attrMap = {};

  for (const v of variants) {
    for (const [code, value] of Object.entries(v.attrs)) {
      if (!attrMap[code]) attrMap[code] = new Set();
      attrMap[code].add(value);
    }
  }

  return Object.fromEntries(
    Object.entries(attrMap).map(([k, set]) => [k, [...set].sort()])
  );
}