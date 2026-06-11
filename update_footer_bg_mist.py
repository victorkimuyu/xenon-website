import os
import glob

def update_footer_bg():
    base_dir = r"d:\Xenon Website"
    html_files = glob.glob(os.path.join(base_dir, "*.html"))
    
    updated_count = 0
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # The footer is currently using bg-cyan-950
        if "bg-cyan-950" in content:
            new_content = content.replace("bg-cyan-950", "bg-mist-950")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated footer in {os.path.basename(file_path)}")
            updated_count += 1
            
    print(f"Successfully updated the footer background to mist-950 in {updated_count} files.")

if __name__ == "__main__":
    update_footer_bg()
