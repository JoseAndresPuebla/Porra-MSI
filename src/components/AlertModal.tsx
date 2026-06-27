export function AlertModal({ isOpen, title, message, type, onClose }: { isOpen: boolean; title: string; message: string; type: 'success' | 'error'; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl bg-dark-800 border border-dark-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`p-4 border-b ${type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <h3 className={`font-bold ${type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{title}</h3>
        </div>
        <div className="p-4 text-gray-300 text-sm">
          {message}
        </div>
        <div className="p-4 bg-dark-900 border-t border-dark-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded bg-dark-700 text-white hover:bg-dark-600 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
