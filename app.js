const { h } = window.App.VDOM;
const { useState, useEffect } = window.App.Hooks;
const { init, addRoute, Link, navbarDynamic } = window.App.Router;

// Supabase client - đảm bảo đã init ở nơi khác hoặc thêm init ở đây nếu cần
const supabase = window.supabase;

function Navbar() {
  return h('nav', null,
    h(Link, { to: '/', children: 'Home' }),
    ' | ',
    h(Link, { to: '/about', children: 'About' }),
    ' | ',
    h(Link, { to: '/tasks', children: 'Quản lý Tasks + PDF' })
  );
}

function Home() {
  return h('div', { className: 'container' },
    h('h1', null, 'Chào mừng đến với Framework Tự Build!'),
    h('p', null, 'Demo CRUD tasks với upload và tải file PDF từ Supabase Storage.'),
    h('p', null, 'Mỗi task có thể đính kèm 1 file PDF.')
  );
}

function About() {
  return h('div', { className: 'container' },
    h('h1', null, 'Giới Thiệu'),
    h('p', null, 'Framework nhẹ + Supabase Database + Storage.')
  );
}

/*
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPdfFile, setEditPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, completed, pdf_url, created_at')
      .order('created_at', { ascending: false });

    if (error) setMessage('Lỗi load: ' + error.message);
    else setTasks(data || []);
    setLoading(false);
  };

  const uploadPdf = async (file, taskId) => {
    if (!file) return null;

    const ext = file.name.split('.').pop();
    const fileName = `${taskId}_${Date.now()}.${ext}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('task-pdfs')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('task-pdfs')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    if (newPdfFile && newPdfFile.size > MAX_FILE_SIZE) {
      setMessage('File quá lớn! Vui lòng chọn <= 50 MB.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert({ title: newTitle.trim() })
        .select()
        .single();
      if (insertError) throw insertError;

      let pdfUrl = null;
      if (newPdfFile) pdfUrl = await uploadPdf(newPdfFile, newTask.id);

      if (pdfUrl) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ pdf_url: pdfUrl })
          .eq('id', newTask.id);
        if (updateError) throw updateError;
      }

      setNewTitle('');
      setNewPdfFile(null);
      fetchTasks();
      setMessage('Thêm task thành công!');
    } catch (err) {
      setMessage('Lỗi thêm task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    if (editPdfFile && editPdfFile.size > MAX_FILE_SIZE) {
      setMessage('File quá lớn! Vui lòng chọn <= 50 MB.');
      return;
    }

    setLoading(true);
    try {
      let pdfUrl = tasks.find(t => t.id === editingId)?.pdf_url || null;
      if (editPdfFile) pdfUrl = await uploadPdf(editPdfFile, editingId);

      const updates = { title: editTitle.trim() };
      if (pdfUrl !== null) updates.pdf_url = pdfUrl;

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setEditPdfFile(null);
      fetchTasks();
      setMessage('Sửa thành công!');
    } catch (err) {
      setMessage('Lỗi sửa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompleted = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) setMessage('Lỗi xóa: ' + error.message);
    else {
      fetchTasks();
      setMessage('Xóa thành công!');
    }
    setLoading(false);
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPdfFile(null);
  };

  const handleNewFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File quá lớn! Vui lòng chọn <= 50 MB.');
      e.target.value = '';
      return;
    }
    setNewPdfFile(file);
  };

  const TaskItem = (task) => {
    const isEditing = editingId === task.id;

    return h('li', { key: task.id, className: 'task-item' },
      h('input', { type: 'checkbox', checked: task.completed || false, onChange: () => toggleCompleted(task) }),
      ' ',
      isEditing
        ? h('div', { className: 'edit-form' },
            h('input', {
              type: 'text',
              value: editTitle,
              onInput: e => setEditTitle(e.target.value),
              className: 'title-input'
            }),
            h('br'),
            h('input', {
              type: 'file',
              accept: '.pdf',
              onChange: e => setEditPdfFile(e.target.files[0] || null)
            }),
            h('p', { className: 'current-pdf' },
              task.pdf_url ? 'PDF hiện tại: ' : 'Chưa có PDF',
              task.pdf_url && h('a', { href: task.pdf_url, target: '_blank', rel: 'noopener' }, 'Xem')
            ),
            h('div', { className: 'edit-actions' },
              h('button', { onClick: saveEdit, disabled: loading, className: 'btn-save' }, 'Lưu'),
              ' ',
              h('button', { onClick: cancelEdit, className: 'btn-cancel' }, 'Hủy')
            )
          )
        : h('span', null,
            h('strong', { className: task.completed ? 'completed' : '' }, task.title),
            task.pdf_url && h('span', null,
              ' | ',
              h('a', { href: task.pdf_url, download: true, className: 'pdf-download' }, 'Tải PDF về'),
              ' ',
              h('a', { href: task.pdf_url, target: '_blank', rel: 'noopener', className: 'pdf-view' }, '(xem)')
            )
          ),
      '   ',
      !isEditing && h('button', { onClick: () => startEdit(task), className: 'btn-edit' }, 'Sửa'),
      ' ',
      h('button', { onClick: () => deleteTask(task.id), className: 'btn-delete' }, 'Xóa')
    );
  };

  return h('div', { className: 'container' },
    h('h1', null, 'Quản lý Tasks + PDF'),

    // Form thêm task
    h('div', { className: 'add-task-form' },
      h('input', {
        type: 'text',
        placeholder: 'Tiêu đề task mới',
        value: newTitle,
        onInput: e => setNewTitle(e.target.value),
        disabled: loading,
        className: 'title-input'
      }),
      h('br'),
      h('input', {
        type: 'file',
        accept: '.pdf',
        onChange: handleNewFileChange,
        disabled: loading
      }),
      newPdfFile && h('span', { className: 'file-selected' }, `Đã chọn: ${newPdfFile.name}`),
      h('br'),
      h('button', {
        onClick: addTask,
        disabled: loading || !newTitle.trim(),
        className: 'btn-primary'
      }, loading ? 'Đang xử lý...' : 'Thêm Task')
    ),

    message && h('p', {
      className: message.includes('Lỗi') ? 'msg-error' : 'msg-success'
    }, message),

    loading && !tasks.length
      ? h('p', null, 'Đang tải...')
      : h('ul', { className: 'task-list' },
          tasks.map(TaskItem)
        )
  );
}
*/

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








addRoute('/', Home);
addRoute('/about', About);
addRoute('/tasks', Tasks);

navbarDynamic({ navbar: Navbar });
init(document.getElementById('app'), { hash: false });