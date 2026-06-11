import os
import glob
import re
from PIL import Image

def optimize_images():
    base_dir = r"d:\Xenon Website"
    images_dir = os.path.join(base_dir, "static", "images")
    
    # 1. Find all HTML and CSS files
    target_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "static", "css", "*.css"))
    
    # 2. Extract all .png references
    png_references = set()
    for file_path in target_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Find static/images/...png
            matches = re.findall(r'static/images/([^\"\'\)]+\.png)', content)
            png_references.update(matches)
            
    print(f"Found {len(png_references)} unique PNG images in use: {png_references}")
    
    # 3. Process each referenced PNG
    converted_images = []
    for img_name in png_references:
        png_path = os.path.join(images_dir, img_name)
        if not os.path.exists(png_path):
            print(f"Warning: {png_path} does not exist.")
            continue
            
        # Determine max width based on filename
        max_width = 800
        if "hero" in img_name.lower() or "skyline" in img_name.lower():
            max_width = 1920
        elif "about" in img_name.lower() or "handshake" in img_name.lower():
            max_width = 1000
            
        try:
            with Image.open(png_path) as img:
                # Convert to RGB (in case of RGBA)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                # Resize if necessary
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    
                # Save as JPG
                jpg_name = img_name.rsplit(".", 1)[0] + ".jpg"
                jpg_path = os.path.join(images_dir, jpg_name)
                img.save(jpg_path, "JPEG", quality=85, optimize=True)
                converted_images.append((img_name, jpg_name))
                print(f"Converted {img_name} to {jpg_name} (width: {img.width})")
                
            # Remove original PNG
            os.remove(png_path)
        except Exception as e:
            print(f"Error processing {img_name}: {e}")
            
    # 4. Update HTML and CSS files
    for file_path in target_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        original_content = content
        for png_name, jpg_name in converted_images:
            content = content.replace(f"static/images/{png_name}", f"static/images/{jpg_name}")
            
        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated references in {os.path.basename(file_path)}")

if __name__ == "__main__":
    optimize_images()
