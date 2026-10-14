import { Building2, ExternalLink, ImageOff, X } from 'lucide-react'
import type { Monument } from '../../types'

interface MonumentPanelProps {
  monuments: Monument[]
  loading: boolean
  selectedMonument: Monument | null
  onSelect: (monument: Monument | null) => void
  onClose: () => void
  className?: string
  hiddenCount?: number
}

export function MonumentPanel({
  monuments,
  loading,
  selectedMonument,
  onSelect,
  onClose,
  className = '',
  hiddenCount = 0,
}: MonumentPanelProps) {
  return (
    <div
      className={`absolute right-4 bottom-4 w-80 max-w-[calc(100%-2rem)] bg-obsidian-loam/95 border border-iron-filings z-20 flex flex-col overflow-hidden ${className}`}
      style={{ transform: 'translateZ(0)', contain: 'content' }}
    >
      <div className="px-4 py-4 border-b border-iron-filings flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash mb-1">
            Inventario
          </p>
          <h2 className="text-[18px] leading-tight tracking-[-0.03em] text-bone-vellum">
            Monumentos y edificios
          </h2>
          <p className="font-jetbrains-mono text-caption text-drift-ash mt-1.5">
            {loading
              ? 'Buscando…'
              : monuments.length > 0
              ? `${monuments.length} lugares${hiddenCount > 0 ? ` · ${hiddenCount} fuera del modelo 3D` : ''}`
              : 'Sin resultados'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-drift-ash hover:text-lime-surveyor shrink-0"
          aria-label="Cerrar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ willChange: 'scroll-position' }}>
        {loading && monuments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-5 h-5 border border-drift-ash border-t-lime-surveyor rounded-full animate-spin" />
            <span className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
              Cargando
            </span>
          </div>
        )}

        {!loading && monuments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-3 px-6 text-center">
            <Building2 className="w-6 h-6 text-drift-ash" />
            <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
              Sin datos para esta ciudad
            </p>
          </div>
        )}

        <div>
          {monuments.map((monument) => {
            const isSelected = selectedMonument?.id === monument.id
            return (
              <button
                key={monument.id}
                onClick={() => onSelect(isSelected ? null : monument)}
                className={`monument-row w-full flex items-start gap-3 px-4 py-3 text-left border-b border-iron-filings/60 ${
                  isSelected ? 'bg-lime-surveyor/10' : 'hover:bg-bone-vellum/5'
                }`}
              >
                <div className="w-12 h-12 bg-obsidian-loam border border-iron-filings flex-shrink-0 overflow-hidden">
                  {monument.imageUrl ? (
                    <img
                      src={monument.imageUrl}
                      alt={monument.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-drift-ash">
                      <ImageOff className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    className={`text-[15px] leading-snug tracking-[-0.03em] truncate ${
                      isSelected ? 'text-lime-surveyor' : 'text-bone-vellum'
                    }`}
                  >
                    {monument.name}
                  </h3>
                  <p className="font-jetbrains-mono text-caption text-drift-ash mt-1 truncate">
                    {monument.type}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedMonument && (
        <div className="px-4 py-4 border-t border-iron-filings">
          <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-lime-surveyor mb-2">
            {selectedMonument.type}
          </p>
          <h3 className="text-[18px] leading-tight tracking-[-0.03em] text-bone-vellum mb-2">
            {selectedMonument.name}
          </h3>
          {selectedMonument.extract && (
            <p className="text-[14px] leading-[1.62] text-drift-ash line-clamp-4 mb-3">
              {selectedMonument.extract}
            </p>
          )}
          {selectedMonument.wikipediaUrl && (
            <a
              href={selectedMonument.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-lime-surveyor hover:text-bone-vellum"
            >
              Ver en Wikipedia
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
