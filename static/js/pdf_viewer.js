document.addEventListener("DOMContentLoaded", () => {
    // PDF Library Source
    const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    const PDFWORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    // File mapping using the exact files in static/sample_reports/
    const reportFiles = {
        "assessment": "static/sample_reports/XENON SAMPLE ASSESSEMENT REPORT.pdf",
        "valuation": "static/sample_reports/XENON SAMPLE VALUATION REPORT.pdf",
        "reinspection": "static/sample_reports/XENON SAMPLE RE-INSPECTION REPORT.pdf"
    };

    // State
    let pdfDoc = null;
    let pageNum = 1;
    let pageIsRendering = false;
    let pageNumIsPending = null;
    let scale = 1.0;
    let pdfjsLibLoaded = false;
    let isLoadingLib = false;
    let currentPdfUrl = null;

    // UI Elements
    const modal = document.getElementById('pdf-modal');
    const canvas = document.getElementById('pdf-render');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const loadingUI = document.getElementById('pdf-loading');
    const loadingText = document.getElementById('pdf-loading-text');
    const selector = document.getElementById('pdf-report-selector');
    
    // Bookmarks UI
    const bookmarksPane = document.getElementById('pdf-bookmarks-pane');
    const bookmarksContent = document.getElementById('pdf-bookmarks-content');
    const toggleBookmarksBtn = document.getElementById('pdf-toggle-bookmarks');
    const bookmarksLabel = document.getElementById('pdf-bookmarks-label');
    
    // Controls
    const prevBtn = document.getElementById('pdf-prev');
    const nextBtn = document.getElementById('pdf-next');
    const zoomInBtn = document.getElementById('pdf-zoom-in');
    const zoomOutBtn = document.getElementById('pdf-zoom-out');
    const zoomLevelText = document.getElementById('pdf-zoom-level');
    const pageNumText = document.getElementById('pdf-page-num');
    const pageCountText = document.getElementById('pdf-page-count');
    const requestCta = document.getElementById('pdf-request-cta');
    const downloadBtn = document.getElementById('pdf-download-btn');
    const printBtn = document.getElementById('pdf-print-btn');

    // Toggle Bookmarks Sidebar
    if (toggleBookmarksBtn && bookmarksPane) {
        toggleBookmarksBtn.addEventListener('click', () => {
            bookmarksPane.classList.toggle('w-12');
            bookmarksPane.classList.toggle('w-64');
            
            if (bookmarksLabel) {
                bookmarksLabel.classList.toggle('opacity-0');
                bookmarksLabel.classList.toggle('opacity-100');
            }
            
            if (bookmarksContent) {
                if (bookmarksContent.classList.contains('hidden')) {
                    bookmarksContent.classList.remove('hidden');
                    // Slight delay to allow display block to apply before fading in
                    setTimeout(() => {
                        bookmarksContent.classList.remove('opacity-0');
                        bookmarksContent.classList.add('opacity-100');
                    }, 10);
                } else {
                    bookmarksContent.classList.remove('opacity-100');
                    bookmarksContent.classList.add('opacity-0');
                    // Wait for fade out to complete before hiding
                    setTimeout(() => {
                        bookmarksContent.classList.add('hidden');
                    }, 300);
                }
            }
        });
    }

    // Load PDF.js dynamically
    function loadPdfJs(callback) {
        if (pdfjsLibLoaded) {
            callback();
            return;
        }
        if (isLoadingLib) return; // Prevent multiple loads
        isLoadingLib = true;
        
        loadingUI.classList.remove('hidden');
        if(canvas) canvas.classList.add('hidden');
        if(loadingText) loadingText.textContent = "Loading PDF Engine (1.5MB)...";

        const script = document.createElement('script');
        script.src = PDFJS_URL;
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWORKER_URL;
            pdfjsLibLoaded = true;
            isLoadingLib = false;
            callback();
        };
        script.onerror = () => {
            if(loadingText) loadingText.textContent = "Error loading PDF engine. Please check your connection.";
            isLoadingLib = false;
        };
        document.body.appendChild(script);
    }

    // Render the page
    const renderPage = num => {
        pageIsRendering = true;

        // Get page
        pdfDoc.getPage(num).then(page => {
            // Calculate scale based on container width to make it responsive
            const container = document.getElementById('pdf-canvas-container');
            const containerWidth = container.clientWidth - 40; // padding
            
            // Get unscaled viewport to determine base ratio
            const unscaledViewport = page.getViewport({ scale: 1 });
            
            // Auto-scale to fit width (max 2.0 to utilize large screen)
            let baseScale = containerWidth / unscaledViewport.width;
            if (baseScale > 2.0) baseScale = 2.0;
            
            // Apply user zoom multiplier
            const finalScale = baseScale * scale;
            
            const viewport = page.getViewport({ scale: finalScale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;
                
                // Hide loader, show canvas
                loadingUI.classList.add('hidden');
                canvas.classList.remove('hidden');

                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            });

            // Output current page
            if(pageNumText) pageNumText.textContent = num;
        });
    };

    // Check for pages rendering
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };

    // Show Prev Page
    const showPrevPage = () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    };

    // Show Next Page
    const showNextPage = () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    };

    // Bookmarks Rendering Logic
    const renderOutline = (outline, container) => {
        const ul = document.createElement('ul');
        ul.className = 'space-y-1.5';

        outline.forEach(item => {
            const li = document.createElement('li');
            
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'block hover:bg-slate-200/50 hover:text-xenon-green-700 px-2 py-1.5 rounded transition-colors text-slate-700 break-words leading-snug';
            a.textContent = item.title;
            a.title = item.title;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToDestination(item.dest);
            });

            li.appendChild(a);

            if (item.items && item.items.length > 0) {
                const subContainer = document.createElement('div');
                subContainer.className = 'pl-3 mt-1 border-l-2 border-slate-200 ml-1.5';
                renderOutline(item.items, subContainer);
                li.appendChild(subContainer);
            }

            ul.appendChild(li);
        });

        container.innerHTML = '';
        container.appendChild(ul);
    };

    const navigateToDestination = (dest) => {
        if (!pdfDoc) return;
        
        if (typeof dest === 'string') {
            pdfDoc.getDestination(dest).then(destArray => {
                if (destArray) navigateToDestinationArray(destArray);
            });
        } else if (Array.isArray(dest)) {
            navigateToDestinationArray(dest);
        }
    };

    const navigateToDestinationArray = (destArray) => {
        pdfDoc.getPageIndex(destArray[0]).then(pageIndex => {
            pageNum = pageIndex + 1;
            queueRenderPage(pageNum);
        }).catch(err => console.error("Could not find page index for destination", err));
    };

    // Get Document
    const loadDocument = (reportType) => {
        if (!pdfjsLibLoaded) return;
        
        loadingUI.classList.remove('hidden');
        if(canvas) canvas.classList.add('hidden');
        if(loadingText) loadingText.textContent = "Downloading Report...";
        
        // Hide pane entirely while loading
        if (bookmarksPane) {
            bookmarksPane.classList.add('hidden');
            bookmarksPane.classList.remove('flex');
        }
        
        currentPdfUrl = reportFiles[reportType] || reportFiles["assessment"];
        
        window.pdfjsLib.getDocument(currentPdfUrl).promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            if(pageCountText) pageCountText.textContent = pdfDoc.numPages;
            pageNum = 1;
            queueRenderPage(pageNum);
            
            // Fetch and render outline
            pdfDoc.getOutline().then(outline => {
                // Always show the collapsible sidebar in default 'closed' state for testing
                if (bookmarksPane) {
                    bookmarksPane.classList.remove('hidden');
                    bookmarksPane.classList.add('flex');
                    bookmarksPane.classList.add('w-12');
                    bookmarksPane.classList.remove('w-64');
                    
                    if (bookmarksLabel) {
                        bookmarksLabel.classList.add('opacity-0');
                        bookmarksLabel.classList.remove('opacity-100');
                    }
                    if (bookmarksContent) {
                        bookmarksContent.classList.add('hidden', 'opacity-0');
                        bookmarksContent.classList.remove('opacity-100');
                        // Render the items
                        renderOutline(outline, bookmarksContent);
                    }
                }
            }).catch(err => {
                // Ignore error, just hide UI completely
                if (bookmarksPane) {
                    bookmarksPane.classList.add('hidden');
                    bookmarksPane.classList.remove('flex');
                }
                console.error("Error loading outline", err);
            });

        }).catch(err => {
            if(loadingText) loadingText.textContent = "Error loading document.";
            console.error(err);
        });
    };

    // Open Modal Function
    window.openPdfModal = function(reportType) {
        if (!modal) return;
        
        // Ensure selector matches the requested type
        if (selector) {
            selector.value = reportType;
        }

        modal.classList.remove('hidden');
        
        loadPdfJs(() => {
            loadDocument(reportType);
        });
    };

    // Event Listeners for triggers
    document.querySelectorAll('.open-pdf-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-report') || 'assessment';
            openPdfModal(type);
        });
    });

    // Close Modal Event Listeners
    document.querySelectorAll('.close-pdf-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if(modal) modal.classList.add('hidden');
        });
    });

    // Selector Change Event
    if (selector) {
        selector.addEventListener('change', (e) => {
            scale = 1.0; // reset zoom
            if (zoomLevelText) zoomLevelText.textContent = '100%';
            loadDocument(e.target.value);
        });
    }

    // Pagination Events
    if (prevBtn) prevBtn.addEventListener('click', showPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', showNextPage);
    
    // Zoom Events
    const updateZoomText = () => {
        if (zoomLevelText) zoomLevelText.textContent = Math.round(scale * 100) + '%';
    };
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
        if (scale >= 3.0) return;
        scale += 0.25;
        updateZoomText();
        if (pdfDoc) queueRenderPage(pageNum);
    });
    
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
        if (scale <= 0.5) return;
        scale -= 0.25;
        updateZoomText();
        if (pdfDoc) queueRenderPage(pageNum);
    });

    // Request Service CTA inside PDF Viewer
    if (requestCta) {
        requestCta.addEventListener('click', () => {
            // Close PDF modal
            if(modal) modal.classList.add('hidden');
            
            // Open Service Request modal
            const serviceModal = document.getElementById('service-modal');
            if (serviceModal) {
                // Select the proper option in the service modal
                const serviceSelect = document.getElementById('service_type');
                if (serviceSelect && selector) {
                    // Mapping pdf selector value to service modal option value
                    const valMap = {
                        "assessment": "Accident Assessment",
                        "valuation": "Pre-Insurance Valuation",
                        "reinspection": "Post-Repair Re-Inspection"
                    };
                    serviceSelect.value = valMap[selector.value];
                }
                serviceModal.classList.remove('hidden');
            }
        });
    }

    // Download Logic
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentPdfUrl) return;
            const a = document.createElement('a');
            a.href = currentPdfUrl;
            a.download = currentPdfUrl.split('/').pop() || 'report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Print Logic
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            if (!currentPdfUrl) return;
            let printIframe = document.getElementById('pdf-print-iframe');
            if (!printIframe) {
                printIframe = document.createElement('iframe');
                printIframe.id = 'pdf-print-iframe';
                printIframe.style.display = 'none';
                document.body.appendChild(printIframe);
            }
            
            printIframe.onload = function() {
                try {
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                } catch (e) {
                    window.open(currentPdfUrl, '_blank').print();
                }
            };
            printIframe.src = currentPdfUrl;
        });
    }
});
