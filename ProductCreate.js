async function loadAttributes() {
  const { data, error } = await supabase
    .from("attributes")
    .select(`
      id, code, name,
      values:attribute_values(id, value)
    `)
    .order("display_order", { foreignTable: "attribute_values" });

  if (error) throw error;
  return data;
}

function ProductSection({ product, setProduct }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "Product"),

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

function VariantsSection({ variants, setVariants }) {
  function add() {
    setVariants([
      ...variants,
      { sku: "", price: 0, stock: 0, is_active: true }
    ]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "Variants"),

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

function VariantAttributeSection({
  variants,
  attributes,
  variantAttrMap,
  setVariantAttrMap
}) {
  function toggle(variantIndex, attrValueId) {
    const exists = variantAttrMap.find(
      m =>
        m.variantIndex === variantIndex &&
        m.attribute_value_id === attrValueId
    );

    setVariantAttrMap(
      exists
        ? variantAttrMap.filter(m => m !== exists)
        : [...variantAttrMap, { variantIndex, attribute_value_id: attrValueId }]
    );
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "Variant Attributes"),

    ...variants.map((v, vi) =>
      h("div", { class: "variant-attr" }, [
        h("strong", {}, v.sku || `Variant ${vi + 1}`),

        ...attributes.map(a =>
          h("div", {}, [
            h("span", {}, a.name),
            ...a.values.map(val =>
              h("label", {}, [
                h("input", {
                  type: "checkbox",
                  onchange: () => toggle(vi, val.id)
                }),
                val.value
              ])
            )
          ])
        )
      ])
    )
  ]);
}

async function saveAll(product, variants, variantAttrMap) {
  // 1. product
  const { data: productRow } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  // 2. variants
  const { data: variantRows } = await supabase
    .from("product_variants")
    .insert(
      variants.map(v => ({
        ...v,
        product_id: productRow.id
      }))
    )
    .select();

  // 3. variant ↔ attribute
  const payload = variantAttrMap.map(m => ({
    variant_id: variantRows[m.variantIndex].id,
    attribute_value_id: m.attribute_value_id
  }));

  if (payload.length > 0) {
    await supabase
      .from("variant_attribute_values")
      .insert(payload);
  }
}

function ProductCreatePage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    description: "",
    status: "draft"
  });

  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variantAttrMap, setVariantAttrMap] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAttributes().then(setAttributes);
  }, []);

  async function submit() {
    try {
      setLoading(true);
      await saveAll(product, variants, variantAttrMap);
      alert("Product created");
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

    variants.length > 0 &&
      h(VariantAttributeSection, {
        variants,
        attributes,
        variantAttrMap,
        setVariantAttrMap
      }),

    h("button", { onclick: submit, disabled: loading },
      loading ? "Saving..." : "Save Product"
    )
  ]);
}

