import { useState, useRef, useEffect } from 'react'

export default function ImageCropper({ src, onCrop, onCancel }) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 })
  const imgRef = useRef(null)

  const VIEWPORT_SIZE = 180 // Tamanho da área de recorte circular

  // Quando a imagem carregar, calculamos as dimensões base para preencher o VIEWPORT_SIZE
  const handleImageLoad = (e) => {
    const img = e.target
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    const ar = naturalWidth / naturalHeight

    let w = VIEWPORT_SIZE
    let h = VIEWPORT_SIZE

    if (ar > 1) {
      w = VIEWPORT_SIZE * ar
    } else {
      h = VIEWPORT_SIZE / ar
    }

    setBaseSize({ width: w, height: h })
    // Centraliza a imagem inicialmente
    setPosition({
      x: (VIEWPORT_SIZE - w) / 2,
      y: (VIEWPORT_SIZE - h) / 2
    })
    setZoom(1)
  }

  // Calcula restrições para garantir que a imagem sempre preencha o círculo de recorte
  const getConstrainedPos = (x, y, scale) => {
    const w = baseSize.width * scale
    const h = baseSize.height * scale

    // O limite esquerdo não pode ser > 0 (imagem saindo pela direita do círculo)
    // O limite direito (x + w) não pode ser < VIEWPORT_SIZE
    let minX = VIEWPORT_SIZE - w
    let maxX = 0
    if (minX > maxX) minX = maxX

    let cx = Math.min(Math.max(x, minX), maxX)

    // O limite superior não pode ser > 0 (imagem saindo por baixo)
    // O limite inferior (y + h) não pode ser < VIEWPORT_SIZE
    let minY = VIEWPORT_SIZE - h
    let maxY = 0
    if (minY > maxY) minY = maxY

    let cy = Math.min(Math.max(y, minY), maxY)

    return { x: cx, y: cy }
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    const constrained = getConstrainedPos(newX, newY, zoom)
    setPosition(constrained)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y
    const constrained = getConstrainedPos(newX, newY, zoom)
    setPosition(constrained)
  }

  const handleZoomChange = (e) => {
    const nextZoom = parseFloat(e.target.value)
    const oldZoom = zoom
    const centerX = VIEWPORT_SIZE / 2
    const centerY = VIEWPORT_SIZE / 2

    // Ponto aproximado da imagem que está no centro do círculo
    const imgPointX = (centerX - position.x) / oldZoom
    const imgPointY = (centerY - position.y) / oldZoom

    // Nova posição ajustada para que o mesmo ponto permaneça no centro
    const nextX = centerX - imgPointX * nextZoom
    const nextY = centerY - imgPointY * nextZoom

    const constrained = getConstrainedPos(nextX, nextY, nextZoom)
    setZoom(nextZoom)
    setPosition(constrained)
  }

  const handleCrop = () => {
    const img = imgRef.current
    if (!img) return

    const canvas = document.createElement('canvas')
    // Usamos 2x o tamanho para melhor qualidade (retina)
    canvas.width = VIEWPORT_SIZE * 2
    canvas.height = VIEWPORT_SIZE * 2

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Renderiza a imagem escalada e transladada no canvas 2x
    const w = baseSize.width * zoom * 2
    const h = baseSize.height * zoom * 2
    const dx = position.x * 2
    const dy = position.y * 2

    ctx.drawImage(img, dx, dy, w, h)

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85)
    onCrop(croppedBase64)
  }

  return (
    <div className="cropper-overlay">
      <div className="cropper-box">
        <div className="cropper-header">Recortar Foto de Perfil</div>
        
        <div 
          className="cropper-viewport-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div className="cropper-viewport" style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
            <img
              ref={imgRef}
              src={src}
              alt="Para recortar"
              onLoad={handleImageLoad}
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: baseSize.width * zoom,
                height: baseSize.height * zoom,
                maxWidth: 'none',
                maxHeight: 'none',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        <div className="cropper-controls">
          <i className="ti ti-zoom-out" style={{ fontSize: 16 }} />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoomChange}
            className="zoom-slider"
          />
          <i className="ti ti-zoom-in" style={{ fontSize: 16 }} />
        </div>

        <div className="cropper-actions">
          <button className="btn-sm secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-sm primary" onClick={handleCrop}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}
