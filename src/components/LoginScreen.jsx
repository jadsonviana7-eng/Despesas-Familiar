import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import ImageCropper from './ImageCropper'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Estados de Registro (Primeiro Acesso)
  const [username, setUsername] = useState('')
  const [photo, setPhoto] = useState('')
  const [cropperSrc, setCropperSrc] = useState(null)
  const fileInputRef = useRef(null)

  const [usersCount, setUsersCount] = useState(0)
  const [checkingUsers, setCheckingUsers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verifica se o banco de usuários está vazio
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const q = query(collection(db, 'users'))
        const snapshot = await getDocs(q)
        setUsersCount(snapshot.size)
      } catch (err) {
        console.error("Erro ao verificar usuários:", err)
        setError("Erro de conexão com o banco de dados.")
      } finally {
        setCheckingUsers(false)
      }
    }
    checkUsers()
  }, [])

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

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.")
      return
    }

    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        setError("E-mail ou senha incorretos.")
        setLoading(false)
        return
      }

      const userData = snapshot.docs[0].data()
      const userId = snapshot.docs[0].id

      if (userData.password === password) {
        onLogin({ id: userId, ...userData })
      } else {
        setError("E-mail ou senha incorretos.")
      }
    } catch (err) {
      console.error(err)
      setError("Erro ao autenticar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }

    setLoading(true)
    setError('')
    try {
      const newUser = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        profile: 'Administrador',
        photo,
        createdAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, 'users'), newUser)
      onLogin({ id: docRef.id, ...newUser })
    } catch (err) {
      console.error(err)
      setError("Erro ao criar conta de Administrador. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingUsers) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <i className="ti ti-loader" style={{ fontSize: 32, animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
          <span style={{ marginTop: 15, fontSize: 14, fontWeight: 600 }}>Carregando sistema...</span>
        </div>
      </div>
    )
  }

  const isFirstAccess = usersCount === 0

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-header">
          <i className="ti ti-wallet" aria-hidden="true" />
          <span>Finanças</span>
        </div>

        <h1 className="login-title">
          {isFirstAccess ? 'Primeiro Acesso' : 'Entrar no Sistema'}
        </h1>
        <p className="login-subtitle">
          {isFirstAccess 
            ? 'Cadastre a conta do Administrador Geral para iniciar o aplicativo.' 
            : 'Digite suas credenciais para gerenciar suas contas e lançamentos.'
          }
        </p>

        {error && <div className="login-error-alert">{error}</div>}

        {isFirstAccess ? (
          // Formulário de Cadastro Inicial de Administrador
          <form className="login-form" onSubmit={handleSignUp}>
            <div className="avatar-upload-group" style={{ marginBottom: 15 }}>
              <div 
                className={`avatar-uploader${photo ? ' has-img' : ''}`}
                style={{ width: 84, height: 84 }}
                onClick={() => fileInputRef.current?.click()}
              >
                {photo ? (
                  <>
                    <img src={photo} alt="Avatar Preview" className="avatar-preview" />
                    <div className="avatar-hover-overlay">
                      <i className="ti ti-camera" aria-hidden="true" />
                    </div>
                  </>
                ) : (
                  <div className="avatar-placeholder-icon">
                    <i className="ti ti-camera" aria-hidden="true" />
                    <span style={{ fontSize: 9 }}>Adicionar Foto</span>
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

            <div className="login-input-group">
              <label>Nome do Administrador</label>
              <div className="login-input-wrapper">
                <i className="ti ti-user" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>E-mail</label>
              <div className="login-input-wrapper">
                <i className="ti ti-mail" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Senha</label>
              <div className="login-input-wrapper">
                <i className="ti ti-lock" aria-hidden="true" />
                <input
                  type="password"
                  placeholder="Defina uma senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta & Iniciar'}
            </button>
          </form>
        ) : (
          // Formulário de Login Padrão
          <form className="login-form" onSubmit={handleSignIn}>
            <div className="login-input-group">
              <label>E-mail</label>
              <div className="login-input-wrapper">
                <i className="ti ti-mail" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Senha</label>
              <div className="login-input-wrapper">
                <i className="ti ti-lock" aria-hidden="true" />
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no Painel'}
            </button>
          </form>
        )}
      </div>

      {cropperSrc && (
        <ImageCropper
          src={cropperSrc}
          onCrop={handleCropped}
          onCancel={() => {
            setCropperSrc(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}
    </div>
  )
}
