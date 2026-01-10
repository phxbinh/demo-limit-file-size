const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPdfFile, setNewPdfFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPdfFile, setEditPdfFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =====================
  // INIT AUTH + ROLE
  // =====================
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role || "user");
      }
    };

    init();
  }, []);

  // =====================
  // FETCH TASKS
  // =====================
  useEffect(() => {
    if (user) fetchTasks();
  }, [user, role]);

  const fetchTasks = async () => {
    setLoading(true);
    setMessage("");

    let query = supabase
      .from("tasks")
      .select("id, title, completed, pdf_path, created_at, user_id")
      .order("created_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) setMessage("❌ Lỗi tải task: " + error.message);
    else setTasks(data || []);

    setLoading(false);
  };

  // =====================
  // STORAGE HELPERS
  // =====================
  const uploadPdf = async (file, userId, taskId) => {
    const path = `${userId}/${taskId}.pdf`;

    const { error } = await supabase.storage
      .from("task-pdfs")
      .upload(path, file, { upsert: true });

    if (error) throw error;
    return path;
  };

  const getSignedUrl = async (path) => {
    const { data, error } = await supabase.storage
      .from("task-pdfs")
      .createSignedUrl(path, 60);

    if (error) throw error;
    return data.signedUrl;
  };

  // =====================
  // ADD TASK
  // =====================
  const addTask = async () => {
    if (!user) return alert("Vui lòng đăng nhập");
    if (!newTitle.trim()) return;

    if (newPdfFile && newPdfFile.size > MAX_FILE_SIZE) {
      setMessage("❌ File quá lớn (<=50MB)");
      return;
    }

    setLoading(true);
    try {
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: newTitle.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (newPdfFile) {
        const path = await uploadPdf(newPdfFile, user.id, task.id);
        await supabase.from("tasks").update({ pdf_path: path }).eq("id", task.id);
      }

      setNewTitle("");
      setNewPdfFile(null);
      fetchTasks();
      setMessage("✅ Thêm task thành công");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // SAVE EDIT
  // =====================
  const saveEdit = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      let pdfPath = tasks.find(t => t.id === editingId)?.pdf_path || null;

      if (editPdfFile) {
        pdfPath = await uploadPdf(editPdfFile, user.id, editingId);
      }

      await supabase
        .from("tasks")
        .update({ title: editTitle.trim(), pdf_path: pdfPath })
        .eq("id", editingId);

      setEditingId(null);
      setEditPdfFile(null);
      fetchTasks();
      setMessage("✅ Cập nhật thành công");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // DELETE TASK
  // =====================
  const deleteTask = async (task) => {
    if (!confirm("Xóa task này?")) return;

    setLoading(true);
    try {
      // admin xoá task người khác nên KHÔNG xoá pdf ở client
      await supabase.from("tasks").delete().eq("id", task.id);
      fetchTasks();
      setMessage("🗑 Đã xoá task");
    } catch (err) {
      setMessage("❌ Không có quyền xoá");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // TASK ITEM
  // =====================
  const TaskItem = (task) => {
    const isOwner = task.user_id === user.id;
    const canEdit = isOwner;
    const canDelete = isOwner || role === "admin";

    const isEditing = editingId === task.id;

    return h("li", {
      key: task.id,
      style: { padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "1rem" }
    },
      isEditing
        ? h("div", null,
            h("input", {
              value: editTitle,
              onInput: e => setEditTitle(e.target.value),
              style: { width: "300px" }
            }),
            h("br"),
            h("input", {
              type: "file",
              accept: ".pdf",
              onChange: e => setEditPdfFile(e.target.files[0] || null)
            }),
            h("br"),
            h("button", { onClick: saveEdit, disabled: loading }, "Lưu"),
            " ",
            h("button", { onClick: () => setEditingId(null) }, "Hủy")
          )
        : h("div", null,
            h("strong", null, task.title),
            task.pdf_path &&
              h("button", {
                style: { marginLeft: "1rem" },
                onClick: async () => {
                  const url = await getSignedUrl(task.pdf_path);
                  window.open(url, "_blank");
                }
              }, "Xem PDF")
          ),

      h("div", { style: { marginTop: "0.5rem" } },
        canEdit && h("button", {
          onClick: () => {
            setEditingId(task.id);
            setEditTitle(task.title);
          }
        }, "Sửa"),

        canDelete && h("button", {
          onClick: () => deleteTask(task),
          style: { color: "red", marginLeft: "0.5rem" }
        }, "Xóa")
      )
    );
  };

  // =====================
  // RENDER
  // =====================
  if (!user) {
    return h("p", { style: { color: "red" } },
      "⚠️ Vui lòng đăng nhập để sử dụng chức năng Tasks"
    );
  }

  return h("div", null,
    h("h2", null, "📋 Tasks"),

    h("div", { style: { marginBottom: "1rem" } },
      h("input", {
        placeholder: "Tiêu đề task",
        value: newTitle,
        onInput: e => setNewTitle(e.target.value)
      }),
      h("br"),
      h("input", {
        type: "file",
        accept: ".pdf",
        onChange: e => setNewPdfFile(e.target.files[0] || null)
      }),
      h("br"),
      h("button", { onClick: addTask, disabled: loading }, "Thêm task")
    ),

    message && h("p", null, message),

    loading
      ? h("p", null, "Đang tải...")
      : h("ul", { style: { listStyle: "none", padding: 0 } },
          tasks.map(TaskItem)
        )
  );
}