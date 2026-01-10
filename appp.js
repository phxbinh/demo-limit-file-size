// app.js
const { h, render } = window.App.VDOM;
const { useState, useEffect, useRef } = window.App.Hooks;
const { Link, Outlet, navigateTo } = window.App.Router;

// ====================
// Component Auth (Đăng nhập / Đăng ký)
// ====================
function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");          // Thêm cho signup
  const [fullName, setFullName] = useState("");          // Thêm cho signup
  const [avatarUrl, setAvatarUrl] = useState("");        // Optional cho signup
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");            // Thêm thông báo success signup
  const [user, setUser] = useState(null);

  // Kiểm tra session khi mount
  useEffect(() => {
    const { data: authListener } = window.supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          navigateTo("/dashboard");
        }
      }
    );

    // Kiểm tra session ban đầu
    window.supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) navigateTo("/dashboard");
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");

  try {
    let userSession = null;

    if (isLogin) {
      // --- LOGIN ---
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      userSession = data.session;

      if (!userSession) {
        throw new Error("Không lấy được session. Vui lòng thử lại.");
      }

      if (error) throw error;

      // Khi email confirmation bật → session = null
      setSuccess(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực trước khi đăng nhập."
      );

      // Reset form
      setUsername("");
      setFullName("");
      setAvatarUrl("");
    }
  } catch (err) {
    setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
};

  const handleForgotPassword = async () => {
    if (!email) return alert("Vui lòng nhập email trước!");

    const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) alert(error.message);
    else alert("📩 Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư!");
  };

  const handleSignOut = async () => {
    await window.supabase.auth.signOut();
    setUser(null);
    navigateTo("/auth");
  };

  // Nếu đã đăng nhập → hiển thị welcome
  if (user) {
    return h("div", { style: { padding: "2rem", textAlign: "center" } },
      h("h1", null, "Chào mừng bạn trở lại!"),
      h("p", null, `Email: ${user.email}`),
      h("button", {
        onClick: handleSignOut,
        style: { padding: "0.5rem 1rem", marginTop: "1rem", background: "#ff4d4d", color: "white", border: "none", borderRadius: "4px" }
      }, "Đăng xuất"),
      h("br"),
      h(Link, { to: "/dashboard" }, "Đi đến Dashboard")
    );
  }

  return h("div", {
    style: {
      maxWidth: "400px",
      margin: "4rem auto",
      padding: "2rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }
  },
    h("h2", { style: { textAlign: "center" } }, isLogin ? "Đăng nhập" : "Đăng ký"),

    error && h("p", { style: { color: "red", textAlign: "center", marginBottom: "1rem" } }, error),
    success && h("p", { style: { color: "green", textAlign: "center", marginBottom: "1rem" } }, success),

    h("form", { onSubmit: handleSubmit },
      // Email
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Email"),
        h("input", {
          type: "email",
          value: email,
          required: true,
          disabled: loading,
          onInput: (e) => setEmail(e.target.value),
          style: { width: "100%", padding: "0.5rem", fontSize: "1rem" }
        })
      ),

      // Mật khẩu
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Mật khẩu"),
        h("input", {
          type: "password",
          value: password,
          required: true,
          minLength: 6,
          disabled: loading,
          onInput: (e) => setPassword(e.target.value),
          style: { width: "100%", padding: "0.5rem", fontSize: "1rem" }
        })
      ),

      // Các field chỉ hiện khi ĐĂNG KÝ
      !isLogin && h("div", null,
        // Username
        h("div", { style: { marginBottom: "1rem" } },
          h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Username"),
          h("input", {
            type: "text",
            value: username,
            required: true,
            minLength: 3,
            disabled: loading,
            onInput: (e) => setUsername(e.target.value),
            style: { width: "100%", padding: "0.5rem", fontSize: "1rem" }
          })
        ),

        // Full Name
        h("div", { style: { marginBottom: "1rem" } },
          h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Họ và tên"),
          h("input", {
            type: "text",
            value: fullName,
            required: true,
            disabled: loading,
            onInput: (e) => setFullName(e.target.value),
            style: { width: "100%", padding: "0.5rem", fontSize: "1rem" }
          })
        ),

        // Avatar URL (optional)
        h("div", { style: { marginBottom: "1rem" } },
          h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Avatar URL (tùy chọn)"),
          h("input", {
            type: "url",
            value: avatarUrl,
            disabled: loading,
            onInput: (e) => setAvatarUrl(e.target.value),
            style: { width: "100%", padding: "0.5rem", fontSize: "1rem" }
          })
        )
      ),

      // Nút submit
      h("button", {
        type: "submit",
        disabled: loading,
        style: {
          width: "100%",
          padding: "0.75rem",
          background: "#0066ff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer"
        }
      }, loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Đăng ký")),

      // Toggle Login/Signup
      h("p", { style: { textAlign: "center", marginTop: "1rem" } },
        isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? ",
        h("a", {
          href: "#",
          onClick: (e) => { e.preventDefault(); setIsLogin(!isLogin); setError(""); setSuccess(""); }
        }, isLogin ? "Đăng ký ngay" : "Đăng nhập")
      ),

      // Quên mật khẩu
      isLogin && h("p", { style: { textAlign: "center", marginTop: "1rem" } },
        h("a", {
          href: "#",
          onClick: (e) => { e.preventDefault(); handleForgotPassword(); }
        }, "Quên mật khẩu?")
      )
    )
  );
}


