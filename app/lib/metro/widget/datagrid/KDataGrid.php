<?php

namespace Adianti\Widget\Datagrid;

use Adianti\Control\TAction;
use Adianti\Core\AdiantiCoreTranslator;
use Adianti\Widget\Container\TTable;
use Adianti\Widget\Util\TDropDown;
use Adianti\Widget\Base\TElement;
use Adianti\Widget\Base\TScript;
use Adianti\Widget\Form\TField;
use Adianti\Widget\Form\THidden;
use Adianti\Widget\Util\TImage;
use Adianti\Util\AdiantiTemplateHandler;

use Closure;
use KAction;
use KMenuBuilder;
use Math\Parser;
use Exception;

class KDataGrid extends TTable
{
    protected $columns;
    protected $actions;
    protected $action_groups;
    protected $menu_actions;
    protected $rowcount;
    protected $thead;
    protected $tbody;
    protected $tfoot;
    protected $height;
    protected $scrollable;
    protected $modelCreated;
    protected $pageNavigation;
    protected $defaultClick;
    protected $groupColumn;
    protected $groupTransformer;
    protected $groupTotal;
    protected $groupContent;
    protected $groupMask;
    protected $popover;
    protected $poptitle;
    protected $popside;
    protected $popcontent;
    protected $popcondition;
    protected $objects;
    protected $objectsGroup;
    protected $actionWidth;
    protected $groupCount;
    protected $groupRowCount;
    protected $columnValues;
    protected $columnValuesGroup;
    protected $HTMLOutputConversion;
    protected $searchAttributes;
    protected $outputData;
    protected $hiddenFields;
    protected $prependRows;
    protected $hasInlineEditing;
    protected $hasTotalFunction;
    protected $actionSide;
    protected $mutationAction;
    protected $forPrinting;

    public function __construct()
    {
        parent::__construct();
        $this->modelCreated = FALSE;
        $this->defaultClick = TRUE;
        $this->popover = FALSE;
        $this->groupColumn = NULL;
        $this->groupContent = NULL;
        $this->groupMask = NULL;
        $this->groupCount = 0;
        $this->actions = array();
        $this->action_groups = array();
        $this->menu_actions = array();
        $this->actionWidth = '28px';
        $this->objects = array();
        $this->objectsGroup = array();
        $this->columnValues = array();
        $this->columnValuesGroup = array();
        $this->HTMLOutputConversion = true;
        $this->searchAttributes = [];
        $this->outputData = [];
        $this->hiddenFields = false;
        $this->prependRows = 0;
        $this->hasInlineEditing = false;
        $this->hasTotalFunction = false;
        $this->actionSide = 'left';
        $this->forPrinting = false;

        $this->rowcount = 0;
        $this->{'class'} = 'table align-middle table-row-dashed fs-6 gy-5 dataTable';
        $this->{'id'} = 'idTable';
    }

    public static function appendRow($table_id, $row)
    {
        $row64 = base64_encode($row->getContents());
        TScript::create("ttable_add_row('{$table_id}', 'body', '{$row64}')");
    }

    public static function removeRowById($table_id, $id)
    {
        TScript::create("ttable_remove_row_by_id('{$table_id}', '{$id}')");
    }

    public static function replaceRowById($table_id, $id, $row)
    {
        $row64 = base64_encode($row->getContents());
        TScript::create("ttable_replace_row_by_id('{$table_id}', '{$id}', '{$row64}')");

    }

    public function setId($id)
    {
        $this->{'id'} = $id;
        return $this;
    }

    public function setMutationAction(TAction $action)
    {
        $this->mutationAction = $action;
        return $this;
    }

    public function setActionSide($side)
    {
        $this->actionSide = $side;
        return $this;
    }

    public function generateHiddenFields()
    {
        $this->hiddenFields = true;
        return $this;
    }

    public function disableHtmlConversion()
    {
        $this->HTMLOutputConversion = false;
        return $this;
    }

    public function getOutputData()
    {
        return $this->outputData;
    }

