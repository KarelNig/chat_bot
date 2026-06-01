import { MessageSquare } from "lucide-react";

export function EmptyState(): React.JSX.Element {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-950 gap-4">
      <span className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <MessageSquare size={28} className="text-violet-500" />
      </span>
      <div className="text-center">
        <p className="text-zinc-300 font-semibold">Select a conversation</p>
        <p className="text-zinc-500 text-sm mt-1">or start a new one with the + button</p>
      </div>
    </div>
  );
}
