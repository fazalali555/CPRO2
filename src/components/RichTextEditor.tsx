import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { CharacterCount } from '@tiptap/extension-character-count';
import classNames from 'classnames';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onPaste?: (text: string) => void;
  label?: string;
  error?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onPaste,
  label,
  error,
  className,
  minHeight = '320px',
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState('Home');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-6 text-[10pt] font-serif text-black leading-relaxed',
      },
      handlePaste: (view, event, slice) => {
        if (onPaste && event.clipboardData) {
          const plainText = event.clipboardData.getData('text/plain');
          if (plainText) {
            onPaste(plainText);
          }
        }
        return false; // let tiptap handle the actual paste formatting
      }
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ icon, onClick, active, label, danger }: any) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded hover:bg-surface-variant flex flex-col items-center justify-center transition-all min-w-[40px] active:scale-95 ${
        active ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'
      } ${danger ? 'hover:bg-error/10 hover:text-error' : ''}`}
      title={label}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="text-[9px] mt-1 hidden sm:block select-none">{label}</span>
    </button>
  );

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  return (
    <div className={classNames('flex flex-col space-y-1', className)}>
      {label && (
        <label className="text-sm font-medium text-on-surface">
          {label}
        </label>
      )}
      <div
        className={classNames(
          'border rounded-xl bg-surface overflow-hidden transition-all flex flex-col',
          error
            ? 'border-error focus-within:ring-2 focus-within:ring-error/20'
            : 'border-outline/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary'
        )}
      >
        {/* Ribbon Tabs */}
        <nav className="bg-surface-variant/20 border-b border-outline/10 flex items-center px-2 shrink-0 overflow-x-auto no-scrollbar">
          {['Home', 'Insert'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
              className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-on-surface-variant hover:bg-surface-variant/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Ribbon Tools Container */}
        <div className="bg-surface-variant/10 border-b border-outline/10 p-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 min-h-[56px]">
          {activeTab === 'Home' && (
            <>
              <div className="flex items-center rounded-lg p-0.5 gap-0.5">
                <MenuButton icon="undo" onClick={() => editor.chain().focus().undo().run()} label="Undo" />
                <MenuButton icon="redo" onClick={() => editor.chain().focus().redo().run()} label="Redo" />
              </div>

              <div className="h-8 w-px bg-outline/20 mx-1 hidden sm:block" />

              <div className="flex items-center rounded-lg p-0.5 gap-0.5 sm:gap-1">
                <div className="flex flex-col px-2 hidden lg:flex border-r border-outline/10 mr-1">
                  <select 
                    className="text-[11px] border-none bg-transparent focus:ring-0 cursor-pointer p-0 font-medium text-on-surface"
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                  <span className="text-[9px] text-on-surface-variant/70">Font</span>
                </div>
                
                <MenuButton 
                  icon="format_bold" 
                  onClick={() => editor.chain().focus().toggleBold().run()} 
                  active={editor.isActive('bold')} 
                  label="Bold"
                />
                <MenuButton 
                  icon="format_italic" 
                  onClick={() => editor.chain().focus().toggleItalic().run()} 
                  active={editor.isActive('italic')} 
                  label="Italic"
                />
                <MenuButton 
                  icon="format_underlined" 
                  onClick={() => editor.chain().focus().toggleUnderline().run()} 
                  active={editor.isActive('underline')} 
                  label="Underline"
                />
                <MenuButton 
                  icon="palette" 
                  onClick={() => {
                    const color = window.prompt('Font color (hex/name):', '#000000');
                    if (color) editor.chain().focus().setColor(color).run();
                  }} 
                  label="Color"
                />
                <MenuButton 
                  icon="border_color" 
                  onClick={() => editor.chain().focus().toggleHighlight().run()} 
                  active={editor.isActive('highlight')} 
                  label="Highlight"
                />
                <MenuButton 
                  icon="format_clear" 
                  onClick={() => editor.chain().focus().unsetAllMarks().run()} 
                  label="Clear"
                />
              </div>

              <div className="h-8 w-px bg-outline/20 mx-1 hidden sm:block" />

              <div className="flex items-center rounded-lg p-0.5 gap-0.5 sm:gap-1">
                <MenuButton 
                  icon="format_align_left" 
                  onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                  active={editor.isActive({ textAlign: 'left' })} 
                  label="Left"
                />
                <MenuButton 
                  icon="format_align_center" 
                  onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                  active={editor.isActive({ textAlign: 'center' })} 
                  label="Center"
                />
                <MenuButton 
                  icon="format_align_right" 
                  onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                  active={editor.isActive({ textAlign: 'right' })} 
                  label="Right"
                />
                <MenuButton 
                  icon="format_align_justify" 
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                  active={editor.isActive({ textAlign: 'justify' })} 
                  label="Justify"
                />
              </div>

              <div className="h-8 w-px bg-outline/20 mx-1 hidden sm:block" />

              <div className="flex items-center rounded-lg p-0.5 gap-0.5 sm:gap-1">
                <MenuButton 
                  icon="format_list_bulleted" 
                  onClick={() => editor.chain().focus().toggleBulletList().run()} 
                  active={editor.isActive('bulletList')} 
                  label="Bullets"
                />
                <MenuButton 
                  icon="format_list_numbered" 
                  onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                  active={editor.isActive('orderedList')} 
                  label="Numbers"
                />
              </div>
            </>
          )}

          {activeTab === 'Insert' && (
            <div className="flex items-center rounded-lg p-0.5 gap-1">
              <MenuButton icon="table_chart" onClick={addTable} label="Table" />
              <MenuButton icon="image" onClick={addImage} label="Picture" />
              <MenuButton icon="title" onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()} label="Heading" />
              <MenuButton icon="code" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="Code" />
              <MenuButton icon="format_quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote" />
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="relative bg-surface flex-1 overflow-y-auto">
          <style>{`
            .ProseMirror {
              min-height: ${minHeight};
            }
            .ProseMirror p {
              margin: 0.5em 0;
            }
            .ProseMirror table {
              border-collapse: collapse;
              table-layout: fixed;
              width: 100%;
              margin: 1rem 0;
              overflow: hidden;
            }
            .ProseMirror table td,
            .ProseMirror table th {
              min-width: 1em;
              border: 1px solid #e2e8f0;
              padding: 6px 10px;
              vertical-align: top;
              box-sizing: border-box;
              position: relative;
            }
            .ProseMirror table th {
              font-weight: bold;
              text-align: left;
              background-color: #f8fafc;
            }
            .ProseMirror img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1rem auto;
              border-radius: 8px;
            }
            /* Hide scrollbar for toolbar */
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <EditorContent editor={editor} className="min-h-full" />
        </div>

        {/* Footer Status Bar — Inspired by Word Pro 2.zip */}
        <div className="bg-surface-variant/20 border-t border-outline/10 px-4 py-1.5 flex items-center justify-between text-[10px] text-on-surface-variant font-medium select-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">description</span>
              <span>Page 1 of 1</span>
            </div>
            <div className="h-3 w-px bg-outline/20" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-on-surface">{editor.storage.characterCount.words()}</span>
              <span className="opacity-70">words</span>
            </div>
            <div className="h-3 w-px bg-outline/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 opacity-70">
              <span className="material-symbols-outlined text-[14px]">language</span>
              <span>English (Official)</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase tracking-tighter">Drafting Ready</span>
             </div>
          </div>
        </div>
      </div>
      {error && <span className="text-xs text-error mt-1 pl-1">{error}</span>}
    </div>
  );
}
