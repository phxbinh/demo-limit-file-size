// ========================
// Product Create Page
// Compatible with custom VDOM + Hooks + Router
// ========================
/*
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;
const { navigateTo } = window.App.Router;
*/
// ========================
// Section 1: Product Info
// ========================
function ProductSection({ product, setProduct }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "1. Product Information"),

    h("label", {}, "Product name"),
    h("input", {
      value: product.name,
      placeholder: "T-shirt basic",
      oninput: e =>
        setProduct({ ...product, name: e.target.value })
    }),

    h("label", {}, "Slug (unique)"),
    h("input", {
      value: product.slug,
      placeholder: "t-shirt-basic",
      oninput: e =>
        setProduct({ ...product, slug: e.target.value })
    }),

    h("label", {}, "Description"),
    h("textarea", {
      value: product.description,
      placeholder: "Full product description",
      oninput: e =>
        setProduct({ ...product, description: e.target.value })
    })
  ]);
}

// ========================
// Section 2: Variants
// ========================
function VariantsSection({ variants, setVariants }) {
  function addVariant() {
    setVariants([
      ...variants,
      {
        sku: "",
        title: "",
        price: 0,
        stock: 0,
        is_active: true,
        attributes: {}
      }
    ]);
  }

  function update(index, field, value) {
    const next = [...variants];
    next[index][field] = value;
    setVariants(next);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Variants"),

    ...variants.map((v, i) =>
      h("div", { class: "row" }, [
        h("input", {
          placeholder: "SKU",
          value: v.sku,
          oninput: e => update(i, "sku", e.target.value)
        }),

        h("input", {
          placeholder: "Title (optional)",
          value: v.title,
          oninput: e => update(i, "title", e.target.value)
        }),

        h("input", {
          type: "number",
          placeholder: "Price",
          value: v.price,
          oninput: e => update(i, "price", +e.target.value)
        }),

        h("input", {
          type: "number",
          placeholder: "Stock",
          value: v.stock,
          oninput: e => update(i, "stock", +e.target.value)
        })
      ])
    ),

    h("button", { onclick: addVariant }, "+ Add Variant")
  ]);
}

// ========================
// Section 3: Attributes
// ========================
function AttributesSection({ attributes, setAttributes }) {
  function addAttribute() {
    setAttributes([
      ...attributes,
      { code: "", name: "", values: [] }
    ]);
  }

  function updateAttr(i, field, value) {
    const next = [...attributes];
    next[i][field] = value;
    setAttributes(next);
  }

  function addValue(i) {
    const next = [...attributes];
    next[i].values.push("");
    setAttributes(next);
  }

  function updateValue(i, vi, value) {
    const next = [...attributes];
    next[i].values[vi] = value;
    setAttributes(next);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "3. Attributes"),

    ...attributes.map((a, i) =>
      h("div", { class: "attr" }, [
        h("input", {
          placeholder: "Code (size, color)",
          value: a.code,
          oninput: e => updateAttr(i, "code", e.target.value)
        }),

        h("input", {
          placeholder: "Display name",
          value: a.name,
          oninput: e => updateAttr(i, "name", e.target.value)
        }),

        h("button", { onclick: () => addValue(i) }, "+ Value"),

        ...a.values.map((v, vi) =>
          h("input", {
            placeholder: "Value",
            value: v,
            oninput: e => updateValue(i, vi, e.target.value)
          })
        )
      ])
    ),

    h("button", { onclick: addAttribute }, "+ Add Attribute")
  ]);
}

// ========================
// Section 4: Variant ↔ Attribute Mapping
// ========================
function VariantAttributeSection({ variants, attributes, setVariants }) {
  function select(variantIndex, attrCode, value) {
    const next = [...variants];
    next[variantIndex].attributes[attrCode] = value;
    setVariants(next);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "4. Variant Attributes"),

    ...variants.map((v, vi) =>
      h("div", { class: "variant-attr" }, [
        h("strong", {}, v.sku || `Variant ${vi + 1}`),

        ...attributes.map(a =>
          h("div", {}, [
            h("span", {}, a.name),
            ...a.values.map(val =>
              h("label", {}, [
                h("input", {
                  type: "radio",
                  checked: v.attributes[a.code] === val,
                  onchange: () =>
                    select(vi, a.code, val)
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
// Helper: Build RPC Payload
// ========================
function buildPayload(product, variants, attributes) {
  return {
    product,
    attributes,
    variants: variants.map(v => ({
      sku: v.sku,
      title: v.title,
      price: v.price,
      stock: v.stock,
      is_active: v.is_active,
      attributes: v.attributes
    }))
  };
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
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submitProduct() {
    try {
      setLoading(true);

      const payload = buildPayload(
        product,
        variants,
        attributes
      );

      const { error } = await supabase.rpc(
        "admin_create_product",
        { payload }
      );

      if (error) throw error;

      alert("Product created successfully");
      navigateTo("/");
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
    h(AttributesSection, { attributes, setAttributes }),
    h(VariantAttributeSection, {
      variants,
      attributes,
      setVariants
    }),

    h("button", {
      onclick: submitProduct,
      disabled: loading
    }, loading ? "Saving..." : "Create Product")
  ]);
}