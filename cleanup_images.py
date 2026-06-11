import os
import glob
import re
import shutil

def cleanup_unused_images():
    base_dir = r"d:\Xenon Website"
    images_dir = os.path.join(base_dir, "static", "images")
    unused_dir = os.path.join(images_dir, "unused")
    
    # Create unused directory if it doesn't exist
    if not os.path.exists(unused_dir):
        os.makedirs(unused_dir)
        
    # 1. Find all HTML and CSS files
    target_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "static", "css", "*.css"))
    
    # 2. Extract all image references (png, jpg, jpeg, svg, gif)
    referenced_images = set()
    for file_path in target_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Match static/images/...
            matches = re.findall(r'static/images/([^\"\'\)]+)', content)
            for m in matches:
                # remove any URL parameters or fragments just in case
                clean_name = m.split('?')[0].split('#')[0]
                referenced_images.add(clean_name.strip())
                
    print(f"Found {len(referenced_images)} unique images in use: {referenced_images}")
    
    # 3. List all files currently in static/images
    all_images = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]
    
    # 4. Identify unused images
    unused_images = [f for f in all_images if f not in referenced_images]
    print(f"\nFound {len(unused_images)} unused images to move.")
    
    # 5. Move unused images
    moved_count = 0
    for img in unused_images:
        src = os.path.join(images_dir, img)
        dst = os.path.join(unused_dir, img)
        try:
            shutil.move(src, dst)
            print(f"Moved: {img}")
            moved_count += 1
        except Exception as e:
            print(f"Error moving {img}: {e}")
            
    print(f"\nSuccessfully moved {moved_count} unused images to static/images/unused/")

if __name__ == "__main__":
    cleanup_unused_images()
