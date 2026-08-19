<?php

use Adianti\Control\TPage;
use Adianti\Control\TAction;
use Adianti\Widget\Container\TPanelGroup;
use Adianti\Widget\Form\TEntry;
use Adianti\Widget\Form\TButton;
use Adianti\Widget\Form\TLabel;
use Adianti\Widget\Base\TElement;
use Adianti\Widget\Dialog\TMessage;
use Adianti\Database\TTransaction;

/**
 * SampleController — Standard Adianti Framework Page Controller.
 * Accessible via URL: ?class=SampleController or #class=SampleController or engine.php?class=SampleController
 */
class SampleController extends TPage
{
    public function __construct($param = null)
    {
        parent::__construct();

        // Create Panel Group (Standard Adianti Card Container)
        $panel = new TPanelGroup('Standard Adianti Controller Demo', '#7c3aed');
        $panel->style = 'margin: 20px; max-width: 960px;';

        // Content Container
        $div = new TElement('div');
        $div->style = 'padding: 24px; font-family: Inter, sans-serif;';

        // Welcome Badge & Description
        $badge = new TElement('div');
        $badge->style = 'display: inline-block; padding: 6px 14px; background: #ede9fe; color: #6d28d9; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 16px;';
        $badge->add('🚀 Pure Adianti Controller: SampleController');
        $div->add($badge);

        $h2 = new TElement('h2');
        $h2->style = 'margin: 0 0 8px 0; color: #1e1b4b; font-size: 22px; font-weight: 700;';
        $h2->add('Halo dari Standard Adianti Controller!');
        $div->add($h2);

        $p = new TElement('p');
        $p->style = 'color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 24px;';
        $p->add('Halaman ini dirender langsung oleh class <code>SampleController</code> yang merupakan turunan dari <code>Adianti\Control\TPage</code> standar Adianti Framework.');
        $div->add($p);

        // Stats Cards Grid
        $grid = new TElement('div');
        $grid->style = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;';

        $stats = [
            ['title' => 'Controller', 'val' => 'SampleController', 'icon' => '⚡', 'bg' => '#f5f3ff', 'color' => '#7c3aed'],
            ['title' => 'Base Class', 'val' => 'TPage', 'icon' => '🏛️', 'bg' => '#eff6ff', 'color' => '#2563eb'],
            ['title' => 'Framework', 'val' => 'Pure Adianti 8.6', 'icon' => '📦', 'bg' => '#ecfdf5', 'color' => '#059669'],
            ['title' => 'Status', 'val' => 'Aktif & Terintegrasi', 'icon' => '✅', 'bg' => '#fefce8', 'color' => '#ca8a04'],
        ];

        foreach ($stats as $s) {
            $card = new TElement('div');
            $card->style = "padding: 16px; background: {$s['bg']}; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);";
            
            $top = new TElement('div');
            $top->style = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
            $top->add("<span style='font-size:12px; font-weight:600; color:#6b7280;'>{$s['title']}</span>");
            $top->add("<span style='font-size:18px;'>{$s['icon']}</span>");
            $card->add($top);

            $val = new TElement('div');
            $val->style = "font-size: 16px; font-weight: 700; color: {$s['color']};";
            $val->add($s['val']);
            $card->add($val);

            $grid->add($card);
        }
        $div->add($grid);

        // Interactive Action Buttons
        $actionsDiv = new TElement('div');
        $actionsDiv->style = 'display: flex; gap: 12px; align-items: center;';

        $btn1 = new TElement('a');
        $btn1->href = '#class=ShowcaseModelList';
        $btn1->style = 'padding: 10px 18px; background: #7c3aed; color: #fff; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);';
        $btn1->add('✨ Buka Showcase Model');
        $actionsDiv->add($btn1);

        $btn2 = new TElement('a');
        $btn2->href = '#class=TaskForm&method=onEdit&id=1';
        $btn2->style = 'padding: 10px 18px; background: #f3f4f6; color: #374151; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #d1d5db;';
        $btn2->add('📋 Buka Task Form ID 1');
        $actionsDiv->add($btn2);

        $div->add($actionsDiv);
        $panel->add($div);

        // Add to TPage
        parent::add($panel);
    }

    public function onTest($param = null)
    {
        new TMessage('info', 'Method onTest() berhasil dieksekusi dari SampleController!');
    }
}
