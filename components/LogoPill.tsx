export default function LogoPill() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-white rounded-full px-4 py-2 flex items-center gap-3 shadow-md">
        {/* Replace with actual logo assets */}
        {/* <img src="/nacos-logo.png" alt="NACOS" className="w-8 h-8" /> */}
        {/* <img src="/rsu-logo.png" alt="RSU" className="w-8 h-8" /> */}
        <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-[10px] font-bold">
          
        </div>
        <div className="w-px h-6 bg-gray-300" />
        <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-[10px] font-bold">
          
        </div>
      </div>
      <div className="text-center">
        <p className="text-[#C4A882] text-[9px] font-inter font-medium tracking-widest uppercase">
          NACOS
        </p>
        <p className="text-[#C4A882] text-[9px] font-inter font-medium tracking-widest uppercase">
          RSU
        </p>
      </div>
    </div>
  );
}
