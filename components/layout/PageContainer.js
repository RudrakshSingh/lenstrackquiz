export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}

