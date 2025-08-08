# Layout e Stili Originali - PhotoCollageMaker

## Struttura Layout Principale

```jsx
<div className="min-h-screen bg-gray-100">
  {/* Container con padding per tutti gli elementi TRANNE il collage */}
  <div className="px-2 sm:px-4 pt-2 sm:pt-4">
    {/* Header */}
    <div className="text-center mb-4 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
        Creatore di Collage
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        Carica le immagini e trascinale per riordinarle
      </p>
    </div>

    {/* Pulsante Carica Immagini */}
    <div className="text-center mb-4 sm:mb-6">
      <button
        onClick={triggerBulkFileInput}
        className="flex items-center justify-center mx-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg text-sm sm:text-base"
      >
        <Plus size={18} className="mr-2" />
        Carica Immagini (Max 4)
      </button>
      <p className="text-xs sm:text-sm text-gray-500 mt-2">
        Seleziona fino a 4 immagini che si posizioneranno automaticamente
      </p>
    </div>
  </div>

  {/* Collage Layout - SENZA PADDING, con bordo bianco come originale */}
  <div className="w-full mb-4 sm:mb-8">
    <div 
      className="bg-white mx-auto flex justify-center"
      style={{ 
        padding: '8.75px', // Bordo bianco originale della versione 55
        width: '100%'
      }}
    >
      <div 
        className="flex"
        style={{ 
          gap: '8.75px', // Gap originale
          width: '100%',
          maxWidth: 'calc(100vw - 17.5px)' // Totale viewport minus padding del container bianco
        }}
      >
        {/* Singola immagine del collage */}
        <div
          key={index}
          data-image-index={index}
          className={`
            relative bg-white overflow-hidden transition-all duration-300 ease-out flex-1
            ${dragOverIndex === index && draggedIndex !== null && draggedIndex !== index ? 'ring-4 ring-blue-400 ring-opacity-75 scale-105' : ''}
          `}
          style={{
            aspectRatio: '1 / 1',
            minWidth: '60px',
            opacity: draggedIndex === index && !touchDrag.isDragging ? 0.6 : 1,
            transform: touchDrag.isDragging && touchDrag.startIndex === index 
              ? `translate(${touchDrag.position.x - touchDrag.startPosition.x}px, ${touchDrag.position.y - touchDrag.startPosition.y}px) scale(1.1) rotate(3deg)` 
              : dragOverIndex === index && draggedIndex !== null && draggedIndex !== index
                ? 'scale(1.05)'
                : 'scale(1)',
            cursor: image && image !== 'HEIC_PLACEHOLDER' ? 'grab' : 'pointer',
            touchAction: 'none',
            userSelect: 'none',
            zIndex: touchDrag.isDragging && touchDrag.startIndex === index ? 1000 : 'auto',
            position: touchDrag.isDragging && touchDrag.startIndex === index ? 'fixed' : 'relative'
          }}
        >
          {/* Contenuto immagine */}
        </div>
      </div>
    </div>
  </div>
</div>
```

## Stati delle Immagini

### 1. Immagine Caricata
```jsx
<>
  <img
    src={image}
    alt={`Immagine ${index + 1}`}
    className="w-full h-full object-cover select-none block"
    draggable={false}
  />
  
  {/* Pulsante rimozione */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      removeImage(index);
    }}
    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-80 hover:opacity-100 z-10 w-5 h-5 sm:w-7 sm:h-7"
  >
    <X size={12} />
  </button>
  
  {/* Numero posizione */}
  <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded z-10">
    {index + 1}
  </div>
</>
```

### 2. Stato Loading
```jsx
<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 opacity-30 animate-pulse"></div>
  
  <div className="relative z-10 flex flex-col items-center">
    <div className="w-6 h-6 sm:w-10 sm:h-10 border-2 sm:border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2 sm:mb-3"></div>
    
    <p className="text-blue-700 font-semibold text-xs sm:text-sm mb-1">
      Caricamento...
    </p>
    <p className="text-blue-500 text-xs mb-2 sm:mb-3 text-center">
      Elaborazione
    </p>
    
    <div className="w-16 sm:w-24 bg-white bg-opacity-50 rounded-full h-1 sm:h-2 mb-1 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${loadingProgress[index]}%` }}
      ></div>
    </div>
    
    <p className="text-blue-600 text-xs font-mono">
      {Math.round(loadingProgress[index])}%
    </p>
  </div>
  
  {/* Particelle animate */}
  <div className="absolute top-2 left-2 w-1 h-1 sm:w-2 sm:h-2 bg-blue-300 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s' }}></div>
  <div className="absolute top-4 right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
  <div className="absolute bottom-3 left-4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-pink-300 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '1s' }}></div>
</div>
```

### 3. Slot Vuoto
```jsx
<div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
  <Upload size={20} className="sm:w-8 sm:h-8 text-gray-400 mb-1 sm:mb-2" />
  <p className="text-gray-600 font-medium text-xs sm:text-sm mb-1">
    Foto {index + 1}
  </p>
  <p className="text-gray-400 text-xs text-center px-1">
    Supportati tutti
  </p>
  <p className="text-gray-300 text-xs mt-0.5 hidden sm:block">
    JPG, PNG, HEIC*, WEBP...
  </p>
  <p className="text-gray-400 text-xs hidden sm:block">
    *Richiede conversione
  </p>
