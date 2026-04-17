export default function Loading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">

      {/* Header */}
      <div className="h-6 w-40 bg-gray-200 rounded-md" />

      {/* Member Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded-md" />
        <div className="h-4 w-24 bg-gray-200 rounded-md" />
        <div className="h-4 w-40 bg-gray-200 rounded-md" />
      </div>

      {/* Membership List */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">

        <div className="h-4 w-32 bg-gray-200 rounded-md mb-3" />

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
          >
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>

            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}

      </div>

    </div>
  );
}