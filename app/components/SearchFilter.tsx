'use client';

export default function SearchFilter({
  selectedProvince,
  setSelectedProvince,
  searchQuery,
  setSearchQuery,
}: {
  selectedProvince: string;
  setSelectedProvince: (prov: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const provinces = [
    { id: 'ALL', name: '🌐 ทั้งหมด 4 จังหวัด' },
    { id: 'กรุงเทพมหานคร', name: '🏙️ กรุงเทพฯ (สายไหม/ดอนเมือง/บางเขน)' },
    { id: 'นนทบุรี', name: '⛵ นนทบุรี (ปากเกร็ด/เมืองนนท์)' },
    { id: 'ปทุมธานี', name: '🌊 ปทุมธานี (รังสิต/ลำลูกกา)' },
    { id: 'นครนายก', name: '🏞️ นครนายก' },
  ];

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      {/* ช่องค้นหา (Search Bar) */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 ค้นหาพื้นที่, คลอง, ถนน (เช่น สายไหม, ลำลูกกา คลอง 4, ท่าน้ำนนท์, พหลโยธิน)..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-xs bg-slate-200 text-slate-600 hover:bg-slate-300 px-2 py-1 rounded-full"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* ปุ่มเลือกจังหวัด (Province Filter Tabs) */}
      <div className="flex flex-wrap gap-2">
        {provinces.map((prov) => (
          <button
            key={prov.id}
            onClick={() => setSelectedProvince(prov.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              selectedProvince === prov.id
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {prov.name}
          </button>
        ))}
      </div>
    </div>
  );
}