"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/auth-api";
import ArticleImageUpload from "../../components/ArticleImageUpload";
import {
    Code as CodeIcon,
    Link as LinkIcon,
    List,
    ListOrdered,
    Table,
    Quote,
    Type,
    Terminal,
    X,
    Bold,
    Italic,
    Lightbulb,
} from "lucide-react";

export default function CreateArticle() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([
        "javascript",
        "react",
    ]);
    const [customTag, setCustomTag] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const codeEditorRef = useRef<HTMLTextAreaElement>(null);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [codeContent, setCodeContent] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");

    const predefinedTags = [
        "node.js",
        "express",
        "authentication",
        "typescript",
        "api",
        "web development",
        "backend",
        "frontend",
        "database",
        "mongodb",
        "postgresql",
        "css",
        "html",
        "python",
    ];

    const programmingLanguages = [
        "javascript",
        "typescript",
        "python",
        "java",
        "cpp",
        "c",
        "csharp",
        "html",
        "css",
        "php",
        "ruby",
        "go",
        "rust",
        "kotlin",
        "swift",
        "sql",
        "json",
        "xml",
        "yaml",
        "bash",
        "powershell",
        "dart",
        "vue",
    ];

    const insertText = (before: string, after: string = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        const newText =
            content.substring(0, start) +
            before +
            selectedText +
            after +
            content.substring(end);
        setContent(newText);

        setTimeout(() => {
            const newPosition =
                start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
        }, 0);
    };

    const formatBold = () => {
        insertText("**", "**");
    };

    const formatItalic = () => {
        insertText("*", "*");
    };

    const insertLink = () => {
        const url = prompt("Enter URL:");
        if (url) {
            const linkText = prompt("Enter link text:") || "Link";
            insertText(`[${linkText}](${url})`);
        }
    };

    const insertList = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const beforeCursor = content.substring(0, start);
        const afterCursor = content.substring(start);

        const atStartOfLine = beforeCursor === "" || beforeCursor.endsWith("\n");
        const prefix = atStartOfLine ? "• " : "\n• ";

        const newContent = beforeCursor + prefix + afterCursor;
        setContent(newContent);

        setTimeout(() => {
            const newPosition = start + prefix.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
        }, 0);
    };

    const insertNumberedList = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const beforeCursor = content.substring(0, start);
        const afterCursor = content.substring(start);

        const atStartOfLine = beforeCursor === "" || beforeCursor.endsWith("\n");
        const prefix = atStartOfLine ? "1. " : "\n1. ";

        const newContent = beforeCursor + prefix + afterCursor;
        setContent(newContent);

        setTimeout(() => {
            const newPosition = start + prefix.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
        }, 0);
    };

    const insertInlineCode = () => {
        insertText("`", "`");
    };

    const insertHeading = (level: number) => {
        const heading = "#".repeat(level) + " ";
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const beforeCursor = content.substring(0, start);
        const afterCursor = content.substring(start);

        const atStartOfLine = beforeCursor === "" || beforeCursor.endsWith("\n");
        const prefix = atStartOfLine ? heading : "\n" + heading;

        const newContent = beforeCursor + prefix + afterCursor;
        setContent(newContent);

        setTimeout(() => {
            const newPosition = start + prefix.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
        }, 0);
    };

    const insertQuote = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const beforeCursor = content.substring(0, start);
        const afterCursor = content.substring(start);

        const atStartOfLine = beforeCursor === "" || beforeCursor.endsWith("\n");
        const prefix = atStartOfLine ? "> " : "\n> ";

        const newContent = beforeCursor + prefix + afterCursor;
        setContent(newContent);

        setTimeout(() => {
            const newPosition = start + prefix.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
        }, 0);
    };

    const insertTable = () => {
        const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
`;
        insertText(tableMarkdown);
    };

    const openCodeEditor = () => {
        setShowCodeEditor(true);
        setCodeContent("");
    };

    const insertCode = () => {
        if (codeContent.trim()) {
            const codeBlock = `\`\`\`${selectedLanguage}\n${codeContent}\n\`\`\`\n\n`;
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent =
                    content.substring(0, start) + codeBlock + content.substring(end);
                setContent(newContent);

                setTimeout(() => {
                    const newPosition = start + codeBlock.length;
                    textarea.setSelectionRange(newPosition, newPosition);
                    textarea.focus();
                }, 0);
            }
            setShowCodeEditor(false);
            setCodeContent("");
        }
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        if (e.key === "Tab") {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue =
                content.substring(0, start) + "  " + content.substring(end);
            setContent(newValue);
            setTimeout(() => {
                textarea.setSelectionRange(start + 2, start + 2);
                textarea.focus();
            }, 0);
        } else if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case "b":
                    e.preventDefault();
                    formatBold();
                    break;
                case "i":
                    e.preventDefault();
                    formatItalic();
                    break;
                case "k":
                    e.preventDefault();
                    insertLink();
                    break;
            }
        }
    };

    const handleCustomTagAdd = () => {
        if (
            customTag.trim() &&
            !selectedTags.includes(customTag.trim().toLowerCase()) &&
            selectedTags.length < 5
        ) {
            setSelectedTags([...selectedTags, customTag.trim().toLowerCase()]);
            setCustomTag("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCustomTagAdd();
        }
    };

    const handleTagSelect = (tag: string) => {
        if (!selectedTags.includes(tag) && selectedTags.length < 5) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleTagRemove = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setError("Please fill in all required fields");
            return;
        }

        if (selectedTags.length === 0) {
            setError("Please add at least one tag");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            formData.append("tags", JSON.stringify(selectedTags));

            images.forEach((image) => {
                formData.append(`images`, image);
            });

            await authAPI.createArticle(formData);
            router.push("/articles");
        } catch (err) {
            console.error("Error creating article:", err);
            setError("Failed to create article. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem('articleDraft', JSON.stringify({
            title,
            content,
            selectedTags,
            timestamp: new Date().toISOString(),
        }));
        alert("Draft saved successfully!");
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if ((title || content) && !loading) {
                setIsAutoSaving(true);
                localStorage.setItem('articleDraft', JSON.stringify({
                    title,
                    content,
                    selectedTags,
                    timestamp: new Date().toISOString(),
                }));
                setTimeout(() => setIsAutoSaving(false), 1000);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [title, content, selectedTags, loading]);

    const renderMarkdownPreview = (text: string) => {
    let html = text;

    // Handle code blocks with language first (e.g., ```js...```)
    html = html.replace(
        /```(\w+)\n([\s\S]*?)```/g,
        '<pre class="bg-[#172A3A] text-[#d1fae5] p-4 rounded-lg overflow-x-auto my-2 font-mono text-sm"><div class="text-xs text-[#3d4e5c] mb-2">$1</div><code>$2</code></pre>'
    );
    // Handle generic code blocks without language
    html = html.replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-[#172A3A] text-[#d1fae5] p-4 rounded-lg overflow-x-auto my-2 font-mono text-sm"><code>$1</code></pre>'
    );

    // Handle tables
    const tableRegex = /(\|.*\|[\r\n]+)(\|[\s\-\|:]+\|[\r\n]+)((?:\|.*\|(?:[\r\n]+|$))*)/g;
    html = html.replace(tableRegex, (match, header, separator, rows) => {
      const headerCells = header
        .split("|")
        .filter((cell: string) => cell.trim())
        .map(
          (cell: string) =>
            `<th class="px-2 py-1 bg-[#e6fcf1] font-semibold text-left border border-[#a8e4c9] text-[#172A3A]">${cell.trim()}</th>`
        )
        .join("");

      const rowsHtml = rows
        .split("\n")
        .filter((row: string) => row.trim())
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter((cell: string) => cell.trim())
            .map(
              (cell: string) =>
                `<td class="px-2 py-1 border border-[#a8e4c9] text-[#172A3A]">${cell.trim()}</td>`
            )
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `<table class="w-full border-collapse border border-[#a8e4c9]">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    });
    
    // Simple markdown rendering for preview
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-[#e6fcf1] text-[#065f46] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^#{3} (.+)$/gm, '<h3 class="text-xl font-semibold text-[#172A3A] mt-4 mb-2">$1</h3>')
      .replace(/^#{2} (.+)$/gm, '<h2 class="text-2xl font-semibold text-[#172A3A] mt-5 mb-2">$1</h2>')
      .replace(/^#{1} (.+)$/gm, '<h1 class="text-3xl font-bold text-[#172A3A] mt-6 mb-3">$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#06a395] pl-4 italic text-[#172A3A] my-3 bg-[#f4f4f4] py-1.5">$1</blockquote>')
      .replace(/^• (.+)$/gm, '<li class="ml-4 text-[#172A3A] my-0.5">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-[#172A3A] my-0.5">$2</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#06a395] hover:text-[#04786d] underline">$1</a>')
      .replace(/^---$/gm, '<hr class="border-[#a8e4c9] my-4" />');
      
    html = html.replace(/\n(?!<pre>)/g, '<br/>');

    return html;
  };

    const ToolbarButton: React.FC<{
        onClick: () => void;
        icon: React.ReactNode;
        title: string;
        disabled?: boolean;
    }> = ({ onClick, icon, title, disabled = false }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="p-2 rounded-lg text-[#3d4e5c] hover:bg-[#a8e4c9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {icon}
        </button>
    );


    return (
        <div className="min-h-screen bg-[#f4f4f4]">
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#172A3A] mb-2">
                        Create Article
                    </h1>
                    <p className="text-[#0e1921]">
                        Share your knowledge with the community by creating an article
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-[#d1fae5] shadow-lg">
                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                                <div className="space-y-3">
                                    <label
                                        htmlFor="title"
                                        className="block text-lg font-semibold text-[#172A3A] mb-2"
                                    >
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-sm text-[#0e1921] mb-3">
                                        Be specific and provide a clear title for your article
                                    </p>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#e6fcf1] border border-[#a8e4c9] rounded-lg text-[#172A3A] placeholder-[#3d4e5c] focus:outline-none focus:ring-2 focus:ring-[#06a395] focus:border-[#06a395] transition-all"
                                        placeholder="e.g. Complete Guide to React State Management"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label
                                        htmlFor="content"
                                        className="block text-lg font-semibold text-[#172A3A] mb-2"
                                    >
                                        Content <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-sm text-[#0e1921] mb-3">
                                        Write your article content. Use markdown formatting for
                                        better presentation.
                                    </p>
                                    <div className="bg-[#e6fcf1] border border-[#a8e4c9] rounded-xl overflow-hidden">
                                        <div className="border-b border-[#a8e4c9] bg-[#e6fcf1]/70 backdrop-blur-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <div className="flex items-center gap-1 text-[#3d4e5c]">
                                                        <div className="relative group">
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1.5 hover:bg-[#a8e4c9] rounded-md text-sm font-bold transition-colors flex items-center gap-1"
                                                                title="Headings"
                                                            >
                                                                H
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <div className="absolute top-full left-0 mt-1 bg-white border border-[#a8e4c9] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-10 min-w-20">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => insertHeading(1)}
                                                                    className="block w-full text-left px-3 py-2 hover:bg-[#d1fae5] text-xl font-bold rounded-t-lg text-[#172A3A]"
                                                                >
                                                                    H1
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => insertHeading(2)}
                                                                    className="block w-full text-left px-3 py-2 hover:bg-[#d1fae5] text-lg font-semibold text-[#172A3A]"
                                                                >
                                                                    H2
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => insertHeading(3)}
                                                                    className="block w-full text-left px-3 py-2 hover:bg-[#d1fae5] text-base font-medium rounded-b-lg text-[#172A3A]"
                                                                >
                                                                    H3
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="w-px h-5 bg-[#a8e4c9] mx-1"></div>
                                                        <ToolbarButton
                                                            onClick={formatBold}
                                                            icon={<Bold size={18} />}
                                                            title="Bold (Ctrl+B)"
                                                        />
                                                        <ToolbarButton
                                                            onClick={formatItalic}
                                                            icon={<Italic size={18} />}
                                                            title="Italic (Ctrl+I)"
                                                        />
                                                        <div className="w-px h-5 bg-[#a8e4c9] mx-1"></div>
                                                        <ToolbarButton
                                                            onClick={insertInlineCode}
                                                            icon={<CodeIcon size={18} />}
                                                            title="Inline Code"
                                                        />
                                                        <ToolbarButton
                                                            onClick={openCodeEditor}
                                                            icon={<Terminal size={18} />}
                                                            title="Code Editor"
                                                        />
                                                        <div className="w-px h-5 bg-[#a8e4c9] mx-1"></div>
                                                        <ToolbarButton
                                                            onClick={insertQuote}
                                                            icon={<Quote size={18} />}
                                                            title="Quote"
                                                        />
                                                        <ToolbarButton
                                                            onClick={insertLink}
                                                            icon={<LinkIcon size={18} />}
                                                            title="Insert Link"
                                                        />
                                                        <div className="w-px h-5 bg-[#a8e4c9] mx-1"></div>
                                                        <ToolbarButton
                                                            onClick={insertList}
                                                            icon={<List size={18} />}
                                                            title="Bullet List"
                                                        />
                                                        <ToolbarButton
                                                            onClick={insertNumberedList}
                                                            icon={<ListOrdered size={18} />}
                                                            title="Numbered List"
                                                        />
                                                        <div className="w-px h-5 bg-[#a8e4c9] mx-1"></div>
                                                        <ToolbarButton
                                                            onClick={insertTable}
                                                            icon={<Table size={18} />}
                                                            title="Insert Table"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isAutoSaving && (
                                                        <span className="text-xs text-[#065f46] flex items-center gap-1">
                                                            <svg
                                                                className="w-3 h-3 animate-spin"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                ></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                ></path>
                                                            </svg>
                                                            Saving...
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPreview(!showPreview)}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showPreview
                                                            ? "bg-[#06a395] text-white hover:bg-[#04786d]"
                                                            : "bg-[#a8e4c9] text-[#044634] hover:bg-[#d1fae5]"
                                                            }`}
                                                    >
                                                        {showPreview ? "Edit" : "Preview"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {showCodeEditor && (
                                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                                    <div className="flex items-center justify-between p-6 border-b border-[#d1fae5]">
                                                        <div className="flex items-center space-x-3">
                                                            <Terminal className="w-6 h-6 text-[#06a395]" />
                                                            <h3 className="text-xl font-bold text-[#172A3A]">
                                                                Code Editor
                                                            </h3>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCodeEditor(false)}
                                                            className="p-2 hover:bg-[#d1fae5] rounded-lg transition-colors"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-medium text-[#0e1921] mb-2">
                                                                Programming Language
                                                            </label>
                                                            <select
                                                                value={selectedLanguage}
                                                                onChange={(e) =>
                                                                    setSelectedLanguage(e.target.value)
                                                                }
                                                                className="w-full p-3 border border-[#a8e4c9] rounded-lg bg-[#e6fcf1] focus:ring-2 focus:ring-[#06a395] focus:border-[#06a395] text-[#172A3A]"
                                                            >
                                                                {programmingLanguages.map((lang) => (
                                                                    <option key={lang} value={lang}>
                                                                        {lang.charAt(0).toUpperCase() +
                                                                            lang.slice(1)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="mb-6">
                                                            <label className="block text-sm font-medium text-[#0e1921] mb-2">
                                                                Your Code
                                                            </label>
                                                            <div className="relative">
                                                                <textarea
                                                                    ref={codeEditorRef}
                                                                    value={codeContent}
                                                                    onChange={(e) =>
                                                                        setCodeContent(e.target.value)
                                                                    }
                                                                    className="w-full h-80 p-4 bg-[#172A3A] text-[#d1fae5] font-mono text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#06a395]"
                                                                    placeholder={`// Write your ${selectedLanguage} code here...`}
                                                                    style={{
                                                                        lineHeight: "1.5",
                                                                        tabSize: "2",
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab") {
                                                                            e.preventDefault();
                                                                            const start =
                                                                                e.currentTarget.selectionStart;
                                                                            const end = e.currentTarget.selectionEnd;
                                                                            const newValue =
                                                                                codeContent.substring(0, start) +
                                                                                "  " +
                                                                                codeContent.substring(end);
                                                                            setCodeContent(newValue);
                                                                            setTimeout(() => {
                                                                                e.currentTarget.setSelectionRange(
                                                                                    start + 2,
                                                                                    start + 2
                                                                                );
                                                                            }, 0);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute top-2 right-2 text-xs text-[#3d4e5c] bg-[#172A3A] px-2 py-1 rounded">
                                                                    {selectedLanguage}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-[#0e1921]">
                                                                <kbd className="px-2 py-1 bg-[#a8e4c9] rounded text-xs">
                                                                    Tab
                                                                </kbd>{" "}
                                                                to indent
                                                            </div>
                                                            <div className="flex space-x-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCodeEditor(false)}
                                                                    className="px-6 py-2 text-[#0e1921] hover:text-[#172A3A] transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={insertCode}
                                                                    disabled={!codeContent.trim()}
                                                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${codeContent.trim()
                                                                        ? "bg-[#06a395] text-white hover:bg-[#04786d] shadow-primary"
                                                                        : "bg-[#d1fae5] text-[#2d7a64] cursor-not-allowed"
                                                                        }`}
                                                                >
                                                                    Insert Code
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {showPreview ? (
                                            <div
                                                className="p-6 min-h-[500px] prose prose-[#172A3A] max-w-none"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderMarkdownPreview(content),
                                                }}
                                            />
                                        ) : (
                                            <textarea
                                                ref={textareaRef}
                                                id="content"
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                rows={20}
                                                className="w-full p-6 bg-[#d1fae5] border-0 text-[#172A3A] placeholder-[#3d4e5c] focus:outline-none resize-none font-mono text-sm leading-relaxed"
                                                placeholder="Write your article content here..."
                                                onKeyDown={handleEditorKeyDown}
                                                required
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xs text-[#3d4e5c] mt-2">
                                        <span>
                                            {
                                                content.split(" ").filter((word) => word.length > 0)
                                                    .length
                                            }{" "}
                                            words
                                        </span>
                                        <span>{content.length} characters</span>
                                    </div>
                                </div>
                                
                                {/* Image Upload Section */}
                                <div className="space-y-3">
                                    <label className="block text-lg font-semibold text-[#172A3A] mb-2">
                                        Images <span className="text-sm font-normal text-[#0e1921] ml-2">(Optional)</span>
                                    </label>
                                    <p className="text-sm text-[#0e1921] mb-3">
                                        Add up to 5 images to make your article more engaging
                                    </p>
                                    <ArticleImageUpload
                                        onImagesChange={setImages}
                                        maxImages={5}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-lg font-semibold text-[#172A3A] mb-2">
                                            Tags <span className="text-red-500">*</span>
                                            <span className="text-sm font-normal text-[#0e1921] ml-2">
                                                ({selectedTags.length}/5)
                                            </span>
                                        </label>
                                        <p className="text-sm text-[#0e1921] mb-4">
                                            Add up to 5 tags to describe what your article is about
                                        </p>
                                        <div className="bg-[#e6fcf1] border border-[#a8e4c9] rounded-lg p-4">
                                            <div className="flex flex-wrap gap-2 items-center mb-3">
                                                {selectedTags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[#06a395] text-white border border-[#33b9ab] hover:bg-[#04786d] transition-colors"
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTagRemove(tag)}
                                                            className="ml-2 text-white hover:text-white font-bold text-base leading-none"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                {selectedTags.length < 5 && (
                                                    <input
                                                        type="text"
                                                        value={customTag}
                                                        onChange={(e) => setCustomTag(e.target.value)}
                                                        onKeyPress={handleKeyPress}
                                                        className="bg-transparent border-0 outline-none text-[#172A3A] placeholder-[#3d4e5c] min-w-[120px] flex-1 py-1"
                                                        placeholder={
                                                            selectedTags.length === 0
                                                                ? "Add your first tag..."
                                                                : "Add another tag..."
                                                        }
                                                    />
                                                )}
                                            </div>
                                            {selectedTags.length >= 5 && (
                                                <p className="text-xs text-orange-500">
                                                    Maximum 5 tags allowed
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm text-[#0e1921] mb-3">
                                                Popular tags:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {predefinedTags.slice(0, 15).map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleTagSelect(tag)}
                                                        disabled={
                                                            selectedTags.includes(tag) ||
                                                            selectedTags.length >= 5
                                                        }
                                                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${selectedTags.includes(tag)
                                                            ? "bg-[#06a395] text-white border-[#33b9ab] cursor-default"
                                                            : selectedTags.length >= 5
                                                                ? "bg-[#a8e4c9] text-[#2d7a64] border-[#a8e4c9] cursor-not-allowed"
                                                                : "bg-[#d1fae5] text-[#065f46] border-[#a8e4c9] hover:bg-[#a8e4c9] hover:border-[#33b9ab] cursor-pointer"
                                                            }`}
                                                    >
                                                        {tag}
                                                        {selectedTags.includes(tag) && (
                                                            <span className="ml-1.5">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {error && (
                                    <div className="bg-red-200/30 border border-red-500/50 text-red-700 px-4 py-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="w-5 h-5 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {error}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-[#a8e4c9] gap-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2.5 text-[#0e1921] hover:text-[#172A3A] transition-colors flex items-center gap-2"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                        Cancel
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveDraft}
                                            className="px-6 py-2.5 bg-[#d1fae5] text-[#065f46] rounded-lg hover:bg-[#a8e4c9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#06a395] flex items-center gap-2"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            Save Draft
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                loading ||
                                                !title.trim() ||
                                                !content.trim() ||
                                                selectedTags.length === 0
                                            }
                                            className="px-8 py-2.5 bg-[#06a395] text-white font-medium rounded-lg hover:bg-[#04786d] focus:outline-none focus:ring-2 focus:ring-[#06a395] focus:ring-offset-2 focus:ring-offset-[#f4f4f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#06a395] flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg
                                                        className="animate-spin w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Publishing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                        />
                                                    </svg>
                                                    Publish Article
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-[#d1fae5] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-[#172A3A] mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Writing Tips
                            </h3>
                            <ul className="space-y-3 text-sm text-[#0e1921]">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Make your title descriptive and SEO-friendly
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Use proper grammar and spelling
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Include relevant code examples with proper formatting
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Add images to illustrate complex concepts
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Choose tags that accurately describe your content
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#06a395] mt-0.5">•</span>
                                    Break up long paragraphs for better readability
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white border border-[#d1fae5] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-[#172A3A] mb-4 flex items-center gap-2">
                                <CodeIcon className="w-5 h-5 text-[#065f46]" />
                                Markdown Guide
                            </h3>
                            <div className="space-y-2 text-sm text-[#0e1921]">
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]">**bold**</code>
                                    <span className="text-[#172A3A] font-bold">bold</span>
                                </div>
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]">*italic*</code>
                                    <span className="text-[#172A3A] italic">italic</span>
                                </div>
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]">`code`</code>
                                    <code className="bg-[#e6fcf1] text-[#065f46] px-1 rounded">
                                        code
                                    </code>
                                </div>
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]">[link](url)</code>
                                    <span className="text-[#06a395] underline">link</span>
                                </div>
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]"># Heading</code>
                                    <span className="text-[#172A3A] font-bold">Heading</span>
                                </div>
                                <div className="flex justify-between">
                                    <code className="text-[#3d4e5c]">• List</code>
                                    <span className="text-[#172A3A]">• List</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-[#d1fae5] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-[#172A3A] mb-4 flex items-center gap-2">
                                <Type className="w-5 h-5 text-[#33b9ab]" />
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <kbd className="inline-block bg-[#e6fcf1] text-[#065f46] px-2 py-1 rounded text-xs font-mono">
                                    Ctrl + B
                                </kbd>
                                <span className="text-sm text-[#0e1921] ml-2">Bold text</span>
                                <br />
                                <kbd className="inline-block bg-[#e6fcf1] text-[#065f46] px-2 py-1 rounded text-xs font-mono">
                                    Ctrl + I
                                </kbd>
                                <span className="text-sm text-[#0e1921] ml-2">Italic text</span>
                                <br />
                                <kbd className="inline-block bg-[#e6fcf1] text-[#065f46] px-2 py-1 rounded text-xs font-mono">
                                    Tab
                                </kbd>
                                <span className="text-sm text-[#0e1921] ml-2">Indent code</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
