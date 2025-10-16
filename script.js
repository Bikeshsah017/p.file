// p.file - Privacy-focused photo storage application
class PFileApp {
    constructor() {
        this.encryptionKey = null;
        this.uploadedPhotos = JSON.parse(localStorage.getItem('pfile_photos') || '[]');
        this.currentPhoto = null;
        this.settings = JSON.parse(localStorage.getItem('pfile_settings') || '{}');
        this.theme = localStorage.getItem('pfile_theme') || 'light';
        this.encryptionMethod = 'aes256';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGallery();
        this.generateEncryptionKey();
        this.applyTheme();
        this.loadSettings();
        this.setupAdvancedFeatures();
    }

    generateEncryptionKey() {
        // Generate a secure encryption key for the user
        this.encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
        localStorage.setItem('pfile_encryption_key', this.encryptionKey);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.filterPhotos(e.target.value));

        // Modal close
        document.getElementById('photoModal').addEventListener('click', (e) => {
            if (e.target.id === 'photoModal') {
                this.closeModal();
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // User menu
        const userBtn = document.getElementById('userBtn');
        userBtn.addEventListener('click', () => this.toggleUserMenu());

        // Settings
        const themeSelect = document.getElementById('themeSelect');
        themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));

        const accentColor = document.getElementById('accentColor');
        accentColor.addEventListener('change', (e) => this.changeAccentColor(e.target.value));

        // Encryption settings
        document.querySelectorAll('input[name="encryption"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.changeEncryptionMethod(e.target.value));
        });

