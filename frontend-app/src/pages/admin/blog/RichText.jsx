import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Node } from "@tiptap/core";
import imageCompression from "browser-image-compression";
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
  FiEye,
  FiVideo,
  FiImage
} from "react-icons/fi";
import { FaHeading, FaQuoteRight, FaListUl, FaListOl } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import sanitizeHtml from "../../../utils/sanitizeHtml";
import { getVideoEmbedUrl } from "../../../utils/videoEmbed";
import toast from "react-hot-toast";

const ArticleImage = Node.create({
  name: "articleImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ node }) {
    return ["img", { src: node.attrs.src, alt: node.attrs.alt || "", loading: "lazy" }];
  }
});

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Embedded property video" }
    };
  },
  parseHTML() {
    return [{
      tag: "div[data-video-embed]",
      getAttrs: (element) => {
        const iframe = element.querySelector("iframe");
        const src = getVideoEmbedUrl(iframe?.getAttribute("src"));
        return src ? { src, title: iframe?.getAttribute("title") || "Embedded property video" } : false;
      }
    }];
  },
  renderHTML({ node }) {
    const src = getVideoEmbedUrl(node.attrs.src);
    if (!src) return ["div", { "data-video-invalid": "true" }];
    return ["div", { "data-video-embed": "true", class: "article-video-embed" }, ["iframe", {
      src,
      title: node.attrs.title || "Embedded property video",
      loading: "lazy",
      referrerpolicy: "strict-origin-when-cross-origin",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowfullscreen: "true"
    }]];
  }
});

const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
    className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors disabled:cursor-wait disabled:opacity-50 ${
      isActive
        ? "bg-[#0D915C] text-white"
        : "text-[#41635A] hover:bg-[#F1F7F3] hover:text-[#013E43]"
    }`}
  >
    {children}
  </button>
);

const RichText = ({ value, onChange, onUploadImage }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
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
      }),
      VideoEmbed,
      ArticleImage
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

  const addVideo = () => {
    const input = window.prompt("Paste a YouTube or Vimeo video link");
    if (!input) return;
    const src = getVideoEmbedUrl(input);
    if (!src) {
      window.alert("Use a valid HTTPS YouTube or Vimeo video link.");
      return;
    }
    editor?.chain().focus().insertContent({
      type: "videoEmbed",
      attrs: { src, title: "Embedded property video" }
    }).run();
  };

  const addImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or AVIF image.");
      return;
    }
    const suggestedAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120);
    const alt = window.prompt("Describe this image for readers and search engines", suggestedAlt)?.trim();
    if (!alt) return;
    if (alt.length > 180) {
      toast.error("Keep the image description under 180 characters.");
      return;
    }

    setUploadingImage(true);
    try {
      let uploadFile = file;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
          fileType: "image/webp"
        });
        if (compressed?.size && compressed.size < file.size && compressed.type === "image/webp") {
          const webpName = `${file.name.replace(/\.[^.]+$/, "") || "article-image"}.webp`;
          uploadFile = new File([compressed], webpName, { type: "image/webp", lastModified: Date.now() });
        }
      } catch {
        // Keep the original file; the server validates its actual image signature and size.
      }
      if (uploadFile.size > 10 * 1024 * 1024) {
        throw new Error("This image is still over 10 MB after compression. Choose a smaller image.");
      }
      const uploaded = await onUploadImage(uploadFile);
      if (!uploaded?.url || !/^https:\/\//i.test(uploaded.url)) throw new Error("The image upload did not return a valid public image URL.");
      editor?.chain().focus().insertContent({ type: "articleImage", attrs: { src: uploaded.url, alt } }).run();
      toast.success("Image added to the article.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Image upload failed. Try a smaller image.");
    } finally {
      setUploadingImage(false);
    }
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

          <ToolbarButton onClick={addVideo} title="Add YouTube or Vimeo video">
            <FiVideo />
          </ToolbarButton>

          {onUploadImage && <>
            <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Upload image to article" disabled={uploadingImage}>
              <FiImage />
            </ToolbarButton>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={addImage}
              disabled={uploadingImage}
              aria-label="Choose an article image"
            />
            {uploadingImage && <span role="status" className="px-2 text-xs font-medium text-[#0D915C]">Uploading image…</span>}
          </>}

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
