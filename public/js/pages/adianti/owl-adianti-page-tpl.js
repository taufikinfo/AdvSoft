// ══════════════════════════════════════════════════════════════
//  AdiantiPageView — Owl Template
//  Dynamic Renderer for Standard Adianti Controllers (TPage / TWindow)
// ══════════════════════════════════════════════════════════════
(function () {
const xml = owl.xml;

window.TEMPLATES = window.TEMPLATES || {};
window.TEMPLATES.AdiantiPageView = xml`
<div class="ls-adianti-page-container" style="padding: 20px; min-height: 100vh; background: #f8fafc;">
    <!-- Top Bar with Controller Info -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: #ede9fe; color: #7c3aed; font-size: 18px;">
                <t t-out="window.lucideIcon('box', 20)"/>
            </span>
            <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;" t-esc="state.className || 'Adianti Controller'"/>
                <span style="font-size: 12px; color: #64748b;" t-esc="'Method: ' + (state.method || 'default') + ' | Status: Terhubung'"/>
            </div>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="ls-btn ls-btn-outline ls-btn-sm" t-on-click="reloadPage" style="display: flex; align-items: center; gap: 6px;">
                <t t-out="window.lucideIcon('refresh-cw', 14)"/> Muat Ulang
            </button>
        </div>
    </div>

    <!-- Loading Spinner -->
    <div t-if="state.loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b;">
        <div class="ls-report-spinner" style="width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"/>
        <span style="font-size: 14px; font-weight: 500;">Memuat Controller Adianti...</span>
    </div>

    <!-- Error Message -->
    <div t-if="state.error" style="background: #fef2f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; color: #991b1b; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 6px;">
            <t t-out="window.lucideIcon('alert-triangle', 18)"/> Gagal Memuat Controller
        </div>
        <p style="margin: 0; font-size: 14px;" t-esc="state.error"/>
    </div>

    <!-- Rendered Adianti Content Slot -->
    <div t-if="!state.loading and !state.error" class="ls-adianti-content-slot" t-ref="contentSlot" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;"/>
</div>
`;

})();
