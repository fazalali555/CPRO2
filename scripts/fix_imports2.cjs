const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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

    // Fix missing UI components
    newContent = newContent.replace(/from\s+['"](?:\.\.\/)+components\/ui\/(.*?)['"]/g, 'from "@/components/ui/$1"');
    newContent = newContent.replace(/from\s+['"](?:\.\.\/)+ui\/(.*?)['"]/g, 'from "@/components/ui/$1"');
    
    // Fix components outside letter-composer
    newContent = newContent.replace(/from\s+['"](?:\.\.\/)+components\/(TableManager|ImageUpload|HyperlinkDialog|PageElements)['"]/g, 'from "@/components/letter-composer/components/$1"');
    
    // Fix AIService, ExportService
    newContent = newContent.replace(/from\s+['"](?:\.\.\/)+services\/(AIService|ExportService|StorageService)['"]/g, 'from "@/services/$1"');

    // Fix formatters, validators
    newContent = newContent.replace(/from\s+['"](?:\.\.\/)+utils\/(formatters|validators)['"]/g, 'from "@/utils/$1"');

    // Badge colors
    newContent = newContent.replace(/color="info"/g, 'color="primary"');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
