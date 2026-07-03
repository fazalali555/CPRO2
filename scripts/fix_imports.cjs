const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    // 1. Unified cn utility
    newContent = newContent.replace(
        /import\s+\{\s*cn\s*\}\s+from\s+["'].*features\/clerk-desk\/components\/wordpro\/lib\/utils["']/g,
        'import { cn } from "@/lib/utils"'
    );
    newContent = newContent.replace(
        /import\s+\{\s*cn\s*\}\s+from\s+["']\.\.?\/lib\/utils["']/g,
        'import { cn } from "@/lib/utils"'
    );
    // Inside letter-composer, some use @wordpro/lib/utils - that's fine, but let's make it consistent if not internal
    if (!file.includes('letter-composer')) {
        newContent = newContent.replace(
            /import\s+\{\s*cn\s*\}\s+from\s+["']@wordpro\/lib\/utils["']/g,
            'import { cn } from "@/lib/utils"'
        );
    }

    // 2. Unified UI components
    // Replace all variations of UI component imports with @/components/ui/
    newContent = newContent.replace(
        /from\s+["'].*features\/clerk-desk\/components\/wordpro\/components\/ui\/(.*)["']/g,
        'from "@/components/ui/$1"'
    );
    // Handle relative UI imports in letter-composer/components/editor
    if (file.includes('letter-composer')) {
        newContent = newContent.replace(
            /from\s+["']\.\.\/components\/ui\/(.*)["']/g,
            'from "@/components/ui/$1"'
        );
        newContent = newContent.replace(
            /from\s+["']\.\/ui\/(.*)["']/g,
            'from "@/components/ui/$1"'
        );
    }

    // 3. Fix @shared/editor-types -> @wordpro/lib/editor-types
    newContent = newContent.replace(
        /from\s+["']@shared\/editor-types["']/g,
        'from "@wordpro/lib/editor-types"'
    );

    // 4. Fix EditorContext relative imports
    if (file.includes('letter-composer')) {
        newContent = newContent.replace(
            /from\s+["']\.\.\/\.\.\/contexts\/EditorContext["']/g,
            'from "@wordpro/contexts/EditorContext"'
        );
    }

    // 5. Fix components relative imports inside letter-composer
    if (file.includes('letter-composer')) {
        newContent = newContent.replace(
            /from\s+["']\.\.\/components\/(.*)["']/g,
            'from "@wordpro/components/$1"'
        );
    }

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
