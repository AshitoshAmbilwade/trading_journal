"use client";
import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const cn = (...args: Array<string | false | null | undefined>) => args.filter(Boolean).join(" ");

interface Props {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxLength?: number;
}

export function StrategyInputList({
  label,
  items,
  onChange,
  placeholder = "Add new criterion...",
  maxItems = 200,
  maxLength = 1000,
}: Props) {
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (items.length >= maxItems) {
      alert("Max items reached");
      return;
    }
    onChange([...items, v.slice(0, maxLength)]);
    setValue("");
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-200">{label}</label>

      <div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-12 px-4 bg-gray-900 border border-gray-800 text-white"
        />

        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            onClick={add}
            className="bg-black border border-gray-800 text-gray-200 hover:bg-gray-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
          <span className="text-xs text-gray-400">Press Enter to add</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 mt-2">No items added yet.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {items.map((it, idx) => (
            <li key={idx} className={cn("flex items-center justify-between px-3 py-2 rounded-md bg-gray-800 border border-gray-700")}>
              <div className="text-sm text-white break-words">{it}</div>
              <button onClick={() => remove(idx)} className="p-1 text-gray-400 hover:text-rose-400">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
