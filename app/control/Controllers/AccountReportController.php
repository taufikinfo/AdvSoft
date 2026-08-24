<?php

namespace App\Control\Controllers;

use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use Adianti\Database\TTransaction;

/**
 * AccountReportController — Pure Adianti Financial Reporting Engine.
 */
class AccountReportController extends Controller
{
    protected function getPdo(): \PDO
    {
        if (!TTransaction::get()) {
            TTransaction::open('advsoft');
        }
        return TTransaction::get();
    }

    // ────────────────────────────────────────────────────
    //  1. TRIAL BALANCE (Neraca Saldo)
    // ────────────────────────────────────────────────────
    public function trialBalance(Request $request): JsonResponse
    {
        $params = $this->parseParams($request);
        $pdo = $this->getPdo();

        $where = ["1=1"];
        $bindings = [];

        if (!empty($params['date_from'])) {
            $where[] = "am.date >= :date_from";
            $bindings[':date_from'] = $params['date_from'];
        }
        if (!empty($params['date_to'])) {
            $where[] = "am.date <= :date_to";
            $bindings[':date_to'] = $params['date_to'];
        }
        if ($params['target_move'] === 'posted') {
            $where[] = "am.state = 'posted'";
        }
        if (!empty($params['journal_ids'])) {
            $inList = implode(',', array_map('intval', (array)$params['journal_ids']));
            $where[] = "am.journal_id IN ($inList)";
        }

        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT 
                aa.id as account_id,
                aa.code,
                aa.name,
                aa.account_type,
                aa.group_name,
                COALESCE(SUM(aml.debit), 0) as total_debit,
                COALESCE(SUM(aml.credit), 0) as total_credit,
                COALESCE(SUM(aml.debit - aml.credit), 0) as balance
            FROM account_move_line aml
            JOIN account_move am ON aml.move_id = am.id
            JOIN account_account aa ON aml.account_id = aa.id
            WHERE $whereSql
            GROUP BY aa.id, aa.code, aa.name, aa.account_type, aa.group_name
            ORDER BY aa.code ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $totalDebit  = 0;
        $totalCredit = 0;
        foreach ($rows as &$r) {
            $r['total_debit']  = (float) $r['total_debit'];
            $r['total_credit'] = (float) $r['total_credit'];
            $r['balance']      = (float) $r['balance'];
            $totalDebit  += $r['total_debit'];
            $totalCredit += $r['total_credit'];
        }

        return new JsonResponse([
            'title'    => 'Neraca Saldo (Trial Balance)',
            'period'   => $this->periodLabel($params),
            'currency' => 'IDR',
            'rows'     => $rows,
            'lines'    => $rows,
            'accounts' => $rows,
            'totals'   => [
                'total_debit'  => round($totalDebit, 2),
                'total_credit' => round($totalCredit, 2),
                'balance'      => round($totalDebit - $totalCredit, 2),
                'is_balanced'  => abs($totalDebit - $totalCredit) < 0.01,
            ],
            'summary'  => [
                'total_debit'  => round($totalDebit, 2),
                'total_credit' => round($totalCredit, 2),
                'is_balanced'  => abs($totalDebit - $totalCredit) < 0.01,
            ],
        ]);
    }

