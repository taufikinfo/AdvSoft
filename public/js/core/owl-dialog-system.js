/**
 * ══════════════════════════════════════════════════════════════════
 * Larasoft Dialog & Notification Engine
 * Replaces ugly browser alerts/confirms with modern, professional UI modals & toasts.
 * ══════════════════════════════════════════════════════════════════
 */
(function () {
    // ── SVG Icons for Dialog & Toast ─────────────────────────────────
    const ICONS = {
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`,
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`,
        confirm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`
    };

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ══════════════════════════════════════════════════════════════════
    // 1. Toast Notification Manager (LarasoftToast)
    // ══════════════════════════════════════════════════════════════════
    const LarasoftToast = {
        _getContainer() {
            let container = document.getElementById('ls-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'ls-toast-container';
                document.body.appendChild(container);
            }
            return container;
        },

        show(options = {}) {
            let message = '';
            let title = '';
            let type = 'info';
            let duration = 3500;

            if (typeof options === 'string') {
                message = options;
            } else {
                message = options.message || options.text || '';
                title = options.title || '';
                type = options.type || 'info';
                duration = options.duration !== undefined ? options.duration : 3500;
            }

            if (type === 'warn') type = 'warning';

            const container = this._getContainer();
            const toast = document.createElement('div');
            toast.className = `ls-toast-item type-${type}`;

            const iconSvg = ICONS[type] || ICONS.info;

            let contentHtml = '';
            if (title) {
                contentHtml += `<div class="ls-toast-title">${escapeHtml(title)}</div>`;
            }
            contentHtml += `<div class="ls-toast-message">${escapeHtml(message)}</div>`;

            toast.innerHTML = `
                <div class="ls-toast-icon">${iconSvg}</div>
                <div class="ls-toast-content">${contentHtml}</div>
                <button class="ls-toast-close" type="button" title="Close">×</button>
                <div class="ls-toast-progress"></div>
            `;

            container.appendChild(toast);

            const progressBar = toast.querySelector('.ls-toast-progress');
            if (progressBar && duration > 0) {
                progressBar.style.transition = `transform ${duration}ms linear`;
                requestAnimationFrame(() => {
                    progressBar.style.transform = 'scaleX(0)';
                });
            }

            let dismissTimer = null;
            const dismiss = () => {
                if (dismissTimer) clearTimeout(dismissTimer);
                toast.classList.add('closing');
                setTimeout(() => {
                    toast.remove();
                }, 260);
            };

            if (duration > 0) {
                dismissTimer = setTimeout(dismiss, duration);
                toast.addEventListener('mouseenter', () => {
                    if (dismissTimer) clearTimeout(dismissTimer);
                    if (progressBar) progressBar.style.transitionPlayState = 'paused';
                });
                toast.addEventListener('mouseleave', () => {
                    dismissTimer = setTimeout(dismiss, 1200);
                });
            }

            toast.querySelector('.ls-toast-close').addEventListener('click', (e) => {
                e.stopPropagation();
                dismiss();
            });

            return { dismiss };
        },

        success(msg, title = '') {
            return this.show({ message: msg, title, type: 'success' });
        },
        error(msg, title = '') {
            return this.show({ message: msg, title, type: 'error', duration: 4500 });
        },
        warn(msg, title = '') {
            return this.show({ message: msg, title, type: 'warning', duration: 4000 });
        },
        info(msg, title = '') {
            return this.show({ message: msg, title, type: 'info' });
        }
    };

    // ══════════════════════════════════════════════════════════════════
    // 2. Modal Dialog Engine (LarasoftDialog)
    // ══════════════════════════════════════════════════════════════════
    const LarasoftDialog = {
        show(options = {}) {
            return new Promise((resolve) => {
                let {
                    title = '',
                    message = '',
                    type = 'info',
                    confirmText = 'OK',
                    cancelText = null,
                    showCancel = false,
                    details = null,
                    closeOnBackdrop = true,
                } = options;

                if (type === 'warn') type = 'warning';
                if (type === 'danger') type = 'error';

                // Default titles based on type
                if (!title) {
                    switch (type) {
                        case 'error': title = 'Action Error'; break;
                        case 'warning': title = 'Warning'; break;
                        case 'success': title = 'Success'; break;
                        case 'confirm': title = 'Confirmation'; break;
                        default: title = 'Notification'; break;
                    }
                }

                // If cancelText is provided, showCancel is true
                if (cancelText || type === 'confirm') {
                    showCancel = true;
                    if (!cancelText) cancelText = 'Cancel';
                }

                // Create Overlay
                const overlay = document.createElement('div');
                overlay.className = 'ls-dialog-overlay';

                const iconSvg = ICONS[type] || ICONS.info;

                let detailsHtml = '';
                if (details) {
                    const detailStr = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details);
                    detailsHtml = `
                        <div class="ls-dialog-details-container">
                            <button type="button" class="ls-dialog-details-toggle">
                                <span>▶</span> Technical Details
                            </button>
                            <div class="ls-dialog-details-box" style="display:none;">${escapeHtml(detailStr)}</div>
                        </div>
                    `;
                }

                let cancelBtnHtml = '';
                if (showCancel) {
                    cancelBtnHtml = `<button type="button" class="ls-dialog-btn ls-dialog-btn-secondary ls-dialog-btn-cancel">${escapeHtml(cancelText)}</button>`;
                }

                overlay.innerHTML = `
                    <div class="ls-dialog-card type-${type}" role="dialog" aria-modal="true" aria-labelledby="ls-dialog-title">
                        <button type="button" class="ls-dialog-close-btn" aria-label="Close">×</button>
                        <div class="ls-dialog-body">
                            <div class="ls-dialog-icon-wrapper">
                                ${iconSvg}
                            </div>
                            <h3 class="ls-dialog-title" id="ls-dialog-title">${escapeHtml(title)}</h3>
                            <p class="ls-dialog-message">${escapeHtml(message)}</p>
                            ${detailsHtml}
                        </div>
                        <div class="ls-dialog-footer">
                            ${cancelBtnHtml}
                            <button type="button" class="ls-dialog-btn ls-dialog-btn-primary ls-dialog-btn-confirm">${escapeHtml(confirmText)}</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(overlay);

                const card = overlay.querySelector('.ls-dialog-card');
                const confirmBtn = overlay.querySelector('.ls-dialog-btn-confirm');
                const cancelBtn = overlay.querySelector('.ls-dialog-btn-cancel');
                const closeBtn = overlay.querySelector('.ls-dialog-close-btn');
                const detailsToggle = overlay.querySelector('.ls-dialog-details-toggle');
                const detailsBox = overlay.querySelector('.ls-dialog-details-box');

                if (detailsToggle && detailsBox) {
                    detailsToggle.addEventListener('click', () => {
                        const isHidden = detailsBox.style.display === 'none';
                        detailsBox.style.display = isHidden ? 'block' : 'none';
                        detailsToggle.querySelector('span').textContent = isHidden ? '▼' : '▶';
                    });
                }

                let isClosed = false;
                const closeDialog = (result) => {
                    if (isClosed) return;
                    isClosed = true;
                    document.removeEventListener('keydown', handleKey);
                    overlay.classList.add('closing');
                    setTimeout(() => {
                        overlay.remove();
                        resolve(result);
                    }, 200);
                };

                const handleKey = (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        closeDialog(false);
                    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        closeDialog(true);
                    }
                };

                document.addEventListener('keydown', handleKey);

                confirmBtn.addEventListener('click', () => closeDialog(true));
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => closeDialog(false));
                }
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => closeDialog(false));
                }

                if (closeOnBackdrop) {
                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) closeDialog(false);
                    });
                }

                // Autofocus on primary button
                requestAnimationFrame(() => {
                    confirmBtn.focus();
                });
            });
        },

        alert(message, options = {}) {
            if (typeof options === 'string') {
                options = { title: options };
            }
            return this.show({
                ...options,
                message: message || options.message || '',
                showCancel: false,
            });
        },

        confirm(message, options = {}) {
            if (typeof options === 'string') {
                options = { title: options };
            }
            return this.show({
                ...options,
                message: message || options.message || '',
                type: options.type || 'confirm',
                showCancel: true,
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
            });
        },

        error(message, title = 'Action Error', details = null) {
            return this.show({
                type: 'error',
                title: title,
                message: message,
                details: details,
                confirmText: 'OK',
            });
        },

        warning(message, title = 'Warning') {
            return this.show({
                type: 'warning',
                title: title,
                message: message,
                confirmText: 'OK',
            });
        },

        success(message, title = 'Success') {
            return this.show({
                type: 'success',
                title: title,
                message: message,
                confirmText: 'OK',
            });
        },

        info(message, title = 'Information') {
            return this.show({
                type: 'info',
                title: title,
                message: message,
                confirmText: 'OK',
            });
        }
    };

    // ══════════════════════════════════════════════════════════════════
    // 3. Smart Parser & Global window.alert Hook
    // ══════════════════════════════════════════════════════════════════
    const _originalAlert = window.alert;

    window.alert = function (message) {
        const raw = message != null ? String(message) : '';

        // Check if string contains standard error/action patterns
        let type = 'info';
        let title = 'Notification';
        let cleanMsg = raw;

        if (/^Action Error:\s*/i.test(raw)) {
            type = 'error';
            title = 'Action Error';
            cleanMsg = raw.replace(/^Action Error:\s*/i, '');
        } else if (/^(Error|Gagal|Exception):\s*/i.test(raw)) {
            type = 'error';
            title = 'Error';
            cleanMsg = raw.replace(/^(Error|Gagal|Exception):\s*/i, '');
        } else if (/^(Warning|Perhatian|Peringatan):\s*/i.test(raw)) {
            type = 'warning';
            title = 'Warning';
            cleanMsg = raw.replace(/^(Warning|Perhatian|Peringatan):\s*/i, '');
        } else if (/is required\.?$/i.test(raw) || /wajib diisi/i.test(raw)) {
            type = 'warning';
            title = 'Validation Required';
            cleanMsg = raw;
        } else if (/failed|error|cannot|tidak bisa/i.test(raw)) {
            type = 'error';
            title = 'Operation Failed';
            cleanMsg = raw;
        } else if (/success|berhasil|saved successfully/i.test(raw)) {
            // For simple success, a toast is even smoother!
            LarasoftToast.success(raw);
            return;
        }

        LarasoftDialog.show({
            type: type,
            title: title,
            message: cleanMsg,
            confirmText: 'OK'
        });
    };

    // ══════════════════════════════════════════════════════════════════
    // 4. SweetAlert2 Compatibility Layer (window.Swal)
    // ══════════════════════════════════════════════════════════════════
    const Swal = {
        fire(titleOrOptions, message, icon) {
            let opts = {};
            if (typeof titleOrOptions === 'object') {
                opts = titleOrOptions;
            } else {
                opts = {
                    title: titleOrOptions,
                    message: message,
                    type: icon || 'info'
                };
            }

            if (opts.icon) opts.type = opts.icon;
            if (opts.text && !opts.message) opts.message = opts.text;

            if (opts.toast) {
                return Promise.resolve(LarasoftToast.show({
                    title: opts.title,
                    message: opts.message,
                    type: opts.type,
                    duration: opts.timer || 3000
                }));
            }

            return LarasoftDialog.show({
                title: opts.title,
                message: opts.message,
                type: opts.type || 'info',
                confirmText: opts.confirmButtonText || 'OK',
                cancelText: opts.cancelButtonText || 'Cancel',
                showCancel: opts.showCancelButton || false,
            }).then(isConfirmed => ({
                isConfirmed: !!isConfirmed,
                isDenied: false,
                isDismissed: !isConfirmed
            }));
        }
    };

    // ══════════════════════════════════════════════════════════════════
    // 5. Expose Global APIs
    // ══════════════════════════════════════════════════════════════════
    window.LarasoftToast = LarasoftToast;
    window.LarasoftDialog = LarasoftDialog;
    window.LarasoftAlert = LarasoftDialog;
    window.Swal = Swal;

    // Adianti framework bridge overrides
    window.__adianti_dialog = function (opts) {
        const type = opts.type || 'info';
        const title = opts.title || (type === 'error' ? 'Error' : 'Notification');
        const message = opts.message || '';
        LarasoftDialog.show({
            type: type,
            title: title,
            message: message,
            confirmText: 'OK'
        }).then(() => {
            if (opts.callback) opts.callback();
        });
    };

    window.__adianti_error = function (title, message, callback) {
        LarasoftDialog.error(message, title).then(() => {
            if (callback) callback();
        });
    };

    window.__adianti_message = function (title, message, callback) {
        LarasoftDialog.info(message, title).then(() => {
            if (callback) callback();
        });
    };

})();
