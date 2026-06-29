import { useState, useEffect, useRef } from 'react'
import { useCategories } from '../CategoriesContext'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, onSnapshot, orderBy, Timestamp
} from 'firebase/firestore'
import ImageCropper from './ImageCropper'

const PALETTE = [
  '#D85A30','#E8932A','#BA7517','#1D9E75','#0F6E56',
  '#378ADD','#185FA5','#7F77DD','#5C55C0','#D4537E',
  '#993556','#888780','#4a4a48','#2c7a4b','#1a5fa8',
]

const ICONS = [
  'ti-home','ti-tools-kitchen-2','ti-car','ti-heart','ti-device-gamepad',
  'ti-school','ti-briefcase','ti-code','ti-trending-up','ti-dots',
  'ti-shopping-cart','ti-device-mobile','ti-plane','ti-music',
  'ti-building','ti-pig-money','ti-cash','ti-receipt','ti-gift',
  'ti-stethoscope','ti-dumbbell','ti-books','ti-coffee',
]

function CategoryForm({ type, initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || PALETTE[0])
  const [icon, setIcon] = useState(initial?.icon || 'ti-dots')

  const handleSave = () => {
    if (!name.trim()) return alert('Informe o nome da categoria.')
    onSave({ ...initial, name: name.trim(), color, icon })
  }

  return (
    <div className="cat-form">
      <div className="cat-form-title">{initial ? 'Editar categoria' : 'Nova categoria'}</div>

      <div className="cat-form-row">
        <div className="form-group">
          <label>Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Academia, Netflix..."
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Prévia</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span className="cat-dot-lg" style={{ background: color, width: 16, height: 16 }} />
            <i className={`ti ${icon}`} style={{ fontSize: 20, color }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{name || 'Categoria'}</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Cor</label>
        <div className="color-palette">
          {PALETTE.map(c => (
            <button
              key={c}
              className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Ícone</label>
        <div className="icon-palette">
          {ICONS.map(ic => (
            <button
              key={ic}
              className={`icon-opt${icon === ic ? ' selected' : ''}`}
              onClick={() => setIcon(ic)}
              aria-label={ic}
            >
              <i className={`ti ${ic}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="cat-form-actions">
        <button className="btn-sm secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn-sm primary" onClick={handleSave}>
          {initial ? 'Salvar' : 'Criar categoria'}
        </button>
      </div>
    </div>
  )
}

function CategorySection({ type, categories }) {
  const { addCategory, updateCategory, deleteCategory } = useCategories()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const handleSave = (cat) => {
    if (cat.id) { updateCategory(type, cat); setEditingId(null) }
    else { addCategory(type, cat); setAdding(false) }
  }

  const handleDelete = (id) => {
    if (!confirm('Excluir esta categoria? Os lançamentos existentes não serão afetados.')) return
    deleteCategory(type, id)
    if (editingId === id) setEditingId(null)
  }

  return (
    <div>
      <div className="cat-list">
        {categories.map(cat => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <CategoryForm
                type={type}
                initial={cat}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="cat-item">
                <span className="cat-dot-lg" style={{ background: cat.color }} />
                <i className={`ti ${cat.icon} cat-icon`} style={{ color: cat.color }} aria-hidden="true" />
                <span className="cat-name">{cat.name}</span>
                <div className="cat-actions">
                  <button
                    className="act-btn"
                    title="Editar"
                    onClick={() => { setEditingId(cat.id); setAdding(false) }}
                  >
                    <i className="ti ti-edit" aria-hidden="true" />
                  </button>
                  <button
                    className="act-btn danger"
                    title="Excluir"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <CategoryForm
          type={type}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          className="btn-sm secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setAdding(true); setEditingId(null) }}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Adicionar categoria
        </button>
      )}
    </div>
  )
}

function ImageCropperWrapper({ src, onCrop, onCancel }) {
  return <ImageCropper src={src} onCrop={onCrop} onCancel={onCancel} />
}

function UserForm({ initial, onSave, onCancel }) {
  const [username, setUsername] = useState(initial?.username || '')
  const [profile, setProfile] = useState(initial?.profile || 'Administrador')
  const [email, setEmail] = useState(initial?.email || '')
  const [password, setPassword] = useState(initial?.password || '')
  const [photo, setPhoto] = useState(initial?.photo || '')
  
  const [saving, setSaving] = useState(false)
  const [cropperSrc, setCropperSrc] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropperSrc(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCropped = (croppedBase64) => {
    setPhoto(croppedBase64)
    setCropperSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!username.trim()) return alert('Informe o nome de usuário.')
    if (!email.trim()) return alert('Informe o e-mail.')
    if (!password.trim()) return alert('Informe a senha.')

    setSaving(true)
    try {
      const userData = {
        username: username.trim(),
        profile,
        email: email.trim(),
        password,
        photo,
        updatedAt: Timestamp.now()
      }

      if (initial?.id) {
        await updateDoc(doc(db, 'users', initial.id), userData)
      } else {
        await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: Timestamp.now()
        })
      }
      onSave()
    } catch (err) {
      alert('Erro ao salvar usuário: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSave}>
      <div className="cat-form-title" style={{ fontSize: '14px', marginBottom: '10px' }}>
        {initial ? 'Editar Usuário' : 'Novo Usuário'}
      </div>

      <div className="avatar-upload-group">
        <label>Foto de Perfil</label>
        <div 
          className={`avatar-uploader${photo ? ' has-img' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {photo ? (
            <>
              <img src={photo} alt="Avatar Preview" className="avatar-preview" />
              <div className="avatar-hover-overlay">
                <i className="ti ti-camera" aria-hidden="true" />
                <span>Alterar</span>
              </div>
            </>
          ) : (
            <div className="avatar-placeholder-icon">
              <i className="ti ti-camera" aria-hidden="true" />
              <span>Adicionar Foto</span>
            </div>
          )}
        </div>
        {photo && (
          <button 
            type="button" 
            className="avatar-remove-btn" 
            onClick={() => setPhoto('')}
          >
            Remover foto
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>

      <div className="form-group">
        <label>Nome de Usuário</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Ex: joao.silva"
          required
        />
      </div>

      <div className="form-group">
        <label>Perfil de Usuário</label>
        <select value={profile} onChange={e => setProfile(e.target.value)} required>
          <option value="Administrador">Administrador</option>
          <option value="Editor">Editor</option>
          <option value="Visualizador">Visualizador</option>
        </select>
      </div>

      <div className="form-group">
        <label>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="joao@exemplo.com"
          required
        />
      </div>

      <div className="form-group">
        <label>Senha</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Digite a senha"
          required
        />
      </div>

      <div className="cat-form-actions" style={{ marginTop: 10 }}>
        <button type="button" className="btn-sm secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn-sm primary" disabled={saving}>
          {saving ? 'Salvando...' : initial ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
      </div>

      {cropperSrc && (
        <ImageCropperWrapper
          src={cropperSrc}
          onCrop={handleCropped}
          onCancel={() => {
            setCropperSrc(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}
    </form>
  )
}

function UserSection() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este usuário permanentemente?')) return
    try {
      await deleteDoc(doc(db, 'users', id))
    } catch (err) {
      alert('Erro ao excluir usuário: ' + err.message)
    }
  }

  if (formOpen) {
    return (
      <UserForm
        initial={editingUser}
        onSave={() => { setFormOpen(false); setEditingUser(null) }}
        onCancel={() => { setFormOpen(false); setEditingUser(null) }}
      />
    )
  }

  return (
    <div>
      <div className="users-header">
        <div className="users-title">Usuários Cadastrados</div>
        <button 
          className="btn-sm primary" 
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setFormOpen(true)}
        >
          <i className="ti ti-plus" aria-hidden="true" /> Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
          Carregando usuários...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-users" aria-hidden="true" />
          Nenhum usuário cadastrado.
        </div>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item">
              {user.photo ? (
                <img src={user.photo} alt={user.username} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.username ? user.username.charAt(0) : 'U'}
                </div>
              )}
              <div className="user-info">
                <div className="user-name-row">
                  <span className="user-name">{user.username}</span>
                  <span className={`user-badge ${(user.profile || '').toLowerCase()}`}>
                    {user.profile}
                  </span>
                </div>
                <div className="user-email">{user.email}</div>
              </div>
              <div className="cat-actions">
                <button className="act-btn" title="Editar" onClick={() => handleEdit(user)}>
                  <i className="ti ti-edit" aria-hidden="true" />
                </button>
                <button className="act-btn danger" title="Excluir" onClick={() => handleDelete(user.id)}>
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsModal({ onClose }) {
  const { expenseCategories, incomeCategories } = useCategories()
  const [tab, setTab] = useState('despesa')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 580 }} role="dialog" aria-modal="true" aria-label="Configurações">
        <div className="modal-header">
          <div className="modal-title">
            <i className="ti ti-settings" style={{ marginRight: 8, color: '#666' }} aria-hidden="true" />
            Configurações
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab${tab === 'despesa' ? ' active' : ''}`}
            onClick={() => setTab('despesa')}
          >
            <i className="ti ti-trending-down" aria-hidden="true" style={{ marginRight: 5 }} />
            Categorias de despesa
          </button>
          <button
            className={`settings-tab${tab === 'receita' ? ' active' : ''}`}
            onClick={() => setTab('receita')}
          >
            <i className="ti ti-trending-up" aria-hidden="true" style={{ marginRight: 5 }} />
            Categorias de receita
          </button>
          <button
            className={`settings-tab${tab === 'usuarios' ? ' active' : ''}`}
            onClick={() => setTab('usuarios')}
          >
            <i className="ti ti-users" aria-hidden="true" style={{ marginRight: 5 }} />
            Usuários
          </button>
        </div>

        <div className="settings-body">
          {tab === 'despesa' && (
            <CategorySection type="despesa" categories={expenseCategories} />
          )}
          {tab === 'receita' && (
            <CategorySection type="receita" categories={incomeCategories} />
          )}
          {tab === 'usuarios' && (
            <UserSection />
          )}
        </div>
      </div>
    </div>
  )
}
