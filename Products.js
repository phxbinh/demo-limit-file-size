
/*
// 2.2 Section Product
function ProductSection({ product, setProduct }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "1. Product"),

    h("input", {
      placeholder: "Name",
      value: product.name,
      oninput: e => setProduct({ ...product, name: e.target.value })
    }),

    h("input", {
      placeholder: "Slug",
      value: product.slug,
      oninput: e => setProduct({ ...product, slug: e.target.value })
    }),

    h("textarea", {
      placeholder: "Description",
      value: product.description,
      oninput: e => setProduct({ ...product, description: e.target.value })
    })
  ]);
}


// 2.3 Section Variants
function VariantsSection({ variants, setVariants }) {
  function add() {
    setVariants([
      ...variants,
      {
        sku: "",
        price: 0,
        stock: 0,
        is_active: true
      }
    ]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Variants"),

    ...variants.map((v, i) =>
      h("div", {}, [
        h("input", {
          placeholder: "SKU",
          value: v.sku,
          oninput: e => {
            const n = [...variants];
            n[i].sku = e.target.value;
            setVariants(n);
          }
        }),
        h("input", {
          type: "number",
          placeholder: "Price",
          value: v.price,
          oninput: e => {
            const n = [...variants];
            n[i].price = +e.target.value;
            setVariants(n);
          }
        })
      ])
    ),

    h("button", { onclick: add }, "+ Variant")
  ]);
}

// 3. Submit → Supabase (core logic)
async function createProductWithVariants(product, variants) {
  // 1. Insert product
  const { data: productRow, error: pErr } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (pErr) throw pErr;

  // 2. Insert variants
  const variantsPayload = variants.map(v => ({
    ...v,
    product_id: productRow.id
  }));

  const { error: vErr } = await supabase
    .from("product_variants")
    .insert(variantsPayload);

  if (vErr) throw vErr;

  return productRow;
}

// 4. Page hoàn chỉnh
export function ProductCreatePage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    description: "",
    status: "draft"
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      const res = await createProductWithVariants(product, variants);
      alert("Created product: " + res.id);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return h("div", {}, [
    h("h2", {}, "Create Product (Supabase)"),

    h(ProductSection, { product, setProduct }),
    h(VaảiantsSection, { variants, setVariants }),

    h("button", { onclick: submit, disabled: loading },
      loading ? "Saving..." : "Save"
    )
  ]);
}
*/
/*
window.App.Router.addRoute(
  "/admin/products/create",
  ProductCreatePage
);
*/


// ========================
// Imports & setup
// ========================
/* không cần đã config ====
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://SUPABASE_URL.supabase.co",
  "SUPABASE_ANON_KEY"
);
*/


// ========================
// Section 1: Product
// ========================
function ProductSection({ product, setProduct }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "1. Product"),

    h("input", {
      placeholder: "Name",
      value: product.name,
      oninput: e => setProduct({ ...product, name: e.target.value })
    }),

    h("input", {
      placeholder: "Slug",
      value: product.slug,
      oninput: e => setProduct({ ...product, slug: e.target.value })
    }),

    h("textarea", {
      placeholder: "Description",
      value: product.description,
      oninput: e => setProduct({ ...product, description: e.target.value })
    })
  ]);
}

// ========================
// Section 2: Variants
// ========================
function VariantsSection({ variants, setVariants }) {
  function add() {
    setVariants([
      ...variants,
      {
        sku: "",
        price: 0,
        stock: 0,
        is_active: true
      }
    ]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Variants"),

    ...variants.map((v, i) =>
      h("div", { class: "row" }, [
        h("input", {
          placeholder: "SKU",
          value: v.sku,
          oninput: e => {
            const n = [...variants];
            n[i].sku = e.target.value;
            setVariants(n);
          }
        }),
        h("input", {
          type: "number",
          placeholder: "Price",
          value: v.price,
          oninput: e => {
            const n = [...variants];
            n[i].price = +e.target.value;
            setVariants(n);
          }
        })
      ])
    ),

    h("button", { onclick: add }, "+ Variant")
  ]);
}

// ========================
// Section 3: Attributes (PHẦN A)
// ========================
function AttributesSection({ attributes, setAttributes }) {
  function addAttribute() {
    setAttributes([
      ...attributes,
      { code: "", name: "", values: [] }
    ]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "3. Attributes"),

    ...attributes.map((a, i) =>
      h("div", { class: "attr" }, [
        h("input", {
          placeholder: "Code (size, color...)",
          value: a.code,
          oninput: e => {
            const n = [...attributes];
            n[i].code = e.target.value;
            setAttributes(n);
          }
        }),

        h("input", {
          placeholder: "Name",
          value: a.name,
          oninput: e => {
            const n = [...attributes];
            n[i].name = e.target.value;
            setAttributes(n);
          }
        }),

        h("button", {
          onclick: () => {
            const n = [...attributes];
            n[i].values.push("");
            setAttributes(n);
          }
        }, "+ Value"),

        ...a.values.map((v, vi) =>
          h("input", {
            placeholder: "Value",
            value: v,
            oninput: e => {
              const n = [...attributes];
              n[i].values[vi] = e.target.value;
              setAttributes(n);
            }
          })
        )
      ])
    ),

    h("button", { onclick: addAttribute }, "+ Attribute")
  ]);
}

