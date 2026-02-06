export default function Button({ children, variant = "primary", ...props }) {
  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition";
  const styles = {
    primary: "bg-unca-500 hover:bg-unca-600 text-white",
    ghost: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    subtle: "bg-unca-100 text-unca-800 hover:bg-unca-200",
  };
  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
}