    public function enablePopover($title, $content, $popside = null, $popcondition = null)
    {
        $this->popover = TRUE;
        $this->poptitle = $title;
        $this->popcontent = $content;
        $this->popside = $popside;
        $this->popcondition = $popcondition;

        return $this;
    }

    public function makeScrollable()
    {
        $this->scrollable = TRUE;

        if (isset($this->thead)) {
            $this->thead->{'style'} = 'display: block';
        }
        return $this;
    }

    public function setActionWidth($width)
    {
        $this->actionWidth = $width;
        return $this;
    }

    public function disableDefaultClick()
    {
        $this->defaultClick = FALSE;
        return $this;
    }

    public function getHeight()
    {
        return $this->height;
    }

    public function setHeight($height)
    {
        if (is_numeric($height)) {
            $this->height = $height . 'px';
        } else {
            $this->height = $height;
        }

        if (!empty($this->tbody) && ($this->scrollable)) {
            $this->tbody->{'style'} = "height: {$this->height}; display: block; overflow-y:scroll; overflow-x:hidden;";
        }
        return $this;
    }

    public function addColumn(KDataGridColumn $object, TAction $action = null)
    {
        if ($this->modelCreated) {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', __METHOD__, 'createModel'));
        } else {
            $this->columns[] = $object;

            if (!empty($action)) {
                $object->setAction($action);
            }
        }

        return $object;
    }

    public function getColumns()
    {
        return $this->columns;
    }

    public function setActions($actions)
    {
        $this->actions = [];

        if (!empty($actions)) {
            foreach ($actions as $action) {
                $this->addAction($action);
            }
        }

        return $this;
    }

    public function addAction(KDataGridAction $action, $label = null, $image = null)
    {
        if (!$action->fieldDefined()) {
            throw new Exception(AdiantiCoreTranslator::translate('You must define the field for the action (^1)', $action->toString()));
        }

        if ($this->modelCreated) {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', __METHOD__, 'createModel'));
        } else {
            $this->actions[] = $action;

            if (!empty($label)) {
                $action->setLabel($label);
            }

            if (!empty($image)) {
                $action->setImage($image);
            }
        }
        return $this;
    }

    public function prepareForPrinting()
    {
        $this->forPrinting = true;
        parent::clearChildren();
        $this->actions = [];
        $this->prependRows = 0;

        if ($this->columns) {
            foreach ($this->columns as $column) {
                $column->removeAction();
            }
        }

        $this->createModel();

        return $this;
    }