    // ────────────────────────────────────────────────────
    //  2. GENERAL LEDGER (Buku Besar)
    // ────────────────────────────────────────────────────
    public function generalLedger(Request $request): JsonResponse
    {
        $params = $this->parseParams($request);
        $pdo = $this->getPdo();

        $where = ["1=1"];
        $bindings = [];

        if (!empty($params['date_from'])) {
            $where[] = "am.date >= :date_from";
            $bindings[':date_from'] = $params['date_from'];
        }
        if (!empty($params['date_to'])) {
            $where[] = "am.date <= :date_to";
            $bindings[':date_to'] = $params['date_to'];
        }
        if ($params['target_move'] === 'posted') {
            $where[] = "am.state = 'posted'";
        }
        if (!empty($params['journal_ids'])) {
            $inList = implode(',', array_map('intval', (array)$params['journal_ids']));
            $where[] = "am.journal_id IN ($inList)";
        }
        if (!empty($params['account_ids'])) {
            $inList = implode(',', array_map('intval', (array)$params['account_ids']));
            $where[] = "aa.id IN ($inList)";
        }

        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT 
                aml.id,
                aml.id as line_id,
                aml.account_id,
                aa.code as account_code,
                aa.code,
                aa.name as account_name,
                aa.name,
                aa.account_type,
                am.date,
                am.name as move_name,
                am.ref,
                aml.name as label,
                aml.partner_id,
                rp.name as partner_name,
                aml.debit,
                aml.credit,
                (aml.debit - aml.credit) as balance
            FROM account_move_line aml
            JOIN account_move am ON aml.move_id = am.id
            JOIN account_account aa ON aml.account_id = aa.id
            LEFT JOIN res_partner rp ON aml.partner_id = rp.id
            WHERE $whereSql
            ORDER BY aa.code ASC, am.date ASC, aml.id ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $grouped = [];
        foreach ($rows as $r) {
            $accId = $r['account_id'];
            if (!isset($grouped[$accId])) {
                $grouped[$accId] = [
                    'account_id'   => $accId,
                    'code'         => $r['account_code'],
                    'name'         => $r['account_name'],
                    'account_name' => $r['account_name'],
                    'account_type' => $r['account_type'],
                    'total_debit'  => 0,
                    'total_credit' => 0,
                    'balance'      => 0,
                    'lines'        => [],
                ];
            }
            $debit  = (float) $r['debit'];
            $credit = (float) $r['credit'];
            $grouped[$accId]['total_debit']  += $debit;
            $grouped[$accId]['total_credit'] += $credit;
            $grouped[$accId]['balance']      += ($debit - $credit);
            $r['debit']   = $debit;
            $r['credit']  = $credit;
            $r['balance'] = (float) $r['balance'];
            $r['running_balance'] = $grouped[$accId]['balance'];
            $grouped[$accId]['lines'][] = $r;
        }

        return new JsonResponse([
            'title'    => 'Buku Besar (General Ledger)',
            'period'   => $this->periodLabel($params),
            'currency' => 'IDR',
            'accounts' => array_values($grouped),
        ]);
    }

    // ────────────────────────────────────────────────────
    //  3. BALANCE SHEET (Neraca)
    // ────────────────────────────────────────────────────
    public function balanceSheet(Request $request): JsonResponse
    {
        $params = $this->parseParams($request);
        $pdo = $this->getPdo();

        $where = ["1=1"];
        $bindings = [];

        if (!empty($params['date_to'])) {
            $where[] = "am.date <= :date_to";
            $bindings[':date_to'] = $params['date_to'];
        }
        if ($params['target_move'] === 'posted') {
            $where[] = "am.state = 'posted'";
        }

        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT 
                aa.id,
                aa.code,
                aa.name,
                aa.account_type,
                aa.group_name,
                COALESCE(SUM(aml.debit - aml.credit), 0) as balance
            FROM account_account aa
            LEFT JOIN account_move_line aml ON aml.account_id = aa.id
            LEFT JOIN account_move am ON aml.move_id = am.id AND $whereSql
            WHERE aa.account_type IN ('asset_current', 'asset_non_current', 'asset_fixed', 'liability_current', 'liability_non_current', 'equity')
            GROUP BY aa.id, aa.code, aa.name, aa.account_type, aa.group_name
            ORDER BY aa.code ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $assets = [];
        $liabilities = [];
        $equity = [];

        $totalAssets = 0;
        $totalLiabilities = 0;
        $totalEquity = 0;

        foreach ($rows as $r) {
            $bal = (float) $r['balance'];
            $type = $r['account_type'];
            if (str_starts_with($type, 'asset')) {
                $assets[] = $r;
                $totalAssets += $bal;
            } elseif (str_starts_with($type, 'liability')) {
                $r['balance'] = -$bal;
                $liabilities[] = $r;
                $totalLiabilities += (-$bal);
            } elseif ($type === 'equity') {
                $r['balance'] = -$bal;
                $equity[] = $r;
                $totalEquity += (-$bal);
            }
        }

        $sections = [
            'assets' => [
                'label'    => 'ASET',
                'accounts' => $assets,
                'total'    => round($totalAssets, 2),
            ],
            'liabilities' => [
                'label'    => 'KEWAJIBAN',
                'accounts' => $liabilities,
                'total'    => round($totalLiabilities, 2),
            ],
            'equity' => [
                'label'    => 'EKUITAS',
                'accounts' => $equity,
                'total'    => round($totalEquity, 2),
            ],
        ];

        return new JsonResponse([
            'title'    => 'Neraca (Balance Sheet)',
            'as_of'    => $params['date_to'] ?? date('Y-m-d'),
            'period'   => 'As of ' . ($params['date_to'] ?? date('Y-m-d')),
            'currency' => 'IDR',
            'sections' => $sections,
            'check'    => round($totalAssets - ($totalLiabilities + $totalEquity), 2),
            'summary'  => [
                'total_assets'             => round($totalAssets, 2),
                'total_liabilities_equity' => round($totalLiabilities + $totalEquity, 2),
                'is_balanced'              => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01,
            ]
        ]);
    }

