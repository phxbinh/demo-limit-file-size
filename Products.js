
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

    ProductSection({ product, setProduct }),
    VariantsSection({ variants, setVariants }),

    h("button", { onclick: submit, disabled: loading },
      loading ? "Saving..." : "Save"
    )
  ]);
}

window.App.Router.addRoute(
  "/admin/products/create",
  ProductCreatePage
);
