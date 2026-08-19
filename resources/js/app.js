// 0. Base Framework
// owl.iife.js is loaded manually in the blade view to preserve global 'this' binding.

// 1. Core
import '../../public/js/core/owl-rpc.js';
import '../../public/js/core/owl-icons.js';
import '../../public/js/core/owl-layout-service.js';
import '../../public/js/core/owl-templates.js';
import '../../public/js/core/owl-root-tpl.js';

// 2. Widgets
import '../../public/js/widgets/fields/owl-field-widgets.js';
import '../../public/js/widgets/fields/owl-field-m2o.js';
import '../../public/js/widgets/fields/owl-field-datetime.js';
import '../../public/js/widgets/fields/owl-field-domain.js';
import '../../public/js/widgets/fields/owl-rte.js';
import '../../public/js/widgets/fields/owl-m2o-dialog.js';
import '../../public/js/widgets/fields/owl-domain-dialog.js';

// 3. Inline Tree
import '../../public/js/widgets/inline-tree/owl-inline-tree-attrs.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-state.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-columns.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-cell-editors.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-drag.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-onchange.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-bulk.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-picker.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree-row.js';
import '../../public/js/widgets/inline-tree/owl-inline-tree.js';

// 4. Views
import '../../public/js/views/list/owl-list.js';
import '../../public/js/views/form/owl-form-tpl.js';
import '../../public/js/views/form/owl-form.js';
import '../../public/js/views/form/owl-form-dialog.js';
import '../../public/js/views/kanban/owl-kanban.js';
import '../../public/js/views/calendar/owl-calendar.js';
import '../../public/js/views/graph/owl-graph.js';
import '../../public/js/views/pivot/owl-pivot.js';
import '../../public/js/views/spreadsheet/engine/spreadsheet-engine.js';
import '../../public/js/views/spreadsheet/owl-spreadsheet.js';

// 5. Pages Auto-Loader (Vite Glob Import)
// Eagerly import all template files first
import.meta.glob('../../public/js/pages/**/*-tpl.js', { eager: true });
// Eagerly import all logic files next (excluding templates)
import.meta.glob(['../../public/js/pages/**/*.js', '!../../public/js/pages/**/*-tpl.js'], { eager: true });

// 6. Mount App
import '../../public/js/core/owl-root.js';
