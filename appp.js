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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BUCKET = 'user-pdfs';

function getFilePathFromUrl(url) {
  if (!url) return null;
  return url.split('/').slice(-2).join('/');
}

async function removePdfByUrl(url) {
  const path = getFilePathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

async function uploadPdf(file, taskId) {
  if (!file) return null;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File PDF vượt quá 50MB');
  }

  const ext = file.name.split('.').pop();
  const path = `${taskId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

function getPathFromPublicUrl(url) {
  if (!url) return null;

  // https://xxx.supabase.co/storage/v1/object/public/task-pdfs/123/abc.pdf
  const idx = url.indexOf('/task-pdfs/');
  if (idx === -1) return null;

  return url.substring(idx + '/task-pdfs/'.length);
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newPdf, setNewPdf] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPdf, setEditPdf] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,completed,pdf_url,created_at')
      .order('created_at', { ascending: false });

    if (error) setMessage(error.message);
    else setTasks(data || []);
    setLoading(false);
  }

  async function addTask() {
    if (!newTitle.trim()) return;

    try {
      setLoading(true);

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({ title: newTitle.trim() })
        .select()
        .single();

      if (error) throw error;

      let pdfUrl = null;
      if (newPdf) pdfUrl = await uploadPdf(newPdf, task.id);

      if (pdfUrl) {
        await supabase
          .from('tasks')
          .update({ pdf_url: pdfUrl })
          .eq('id', task.id);
      }

      setTasks([ { ...task, pdf_url: pdfUrl }, ...tasks ]);
      setNewTitle('');
      setNewPdf(null);
      setMessage('Thêm task thành công');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    try {
      setLoading(true);

      const task = tasks.find(t => t.id === editingId);
      if (!task) return;

      let pdfUrl = task.pdf_url;

      if (editPdf) {
        if (task.pdf_url) await removePdfByUrl(task.pdf_url);
        pdfUrl = await uploadPdf(editPdf, task.id);
      }

      await supabase
        .from('tasks')
        .update({ title: editTitle.trim(), pdf_url: pdfUrl })
        .eq('id', task.id);

      setTasks(tasks.map(t =>
        t.id === task.id ? { ...t, title: editTitle, pdf_url: pdfUrl } : t
      ));

      cancelEdit();
      setMessage('Cập nhật thành công');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  const deleteTask = async (task) => {
  setLoading(true);
  setMessage('');

  try {
    // 1. XÓA PDF TRONG BUCKET
    if (task.pdf_url) {
      const filePath = getPathFromPublicUrl(task.pdf_url);

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('task-pdfs')
          .remove([filePath]);

        if (storageError) {
          console.error('Lỗi xoá PDF:', storageError);
          throw new Error('Không xoá được file PDF');
        }
      }
    }

    // 2. XÓA TASK TRONG DB
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);

    if (error) throw error;

    // 3. UPDATE UI
    setTasks(tasks => tasks.filter(t => t.id !== task.id));
    setMessage('Đã xoá task + PDF');

  } catch (err) {
    setMessage(err.message);
  } finally {
    setLoading(false);
  }
};

  async function toggleCompleted(task) {
    await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    setTasks(tasks.map(t =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    ));
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPdf(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditPdf(null);
  }

  function checkFile(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File PDF tối đa 50MB');
      e.target.value = '';
      return;
    }
    setter(file);
  }

  const TaskItem = (task) =>
    h('li', { key: task.id },
      h('input', {
        type: 'checkbox',
        checked: task.completed,
        onChange: () => toggleCompleted(task)
      }),
      ' ',
      editingId === task.id
        ? h('div', null,
            h('input', {
              value: editTitle,
              onInput: e => setEditTitle(e.target.value)
            }),
            h('input', {
              type: 'file',
              accept: '.pdf',
              onChange: e => checkFile(e, setEditPdf)
            }),
            task.pdf_url && h('a', { href: task.pdf_url, target: '_blank' }, 'PDF hiện tại'),
            h('button', { onClick: saveEdit }, 'Lưu'),
            h('button', { onClick: cancelEdit }, 'Hủy')
          )
        : h('span', null,
            task.title,
            task.pdf_url && h('a', { href: task.pdf_url, target: '_blank' }, ' [PDF]')
          ),
      ' ',
      !editingId && h('button', { onClick: () => startEdit(task) }, 'Sửa'),
      h('button', { onClick: () => deleteTask(task) }, 'Xóa')
    );

  return h('div', null,
    h('h2', null, 'Tasks + PDF'),
    h('input', {
      placeholder: 'Task mới',
      value: newTitle,
      onInput: e => setNewTitle(e.target.value)
    }),
    h('input', {
      type: 'file',
      accept: '.pdf',
      onChange: e => checkFile(e, setNewPdf)
    }),
    h('button', { onClick: addTask, disabled: loading }, 'Thêm'),
    message && h('p', null, message),
    h('ul', null, tasks.map(TaskItem))
  );
}

addRoute('/', Home);
addRoute('/about', About);
addRoute('/tasks', Tasks);

navbarDynamic({ navbar: Navbar });
init(document.getElementById('app'), { hash: false });