    // ────────────────────────────────────────────────────
    //  4. INCOME STATEMENT (Laba Rugi)
    // ────────────────────────────────────────────────────
    public function incomeStatement(Request $request): JsonResponse
    {
        $params = $this->parseParams($request);
        $pdo = $this->getPdo();

        $where = ["1=1"];
        $bindings = [];

        if (!empty($params['date_from'])) {
            $where[] = "am.date >= :date_from";
            $bindings[':date_from'] = $params['date_from'];
        }
        if (!empty($params['date_to'])) {
            $where[] = "am.date <= :date_to";
            $bindings[':date_to'] = $params['date_to'];
        }
        if ($params['target_move'] === 'posted') {
            $where[] = "am.state = 'posted'";
        }

        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT 
                aa.id,
                aa.code,
                aa.name,
                aa.account_type,
                aa.group_name,
                COALESCE(SUM(aml.credit - aml.debit), 0) as balance
            FROM account_account aa
            JOIN account_move_line aml ON aml.account_id = aa.id
            JOIN account_move am ON aml.move_id = am.id
            WHERE aa.account_type IN ('income', 'income_other', 'expense', 'expense_depreciation', 'expense_direct_cost')
              AND $whereSql
            GROUP BY aa.id, aa.code, aa.name, aa.account_type, aa.group_name
            ORDER BY aa.code ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $income = [];
        $expenses = [];
        $totalIncome = 0;
        $totalExpenses = 0;

        foreach ($rows as $r) {
            $bal = (float) $r['balance'];
            if (str_starts_with($r['account_type'], 'income')) {
                $income[] = $r;
                $totalIncome += $bal;
            } else {
                $r['balance'] = -$bal;
                $expenses[] = $r;
                $totalExpenses += (-$bal);
            }
        }

        $netIncome = $totalIncome - $totalExpenses;

        $sections = [
            'income' => [
                'label'    => 'PENDAPATAN',
                'accounts' => $income,
                'total'    => round($totalIncome, 2),
            ],
            'expense' => [
                'label'    => 'BEBAN / PENGELUARAN',
                'accounts' => $expenses,
                'total'    => round($totalExpenses, 2),
            ],
        ];

        return new JsonResponse([
            'title'            => 'Laporan Laba Rugi (Income Statement)',
            'period'           => $this->periodLabel($params),
            'currency'         => 'IDR',
            'sections'         => $sections,
            'gross_profit'     => round($totalIncome, 2),
            'operating_income' => round($netIncome, 2),
            'net_income'       => round($netIncome, 2),
            'income'           => ['lines' => $income, 'total' => round($totalIncome, 2)],
            'expense'          => ['lines' => $expenses, 'total' => round($totalExpenses, 2)],
            'net_profit'       => round($netIncome, 2),
        ]);
    }

    protected function parseParams(Request $request): array
    {
        return [
            'date_from'    => $request->input('date_from'),
            'date_to'      => $request->input('date_to'),
            'target_move'  => $request->input('target_move', 'posted'),
            'journal_ids'  => $request->input('journal_ids', []),
            'account_ids'  => $request->input('account_ids', []),
        ];
    }

    protected function periodLabel(array $params): string
    {
        $f = $params['date_from'] ?? null;
        $t = $params['date_to'] ?? null;
        if ($f && $t) return "$f to $t";
        if ($f) return "From $f";
        if ($t) return "Until $t";
        return "All Periods";
    }
}
