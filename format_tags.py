import re

files = ["d:/Xenon Website/index.html", "d:/Xenon Website/about_us.html", "d:/Xenon Website/solutions.html", "d:/Xenon Website/contact_us.html"]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace rounded-lg and rounded-xl with rounded-sm on <a> tags
    def replace_rounded(match):
        tag = match.group(1)
        classes = match.group(2)
        classes = re.sub(r'\brounded-(lg|xl)\b', 'rounded-sm', classes)
        return f'{tag}class="{classes}"'

    content = re.sub(r'(<a[^>]*?)class="([^"]*)"', replace_rounded, content)
    
    # 2. Add border-t border-slate-200 to <section> tags
    def add_border(match):
        pre = match.group(1)
        classes = match.group(2)
        # only add if no existing top border is present
        if 'border-t' not in classes and 'border-y' not in classes:
            classes = 'border-t border-slate-200 ' + classes
        return f'{pre}class="{classes}"'

    content = re.sub(r'(<section[^>]*?)class="([^"]*)"', add_border, content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updates applied.")
