// createProductFull.js - Phiên bản đầy đủ nhất hiện tại

// ========================
// Helpers
// ========================
function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function uploadFile(file, folder = "products") {
  if (!file) return null;
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage.from("products").upload(path, file);
  if (error) throw new Error(`Upload thất bại: ${error.message}`);

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

// Validation
function validateProduct(p) {
  if (!p.name?.trim()) return "Tên sản phẩm bắt buộc";
  if (!p.slug?.trim()) return "Slug bắt buộc";
  return null;
}

function validateVariants(vs) {
  if (vs.length === 0) return "Cần ít nhất 1 biến thể";
  for (const v of vs) {
    if (!v.sku?.trim()) return "Mỗi biến thể cần SKU";
    if (Number.isNaN(v.price) || v.price < 0) return "Giá ≥ 0";
    if (Number.isNaN(v.stock) || v.stock < 0) return "Tồn kho ≥ 0";
  }
  return null;
}

// ========================
// GIAI ĐOẠN 1: Product + Thumbnail
// ========================
function ProductStage({ product, setProduct, thumbnailFile, setThumbnailFile }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "1. Thông tin sản phẩm cơ bản"),

    h("div", { class: "form-group" }, [
      h("label", {}, "Tên sản phẩm *"),
      h("input", {
        value: product.name,
        oninput: e => setProduct({
          ...product,
          name: e.target.value,
          slug: slugify(e.target.value)
        })
      })
    ]),

    h("div", { class: "form-group" }, [
      h("label", {}, "Slug *"),
      h("input", {
        value: product.slug,
        oninput: e => setProduct({ ...product, slug: e.target.value })
      })
    ]),

    h("div", { class: "form-group" }, [
      h("label", {}, "Mô tả ngắn (short description)"),
      h("textarea", {
        rows: 3,
        value: product.short_description || "",
        oninput: e => setProduct({ ...product, short_description: e.target.value })
      })
    ]),

    h("div", { class: "form-group" }, [
      h("label", {}, "Mô tả chi tiết"),
      h("textarea", {
        rows: 8,
        value: product.description || "",
        oninput: e => setProduct({ ...product, description: e.target.value })
      })
    ]),

    h("div", { class: "form-group" }, [
      h("label", {}, "Ảnh đại diện (thumbnail)"),
      h("input", {
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        onchange: e => setThumbnailFile(e.target.files[0] || null)
      }),
      thumbnailFile && h("div", {}, [
        h("small", {}, `Đã chọn: ${thumbnailFile.name}`),
        h("img", {
          src: URL.createObjectURL(thumbnailFile),
          style: "max-width: 180px; margin-top: 8px; border-radius: 4px;"
        })
      ])
    ])
  ]);
}

// ========================
// GIAI ĐOẠN 2: Variants + Product Images
// ========================
function VariantsAndImagesStage({
  variants, setVariants,
  productImages, setProductImages,
  savedProductId
}) {
  const addVariant = () => setVariants([...variants, {
    sku: "", title: "", price: 0, compare_at_price: null, cost_price: 0,
    stock: 0, allow_backorder: false, is_active: true,
    weight_grams: null, barcode: ""
  }]);

  const removeVariant = i => {
    if (confirm("Xóa biến thể này?")) {
      setVariants(variants.filter((_, idx) => idx !== i));
    }
  };

  const updateVariant = (i, field, val) => {
    const nv = [...variants];
    nv[i][field] = val;
    setVariants(nv);
  };

  const addImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, `products/${savedProductId || "temp"}`);
      setProductImages([...productImages, { image_url: url, display_order: productImages.length }]);
    } catch (err) {
      alert("Upload ảnh thất bại: " + err.message);
    }
  };

  const removeImage = idx => {
    setProductImages(productImages.filter((_, i) => i !== idx));
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Biến thể & Ảnh sản phẩm"),

    // Product Images
    h("div", { class: "images-section" }, [
      h("h4", {}, "Ảnh sản phẩm (chung)"),
      h("input", { type: "file", accept: "image/*", onchange: addImage }),
      h("div", { class: "image-preview-grid" },
        productImages.map((img, i) => h("div", { class: "image-item" }, [
          h("img", { src: img.image_url, alt: "preview" }),
          h("button", { onclick: () => removeImage(i) }, "×")
        ]))
      )
    ]),

    // Variants
    h("h4", {}, "Biến thể"),
    ...variants.map((v, i) => h("div", { class: "variant-block" }, [
      h("div", { class: "variant-fields" }, [
        h("input", { placeholder: "SKU *", value: v.sku, oninput: e => updateVariant(i, "sku", e.target.value) }),
        h("input", { placeholder: "Tên biến thể", value: v.title || "", oninput: e => updateVariant(i, "title", e.target.value) }),
        h("input", { type: "number", placeholder: "Giá bán *", value: v.price, oninput: e => updateVariant(i, "price", +e.target.value || 0) }),
        h("input", { type: "number", placeholder: "Giá so sánh", value: v.compare_at_price ?? "", oninput: e => updateVariant(i, "compare_at_price", e.target.value ? +e.target.value : null) }),
        h("input", { type: "number", placeholder: "Giá vốn", value: v.cost_price || 0, oninput: e => updateVariant(i, "cost_price", +e.target.value || 0) }),
        h("input", { type: "number", placeholder: "Tồn kho", value: v.stock, oninput: e => updateVariant(i, "stock", +e.target.value || 0) }),
        h("input", { type: "number", placeholder: "Cân nặng (g)", value: v.weight_grams ?? "", oninput: e => updateVariant(i, "weight_grams", e.target.value ? +e.target.value : null) }),
        h("input", { placeholder: "Barcode/EAN", value: v.barcode || "", oninput: e => updateVariant(i, "barcode", e.target.value) }),

        h("label", {}, [
          h("input", { type: "checkbox", checked: v.allow_backorder, onchange: e => updateVariant(i, "allow_backorder", e.target.checked) }),
          "Cho phép đặt khi hết hàng"
        ]),
        h("label", {}, [
          h("input", { type: "checkbox", checked: v.is_active, onchange: e => updateVariant(i, "is_active", e.target.checked) }),
          "Kích hoạt"
        ])
      ]),
      h("button", { class: "btn-danger", onclick: () => removeVariant(i) }, "Xóa")
    ])),

    h("button", { onclick: addVariant }, "+ Thêm biến thể")
  ]);
}