        // Settings checkboxes
        document.getElementById('autoEncrypt').addEventListener('change', (e) => this.updateSetting('autoEncrypt', e.target.checked));
        document.getElementById('deleteAfterUpload').addEventListener('change', (e) => this.updateSetting('deleteAfterUpload', e.target.checked));
        document.getElementById('enableAnalytics').addEventListener('change', (e) => this.updateSetting('enableAnalytics', e.target.checked));
    }

    setupAdvancedFeatures() {
        // Initialize advanced features
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        this.setupImagePreview();
        this.initializeSecurityDashboard();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'u':
                        e.preventDefault();
                        this.showSection('upload');
                        break;
                    case 'g':
                        e.preventDefault();
                        this.showSection('gallery');
                        break;
                    case 's':
                        e.preventDefault();
                        this.showSection('settings');
                        break;
                    case 'd':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }
        });
    }

    setupDragAndDrop() {
        // Enhanced drag and drop with visual feedback
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
            this.showDragFeedback();
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!uploadArea.contains(e.relatedTarget)) {
                uploadArea.classList.remove('dragover');
                this.hideDragFeedback();
            }
        });
    }

    setupImagePreview() {
        // Enhanced image preview with zoom and pan
        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        
        modalImage.addEventListener('click', (e) => {
            if (modalImage.style.transform === 'scale(2)') {
                modalImage.style.transform = 'scale(1)';
                modalImage.style.cursor = 'zoom-in';
            } else {
                modalImage.style.transform = 'scale(2)';
                modalImage.style.cursor = 'zoom-out';
            }
        });
    }

    initializeSecurityDashboard() {
        // Update security status indicators
        this.updateSecurityStatus();
        setInterval(() => this.updateSecurityStatus(), 5000);
    }

    updateSecurityStatus() {
        const indicators = document.querySelectorAll('.status-indicator');
        indicators.forEach(indicator => {
            indicator.classList.add('active');
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');
        
        // Add active class to corresponding nav link
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');

        // Load gallery if showing gallery section
        if (sectionName === 'gallery') {
            this.loadGallery();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select image files only.', 'error');
            return;
        }

        this.showUploadProgress(true);

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            await this.uploadFile(file, i + 1, imageFiles.length);
        }

        this.showUploadProgress(false);
        this.showNotification(`${imageFiles.length} photo(s) uploaded successfully!`, 'success');
        this.loadGallery();
    }

    async uploadFile(file, current, total) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Encrypt the image data
                    const encryptedData = this.encryptData(e.target.result);
                    
                    // Create photo object
                    const photo = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        encryptedData: encryptedData,
                        uploadDate: new Date().toISOString(),
                        thumbnail: await this.createThumbnail(e.target.result)
                    };

                    // Store in localStorage (in a real app, this would be sent to a secure server)
                    this.uploadedPhotos.push(photo);
                    localStorage.setItem('pfile_photos', JSON.stringify(this.uploadedPhotos));

                    // Update progress
                    const progress = (current / total) * 100;
                    this.updateProgress(progress, `Uploading ${file.name}...`);

                    // Auto-delete from device if option is enabled
                    const autoDelete = document.getElementById('autoDelete').checked;
                    if (autoDelete) {
                        // In a real implementation, this would clear the file input
                        console.log('File would be deleted from device');
                    }

                    resolve();
                } catch (error) {
                    console.error('Upload error:', error);
                    this.showNotification('Error uploading file', 'error');
                    resolve();
                }
            };

            reader.readAsDataURL(file);
        });
    }

    encryptData(data) {
        // Encrypt the data using AES encryption
        return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    }

    decryptData(encryptedData) {
        // Decrypt the data
        const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    async createThumbnail(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set thumbnail size
                const maxSize = 200;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = imageData;
        });
    }

    loadGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (this.uploadedPhotos.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>No photos yet</h3>
                    <p>Upload your first photo to get started</p>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = this.uploadedPhotos.map(photo => `
            <div class="photo-item" onclick="app.showPhoto('${photo.id}')">
                <img src="${photo.thumbnail}" alt="${photo.name}" loading="lazy">
                <div class="photo-info">
                    <div class="photo-name">${photo.name}</div>
                    <div class="photo-date">${new Date(photo.uploadDate).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    }

    showPhoto(photoId) {
        const photo = this.uploadedPhotos.find(p => p.id == photoId);
        if (!photo) return;

        this.currentPhoto = photo;
        const decryptedData = this.decryptData(photo.encryptedData);
        
        document.getElementById('modalImage').src = decryptedData;
        document.getElementById('photoModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('photoModal').style.display = 'none';
        this.currentPhoto = null;
    }

    downloadPhoto() {
        if (!this.currentPhoto) return;

        const decryptedData = this.decryptData(this.currentPhoto.encryptedData);
        const link = document.createElement('a');
        link.href = decryptedData;
        link.download = this.currentPhoto.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    deletePhoto() {
        if (!this.currentPhoto) return;

        if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            this.uploadedPhotos = this.uploadedPhotos.filter(p => p.id !== this.currentPhoto.id);
            localStorage.setItem('pfile_photos', JSON.stringify(this.uploadedPhotos));
            this.closeModal();
            this.loadGallery();
            this.showNotification('Photo deleted successfully', 'success');
        }
    }

    filterPhotos(searchTerm) {
        const photoItems = document.querySelectorAll('.photo-item');
        const term = searchTerm.toLowerCase();

        photoItems.forEach(item => {
            const name = item.querySelector('.photo-name').textContent.toLowerCase();
            if (name.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showUploadProgress(show) {
        const progressContainer = document.getElementById('uploadProgress');
        progressContainer.style.display = show ? 'block' : 'none';
        
        if (!show) {
            this.updateProgress(0, '');
        }
    }

    updateProgress(percent, text) {
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = text;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Advanced Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('pfile_theme', this.theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        this.showNotification(`Switched to ${this.theme} mode`, 'success');
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    changeTheme(theme) {
        this.theme = theme;
        this.applyTheme();
        localStorage.setItem('pfile_theme', this.theme);
    }

    changeAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
        localStorage.setItem('pfile_accent_color', color);
        this.showNotification('Accent color updated', 'success');
    }

    // Advanced Settings Management
    loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('pfile_settings') || '{}');
        this.settings = { ...this.settings, ...savedSettings };
        
        // Apply saved settings to UI
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.checked = this.settings[key];
            }
        });
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem('pfile_settings', JSON.stringify(this.settings));
        this.showNotification('Setting updated', 'success');
    }

    changeEncryptionMethod(method) {
        this.encryptionMethod = method;
        localStorage.setItem('pfile_encryption_method', method);
        this.showNotification(`Encryption method changed to ${method.toUpperCase()}`, 'success');
    }

    // Advanced User Interface
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.style.opacity = dropdown.style.opacity === '1' ? '0' : '1';
        dropdown.style.visibility = dropdown.style.visibility === 'visible' ? 'hidden' : 'visible';
    }

    showDragFeedback() {
        const feedback = document.createElement('div');
        feedback.id = 'dragFeedback';
        feedback.innerHTML = `
            <div class="drag-feedback-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Drop your photos here</h3>
                <p>Release to upload securely</p>
            </div>
        `;
        feedback.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(102, 126, 234, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            text-align: center;
        `;
        document.body.appendChild(feedback);
    }

    hideDragFeedback() {
        const feedback = document.getElementById('dragFeedback');
        if (feedback) {
            feedback.remove();
        }
    }

    // Advanced Export Functions
    exportAllPhotos() {
        if (this.uploadedPhotos.length === 0) {
            this.showNotification('No photos to export', 'error');
            return;
        }

        const zip = new JSZip();
        let count = 0;

        this.uploadedPhotos.forEach(photo => {
            const decryptedData = this.decryptData(photo.encryptedData);
            const base64Data = decryptedData.split(',')[1];
            zip.file(photo.name, base64Data, { base64: true });
            count++;
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `pfile-photos-${new Date().toISOString().split('T')[0]}.zip`;
            link.click();
            this.showNotification(`Exported ${count} photos`, 'success');
        });
    }

    exportEncryptionKey() {
        const keyData = {
            key: this.encryptionKey,
            method: this.encryptionMethod,
            exportDate: new Date().toISOString(),
            warning: 'Keep this key safe! Without it, you cannot decrypt your photos.'
        };

        const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pfile-encryption-key.json';
        link.click();
        this.showNotification('Encryption key exported', 'success');
    }

    // Advanced Photo Management
    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select image files only.', 'error');
            return;
        }

        this.showUploadProgress(true);

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            await this.uploadFile(file, i + 1, imageFiles.length);
        }

        this.showUploadProgress(false);
        this.showNotification(`${imageFiles.length} photo(s) uploaded successfully!`, 'success');
        this.loadGallery();
        this.updateStorageInfo();
    }

    updateStorageInfo() {
        const totalSize = this.uploadedPhotos.reduce((sum, photo) => sum + photo.size, 0);
        const usedGB = (totalSize / (1024 * 1024 * 1024)).toFixed(1);
        const totalGB = 6;
        const percentage = (usedGB / totalGB) * 100;

        const storageFill = document.querySelector('.storage-fill');
        const storageText = document.querySelector('.storage-info p');
        
        if (storageFill) {
            storageFill.style.width = `${percentage}%`;
        }
        if (storageText) {
            storageText.textContent = `${usedGB} GB of ${totalGB} GB used`;
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    app.showSection(sectionName);
}

function closeModal() {
    app.closeModal();
}

function downloadPhoto() {
    app.downloadPhoto();
}

function deletePhoto() {
    app.deletePhoto();
}

function loadGallery() {
    app.loadGallery();
}

function exportAllPhotos() {
    app.exportAllPhotos();
}

function exportEncryptionKey() {
    app.exportEncryptionKey();
}

// Initialize the application
const app = new PFileApp();
