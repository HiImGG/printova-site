document.addEventListener('DOMContentLoaded', () => {
    // Tabbed Gallery Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple interaction for "Teklif Al" button scrolls to form
    const quoteBtn = document.querySelector('a[href="#teklif-al"]');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', (e) => {
            // The smooth scroll handler above will catch this, 
            // but we can add extra logic here if needed, like focusing an input
            setTimeout(() => {
                const nameInput = document.querySelector('input[name="ad_soyad"]');
                if (nameInput) nameInput.focus();
            }, 500);
        });
    }

    // File Upload Handler
    const fileInput = document.getElementById('file-upload');
    const fileNameSpan = document.getElementById('file-name');
    const quoteForm = document.querySelector('.quote-form');

    if (fileInput && fileNameSpan) {
        // Select relative to the span to ensure we get the correct parent label and sibling icon
        const fileLabel = fileNameSpan.closest('.file-upload-label');
        const fileIcon = fileLabel ? fileLabel.querySelector('i') : null;

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const maxSize = 100 * 1024 * 1024; // 100MB in bytes

                if (file.size > maxSize) {
                    alert('Seçtiğiniz dosya çok büyük! Lütfen 100MB\'dan küçük bir dosya seçin.');
                    fileInput.value = ''; // Clear selection

                    // Reset State
                    fileNameSpan.textContent = '3D Model Dosyası Ekle (.stl, .obj)';
                    fileNameSpan.style.fontWeight = '';

                    if (fileLabel) fileLabel.classList.remove('file-selected');
                    if (fileIcon) {
                        fileIcon.className = 'fas fa-cloud-upload-alt';
                    }
                    return;
                }

                // File Selected State
                fileNameSpan.innerHTML = `<strong>${file.name}</strong> <span style="color:var(--accent-color)">(Yüklendi)</span>`;

                if (fileLabel) fileLabel.classList.add('file-selected');
                if (fileIcon) {
                    fileIcon.className = 'fas fa-check-circle'; // Reset class list to ensure clean switch
                }
            } else {
                // Reset State
                fileNameSpan.textContent = '3D Model Dosyası Ekle (.stl, .obj)';
                fileNameSpan.style.fontWeight = '';

                if (fileLabel) fileLabel.classList.remove('file-selected');
                if (fileIcon) {
                    fileIcon.className = 'fas fa-cloud-upload-alt';
                }
            }
        });
    }

    // UseBasin AJAX Handler (XHR with Progress)
    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = quoteForm.querySelector('button[type="submit"]');

            // Status message element creation if not exists
            let statusMsg = document.getElementById('form-status');
            if (!statusMsg) {
                statusMsg = document.createElement('p');
                statusMsg.id = 'form-status';
                statusMsg.style.marginTop = '1rem';
                statusMsg.style.display = 'none';
                quoteForm.appendChild(statusMsg);
            }

            const action = quoteForm.action;
            const hasFile = fileInput && fileInput.files.length > 0;

            // UI Loading State
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;

            // Initial status
            statusMsg.style.display = 'block';
            statusMsg.style.color = 'var(--text-primary)';
            statusMsg.innerHTML = hasFile
                ? '<i class="fas fa-circle-notch fa-spin"></i> Başlatılıyor...'
                : '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';

            // Create XHR
            const xhr = new XMLHttpRequest();
            xhr.open('POST', action, true);
            xhr.setRequestHeader('Accept', 'application/json');

            // Progress event
            if (hasFile) {
                xhr.upload.onprogress = function (event) {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        statusMsg.innerHTML = `<i class="fas fa-arrow-up"></i> Yükleniyor: <strong>%${percentComplete}</strong>`;
                        if (percentComplete === 100) {
                            statusMsg.innerHTML = '<i class="fas fa-check"></i> Yükleme tamamlandı, sunucu yanıtı bekleniyor... (Lütfen bekleyin)';
                        }
                    }
                };
            }

            // Load/Error events
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Success
                    quoteForm.reset();
                    if (fileNameSpan) {
                        fileNameSpan.textContent = '3D Model Dosyası Ekle (.stl, .obj)';
                        fileNameSpan.style.fontWeight = '';
                        // Also reset visuals
                        const fileLabel = fileNameSpan.closest('.file-upload-label');
                        const fileIcon = fileLabel ? fileLabel.querySelector('i') : null;
                        if (fileLabel) fileLabel.classList.remove('file-selected');
                        if (fileIcon) fileIcon.className = 'fas fa-cloud-upload-alt';
                    }
                    statusMsg.style.color = 'var(--accent-color)';
                    statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Mesajınız başarıyla iletildi!';
                } else {
                    // Error
                    statusMsg.style.color = '#e74c3c';
                    statusMsg.textContent = 'Sunucu hatası: ' + xhr.status + ' - ' + xhr.statusText;
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.error) statusMsg.textContent = 'Hata: ' + response.error;
                    } catch (e) { }
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            };

            xhr.onerror = function () {
                statusMsg.style.color = '#e74c3c';
                statusMsg.textContent = 'Ağ hatası oluştu. İnternet bağlantınızı kontrol edin.';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            };

            // Send
            const formData = new FormData(quoteForm);
            xhr.send(formData);
        });
    }


    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;
    const logoImg = document.querySelector('.logo img');
    const lightLogoPath = 'Printova/Printova Logo.png';
    const darkLogoPath = 'Printova/Printova Logo Nightmode.png';

    // Check Local Storage
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (logoImg) logoImg.src = darkLogoPath;
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                if (themeIcon) themeIcon.className = 'fas fa-moon';
                if (logoImg) logoImg.src = lightLogoPath;
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.className = 'fas fa-sun';
                if (logoImg) logoImg.src = darkLogoPath;
            }
        });
    }
});
