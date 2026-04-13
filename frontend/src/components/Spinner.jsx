// Reusable spinner component
export default function Spinner({ size = 'md', label = 'Loading...' }) {
  const sizes = { sm: 'h-5 w-5 border-2', md: 'h-9 w-9 border-[3px]', lg: 'h-14 w-14 border-4' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className={`${sizes[size]} animate-spin rounded-full border-slate-200 border-t-indigo-600`} />
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}