    public function createModel($create_header = true)
    {
        if (!$this->columns) {
            return;
        }

        if ($create_header) {
            $this->thead = new TElement('thead');
            $this->thead->{'class'} = 'tdatagrid_head';
            parent::add($this->thead);

            $row = new TElement('tr');
            $row->{'class'} = 'text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0';
            if ($this->scrollable) {
                $this->thead->{'style'} = 'display:block';
                if ($this->hasCustomWidth()) {
                    $row->{'style'} = 'display: inline-table; width: calc(100% - 20px)';
                }
            }
            $this->thead->add($row);

            if ($this->actionSide == 'left') {
                $this->createHeaderActionCells($row);
            }

            if ($this->columns) {
                $output_row = [];
                foreach ($this->columns as $column) {
                    $name = $column->getName();
                    $label = $column->getLabel();
                    $align = $column->getAlign();
                    $width = $column->getWidth();
                    $props = $column->getProperties();

                    if ($column->isSearchable()) {
                        $input_search = $column->getInputSearch();
                        $this->enableSearch($input_search, $name);
                        $label .= '&nbsp;' . $input_search;
                    }

                    $col_action = $column->getAction();
                    if ($col_action) {
                        $action_params = $col_action->getParameters();
                    } else {
                        $action_params = null;
                    }

                    $output_row[] = $column->getLabel();

                    if (isset($_GET['order'])) {
                        if ($_GET['order'] == $name || (isset($action_params['order']) && $action_params['order'] == $_GET['order'])) {
                            if (isset($_GET['direction']) and $_GET['direction'] == 'asc') {
                                $label .= '<span class="fa fa-chevron-down blue" aria-hidden="true"></span>';
                            } else {
                                $label .= '<span class="fa fa-chevron-up blue" aria-hidden="true"></span>';
                            }
                        }
                    }
                    $cell = new TElement('th');
                    $cell->{'class'} = 'min-w-125px dt-orderable-asc dt-orderable-desc';
                    $cell->{'data-dt-column'} = $name;
                    $cell->{'aria-label'} = $label . ': Activate to sort';
                    $cell->tabindex = '0';
                    $row->add($cell);
                    $cell->add('<span class="dt-column-title" role="button">' . $label . '</span>');

                    $cell->{'style'} = "text-align:$align;user-select:none";

                    if ($props) {
                        $cell->setProperties($props);
                    }

                    if ($width) {
                        $cell->{'width'} = (strpos($width, '%') !== false || strpos($width, 'px') !== false) ? $width : ($width + 8) . 'px';
                    }

                    if ($column->getAction()) {
                        $action = $column->getAction();
                        if (isset($_GET['direction']) and $_GET['direction'] == 'asc' and isset($_GET['order']) and ($_GET['order'] == $name || (isset($action_params['order']) && $action_params['order'] == $_GET['order']))) {
                            $action->setParameter('direction', 'desc');
                        } else {
                            $action->setParameter('direction', 'asc');
                        }
                        $url = $action->serialize();
                        $cell->{'href'} = htmlspecialchars($url);
                        $cell->{'style'} .= ";cursor:pointer;";
                        $cell->{'generator'} = 'adianti';
                    }
                }

                $this->outputData[] = $output_row;
            }

            if ($this->actionSide == 'right') {
                $this->createHeaderActionCells($row);
            }
        }

        $this->tbody = new TElement('tbody');
        $this->tbody->{'class'} = 'fw-semibold text-gray-600';
        if ($this->scrollable) {
            $this->tbody->{'style'} = "height: {$this->height}; display: block; overflow-y:scroll; overflow-x:hidden;";
        }
        parent::add($this->tbody);

        $this->modelCreated = TRUE;

        return $this;
    }

    private function hasCustomWidth()
    {
        return ((strpos((string)$this->getProperty('style'), 'width') !== false) or !empty($this->getProperty('width')));
    }

    private function createHeaderActionCells($row)
    {
        $actions_count = count($this->actions) + count($this->action_groups) + count($this->menu_actions);

        if ($actions_count > 0) {
            for ($n = 0; $n < $actions_count; $n++) {
                $cell = new TElement('th');
                $row->add($cell);
                $cell->add('<span style="min-width:calc(' . $this->actionWidth . ' - 2px);display:block"></span>');
                $cell->{'class'} = 'tdatagrid_action';
                $cell->{'style'} = 'padding:0';
                $cell->{'width'} = $this->actionWidth;
            }
        }
    }

    public function getWidth()
    {
        $width = 0;
        if ($this->actions) {
            foreach ($this->actions as $action) {
                $width += 22;
            }
        }

        if ($this->columns) {
            foreach ($this->columns as $column) {
                if (is_numeric($column->getWidth())) {
                    $width += $column->getWidth();
                }
            }
        }
        return $width;
    }

    public function enableSearch(TField $input, $attributes)
    {
        if (count($this->objects) > 0) {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', 'enableSearch()', 'addItem()'));
        }

        $input_id = $input->getId();
        $datagrid_id = $this->{'id'};
        $att_names = explode(',', $attributes);
        $dom_atts = [];

        if ($att_names) {
            foreach ($att_names as $att_name) {
                $att_name = trim($att_name);
                $this->searchAttributes[] = $att_name;
                $dom_search_atts[] = str_replace(['-', '>'], ['_', ''], "search_{$att_name}");
            }

            $dom_att_string = implode(',', $dom_search_atts);
            TScript::create("__adianti_input_fuse_search('#{$input_id}', '{$dom_att_string}', '#{$datagrid_id} tr')");
        }
        return $this;

    }

