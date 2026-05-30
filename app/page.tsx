export default function CommandCenter() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">VAULTFORGE</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/post-deal" className="bg-emerald-600 p-6 rounded-lg">
            <div className="text-2xl font-bold">POST NEW DEAL</div>
            <div className="text-sm">Submit off-market opportunity</div>
          </a>
          
          <a href="/directory/join" className="bg-blue-600 p-6 rounded-lg">
            <div className="text-2xl font-bold">JOIN DIRECTORY</div>
            <div className="text-sm">Add your operator profile</div>
          </a>
        </div>
      </div>
    </div>
  )
}
