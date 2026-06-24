"use client";
import { useState, useEffect, useRef } from "react";
import { FiX, FiPlus } from "react-icons/fi";

interface CategorySelectProps {
  selected: string[];
  onChange: (categories: string[]) => void;
}

type Category = { _id: string; name: string; slug: string };

export function CategorySelect({ selected, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter((c) => c !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  async function createCategory() {
    if (!input.trim()) return;
    setCreating(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.trim() }),
    });
    const cat = await res.json();
    setCategories((prev) =>
      prev.find((c) => c._id === cat._id) ? prev : [...prev, cat]
    );
    onChange([...selected, cat.name]);
    setInput("");
    setCreating(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat._id}
            type="button"
            onClick={() => toggle(cat.name)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selected.includes(cat.name)
                ? "bg-[#F15C20] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Create new */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createCategory()}
          placeholder="New category..."
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
        />
        <button
          type="button"
          onClick={createCategory}
          disabled={creating || !input.trim()}
          className="px-2.5 py-1.5 bg-[#F15C20] text-white rounded-lg text-xs disabled:opacity-50 hover:bg-[#d94d17] transition-colors"
        >
          <FiPlus size={14} />
        </button>
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-[#F15C20] text-xs rounded-full"
            >
              {cat}
              <button type="button" onClick={() => toggle(cat)}>
                <FiX size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