    public function addActionGroup(KDataGridActionGroup $object)
    {
        if ($this->modelCreated) {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', __METHOD__, 'createModel'));
        } else {
            $this->action_groups[] = $object;
        }
        return $this;
    }

    public function addMenuGroup($menuGroupClosure)
    {
        if ($this->modelCreated) {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', __METHOD__, 'createModel'));
        } else {
            if ($menuGroupClosure instanceof Closure) {
                $this->menu_actions[] = $menuGroupClosure;
            }
        }
        return $this;
    }

    public function getTotalColumns()
    {
        return count($this->columns) + count($this->actions) + count($this->action_groups) + count($this->menu_actions);
    }

    public function setGroupColumn($column, $mask, $transformer = null)
    {
        $this->groupColumn = $column;
        $this->groupMask = $mask;
        $this->groupTransformer = $transformer;
        return $this;
    }

    public function useGroupTotal($groupTotal = null)
    {
        $this->groupTotal = $groupTotal;
    }

    public function clear($preserveHeader = TRUE, $rows = 0)
    {
        if ($this->prependRows > 0) {
            $rows += $this->prependRows;
        }

        if ($this->modelCreated) {
            // copy the headers
            $current_header = $this->children[0];
            $current_body = $this->children[1];

            if ($preserveHeader) {
                // reset the row array
                $this->children = array();
                // add the header again
                $this->children[] = $current_header;
            } else {
                // reset the row array
                $this->children = array();
            }

            // add an empty body
            $this->tbody = new TElement('tbody');
            $this->tbody->{'class'} = 'tdatagrid_body';
            if ($this->scrollable) {
                $this->tbody->{'style'} = "height: {$this->height}; display: block; overflow-y:scroll; overflow-x:hidden;";
            }
            parent::add($this->tbody);

            if ($rows) {
                for ($n = 0; $n < $rows; $n++) {
                    $this->tbody->add($current_body->getChildren()[$n]);
                }
            }

            // restart the row count
            $this->rowcount = 0;
            $this->objects = array();
            $this->objectsGroup = array();
            $this->columnValues = array();
            $this->columnValuesGroup = array();
            $this->groupContent = NULL;
        }

        return $this;
    }

    public function prependRow($row)
    {
        $this->getBody()->add($row);
        $this->getHead()->{'noborder'} = '1';
        $this->prependRows++;

        return $this;
    }

    public function getBody()
    {
        return $this->tbody;
    }

    public function getHead()
    {
        return $this->thead;
    }

    public function insert($position, $content)
    {
        $this->tbody->insert($position, $content);
        return $this;
    }

    public function addItems($objects)
    {
        if ($objects) {
            foreach ($objects as $object) {
                $this->addItem($object);
            }
        }
        return $this;
    }

