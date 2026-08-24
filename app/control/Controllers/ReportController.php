<?php

namespace App\Control\Controllers;

use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\Response;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\Registry;
use App\Advsoft\Security\SecurityContext;
use App\Advsoft\QWeb\QWeb;
use Dompdf\Dompdf;

class ReportController extends Controller
{
    public function getPrintActions(Request $request): JsonResponse
    {
        $model = $request->input('model');
        if (!$model) {
            return new JsonResponse([]);
        }
        $reportDef = Registry::get('ir.actions.report');
        if (!$reportDef) {
            return new JsonResponse([]);
        }
        
        $actions = $reportDef->newQuery()->where('model', $model)->get();
        return new JsonResponse($actions->toArray());
    }

    public function downloadPdf(Request $request, $report_id)
    {
        return $this->generateReport($request, $report_id, 'pdf');
    }

    public function previewHtml(Request $request, $report_id)
    {
        return $this->generateReport($request, $report_id, 'html');
    }

    private function generateReport(Request $request, $report_id, $format): Response
    {
        $model = null;
        $viewName = null;
        $titlePrefix = '';

        if (is_numeric($report_id)) {
            $reportDef = Registry::get('ir.actions.report');
            $reportConfig = $reportDef ? $reportDef->newQuery()->find($report_id) : null;
            
            if (!$reportConfig) {
                abort(404, "Report Configuration not found.");
            }
            $model = $reportConfig->model;
            $viewName = $reportConfig->report_name;
            $titlePrefix = $reportConfig->name;
        } else {
            $model = $report_id;
            $viewName = 'reports.' . str_replace('.', '_', $model);
        }

        $def = Registry::get($model);
        if (!$def) {
            abort(404, "Model '$model' not found in registry.");
        }

        if (!$def->checkAccessRights('read', false)) {
            abort(403, "Access denied: read on $model.");
        }

        $ids = $request->input('ids');
        if ($ids && is_string($ids)) {
            $ids = explode(',', $ids);
        }

        $query = $def->newQuery();
        $query = $def->applyRecordRules($query, 'read');

        if (!empty($ids)) {
            $query->whereIn('id', (array)$ids);
        } else {
            $query->limit(50);
        }

        $records = $query->get();
        if ($records->isEmpty()) {
            abort(404, "No records found to print.");
        }

        $company = app(SecurityContext::class)->getCompany();
        $title = ($titlePrefix ? $titlePrefix . ' - ' : '') . $def->_description . ' Report';

        $qweb = app(QWeb::class);
        $html = '';

        try {
            $fields = $def->fieldsGet();
            $fieldList = array_map(fn($name, $fdef) => array_merge($fdef, ['name' => $name]), array_keys($fields), $fields);

            $html = $qweb->render($viewName, [
                'docs' => $records,
                'doc_ids' => $records->pluck('id')->toArray(),
                'doc_model' => $model,
                'record' => $records->first(),
                'records' => $records,
                'def' => $def,
                'fields' => $fields,
                'field_list' => $fieldList,
                'title' => $title,
                'company' => $company,
                'user' => app(SecurityContext::class)->getUser(),
                'time' => time(),
            ]);
        } catch (\Throwable $e) {
            $html = "<html><head><title>{$title}</title></head><body><h1>{$title}</h1><p>" . count($records) . " records</p></body></html>";
        }

        if ($format === 'pdf' && class_exists(Dompdf::class)) {
            $dompdf = new Dompdf();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . str_replace('.', '_', $model) . '_report.pdf"');
            echo $dompdf->output();
            exit;
        }

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
