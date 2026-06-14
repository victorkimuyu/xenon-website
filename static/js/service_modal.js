document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('service-modal');
    const openBtns = document.querySelectorAll('.open-service-modal');
    const closeBtns = document.querySelectorAll('.close-service-modal');
    const form = document.getElementById('service-form');
    const fileInput = document.getElementById('service-photos');
    const submitBtn = document.getElementById('service-submit-btn');
    const btnText = document.getElementById('service-btn-text');
    const btnLoader = document.getElementById('service-btn-loader');

    if (!modal || !form) return;

    // Open Modal
    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close Modal
    const closeModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Resize image via Canvas
    const resizeImage = (file, maxSize = 1600) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.85); // Compress as JPEG at 85% quality
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const files = fileInput.files;
        if (files.length > 20) {
            alert("Please select a maximum of 20 photos.");
            return;
        }

        // UI Loading state
        submitBtn.disabled = true;
        btnLoader.classList.remove('hidden');
        
        const formData = new FormData(form);
        formData.delete('photos'); // We will append resized blobs manually

        try {
            for (let i = 0; i < files.length; i++) {
                btnText.textContent = `Uploading Photos: ${i + 1} of ${files.length}...`;
                
                // Process sequentially to save memory
                const resizedBlob = await resizeImage(files[i]);
                formData.append('photos[]', resizedBlob, files[i].name);
            }

            btnText.textContent = "Finalizing request...";

            // Submit via AJAX
            const response = await fetch('process_service.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                window.location.href = 'thanks.html';
            } else {
                alert(result.message || "An error occurred while submitting your request.");
                resetBtnState();
            }

        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during file processing or upload. Please try again.");
            resetBtnState();
        }
    });

    function resetBtnState() {
        submitBtn.disabled = false;
        btnLoader.classList.add('hidden');
        btnText.textContent = "Submit Request";
    }
});