    public function addItem($object)
    {
        if ($this->modelCreated) {
            $valueGroup = null;

            if ($this->groupColumn and
                (is_null($this->groupContent) or $this->groupContent !== $object->{$this->groupColumn})) {

                if ($this->groupMask) {
                    $valueGroup = AdiantiTemplateHandler::replace($this->groupMask, $object);
                } else if ($this->groupTransformer) {
                    $valueGroup = call_user_func($this->groupTransformer, $object->{$this->groupColumn}, $object, $this);
                } else {
                    $valueGroup = $object->{$this->groupColumn};
                }

                if (!is_null($this->groupContent) && $this->groupTotal) {
                    $this->processGroupTotals($this->groupContent);
                }

                $row = new TElement('tr');
                $row->{'class'} = 'tdatagrid_group';
                $row->{'level'} = ++$this->groupCount;
                $this->groupRowCount = 0;
                if ($this->isScrollable() and $this->hasCustomWidth()) {
                    $row->{'style'} = 'display: inline-table; width: 100%';
                }
                $this->tbody->add($row);
                $cell = new TElement('td');
                $cell->colspan = count($this->actions) + count($this->action_groups) + count($this->menu_actions) + count($this->columns);
                $row->add($cell);

                $cell->add($valueGroup);

                $this->groupContent = $object->{$this->groupColumn};
            }

            $classname = ($this->rowcount % 2) == 0 ? 'tdatagrid_row_even' : 'tdatagrid_row_odd';

            $row = new TElement('tr');
            $this->tbody->add($row);
            $row->{'class'} = $classname;

            if ($this->isScrollable() and $this->hasCustomWidth()) {
                $row->{'style'} = 'display: inline-table; width: 100%';
            }

            if ($this->groupColumn) {
                if (empty($this->objectsGroup[$this->groupContent])) {
                    $this->objectsGroup[$this->groupContent] = array();
                }

                $this->objectsGroup[$this->groupContent][] = $object;

                $this->groupRowCount++;
                $row->{'childof'} = $this->groupCount;
                $row->{'level'} = $this->groupCount . '.' . $this->groupRowCount;
            }

            if ($this->actionSide == 'left') {
                $first_url = $this->createItemActions($row, $object);
            }

            $output_row = [];
            $used_hidden = [];

            if ($this->columns) {
                foreach ($this->columns as $column) {
                    $name = $column->getName();
                    $align = $column->getAlign();
                    $width = $column->getWidth();
                    $function = $column->getTransformer();
                    $props = $column->getDataProperties();

                    if (substr($name, 0, 1) == '=') {
                        $content = AdiantiTemplateHandler::replace($name, $object, 'float');
                        $content = AdiantiTemplateHandler::evaluateExpression(substr($content, 1));
                        $object->$name = $content;
                    } else {
                        try {
                            @$content = $object->$name;

                            if (is_null($content)) {
                                $content = AdiantiTemplateHandler::replace($name, $object);

                                if ($content === $name) {
                                    $content = '';
                                }
                            }
                        } catch (Exception $e) {
                            $content = AdiantiTemplateHandler::replace($name, $object);

                            if (empty(trim($content)) or $content === $name) {
                                $content = $e->getMessage();
                            }
                        }
                    }

                    if (isset($this->columnValues[$name])) {
                        $this->columnValues[$name][] = $content;
                    } else {
                        $this->columnValues[$name] = [$content];
                    }

                    if (isset($this->columnValuesGroup[$this->groupContent][$name])) {
                        $this->columnValuesGroup[$this->groupContent][$name][] = $content;
                    } else {
                        $this->columnValuesGroup[$this->groupContent][$name] = [$content];
                    }

                    $data = is_null($content) ? '' : $content;
                    $raw_data = $data;

                    if (($this->HTMLOutputConversion && $column->hasHtmlConversionEnabled()) && is_scalar($data)) {
                        $data = htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');   // TAG value
                    }

                    $cell = new TElement('td');

                    if ($function) {
                        $last_row = isset($this->objects[$this->rowcount - 1]) ? $this->objects[$this->rowcount - 1] : null;
                        $data = call_user_func($function, $raw_data, $object, $row, $cell, $last_row, $this->forPrinting);
                    }

                    $output_row[] = is_scalar($data) ? strip_tags($data) : '';

                    if ($editaction = $column->getEditAction()) {
                        $editaction_field = $editaction->getField();
                        $div = new TElement('div');
                        $div->{'class'} = 'inlineediting';
                        $div->{'style'} = 'padding-left:5px;padding-right:5px';
                        $div->{'action'} = $editaction->serialize();
                        $div->{'field'} = $name;
                        $div->{'key'} = isset($object->{$editaction_field}) ? $object->{$editaction_field} : NULL;
                        $div->{'pkey'} = $editaction_field;
                        $div->add($data);

                        $this->hasInlineEditing = true;

                        $row->add($cell);
                        $cell->add($div);
                        $cell->{'class'} = 'tdatagrid_cell';
                    } else {
                        $row->add($cell);
                        $cell->add($data);

                        if ($this->hiddenFields and !isset($used_hidden[$name])) {
                            $hidden = new THidden($this->id . '_' . $name . '[]');
                            $hidden->{'data-hidden-field'} = 'true';
                            $hidden->setValue($raw_data);
                            $cell->add($hidden);
                            $used_hidden[$name] = true;
                        }

                        $cell->{'class'} = 'tdatagrid_cell';
                        $cell->{'align'} = $align;

                        if (isset($first_url) && $this->defaultClick && empty($cell->{'href'}) && !empty($first_url) && ($first_url !== '#disabled')) {
                            $cell->{'href'} = $first_url;
                            $cell->{'generator'} = 'adianti';
                            $cell->{'class'} = 'tdatagrid_cell';
                        }
                    }

                    if ($props) {
                        $cell->setProperties($props);
                    }

                    if ($width) {
                        $cell->{'width'} = (strpos($width, '%') !== false || strpos($width, 'px') !== false) ? $width : ($width + 8) . 'px';
                    }
                }

                $this->outputData[] = $output_row;
            }

            if ($this->actionSide == 'right') {
                $this->createItemActions($row, $object);
            }

            if ($this->popover && (empty($this->popcondition) or call_user_func($this->popcondition, $object))) {
                $poptitle = $this->poptitle;
                $popcontent = $this->popcontent;
                $poptitle = AdiantiTemplateHandler::replace($poptitle, $object);
                $popcontent = AdiantiTemplateHandler::replace($popcontent, $object, null, true);

                $row->{'data-popover'} = 'true';
                $row->{'poptitle'} = $poptitle;
                $row->{'popcontent'} = htmlspecialchars(str_replace("\n", '', nl2br($popcontent)));

                if ($this->popside) {
                    $row->{'popside'} = $this->popside;
                }
            }

            if (count($this->searchAttributes) > 0) {
                $row->{'id'} = 'row_' . mt_rand(1000000000, 1999999999);

                foreach ($this->searchAttributes as $search_att) {
                    @$search_content = $object->$search_att; // fire magic methods
                    if (!empty($search_content)) {
                        $row_dom_search_att = 'search_' . str_replace(['-', '>'], ['_', ''], $search_att);
                        $row->$row_dom_search_att = $search_content;
                    }
                }
            }

            $this->objects[$this->rowcount] = $object;

            $this->rowcount++;

            return $row;
        } else {
            throw new Exception(AdiantiCoreTranslator::translate('You must call ^1 before ^2', 'createModel', __METHOD__));
        }
        return $this;
    }

