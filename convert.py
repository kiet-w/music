import re
import json

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

boilerplate = read_file('/home/baudui/.gemini/skills/md-to-html/references/boilerplate.html')
md_content = read_file('backend/backend-docs/common/common.md')

# Very basic markdown to HTML converter for this specific file
html_content = md_content

# Remove the title from MD
html_content = re.sub(r'^# Common Module Analysis\s*', '', html_content)

# Extract overview
overview_match = re.search(r'## 1\. Tóm tắt vai trò\n(.*?)(?=\n## |$)', html_content, re.DOTALL)
overview = overview_match.group(1).strip() if overview_match else "Common Module Documentation"

# Remove "1. Tóm tắt vai trò" section as it will be in the hero
html_content = re.sub(r'## 1\. Tóm tắt vai trò\n.*?(?=\n## |$)', '', html_content, count=1, flags=re.DOTALL)

# Convert headers
html_content = re.sub(r'### (.*?)\n', r'<h3>\1</h3>\n', html_content)
html_content = re.sub(r'## (.*?)\n', r'<h2>\1</h2>\n', html_content)

# Convert bold
html_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html_content)

# Convert inline code
html_content = re.sub(r'`([^`]+)`', r'<code>\1</code>', html_content)

# Convert lists
def replace_list(match):
    items = match.group(0).strip().split('\n')
    res = "<ul>\n"
    for item in items:
        res += f"<li>{item[2:]}</li>\n"
    res += "</ul>\n"
    return res

html_content = re.sub(r'(?:^- .+\n?)+', replace_list, html_content, flags=re.MULTILINE)

# Replace paragraphs (very roughly)
# Just wrapping text separated by double newlines into <p>
paragraphs = html_content.split('\n\n')
formatted_paragraphs = []
for p in paragraphs:
    if p.strip() == '':
        continue
    if p.startswith('<h') or p.startswith('<ul>'):
        formatted_paragraphs.append(p)
    else:
        formatted_paragraphs.append(f'<p>{p}</p>')

html_content = '\n'.join(formatted_paragraphs)

# Inject SVGs
# In "System Data Flow" section or similar
# Wait, let's just insert them at the end of the content or in specific sections.
# "## 4. System Data Flow" -> we can inject data-flow.svg there
html_content = html_content.replace('<h2>4. System Data Flow</h2>', '<h2>4. System Data Flow</h2>\n<div class="svg-container"><img src="data-flow.svg" alt="Data Flow"></div>')
html_content += '\n<h2>System Components & ERG</h2>\n<div class="svg-container"><img src="backend-components.svg" alt="Backend Components"></div>\n<div class="svg-container"><img src="data-erg.svg" alt="Data ERG"></div>'

# Now plug into boilerplate
final_html = boilerplate.replace('<!-- MODULE NAME -->', 'Common Module')
final_html = final_html.replace('<!-- OVERVIEW DESCRIPTION -->', overview)
final_html = final_html.replace('<!-- PHẦN CÒN LẠI CỦA TÀI LIỆU NẰM Ở ĐÂY -->', html_content)

# Fix some remaining newlines inside tags or markdown lists that weren't caught perfectly
# Actually let's use the `markdown` pip package if available, or just stick to this.
write_file('backend/backend-docs/common/common.html', final_html)
print("Conversion complete.")