// ====================
// Change Password Component
// ====================
function ChangePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await window.supabase.auth.updateUser({
        password
      });
      if (error) throw error;

      setMessage("✅ Đổi mật khẩu thành công");
      setPassword("");
    } catch (err) {
      setError(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return h("div", {
    style: {
      maxWidth: "400px",
      margin: "2rem auto",
      padding: "1.5rem",
      border: "1px solid #ddd",
      borderRadius: "8px"
    }
  },
    h("h3", null, "Đổi mật khẩu"),
    error && h("p", { style: { color: "red" } }, error),
    message && h("p", { style: { color: "green" } }, message),

    h("form", { onSubmit: handleChangePassword },
      h("input", {
        type: "password",
        placeholder: "Mật khẩu mới (>= 6 ký tự)",
        required: true,
        minLength: 6,
        disabled: loading,
        value: password,
        onInput: (e) => setPassword(e.target.value),
        style: { width: "100%", padding: "0.5rem", marginBottom: "1rem" }
      }),
      h("button", {
        type: "submit",
        disabled: loading,
        style: {
          width: "100%",
          padding: "0.6rem",
          background: "#0066ff",
          color: "#fff",
          border: "none",
          borderRadius: "4px"
        }
      }, loading ? "Đang đổi..." : "Đổi mật khẩu")
    )
  );
}


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
      .select("id, title, completed, pdf_url, created_at, user_id")
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
        await supabase.from("tasks").update({ pdf_url: path }).eq("id", task.id);
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
      let pdfPath = tasks.find(t => t.id === editingId)?.pdf_url || null;

      if (editPdfFile) {
        pdfPath = await uploadPdf(editPdfFile, user.id, editingId);
      }

      await supabase
        .from("tasks")
        .update({ title: editTitle.trim(), pdf_url: pdfPath })
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
            task.pdf_url &&
              h("button", {
                style: { marginLeft: "1rem" },
                onClick: async () => {
                  const url = await getSignedUrl(task.pdf_url);
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



// ====================
// Reset Password
// ====================
function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const { error } = await window.supabase.auth.updateUser({
        password
      });
      if (error) throw error;

      setMsg("✅ Đặt lại mật khẩu thành công");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return h("div", { style: { padding: "2rem", maxWidth: "400px", margin: "auto" } },
    h("h2", null, "Đặt lại mật khẩu"),
    error && h("p", { style: { color: "red" } }, error),
    msg && h("p", { style: { color: "green" } }, msg),
    h("form", { onSubmit: handleReset },
      h("input", {
        type: "password",
        required: true,
        minLength: 6,
        value: password,
        onInput: e => setPassword(e.target.value),
        placeholder: "Mật khẩu mới",
        style: { width: "100%", padding: "0.5rem", marginBottom: "1rem" }
      }),
      h("button", { disabled: loading }, loading ? "Đang xử lý..." : "Xác nhận")
    )
  );
}



// ====================
// Dashboard (sau khi login)
// ====================
function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    window.supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    await window.supabase.auth.signOut();
    navigateTo("/auth");
  };

  return h("div", { style: { padding: "2rem", textAlign: "center" } },
    h("h1", null, "Dashboard"),
    h("p", null, user ? `Xin chào ${user.email}` : "Đang tải..."),

    user && h(ChangePassword),

    user && h(Link, {to: 'profile', children: "Chỉnh sửa hồ sơ"}),

    h("button", {
      onClick: handleSignOut,
      style: { padding: "0.5rem 1rem", marginTop: "1rem" }
    }, "Đăng xuất"),
    h("br"), h("br"),
    h(Link, { to: "/auth", children: "Về trang Auth" }),
    h('br'), h('br'),

user && h(Link, { to: "/tasks", children: "📋 Quản lý Tasks" })
  );
}


// ====================
// Component Profile Edit (Chỉnh sửa thông tin cá nhân)
// ====================
function ProfileEdit() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
    website: "",
    role: ""  // Chỉ hiển thị, không cho user thường sửa
  });

  // Lấy thông tin profile khi component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error("Bạn chưa đăng nhập");

        const { data, error } = await window.supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Không tìm thấy profile");

        setProfile(data);
        setFormData({
          username: data.username || "",
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          website: data.website || "",
          role: data.role || "user"
        });
      } catch (err) {
        setError(err.message || "Không thể tải thông tin cá nhân");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Lưu thông tin
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) throw new Error("Bạn chưa đăng nhập");

      const updates = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url.trim(),
        bio: formData.bio.trim(),
        website: formData.website.trim(),
        updated_at: new Date().toISOString()
      };

      // Nếu là admin, cho phép update role (nếu có thay đổi)
      if (formData.role && profile.role !== formData.role) {
        if (profile.role === "admin") {
          updates.role = formData.role;
        } else {
          throw new Error("Bạn không có quyền thay đổi role");
        }
      }

      const { error } = await window.supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("Cập nhật thông tin thành công!");
      setProfile({ ...profile, ...updates }); // Cập nhật local state
    } catch (err) {
      setError(err.message || "Cập nhật thất bại, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return h("div", { style: { textAlign: "center", padding: "2rem" } },
      h("p", null, "Đang tải thông tin cá nhân...")
    );
  }

  if (error) {
    return h("div", { style: { textAlign: "center", padding: "2rem", color: "red" } },
      h("p", null, error)
    );
  }

  return h("div", {
    style: {
      maxWidth: "500px",
      margin: "2rem auto",
      padding: "2rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fff"
    }
  },
    h("h2", { style: { textAlign: "center", marginBottom: "1.5rem" } }, "Chỉnh sửa thông tin cá nhân"),

    success && h("p", { style: { color: "green", textAlign: "center", marginBottom: "1rem" } }, success),
    error && h("p", { style: { color: "red", textAlign: "center", marginBottom: "1rem" } }, error),

    h("form", { onSubmit: handleSave },

      // Username
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Username"),
        h("input", {
          type: "text",
          name: "username",
          value: formData.username,
          onInput: handleChange,
          required: true,
          minLength: 3,
          disabled: saving,
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem" }
        })
      ),

      // Họ và tên
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Họ và tên"),
        h("input", {
          type: "text",
          name: "full_name",
          value: formData.full_name,
          onInput: handleChange,
          required: true,
          disabled: saving,
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem" }
        })
      ),

      // Avatar URL
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Avatar URL"),
        h("input", {
          type: "url",
          name: "avatar_url",
          value: formData.avatar_url,
          onInput: handleChange,
          placeholder: "https://example.com/avatar.jpg",
          disabled: saving,
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem" }
        })
      ),

      // Bio
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Giới thiệu (Bio)"),
        h("textarea", {
          name: "bio",
          value: formData.bio,
          onInput: handleChange,
          rows: 4,
          disabled: saving,
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem" }
        })
      ),

      // Website
      h("div", { style: { marginBottom: "1rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Website"),
        h("input", {
          type: "url",
          name: "website",
          value: formData.website,
          onInput: handleChange,
          placeholder: "https://example.com",
          disabled: saving,
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem" }
        })
      ),

      // Role (chỉ hiển thị, không cho user thường sửa)
      h("div", { style: { marginBottom: "1.5rem" } },
        h("label", { style: { display: "block", marginBottom: "0.5rem" } }, "Vai trò (Role)"),
        h("input", {
          type: "text",
          value: formData.role,
          disabled: true,  // Luôn disable
          style: { width: "100%", padding: "0.6rem", fontSize: "1rem", background: "#f0f0f0" }
        }),
        profile?.role !== "admin" && h("small", { style: { color: "gray", display: "block", marginTop: "0.3rem" } },
          "Chỉ admin mới có thể thay đổi role"
        )
      ),

      // Nút lưu
      h("button", {
        type: "submit",
        disabled: saving,
        style: {
          width: "100%",
          padding: "0.8rem",
          background: "#0066ff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: saving ? "not-allowed" : "pointer"
        }
      }, saving ? "Đang lưu..." : "Lưu thay đổi")
    )
  );
}

