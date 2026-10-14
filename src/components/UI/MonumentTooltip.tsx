import type { Monument } from '../../types'

interface MonumentTooltipProps {
  monument: Monument
  x: number
  y: number
}

export function MonumentTooltip({ monument, x, y }: MonumentTooltipProps) {
  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%) translateY(-12px)',
      }}
    >
      <div className="bg-obsidian-loam/95 border border-iron-filings rounded-md p-3 max-w-[260px]">
        {monument.imageUrl && (
          <div className="w-full h-28 overflow-hidden mb-3">
            <img
              src={monument.imageUrl}
              alt={monument.name}
              className="w-full h-full object-cover"
              decoding="async"
            />
          </div>
        )}
        <h3 className="text-[15px] leading-snug tracking-[-0.03em] text-bone-vellum">
          {monument.name}
        </h3>
        <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-lime-surveyor mt-1">
          {monument.type}
        </p>
        {monument.extract && (
          <p className="text-[13px] leading-[1.62] text-drift-ash mt-2 line-clamp-3">
            {monument.extract}
          </p>
        )}
      </div>
    </div>
  )
}
