export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">오프라인 상태입니다</h1>
        <p className="mt-2 text-gray-600">
          인터넷 연결을 확인하고 다시 시도해주세요.
        </p>
      </div>
    </div>
  );
}