// ====================
// Home Page
// ====================
function Home() {
  return h("div", { style: { padding: "2rem", textAlign: "center" } },
    h("h1", null, "Welcome to My App"),
    h("p", null, "Đây là trang chủ"),
    h(Link, { to: "/auth" }, "Đi đến Đăng nhập / Đăng ký"),
    h("br"), h("br"),
    h(Link, { to: "/dashboard" }, "Dashboard (yêu cầu đăng nhập)")
  );
}

// ====================
// Routes
// ====================
window.App.Router.addRoute("/", Home);
window.App.Router.addRoute("/auth", AuthPage);
window.App.Router.addRoute("/dashboard", Dashboard);
window.App.Router.addRoute("/reset-password", ResetPasswordPage);
window.App.Router.addRoute("/profile", ProfileEdit);
window.App.Router.addRoute("/tasks", Tasks);


// Navbar đơn giản
window.App.Router.navbarDynamic({
  navbar: () => h("nav", {
    style: {
      background: "#333",
      color: "white",
      padding: "1rem",
      textAlign: "center"
    }
  },
    h(Link, { to: "/", style: { color: "white", margin: "0 1rem" }, children: "Home"}),
    h(Link, { to: "/auth", style: { color: "white", margin: "0 1rem" }, children: "Auth"}),
    h(Link, { to: "/dashboard", style: { color: "white", margin: "0 1rem" }, children: "Dashboard" }),
h(Link, { to: "/tasks", style: { color: "white", margin: "0 1rem" }, children: "Tasks" }),


  )
});

// ====================
// Khởi động App
// ====================
const mountEl = document.getElementById("app");
window.App.Router.init(mountEl, { hash: false }); // Dùng history mode

// Fallback 404
window.App.Router.setNotFound(() => h("div", { style: { padding: "2rem", textAlign: "center" } },
  h("h1", null, "404 - Không tìm thấy trang")
));