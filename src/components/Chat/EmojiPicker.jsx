const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😎", "😢", "🙏", "👍", "👏", "🔥",
  "🎉", "💯", "🛒", "📦", "💬", "📍", "⭐", "🏷️"
];

export default function EmojiPicker({ onPick }) {
  return (
    <div className="grid grid-cols-8 gap-1 p-2 bg-white border rounded-xl shadow-lg">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="text-xl hover:scale-110 transition"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
