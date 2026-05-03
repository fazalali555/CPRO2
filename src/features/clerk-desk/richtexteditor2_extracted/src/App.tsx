import React, { useState, useRef } from 'react';
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
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Palette, 
  FileText, 
  Printer, 
  FileDown, 
  Undo, 
  Redo, 
  Table as TableIcon,
  Image as ImageIcon,
  Search,
  Settings,
  Menu,
  X,
  Highlighter,
  Eraser,
  Type,
  Code,
  Quote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const WordApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [zoom, setZoom] = useState(100);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      CharacterCount,
    ],
    content: `
      <h1 style="text-align: center">Document Title</h1>
      <p style="text-align: center"><em>Draft v1.0</em></p>
      <hr>
      <p>Dear recipient,</p>
      <p>This is a professional document editor built with <strong>React</strong>, <strong>Tiptap</strong>, and <strong>Tailwind CSS</strong>. It provides a full suite of tools to compose letters, reports, and documents directly in your browser.</p>
      <p>Features include:</p>
      <ul>
        <li><strong>Rich Text Formatting</strong> (Bold, Italic, Underline)</li>
        <li><em>Text Alignment</em></li>
        <li><u>Custom Colors and Highlighting</u></li>
        <li>Tables and Image Support</li>
        <li>A4 Page Simulation and PDF Export</li>
      </ul>
      <p>Start typing your content here. You can even insert tables and images using the "Insert" tab above.</p>
      <table style="width:100%">
        <tbody>
          <tr>
            <th>Status</th>
            <th>Feature Set</th>
            <th>Compatibility</th>
          </tr>
          <tr>
            <td>✅ Active</td>
            <td>Rich Formatting</td>
            <td>Desktop & Mobile</td>
          </tr>
          <tr>
            <td>✅ Active</td>
            <td>Export / Print</td>
            <td>Chrome, Safari, Edge</td>
          </tr>
        </tbody>
      </table>
      <blockquote>
        "The best way to predict the future is to invent it."
      </blockquote>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[1056px] p-[20mm] sm:p-[25mm] bg-white shadow-sm ring-1 ring-gray-200',
      },
    },
  });

  const exportPDF = async () => {
    if (!editorRef.current) return;
    const element = editorRef.current.querySelector('.tiptap');
    if (!element) return;

    try {
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('document.pdf');
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  if (!editor) {
    return null;
  }

  const MenuButton = ({ icon: Icon, onClick, active, label, danger }: any) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 flex flex-col items-center justify-center transition-all min-w-[44px] sm:min-w-[54px] active:scale-95 ${
        active ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'
      } ${danger ? 'hover:bg-red-50 hover:text-red-600' : ''}`}
      title={label}
    >
      <Icon size={18} />
      <span className="text-[10px] mt-1 hidden md:block select-none">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f3f2f1] overflow-hidden font-sans select-none">
      {/* Top Title Bar */}
      <header className="bg-[#2b579a] text-white h-12 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Menu className="lg:hidden cursor-pointer p-1 hover:bg-white/10 rounded" onClick={() => setShowMobileMenu(!showMobileMenu)} />
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-sm">
              <FileText size={18} className="text-[#2b579a]" />
            </div>
            <span className="font-semibold text-sm hidden sm:inline whitespace-nowrap">Word Pro Online</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl px-4 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
            <input 
              type="text" 
              placeholder="Tell me what you want to do" 
              className="w-full bg-white/10 border-none rounded py-1 pl-10 pr-4 text-sm focus:bg-white focus:text-gray-900 transition-all outline-none placeholder-white/60 focus:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs transition-colors hidden md:block font-medium">
            Share
          </button>
          <Settings size={18} className="cursor-pointer hover:rotate-45 transition-transform" />
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold border border-white/20 shadow-inner">
            JD
          </div>
        </div>
      </header>

      {/* Ribbon Tabs */}
      <nav className="bg-white border-b flex items-center px-4 shrink-0 overflow-x-auto no-scrollbar z-40">
        {['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 mt-1 whitespace-nowrap ${
              activeTab === tab 
              ? 'border-[#2b579a] text-[#2b579a] bg-gray-50/50' 
              : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Ribbon Tools Container */}
      <div className="bg-[#f3f2f1] border-b p-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 min-h-[64px]">
        {activeTab === 'Home' && (
          <>
            <div className="flex items-center bg-white/50 rounded-lg p-1 gap-0.5">
              <MenuButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} label="Undo" />
              <MenuButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} label="Redo" />
            </div>

            <div className="h-10 w-px bg-gray-300 mx-1 hidden sm:block" />

            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-0.5 sm:gap-1">
              <div className="flex flex-col px-2 hidden lg:flex border-r mr-1">
                <select 
                  className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer p-0 font-medium"
                  onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                </select>
                <span className="text-[10px] text-gray-400">Font</span>
              </div>
              
              <MenuButton 
                icon={Bold} 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                active={editor.isActive('bold')} 
                label="Bold"
              />
              <MenuButton 
                icon={Italic} 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                active={editor.isActive('italic')} 
                label="Italic"
              />
              <MenuButton 
                icon={UnderlineIcon} 
                onClick={() => editor.chain().focus().toggleUnderline().run()} 
                active={editor.isActive('underline')} 
                label="Underline"
              />
              <MenuButton 
                icon={Palette} 
                onClick={() => {
                  const color = window.prompt('Font color (hex/name):', '#ef4444');
                  if (color) editor.chain().focus().setColor(color).run();
                }} 
                label="Color"
              />
              <MenuButton 
                icon={Highlighter} 
                onClick={() => editor.chain().focus().toggleHighlight().run()} 
                active={editor.isActive('highlight')} 
                label="Highlight"
              />
              <MenuButton 
                icon={Eraser} 
                onClick={() => editor.chain().focus().unsetAllMarks().run()} 
                label="Clear"
              />
            </div>

            <div className="h-10 w-px bg-gray-300 mx-1 hidden sm:block" />

            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-0.5 sm:gap-1">
              <MenuButton 
                icon={AlignLeft} 
                onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                active={editor.isActive({ textAlign: 'left' })} 
                label="Left"
              />
              <MenuButton 
                icon={AlignCenter} 
                onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                active={editor.isActive({ textAlign: 'center' })} 
                label="Center"
              />
              <MenuButton 
                icon={AlignRight} 
                onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                active={editor.isActive({ textAlign: 'right' })} 
                label="Right"
              />
              <MenuButton 
                icon={AlignJustify} 
                onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                active={editor.isActive({ textAlign: 'justify' })} 
                label="Justify"
              />
            </div>

            <div className="h-10 w-px bg-gray-300 mx-1 hidden sm:block" />

            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-0.5 sm:gap-1">
              <MenuButton 
                icon={List} 
                onClick={() => editor.chain().focus().toggleBulletList().run()} 
                active={editor.isActive('bulletList')} 
                label="Bullets"
              />
              <MenuButton 
                icon={ListOrdered} 
                onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                active={editor.isActive('orderedList')} 
                label="Numbers"
              />
            </div>
          </>
        )}

        {activeTab === 'Insert' && (
          <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-1">
            <MenuButton icon={TableIcon} onClick={addTable} label="Table" />
            <MenuButton icon={ImageIcon} onClick={addImage} label="Picture" />
            <MenuButton icon={Type} onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()} label="Heading" />
            <MenuButton icon={Code} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="Code" />
            <MenuButton icon={Quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote" />
          </div>
        )}

        {activeTab === 'File' && (
          <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-1">
            <MenuButton 
              icon={FileDown} 
              onClick={exportPDF} 
              label="Save PDF"
            />
            <MenuButton 
              icon={Printer} 
              onClick={handlePrint} 
              label="Print"
            />
          </div>
        )}

        {activeTab === 'Layout' && (
          <div className="flex items-center bg-white rounded-lg p-1 shadow-sm gap-1">
             <MenuButton icon={AlignJustify} onClick={() => {}} label="Margins" />
             <MenuButton icon={FileText} onClick={() => {}} label="Orientation" />
             <MenuButton icon={Type} onClick={() => {}} label="Size" />
             <div className="h-8 w-px bg-gray-200 mx-1" />
             <MenuButton icon={List} onClick={() => {}} label="Columns" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 mr-2">
          <div className="hidden sm:flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50">
             <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
             <span className="text-xs font-semibold text-gray-700">Auto-saving...</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#e6e6e6] p-4 sm:p-12 flex justify-center custom-scrollbar">
        <div 
          className="transition-all duration-300 origin-top flex flex-col items-center w-full"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <div 
            ref={editorRef}
            className="bg-white shadow-2xl mb-24 select-text max-w-full"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
            }}
          >
            <EditorContent editor={editor} className="min-h-full" />
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="bg-white border-t h-9 flex items-center justify-between px-4 text-[11px] text-gray-600 shrink-0 z-50">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
            <span>Page 1 of 1</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
            <span className="font-medium text-gray-800">{editor.storage.characterCount.words()}</span>
            <span>words</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded font-medium">
            English (United States)
          </div>
          <div className="hidden lg:flex items-center gap-1 text-green-700 font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500" /> 
            <span>Accessibility: Good</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border">
            <button 
              onClick={() => setZoom(Math.max(25, zoom - 10))} 
              className="hover:text-blue-600 transition-colors w-6 h-6 flex items-center justify-center font-bold"
            >
              -
            </button>
            <input 
              type="range" 
              min="25" 
              max="200" 
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-16 sm:w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2b579a]"
            />
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 10))} 
              className="hover:text-blue-600 transition-colors w-6 h-6 flex items-center justify-center font-bold"
            >
              +
            </button>
            <span className="w-10 text-right font-bold text-gray-800">{zoom}%</span>
          </div>
          
          <div className="flex items-center gap-2 border-l pl-3 hidden md:flex">
             <div className="w-4 h-4 border border-gray-400 rounded-sm hover:border-blue-500 transition-colors cursor-pointer" title="Focus mode" />
             <div className="w-4 h-4 bg-gray-400 rounded-sm hover:bg-blue-500 transition-colors cursor-pointer" title="Reading mode" />
          </div>
        </div>
      </footer>

      {/* Mobile Drawer */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed inset-y-0 left-0 bg-white w-72 z-[70] shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-[#2b579a]" />
                <span className="font-bold text-xl text-gray-800 tracking-tight">Word Pro</span>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              {[
                { name: 'New Document', active: true },
                { name: 'Open from PC' },
                { name: 'Recent Projects' },
                { name: 'Document Templates' },
                { name: 'Account Settings' }
              ].map(item => (
                <button 
                  key={item.name} 
                  className={`w-full text-left py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-between group ${
                    item.active ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {item.name}
                  <span className="opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all text-xs">VIEW</span>
                </button>
              ))}
            </div>

            <div className="mt-auto border-t pt-6 space-y-4">
              <div className="flex items-center gap-3 px-4">
                 <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-blue-100">JD</div>
                 <div>
                    <div className="text-sm font-bold text-gray-800">John Doe</div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Pro Plan</div>
                 </div>
              </div>
              <button className="w-full bg-[#2b579a] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                 Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .tiptap {
          outline: none;
          min-height: 297mm;
        }
        .tiptap p {
          margin: 1em 0;
          line-height: 1.6;
        }
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5rem 0;
          overflow: hidden;
        }
        .tiptap table td,
        .tiptap table th {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap table th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .tiptap blockquote {
          border-left: 4px solid #2b579a;
          padding: 0.5rem 0 0.5rem 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #475569;
          background-color: #f8fafc;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 5px;
          border: 2px solid #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          header, nav, .bg-[#f3f2f1], footer, .ml-auto {
            display: none !important;
          }
          main {
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          .tiptap {
            box-shadow: none !important;
            width: 100% !important;
            padding: 20mm !important;
            min-height: auto !important;
            ring: 0 !important;
          }
          #root {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WordApp;
