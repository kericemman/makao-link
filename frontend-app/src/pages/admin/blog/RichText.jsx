import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import {
  FiBold,
  FiItalic,
  FiCode,
  FiMinus,
  FiLink,
  FiRotateCcw,
  FiRotateCw,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiEdit3,
  FiEye
} from "react-icons/fi";
import { FaHeading, FaQuoteRight, FaListUl, FaListOl } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import sanitizeHtml from "../../../utils/sanitizeHtml";

const ToolbarButton = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors ${
      isActive
        ? "bg-[#0D915C] text-white"
        : "text-[#41635A] hover:bg-[#F1F7F3] hover:text-[#013E43]"
    }`}
  >
    {children}
  </button>
);

const RichText = ({ value, onChange }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-[#0D915C] underline"
        }
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      })
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const setLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");

    if (url === null) return;

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#DDEAE3] overflow-hidden">
      <div className="bg-[#F1F7F3] p-3 border-b border-[#DDEAE3]">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive("bold")}
            title="Bold"
          >
            <FiBold />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive("italic")}
            title="Italic"
          >
            <FiItalic />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            isActive={editor?.isActive("strike")}
            title="Strikethrough"
          >
            <span className="font-semibold line-through">S</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            isActive={editor?.isActive("code")}
            title="Code"
          >
            <FiCode />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor?.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <FaHeading />
            <span className="text-xs ml-1">1</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor?.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <FaHeading />
            <span className="text-xs ml-1">2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor?.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <FaHeading />
            <span className="text-xs ml-1">3</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive("bulletList")}
            title="Bullet List"
          >
            <FaListUl />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive("orderedList")}
            title="Numbered List"
          >
            <FaListOl />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive("blockquote")}
            title="Quote"
          >
            <FaQuoteRight />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            isActive={editor?.isActive("codeBlock")}
            title="Code Block"
          >
            <MdCode />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <FiMinus />
          </ToolbarButton>

          <ToolbarButton
            onClick={setLink}
            isActive={editor?.isActive("link")}
            title="Add Link"
          >
            <FiLink />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            isActive={editor?.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <FiAlignLeft />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            isActive={editor?.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <FiAlignCenter />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            isActive={editor?.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <FiAlignRight />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
            isActive={editor?.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <FiAlignJustify />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            title="Undo"
          >
            <FiRotateCcw />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            title="Redo"
          >
            <FiRotateCw />
          </ToolbarButton>

          <button
            type="button"
            onClick={() => setPreviewMode((current) => !current)}
            aria-pressed={previewMode}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#C9DED3] bg-white px-3 text-sm font-semibold text-[#013E43] transition hover:bg-[#E7F2EC]"
          >
            {previewMode ? <FiEdit3 aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            <span>{previewMode ? "Edit" : "Preview"}</span>
          </button>
        </div>
      </div>

      <div className="min-w-0 bg-white px-4 py-5 sm:px-7 sm:py-6">
        {previewMode ? (
          <div
            className="rich-content min-h-72"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "<p>Nothing to preview yet.</p>") }}
          />
        ) : (
          <EditorContent
            editor={editor}
            className="rich-content min-h-72 [&_.ProseMirror]:min-h-72 [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none"
          />
        )}
      </div>
    </div>
  );
};

export default RichText;