// ========================
// GIAI ĐOẠN 3: Attributes + Mapping
// ========================
function AttributesStage({ attributes, setAttributes, variantAttrMap, setVariantAttrMap, savedVariants }) {
  const addAttr = () => setAttributes([...attributes, { code: "", name: "", values: [] }]);

  const removeAttr = i => {
    if (confirm("Xóa thuộc tính?")) setAttributes(attributes.filter((_, idx) => idx !== i));
  };

  const addValue = attrIdx => {
    const na = [...attributes];
    na[attrIdx].values.push("");
    setAttributes(na);
  };

  const updateAttr = (attrIdx, field, val) => {
    const na = [...attributes];
    na[attrIdx][field] = val;
    setAttributes(na);
  };

  const updateValue = (attrIdx, valIdx, val) => {
    const na = [...attributes];
    na[attrIdx].values[valIdx] = val;
    setAttributes(na);
  };

  const removeValue = (attrIdx, valIdx) => {
    const na = [...attributes];
    na[attrIdx].values.splice(valIdx, 1);
    setAttributes(na);
  };

  const toggleMap = (variantId, code, value) => {
    const key = { variantId, code, value };
    const exists = variantAttrMap.some(m => m.variantId === variantId && m.code === code && m.value === value);
    if (exists) {
      setVariantAttrMap(variantAttrMap.filter(m => !(m.variantId === variantId && m.code === code && m.value === value)));
    } else {
      setVariantAttrMap([...variantAttrMap, key]);
    }
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "3. Thuộc tính & Gán biến thể"),

    ...attributes.map((a, ai) => h("div", { class: "attribute-item" }, [
      h("div", { class: "attr-header" }, [
        h("input", { placeholder: "Code (size, color...)", value: a.code, oninput: e => updateAttr(ai, "code", e.target.value) }),
        h("input", { placeholder: "Tên hiển thị", value: a.name, oninput: e => updateAttr(ai, "name", e.target.value) }),
        h("button", { onclick: () => removeAttr(ai) }, "Xóa thuộc tính")
      ]),

      h("div", { class: "values" }, [
        ...a.values.map((v, vi) => h("div", { class: "value-row" }, [
          h("input", { value: v, oninput: e => updateValue(ai, vi, e.target.value) }),
          h("button", { onclick: () => removeValue(ai, vi) }, "×")
        ])),
        h("button", { onclick: () => addValue(ai) }, "+ Giá trị")
      ])
    ])),

    h("button", { onclick: addAttr }, "+ Thêm thuộc tính"),

    h("h4", {}, "Gán thuộc tính cho biến thể"),
    ...savedVariants.map(v => h("div", { class: "variant-map" }, [
      h("strong", {}, v.sku || v.title || "Variant " + v.id?.slice(0,8)),
      ...attributes.map(a => h("div", {}, [
        h("div", {}, a.name || a.code),
        ...a.values.map(val => h("label", {}, [
          h("input", {
            type: "checkbox",
            checked: variantAttrMap.some(m => m.variantId === v.id && m.code === a.code && m.value === val),
            onchange: () => toggleMap(v.id, a.code, val)
          }),
          val
        ]))
      ]))
    ]))
  ]);
}

