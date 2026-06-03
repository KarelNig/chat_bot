"use client";

function ShimmerRow({ wide }: { wide: boolean }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className={["h-3 rounded bg-gray-200", wide ? "w-3/4" : "w-1/2"].join(" ")} />
        <div className="h-2.5 rounded bg-gray-200 w-2/5" />
      </div>
    </div>
  );
}

export function ChatSkeleton(): React.JSX.Element {
  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden animate-pulse"
      role="status"
      aria-label="Loading chats"
    >
      {/* Row 1: Global header skeleton */}
      <div className="flex-shrink-0 flex items-stretch border-b border-gray-200 bg-white h-[62px]">
        {/* Left: logo placeholder */}
        <div className="flex-shrink-0 flex items-center px-5 md:w-72 lg:w-80">
          <div className="h-7 w-28 rounded-lg bg-gray-200" />
        </div>
        {/* Right: user placeholder */}
        <div className="flex-1 flex flex-col items-end justify-center px-5 gap-1.5 border-l border-gray-100">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-2.5 w-12 rounded bg-gray-200" />
        </div>
      </div>

      {/* Row 2: Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="flex-shrink-0 w-72 lg:w-80 h-full flex flex-col bg-white border-r border-gray-200">
          <div className="px-5 pt-5 pb-3">
            <div className="h-2.5 w-24 rounded bg-gray-200" />
          </div>
          <div className="px-4 pb-2.5">
            <div className="h-10 w-full rounded-xl bg-gray-200" />
          </div>
          <div className="px-4 pb-4">
            <div className="h-10 w-full rounded-xl bg-gray-200" />
          </div>
          <div className="flex-1 px-3 flex flex-col gap-0.5">
            <ShimmerRow wide />
            <ShimmerRow wide={false} />
            <ShimmerRow wide />
            <ShimmerRow wide={false} />
            <ShimmerRow wide />
          </div>
        </aside>

        {/* Chat window skeleton — desktop only */}
        <div className="flex-1 flex-col h-full hidden md:flex bg-white">
          {/* Bot name header */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 rounded bg-gray-200" />
              <div className="h-2.5 w-12 rounded bg-gray-200" />
            </div>
          </div>
          <div className="border-b border-gray-200" />
          {/* Messages */}
          <div className="flex-1 px-4 py-5 flex flex-col gap-3 bg-gray-50">
            <div className="flex justify-start">
              <div className="h-12 w-52 rounded-2xl rounded-bl-sm bg-white border border-gray-100" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-36 rounded-2xl rounded-br-sm bg-violet-100" />
            </div>
            <div className="flex justify-start">
              <div className="h-16 w-64 rounded-2xl rounded-bl-sm bg-white border border-gray-100" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-48 rounded-2xl rounded-br-sm bg-violet-100" />
            </div>
          </div>
          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="h-12 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
