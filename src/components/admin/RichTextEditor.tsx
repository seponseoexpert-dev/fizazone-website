import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo2,
} from "lucide-react";

import { normalizeRichText, sanitizeHtml } from "@/lib/rich-text";

type Cmd = {
  label: string;
  icon: typeof Bold;
  run: (exec: (c: string, v?: string) => void) => void;
};

const BLOCKS = [
  { label: "Paragraph", value: "<p>" },
  { label: "Heading 1", value: "<h1>" },
  { label: "Heading 2", value: "<h2>" },
  { label: "Heading 3", value: "<h3>" },
  { label: "Heading 4", value: "<h4>" },
  { label: "Quote", value: "<blockquote>" },
];

const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

const TABLE_HTML =
  "<table><thead><tr><th>Heading</th><th>Heading</th></tr></thead>" +
  "<tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br /></p>";

const GROUPS: Cmd[][] = [
  [
    { label: "Bold", icon: Bold, run: (e) => e("bold") },
    { label: "Italic", icon: Italic, run: (e) => e("italic") },
    { label: "Underline", icon: Underline, run: (e) => e("underline") },
    { label: "Strikethrough", icon: Strikethrough, run: (e) => e("strikeThrough") },
    { label: "Inline code", icon: Code2, run: (e) => e("formatBlock", "<pre>") },
  ],
  [
    { label: "Bullet list", icon: List, run: (e) => e("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, run: (e) => e("insertOrderedList") },
    { label: "Quote", icon: Quote, run: (e) => e("formatBlock", "<blockquote>") },
  ],
  [
    { label: "Align left", icon: AlignLeft, run: (e) => e("justifyLeft") },
    { label: "Align center", icon: AlignCenter, run: (e) => e("justifyCenter") },
    { label: "Align right", icon: AlignRight, run: (e) => e("justifyRight") },
    { label: "Justify", icon: AlignJustify, run: (e) => e("justifyFull") },
  ],
  [
    {
      label: "Link",
      icon: Link2,
      run: (e) => {
        const url = window.prompt("Link URL", "https://");
        if (url && !/^\s*(javascript|data):/i.test(url)) e("createLink", url);
      },
    },
    { label: "Insert table", icon: TableIcon, run: (e) => e("insertHTML", TABLE_HTML) },
  ],
  [
    { label: "Clear formatting", icon: Eraser, run: (e) => e("removeFormat") },
    { label: "Undo", icon: Undo2, run: (e) => e("undo") },
    { label: "Redo", icon: Redo2, run: (e) => e("redo") },
  ],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a description…",
  minHeight = 200,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [block, setBlock] = useState("<p>");
  const [size, setSize] = useState("16");

  // Sync external value only when it differs from what the editor holds.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = normalizeRichText(value);
    if (el.innerHTML !== next) el.innerHTML = next;
    setEmpty(!el.textContent?.trim());
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!el.textContent?.trim());
    onChange(sanitizeHtml(el.innerHTML));
  };

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
  };

  const applySize = (px: string) => {
    setSize(px);
    ref.current?.focus();
    // execCommand fontSize only takes 1-7; wrap the selection manually instead.
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
      } catch {
        /* ignore complex selections */
      }
    }
    emit();
  };

  const selectCls =
    "h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground outline-none focus:border-sale";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-background transition ${
        focused ? "border-sale" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/40 px-1.5 py-1.5">
        <select
          value={block}
          onChange={(e) => {
            setBlock(e.target.value);
            exec("formatBlock", e.target.value);
          }}
          className={`${selectCls} w-[7.5rem]`}
          aria-label="Text style"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select
          value={size}
          onChange={(e) => applySize(e.target.value)}
          className={`${selectCls} w-[4.25rem]`}
          aria-label="Font size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
            {group.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                aria-label={c.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => c.run(exec)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-95"
              >
                <c.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          tabIndex={0}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={() => {
            setFocused(false);
            emit();
          }}
          onFocus={() => setFocused(true)}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          className="rich-text max-h-[460px] overflow-y-auto p-3 text-sm outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
