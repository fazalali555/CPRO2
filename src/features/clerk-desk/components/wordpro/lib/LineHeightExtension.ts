import { Extension } from '@tiptap/core';

export interface LineHeightOptions {
  types: string[];
  defaultLineHeight: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions(): LineHeightOptions {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: 'normal',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element: HTMLElement) => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight || attributes.lineHeight === this.options.defaultLineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        return this.options.types
          .map(type => commands.updateAttributes(type, { lineHeight }))
          .some(Boolean);
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types
          .map(type => commands.updateAttributes(type, { lineHeight: null }))
          .some(Boolean);
      },
    };
  },
});

export default LineHeight;