    private function processGroupTotals($valueGroup)
    {
        $row = new TElement('tr');

        if ($this->isScrollable() and $this->hasCustomWidth()) {
            $row->{'style'} = 'display: inline-table; width: 100%';
        }

        if ($this->actionSide == 'left') {
            if ($this->actions) {
                foreach ($this->actions as $action) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }

            if ($this->action_groups) {
                foreach ($this->action_groups as $action_group) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }

            if ($this->menu_actions) {
                foreach ($this->menu_actions as $menu_action) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }
        }

        if ($this->columns) {
            foreach ($this->columns as $column) {
                $cell = new TElement('td');
                $row->add($cell);

                $totalFunction = $column->getTotalFunction();
                $totalMask = $column->getTotalMask();
                $totalCallback = $column->getTotalCallback();
                $transformer = $column->getTransformer();
                $name = $column->getName();
                $align = $column->getAlign();
                $width = $column->getWidth();
                $props = $column->getDataProperties();
                $cell->{'style'} = "text-align:$align";

                if ($width) {
                    $cell->{'width'} = (strpos($width, '%') !== false || strpos($width, 'px') !== false) ? $width : ($width + 8) . 'px';
                }

                if ($props) {
                    $cell->setProperties($props);
                }

                if ($totalCallback) {
                    $raw_content = 0;
                    $content = 0;

                    if (count($this->objectsGroup[$valueGroup]) > 0) {
                        $raw_content = $totalCallback($this->columnValuesGroup[$valueGroup][$name], $this->objectsGroup[$valueGroup]);
                        $content = $raw_content;

                        if ($transformer && $column->totalTransformed()) {
                            $content = call_user_func($transformer, $content, null, null, null, null);
                        }
                    }

                    if (!empty($totalFunction) || !empty($totalCallback)) {
                        $this->hasTotalFunction = true;
                        $cell->{'data-total-function'} = $totalFunction;
                        $cell->{'data-column-name'} = $name;
                        $cell->{'data-total-mask'} = $totalMask;
                        $cell->{'data-value'} = $raw_content;
                    }

                    $cell->add($content);
                } else {
                    $cell->add('&nbsp;');
                }
            }
        }

        $this->tbody->add($row);

        return $this;
    }

