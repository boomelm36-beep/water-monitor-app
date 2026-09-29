export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">🌊 รายงานสถานการณ์น้ำ รังสิต–ลำลูกกา</h1>
        <p className="text-gray-600 mb-8">อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}</p>

        {/* สรุปสถานการณ์ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">ระดับน้ำ คลองรังสิต</p>
            <h2 className="text-3xl font-bold">1.45 ม.</h2>
            <p className="text-sm text-red-500 mt-2">↑ เพิ่มขึ้น 5 ซม. (จาก 1 ชม.ก่อน)</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-cyan-500">
            <p className="text-sm text-gray-500">ปริมาณฝน 1 ชม. ล่าสุด</p>
            <h2 className="text-3xl font-bold">15.2 มม.</h2>
            <p className="text-sm text-yellow-600 mt-2">ฝนปานกลาง แนวโน้มตกต่อเนื่อง</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">สถานะจราจรโดยรวม</p>
            <h2 className="text-3xl font-bold text-orange-500">🟠 เฝ้าระวัง</h2>
            <p className="text-sm text-gray-600 mt-2">พหลโยธินรถเล็กควรหลีกเลี่ยง</p>
          </div>
        </div>

        {/* ส่วนรายละเอียดพื้นที่ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📍 จุดที่ต้องเฝ้าระวัง</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex justify-between border-b pb-2">
              <span>ถนนลำลูกกา คลอง 4</span>
              <span className="text-orange-500 font-semibold">น้ำรอระบาย 20 ซม. (อัปเดต 10 นาทีที่แล้ว)</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>ประตูระบายน้ำจุฬาลงกรณ์</span>
              <span className="text-green-600 font-semibold">เดินเครื่องสูบ 8 เครื่อง (ปกติ)</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}