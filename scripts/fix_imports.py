import os
import re

def update_imports(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace cn imports
                new_content = re.sub(
                    r'import\s+\{\s*cn\s*\}\s+from\s+["\'].*features/clerk-desk/components/wordpro/lib/utils["\']',
                    'import { cn } from "@/lib/utils"',
                    content
                )
                
                # Replace UI imports
                new_content = re.sub(
                    r'from\s+["\'].*features/clerk-desk/components/wordpro/components/ui/(.*)["\']',
                    r'from "@/components/ui/\1"',
                    new_content
                )

                # Replace wordpro contexts/hooks imports if they are now in letter-composer
                new_content = re.sub(
                    r'from\s+["\'].*features/clerk-desk/components/wordpro/(contexts|hooks|lib)/(.*)["\']',
                    r'from "@wordpro/\1/\2"',
                    new_content
                )
                
                if content != new_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")

update_imports('src')