    public function isScrollable()
    {
        return $this->scrollable;
    }

    private function createItemActions($row, $object)
    {
        $first_url = null;

        if ($this->actions) {
            foreach ($this->actions as $action_template) {
                $action = $action_template->prepare($object);
                $label = $action->getLabel();
                $image = $action->getImage();
                $condition = $action->getDisplayCondition();

                if (empty($condition) or call_user_func($condition, $object)) {
                    $url = $action->serialize(TRUE, TRUE);
                    $first_url = isset($first_url) ? $first_url : $url;

                    $link = new TElement('a');
                    $link->{'href'} = htmlspecialchars($url);
                    $link->{'generator'} = 'adianti';
                    $link->{'title'} = $label;

                    if ($url == '#disabled') {
                        $link->{'disabled'} = '1';
                    }

                    if ($image) {
                        $image_tag = is_object($image) ? clone $image : new TImage($image);

                        if ($action->getUseButton()) {
                            $span = new TElement('span');
                            $span->{'class'} = $action->getButtonClass() ? $action->getButtonClass() : 'btn btn-default';
                            $span->add($image_tag);
                            $span->add($label);
                            $link->add($span);

                            $link->{'role'} = 'button';
                        } else {
                            $link->add($image_tag);
                        }
                    } else {
                        $span = new TElement('span');
                        $span->{'class'} = $action->getButtonClass() ? $action->getButtonClass() : 'btn btn-default';
                        $span->add($label);
                        $link->add($span);
                    }
                } else {
                    $link = '';
                }

                $cell = new TElement('td');
                $row->add($cell);
                $cell->add($link);
                $cell->{'style'} = 'min-width:' . $this->actionWidth;
                $cell->{'class'} = 'tdatagrid_cell action';
            }
        }

        if ($this->action_groups) {
            foreach ($this->action_groups as $action_group) {
                $actions = $action_group->getActions();
                $headers = $action_group->getHeaders();
                $separators = $action_group->getSeparators();

                if ($actions) {
                    $dropdown = new TDropDown($action_group->getLabel(), $action_group->getIcon());
                    $last_index = 0;
                    foreach ($actions as $index => $action_template) {
                        $action = $action_template->prepare($object);

                        for ($n = $last_index; $n < $index; $n++) {
                            if (isset($headers[$n])) {
                                $dropdown->addHeader($headers[$n]);
                            }
                            if (isset($separators[$n])) {
                                $dropdown->addSeparator();
                            }
                        }

                        $label = $action->getLabel();
                        $image = $action->getImage();
                        $condition = $action->getDisplayCondition();

                        if (empty($condition) or call_user_func($condition, $object)) {
                            $url = $action->serialize(TRUE, TRUE);
                            $first_url = isset($first_url) ? $first_url : $url;

                            if ($url !== '#disabled') {
                                $dropdown->addAction($label, $action, $image);
                            }
                        }
                        $last_index = $index;
                    }
                    $cell = new TElement('td');
                    $row->add($cell);
                    $cell->add($dropdown);
                    $cell->{'class'} = 'tdatagrid_cell action';
                }
            }
        }

        if ($this->menu_actions) {
            foreach ($this->menu_actions as $menu_action) {
                $cell = new TElement('td');
                $row->add($cell);
                $cell->add($menu_action($object));
                $cell->{'class'} = 'tdatagrid_cell action';
            }
        }

        return $first_url;
    }

    public function getItems()
    {
        return $this->objects;
    }

    public function getRowIndex($attribute, $value)
    {
        foreach ($this->objects as $pos => $object) {
            if ($object->$attribute == $value) {
                return $pos;
            }
        }
        return NULL;
    }