// ========================
// Section 4: Variant ↔ Attribute (PHẦN A)
// ========================
function VariantAttributeSection({ variants, attributes, map, setMap }) {
  function toggle(variantId, attrCode, value) {
    const key = `${variantId}:${attrCode}:${value}`;
    const exists = map.find(m => m.key === key);

    setMap(
      exists
        ? map.filter(m => m.key !== key)
        : [...map, { key, variantId, attrCode, value }]
    );
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "4. Variant Attributes"),

    ...variants.map(v =>
      h("div", { class: "variant-attr" }, [
        h("strong", {}, v.sku || v.id),

        ...attributes.map(a =>
          h("div", {}, [
            h("span", {}, a.code),
            ...a.values.map(val =>
              h("label", {}, [
                h("input", {
                  type: "checkbox",
                  onchange: () => toggle(v.id, a.code, val)
                }),
                val
              ])
            )
          ])
        )
      ])
    )
  ]);
}

// ========================
// DB helpers (PHẦN A)
// ========================
async function saveAttributesAndMap(attributes, variantAttrMap, variants) {
  const { data: attrRows, error: aErr } = await supabase
    .from("attributes")
    .insert(attributes.map(a => ({
      code: a.code,
      name: a.name
    })))
    .select();

  if (aErr) throw aErr;

  const valueRows = [];

  for (let a of attributes) {
    const attr = attrRows.find(r => r.code === a.code);

    const { data: vals, error: vErr } = await supabase
      .from("attribute_values")
      .insert(
        a.values.map(v => ({
          attribute_id: attr.id,
          value: v
        }))
      )
      .select();

    if (vErr) throw vErr;

    valueRows.push(...vals);
  }

  const mapPayload = [];

  for (let m of variantAttrMap) {
    const attr = attrRows.find(a => a.code === m.attrCode);
    const val = valueRows.find(
      v => v.attribute_id === attr.id && v.value === m.value
    );

    mapPayload.push({
      variant_id: m.variantId,
      attribute_value_id: val.id
    });
  }

  await supabase
    .from("variant_attribute_values")
    .insert(mapPayload);
}

// ========================
// Product + Variants submit
// ========================
async function createProductWithVariants(product, variants) {
  const { data: productRow, error: pErr } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (pErr) throw pErr;

  const { data: variantRows, error: vErr } = await supabase
    .from("product_variants")
    .insert(
      variants.map(v => ({
        ...v,
        product_id: productRow.id
      }))
    )
    .select();

  if (vErr) throw vErr;

  return { product: productRow, variants: variantRows };
}

// ========================
// PAGE
// ========================
function ProductCreatePage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    description: "",
    status: "draft"
  });

  const [variants, setVariants] = useState([]);
  const [savedVariants, setSavedVariants] = useState([]);
  const [productId, setProductId] = useState(null);

  const [attributes, setAttributes] = useState([]);
  const [variantAttrMap, setVariantAttrMap] = useState([]);

  const [loading, setLoading] = useState(false);

  const canUseAttributes =
    productId && savedVariants.length > 0;

  async function submitProduct() {
    try {
      setLoading(true);
      const res = await createProductWithVariants(product, variants);
      setProductId(res.product.id);
      setSavedVariants(res.variants);
      alert("Product & variants saved");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return h("div", {}, [
    h("h2", {}, "Create Product"),

    h(ProductSection, { product, setProduct }),
    h(VariantsSection, { variants, setVariants }),

    h("button", {
      onclick: submitProduct,
      disabled: loading
    }, loading ? "Saving..." : "Save Product"),

    // ===== PHẦN A =====
    canUseAttributes &&
      h(AttributesSection, { attributes, setAttributes }),

    canUseAttributes &&
      h(VariantAttributeSection, {
        variants: savedVariants,
        attributes,
        map: variantAttrMap,
        setMap: setVariantAttrMap
      }),

    canUseAttributes &&
      h("button", {
        onclick: () =>
          saveAttributesAndMap(
            attributes,
            variantAttrMap,
            savedVariants
          )
      }, "Save Attributes")
  ]);
}

// ========================
// Route
// ========================
/*
window.App.Router.addRoute(
  "/admin/products/create",
  ProductCreatePage
);
*/