</div>
```

### 4. HEIC Placeholder
```jsx
<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 relative overflow-hidden border-2 border-orange-200">
  <div className="relative z-10 flex flex-col items-center p-1">
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-1 sm:mb-2 shadow-lg">
      <span className="text-white font-bold text-xs">HEIC</span>
    </div>
    
    <p className="text-orange-800 font-semibold text-xs text-center mb-1">
      HEIC rilevato
    </p>
    <p className="text-orange-600 text-xs text-center mb-2 px-1">
      Non supportato
    </p>
    
    <div className="bg-white bg-opacity-70 rounded p-1 text-center">
      <p className="text-orange-700 text-xs font-medium mb-1">💡 Soluzioni:</p>
      <div className="text-orange-600 text-xs">
        <p>• Converti in JPG</p>
        <p className="hidden sm:block">• Convertitore online</p>
      </div>
    </div>
  </div>
  
  {/* Pulsanti */}
  <button className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-80 hover:opacity-100 z-10 w-5 h-5 sm:w-7 sm:h-7">
    <X size={12} />
  </button>
  
  <button className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600 transition-colors z-10">
    Altro
  </button>
</div>
```

## Indicatore di Progresso
```jsx
{(loadingStates.some(state => state) || images.some(img => img && img !== 'HEIC_PLACEHOLDER')) && (
  <div className="text-center mb-4">
    <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
      <div className="flex space-x-1">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full ${
              loadingStates[idx] 
                ? 'bg-blue-400 animate-pulse' 
                : img && img !== 'HEIC_PLACEHOLDER'
                  ? 'bg-green-400'
                  : img === 'HEIC_PLACEHOLDER'
                    ? 'bg-orange-400'
                    : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-blue-600">
        {images.filter(img => img && img !== 'HEIC_PLACEHOLDER').length}/4 caricate
      </span>
    </div>
  </div>
)}
```

## Sezione Istruzioni
```jsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 sm:mb-6">
  <h3 className="font-semibold text-blue-800 mb-2 text-sm">Come usare:</h3>
  <div className="text-blue-700 text-xs space-y-1">
    <p>• <strong>"Carica Immagini"</strong> per caricare fino a 4 foto in blocco</p>
    <p>• Le immagini si posizionano automaticamente in ordine 1-2-3-4</p>
    <p>• <strong>Tieni premuto e trascina</strong> per riordinare • <strong>"Esporta"</strong> per salvare</p>
    <p className="text-blue-600">📱 Su mobile: <strong>premi e trascina</strong> per riordinare (vedrai "TRASCINANDO..." e "RILASCIA QUI")</p>
  </div>
</div>
```

## Pulsanti di Azione
```jsx
<div className="flex flex-col sm:flex-row gap-3 justify-center relative px-4">
  <div className="relative">
    {/* Pulsante Esporta con Tooltip */}
    <button
      ref={buttonRef}
      onClick={() => !showTooltip && setShowTooltip(true)}
      onMouseEnter={() => setShowTooltip(true)}
      disabled={!images.some(img => img !== null && img !== 'HEIC_PLACEHOLDER')}
      className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg text-sm font-medium"
    >
      <Download size={18} className="mr-2" />
      Esporta Collage
    </button>
    
    {/* Tooltip */}
    {showTooltip && (
      <div
        ref={tooltipRef}
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-48"
        style={{
          animation: 'fadeIn 0.2s ease-in-out'
        }}
      >
        <div className="text-sm font-medium text-gray-800 mb-3">
          📱 Scegli formato e salva:
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveToGallery('png')}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
          >
            PNG
          </button>
          <button
            onClick={() => saveToGallery('jpeg')}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
          >
            JPEG
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Su mobile: condividi o salva in galleria
        </p>
        
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    )}
  </div>
  
  {/* Pulsante Reset */}
  <button
    onClick={resetAll}
    className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg text-sm font-medium"
  >
    <RotateCcw size={18} className="mr-2" />
    Reset Tutto
  </button>
</div>
```

## Footer
```jsx
<div className="mt-6 text-center">
  <p className="text-xs text-gray-500">
    💾 Le immagini vengono elaborate localmente • Non vengono inviate online
  </p>
  <p className="text-xs text-gray-400 mt-1">
    📱 Mobile: <strong>Premi e trascina</strong> le immagini per riordinarle • Feedback visivo durante il trascinamento
  </p>
  <canvas ref={canvasRef} style={{ display: 'none' }} />
</div>
```

## CSS Personalizzato
```jsx
<style jsx>{`
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`}</style>
```

## Dimensioni e Stili Critici

- **Bordo bianco collage**: `padding: '8.75px'`
- **Gap tra immagini**: `gap: '8.75px'`
- **Aspect ratio**: `aspectRatio: '1 / 1'`
- **Min width**: `minWidth: '60px'`
- **Max width container**: `maxWidth: 'calc(100vw - 17.5px)'`
- **Touch action**: `touchAction: 'none'`
- **User select**: `userSelect: 'none'`
- **Z-index dragging**: `zIndex: 1000`
- **Position dragging**: `position: 'fixed'`

## Trasformazioni Drag

- **Durante drag**: `translate(${x}px, ${y}px) scale(1.1) rotate(3deg)`
- **Hover drop zone**: `scale(1.05)`
- **Ring drop zone**: `ring-4 ring-blue-400 ring-opacity-75 scale-105`
- **Opacity dragged**: `opacity: 0.6`

## Responsive Breakpoints

- **sm**: Utilizzato per `sm:px-4`, `sm:pt-4`, `sm:text-3xl`, `sm:w-8`, `sm:h-8`, etc.
- **Mobile first**: Classi base per mobile, `sm:` per desktop
- **Icone**: `size={18}` base, `sm:w-8 sm:h-8` per versioni più grandi
- **Padding**: `px-2 sm:px-4`, `py-2 sm:py-3`
- **Text**: `text-xs sm:text-sm`, `text-sm sm:text-base`