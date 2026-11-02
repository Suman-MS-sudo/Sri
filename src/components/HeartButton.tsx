type HeartButtonProps = { label: string; onClick?: () => void; className?: string }

// `.contact-btn` is the hook the living portrait listens on: hovering gives heart eyes, leaving gives a grin.
export default function HeartButton({ label, onClick, className = '' }: HeartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`contact-btn rounded-full px-8 py-3 text-xs font-medium uppercase tracking-widest text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] sm:px-10 sm:py-3.5 sm:text-sm md:px-12 md:py-4 md:text-base ${className}`}
      style={{
        background: 'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
        boxShadow: '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
        outline: '2px solid #FFFFFF',
        outlineOffset: '-3px',
      }}
    >
      {label}
    </button>
  )
}