    public function getRow($position)
    {
        return $this->tbody->get($position);
    }

    public function getPageNavigation()
    {
        return $this->pageNavigation;
    }

    public function setPageNavigation($pageNavigation)
    {
        $this->pageNavigation = $pageNavigation;
        return $this;
    }

    public function setSearchAttributes($attributes)
    {
        $this->searchAttributes = $attributes;
        return $this;
    }

    public function show()
    {
        $this->processTotals();

        if (!$this->hasCustomWidth()) {
            $this->{'style'} .= ';width:unset';
        }

        parent::show();

        $params = $_REQUEST;
        unset($params['class']);
        unset($params['method']);
        $urlparams = '&' . http_build_query($params);

        if ($this->hasInlineEditing) {
            TScript::create(" tdatagrid_inlineedit( '{$urlparams}' );");
        }

        if ($this->groupColumn) {
            TScript::create(" tdatagrid_enable_groups();");
        }

        if ($this->hasTotalFunction) {
            TScript::create(" tdatagrid_update_total('#{$this->{'id'}}');");
        }

        if ($this->mutationAction) {
            $url = $this->mutationAction->serialize(false);
            TScript::create(" tdatagrid_mutation_action('#{$this->{'id'}}', '$url');");
        }
    }

    private function processTotals()
    {
        if ($this->groupColumn && $this->groupTotal) {
            $this->processGroupTotals($this->groupContent);
        }

        $has_total = false;

        $this->tfoot = new TElement('tfoot');
        $this->tfoot->{'class'} = 'tdatagrid_footer';

        if ($this->scrollable) {
            $this->tfoot->{'style'} = "display: block";
            $this->tfoot->{'style'} = "display: block; padding-right: 15px";
        }

        $row = new TElement('tr');

        if ($this->isScrollable() and $this->hasCustomWidth()) {
            $row->{'style'} = 'display: inline-table; width: 100%';
        }
        $this->tfoot->add($row);

        if ($this->actionSide == 'left') {
            if ($this->actions) {
                foreach ($this->actions as $action) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }

            if ($this->action_groups) {
                foreach ($this->action_groups as $action_group) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }

            if ($this->menu_actions) {
                foreach ($this->menu_actions as $menu_action) {
                    $cell = new TElement('td');
                    $row->add($cell);
                }
            }
        }

        if ($this->columns) {
            foreach ($this->columns as $column) {
                $cell = new TElement('td');
                $row->add($cell);

                $totalFunction = $column->getTotalFunction();
                $totalMask = $column->getTotalMask();
                $totalCallback = $column->getTotalCallback();
                $transformer = $column->getTransformer();
                $name = $column->getName();
                $align = $column->getAlign();
                $width = $column->getWidth();
                $props = $column->getDataProperties();
                $cell->{'style'} = "text-align:$align";

                if ($width) {
                    $cell->{'width'} = (strpos($width, '%') !== false || strpos($width, 'px') !== false) ? $width : ($width + 8) . 'px';
                }

                if ($props) {
                    $cell->setProperties($props);
                }

                if ($totalCallback) {
                    $raw_content = 0;
                    $content = 0;

                    if (count($this->objects) > 0) {
                        $raw_content = $totalCallback($this->columnValues[$name], $this->objects);
                        $content = $raw_content;

                        if ($transformer && $column->totalTransformed()) {
                            $content = call_user_func($transformer, $content, null, null, null, null, null);
                        }
                    }

                    if (!empty($totalFunction) || !empty($totalCallback)) {
                        $this->hasTotalFunction = true;
                        $cell->{'data-total-function'} = $totalFunction;
                        $cell->{'data-column-name'} = $name;
                        $cell->{'data-total-mask'} = $totalMask;
                        $cell->{'data-value'} = $raw_content;
                    }
                    $cell->add($content);
                } else {
                    $cell->add('&nbsp;');
                }
            }
        }

        if ($this->hasTotalFunction) {
            parent::add($this->tfoot);
        }

        return $this;
    }

    public function getRowCount()
    {
        return $this->rowcount;
    }
}
