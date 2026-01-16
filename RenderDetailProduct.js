function ProductDetailPage({ params }) {
  //const { h } = window.App.VDOM;
  //const { useState, useEffect } = window.App.Hooks;

  const slug = params.slug; // 🔥 LẤY Ở ĐÂY

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    async function loadData() {
      // 1️⃣ Load product
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!p) return;
      setProduct(p);

      // 2️⃣ Load variants + attributes
      const { data: rows } = await supabase
        .from("public_product_variants_with_attrs_view")
        .select("*")
        .eq("product_id", p.id);

      setVariants(groupVariants(rows));
    }

    loadData();
  }, [slug]);

  // 3️⃣ Khi chọn attribute → tìm variant phù hợp
  useEffect(() => {
    if (!variants.length) return;

    const found = variants.find(v =>
      Object.entries(selectedAttrs).every(
        ([k, val]) => v.attrs[k] === val
      )
    );

    setSelectedVariant(found || null);
  }, [selectedAttrs, variants]);

  if (!product) return h("p", {}, "Đang tải sản phẩm...");

  const attributes = collectAttributes(variants);

  return h("div", { className: "product-detail" },
    h("h1", {}, product.name),

    h("img", {
      src: product.thumbnail_url || "/placeholder.png",
      className: "product-image"
    }),

    // ATTRIBUTE SELECTORS
    ...Object.entries(attributes).map(([code, values]) =>
      h("div", { className: "attr-group" },
        h("label", {}, code.toUpperCase()),
        h("div", { className: "attr-options" },
          ...values.map(val =>
            h("button", {
              className:
                selectedAttrs[code] === val ? "active" : "",
              onClick: () =>
                setSelectedAttrs({ ...selectedAttrs, [code]: val })
            }, val)
          )
        )
      )
    ),

    // PRICE
    h("div", { className: "price" },
      selectedVariant
        ? `${selectedVariant.price.toLocaleString()} ₫`
        : "Vui lòng chọn đầy đủ thuộc tính"
    ),

    // STOCK
    selectedVariant && h("p", {},
      selectedVariant.stock > 0
        ? `Còn ${selectedVariant.stock} sản phẩm`
        : "Hết hàng"
    )
  );
}

function groupVariants(rows = []) {
  const map = {};

  rows.forEach(r => {
    if (!map[r.variant_id]) {
      map[r.variant_id] = {
        id: r.variant_id,
        price: r.price,
        stock: r.stock,
        attrs: {}
      };
    }
    map[r.variant_id].attrs[r.attribute_code] = r.attribute_value;
  });

  return Object.values(map);
}

function collectAttributes(variants) {
  const result = {};

  variants.forEach(v => {
    Object.entries(v.attrs).forEach(([k, val]) => {
      if (!result[k]) result[k] = new Set();
      result[k].add(val);
    });
  });

  Object.keys(result).forEach(k => {
    result[k] = Array.from(result[k]);
  });

  return result;
}