// ========================
// SAVE FUNCTIONS
// ========================
async function saveProductAndThumbnail(product, thumbnailFile) {
  let thumbnail_url = null;
  if (thumbnailFile) {
    thumbnail_url = await uploadFile(thumbnailFile);
  }

  const payload = { ...product, thumbnail_url, status: product.status || "draft" };
  const { data, error } = await supabase.from("products").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function saveVariants(productId, variants) {
  const payload = variants.map(v => ({ ...v, product_id: productId }));
  const { data, error } = await supabase.from("product_variants").insert(payload).select();
  if (error) throw error;
  return data;
}

async function saveProductImages(productId, images) {
  if (!images.length) return;
  const payload = images.map(img => ({
    product_id: productId,
    image_url: img.image_url,
    display_order: img.display_order
  }));
  const { error } = await supabase.from("product_images").insert(payload);
  if (error) throw error;
}

async function saveAttributesAndMap(attributes, map, variants) {
  // Insert attributes
  const { data: attrs } = await supabase.from("attributes").insert(
    attributes.map(a => ({ code: a.code, name: a.name }))
  ).select();

  // Insert values
  let allValues = [];
  for (const a of attributes) {
    const attr = attrs.find(at => at.code === a.code);
    if (!attr || !a.values.length) continue;
    const valuesPayload = a.values
      .filter(v => v.trim())
      .map(v => ({ attribute_id: attr.id, value: v.trim(), display_order: 0 })); // có thể thêm UI sắp xếp sau
    const { data: vals } = await supabase.from("attribute_values").insert(valuesPayload).select();
    allValues = allValues.concat(vals);
  }

  // Insert mappings
  const mappings = [];
  for (const m of map) {
    const attr = attrs.find(a => a.code === m.code);
    if (!attr) continue;
    const val = allValues.find(v => v.attribute_id === attr.id && v.value === m.value);
    if (val) {
      mappings.push({ variant_id: m.variantId, attribute_value_id: val.id });
    }
  }
  if (mappings.length) {
    await supabase.from("variant_attribute_values").insert(mappings);
  }
}

// ========================
// MAIN PAGE
// ========================
function ProductCreatePage() {
  const [stage, setStage] = useState(1);

  const [product, setProduct] = useState({ name: "", slug: "", description: "", short_description: "" });
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [variants, setVariants] = useState([]);
  const [productImages, setProductImages] = useState([]);

  const [attributes, setAttributes] = useState([]);
  const [variantAttrMap, setVariantAttrMap] = useState([]);

  const [savedProduct, setSavedProduct] = useState(null);
  const [savedVariants, setSavedVariants] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleNext() {
    setErrorMsg("");
    if (stage === 1) {
      const err = validateProduct(product);
      if (err) return setErrorMsg(err);
      setStage(2);
    } else if (stage === 2) {
      const err = validateVariants(variants);
      if (err) return setErrorMsg(err);
      setStage(3);
    }
  }

  async function handleSaveAll() {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Save product + thumbnail
      const prod = await saveProductAndThumbnail(product, thumbnailFile);
      setSavedProduct(prod);

      // 2. Save variants
      const vars = await saveVariants(prod.id, variants);
      setSavedVariants(vars);

      // 3. Save product images
      await saveProductImages(prod.id, productImages);

      // 4. Save attributes & mapping
      await saveAttributesAndMap(attributes, variantAttrMap, vars);

      alert("Tạo sản phẩm thành công!");
      // Có thể redirect về list hoặc reset form
    } catch (err) {
      setErrorMsg(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return h("div", { class: "create-product-page" }, [
    h("h1", {}, "Tạo sản phẩm mới"),

    errorMsg && h("div", { class: "error" }, errorMsg),

    stage === 1 && h(ProductStage, { product, setProduct, thumbnailFile, setThumbnailFile }),
    stage === 2 && h(VariantsAndImagesStage, {
      variants, setVariants,
      productImages, setProductImages,
      savedProductId: savedProduct?.id
    }),
    stage === 3 && h(AttributesStage, {
      attributes, setAttributes,
      variantAttrMap, setVariantAttrMap,
      savedVariants
    }),

    h("div", { class: "actions" }, [
      stage > 1 && h("button", { onclick: () => setStage(s => s - 1) }, "← Quay lại"),
      stage < 3 && h("button", {
        onclick: handleNext,
        disabled: loading || (stage === 1 && (!product.name || !product.slug))
      }, "Tiếp tục →"),
      stage === 3 && h("button", {
        onclick: handleSaveAll,
        disabled: loading
      }, loading ? "Đang lưu..." : "Hoàn tất & Lưu sản phẩm")
    ])
  ]);
}