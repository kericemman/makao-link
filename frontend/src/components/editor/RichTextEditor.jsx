import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiList, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight,
  FiAlignJustify,
  FiType,
  FiHash,
  FiCode,
  FiLink,
  FiImage,
  FiMinus,
  FiChevronDown,
  FiEye,
  FiEdit3,
  FiSave,
  FiRotateCcw,
  FiRotateCw
} from "react-icons/fi"
import { FaHeading, FaParagraph, FaQuoteRight, FaListUl, FaListOl } from "react-icons/fa"
import { MdFormatQuote, MdCode } from "react-icons/md"

function BlogEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      })
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value])

  if (!editor) return null

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-[#02BB31] text-white shadow-md' 
          : 'text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]'
      }`}
    >
      {children}
    </button>
  )

  const ToolbarDropdown = ({ value, onChange, options, icon: Icon, title }) => (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43] transition-all"
        title={title}
      >
        <Icon className="text-lg" />
        <FiChevronDown className="text-sm" />
      </button>
      <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-[#A8D8C1] py-1 min-w-[120px] z-50 hidden group-hover:block hover:block">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F0F7F4] transition-colors ${
              value === option.value ? 'text-[#02BB31] font-medium' : 'text-[#065A57]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border-2 border-[#A8D8C1] overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#F0F7F4] p-3 border-b border-[#A8D8C1] flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#A8D8C1]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <FiBold className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <FiItalic className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <span className="text-lg line-through">S</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <FiCode className="text-lg" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#A8D8C1]">
          <ToolbarDropdown
            value={editor.isActive('heading', { level: 1 }) ? 'h1' : 
                   editor.isActive('heading', { level: 2 }) ? 'h2' : 
                   editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
            onChange={(value) => {
              if (value === 'p') {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().setHeading({ level: parseInt(value[1]) }).run()
              }
            }}
            options={[
              { value: 'p', label: 'Paragraph' },
              { value: 'h1', label: 'Heading 1' },
              { value: 'h2', label: 'Heading 2' },
              { value: 'h3', label: 'Heading 3' }
            ]}
            icon={FiType}
            title="Text Style"
          />
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#A8D8C1]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <FiList className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <FaListOl className="text-lg" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#A8D8C1]">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <FiAlignLeft className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <FiAlignCenter className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <FiAlignRight className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <FiAlignJustify className="text-lg" />
          </ToolbarButton>
        </div>

        {/* Block Elements */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#A8D8C1]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <FaQuoteRight className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <MdCode className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <FiMinus className="text-lg" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <FiRotateCcw className="text-lg" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <FiRotateCw className="text-lg" />
          </ToolbarButton>
        </div>

        {/* Preview Toggle */}
        <div className="ml-auto flex items-center space-x-1">
          <ToolbarButton
            onClick={() => {}}
            isActive={false}
            title="Preview"
          >
            <FiEye className="text-lg" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6 bg-white">
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
        />
      </div>

      {/* Character/Word Count */}
      <div className="bg-[#F0F7F4] px-4 py-2 border-t border-[#A8D8C1] flex justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="text-[#065A57]">
            Words: <span className="font-medium text-[#013E43]">
              {editor.storage?.characterCount?.words() || 0}
            </span>
          </span>
          <span className="text-[#065A57]">
            Characters: <span className="font-medium text-[#013E43]">
              {editor.storage?.characterCount?.characters() || 0}
            </span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#065A57]">
            Last saved: <span className="font-medium text-[#013E43]">Just now</span>
          </span>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        .ProseMirror p {
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #013E43;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
          color: #065A57;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #02BB31;
          padding-left: 1em;
          margin: 1em 0;
          color: #065A57;
          font-style: italic;
        }
        .ProseMirror code {
          background: #F0F7F4;
          color: #02BB31;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #013E43;
          color: #F0F7F4;
          padding: 1em;
          border-radius: 0.5em;
          font-family: monospace;
          overflow-x: auto;
        }
        .ProseMirror a {
          color: #02BB31;
          text-decoration: underline;
          cursor: pointer;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #A8D8C1;
          margin: 1em 0;
        }
      `}</style>
    </div>
  )
}

export default BlogEditor