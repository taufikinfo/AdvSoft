<?php

use Adianti\Control\TAction;
use Adianti\Widget\Datagrid\KDataGrid;
use Adianti\Widget\Datagrid\KDataGridAction;
use Adianti\Widget\Datagrid\KDataGridColumn;
use Adianti\Wrapper\MetroDatagridWrapper;
use Adianti\Widget\Base\TElement;
use Adianti\Registry\TSession;

use Latte\Loaders\StringLoader;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
class KGridBuilder
{
    private $tableWrapperId;
    private $instance;
    private $headers = [];
    private $toolbar = [];
    private $columns = [];
    private $footer = [];
    private $bulkActions = [];
    private $datagrid;
    private $wrapper;
    private $name;
    private $modelCreated = false;
    private $navigation;
    private $class;
    private $groupColumn;
    private $groupMask;
    private $groupTransformer;
    private ?int $height = NULL;
    private bool $scrollable = false;
    private string $style;
    private $datatable = "false";
    private $noDataDisplayContent;
    private $switchDisplayTemplate;
    private $switchDisplayCardClass = '';
    private $switchDisplayData ;
    private $displayMode = 'grid'; // default mode
    private $twig;
    private $latte;

    protected $popover;
    protected $poptitle;
    protected $popside;
    protected $popcontent;
    protected $popcondition;

    public function __construct()
    {
        $this->datagrid = new KDataGrid();
        $this->wrapper = new MetroDatagridWrapper($this->datagrid);
        $this->twig = new Environment(new ArrayLoader());
        $this->latte =new Latte\Engine;
    }

    public static function make()
    {
        return new self();
    }

    public function id($id)
    {
        $this->tableWrapperId = $id;
        return $this;
    }

    public function instance($instance)
    {
        $this->instance = $instance;
        return $this;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    // Forward method calls to KDataGrid instance
    public function __call($method, $parameters)
    {
        if (method_exists($this->datagrid, $method)) {
            $result = call_user_func_array([$this->datagrid, $method], $parameters);
            return $result === $this->datagrid ? $this : $result;
        }

        throw new BadMethodCallException("Method {$method} does not exist");
    }

    public function __set($property, $value)
    {
        $this->datagrid->$property = $value;
    }

    public function __get($property)
    {
        return $this->datagrid->$property;
    }

    public function schema(array $components)
    {
        foreach ($components as $component) {
            if ($component instanceof KGridHeader) {
                $this->headers[] = $component;
            } elseif ($component instanceof KGridToolbar) {
                $this->toolbar[] = $component;
            } elseif ($component instanceof KGridColumns) {
                foreach ($component->getColumns() as $col) {
                    $column = new KDataGridColumn($col->getField(), $col->getLabel(), 'left');
                    if ($col->isSortable()) {
                        $action = new TAction([$this->instance, 'onReload']);
                        $action->setParameter('order', $col->getField());
                        $column->setAction($action);
                    }

                    if (method_exists($col, 'getTransformedValue')) {
                        $column->setTransformer(function ($value, $object, $row, $cell) use ($col) {
                            return $col->getTransformedValue($value, $object, $row, $cell);
                        });
                    }

                    $attributes = $col->getAttributes();
                    foreach ($attributes as $name => $value) {
                        $column->setProperty($name, $value);
                    }

                    $this->datagrid->addColumn($column);
                    $this->columns[] = $column;
                }

                foreach ($component->getActions() as $action) {
                    if ($action instanceof KGridAction) {
                        $tAction = new KDataGridAction($action->getAction()->getAction(), $action->getAction()->getParameters());
                        $this->datagrid->addAction($tAction, $action->getLabel(), $action->getImage());
                    }
                }

                if ($component->getActionGroups() instanceof Closure) {
                    $this->datagrid->addMenuGroup(function ($object) use ($component) {
                        return $component->getActionGroups()($object);
                    });
                }

            } elseif ($component instanceof KTableFooter) {
                $this->footer[] = $component;
                foreach ($component->getComponents() as $footerComponent) {
                    if ($footerComponent instanceof KNavigation) {
                        $this->navigation = $footerComponent;
                    }
                }
            }
        }
        return $this;
    }

    public function getColumns()
    {
        return $this->columns;
    }

    public function bulkActions(...$actions)
    {
        foreach ($actions as $action) {
            $this->bulkActions[] = $action;
        }
        return $this;
    }

    public function addItem($item)
    {
        if (!$this->modelCreated) {
            $this->createModel();
        }
        $this->datagrid->addItem($item);
        return $this;
    }

    public function createModel()
    {
        if ($this->scrollable) {
            $this->wrapper->makeScrollable();
        }

        $this->datagrid->createModel();
        $this->modelCreated = true;
    }

    public function clear()
    {
        $this->datagrid->clear();
        return $this;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getNavigation()
    {
        return $this->navigation;
    }

    public function show()
    {
        // Get the display mode from the session
        $this->displayMode = TSession::getValue(get_class($this->instance).'_display_mode' ) ?? 'grid';

        if (!$this->modelCreated) {
            $this->createModel();
        }

        $card = new TElement('div');
        $card->{'class'} = 'card' . ($this->displayMode === 'template' ? ' ' . $this->switchDisplayCardClass : '');

        $cardHeader = new TElement('div');
        $cardHeader->{'class'} = 'card-header border-0 pt-6';

        $cardTitle = new TElement('div');
        $cardTitle->{'class'} = 'card-title';

        foreach ($this->headers as $header) {
            $cardTitle->add($header->render());
        }

        $cardToolbar = new TElement('div');
        $cardToolbar->{'class'} = 'card-toolbar';

        foreach ($this->toolbar as $toolbar) {
            $cardToolbar->add($toolbar->render());
        }

        $cardHeader->add($cardTitle);
        $cardHeader->add($cardToolbar);

        $cardBody = new TElement('div');
        $cardBody->{'class'} = 'card-body';

        if ($this->datagrid->getRowCount() === 0 && $this->noDataDisplayContent) {
            $heading = new TElement('div');
            $heading->{'class'} = 'card-px text-center pt-15';

            $title = new TElement('h2');
            $title->{'class'} = 'fs-2x fw-bold mb-0';
            $title->add($this->noDataDisplayContent['title']);
            $heading->add($title);

            $description = new TElement('p');
            $description->{'class'} = 'text-gray-500 fs-4 fw-semibold py-7';
            $description->add($this->noDataDisplayContent['description']);
            $heading->add($description);

            $cardBody->add($heading);

            foreach ($this->noDataDisplayContent['content'] as $content) {
                $cardBody->add($content);
            }
        } elseif ($this->displayMode === 'template' && $this->switchDisplayTemplate) {
            $this->renderSwitchDisplay($cardBody);
        } else {
            $tableWrapper = new TElement('div');
            $tableWrapper->{'id'} = $this->tableWrapperId;
            $tableWrapper->{'class'} = 'dt-container dt-bootstrap5 dt-empty-footer';

            $cardBody->add($tableWrapper);
            $tableWrapper->add($this->wrapper);
        }

        $card->add($cardHeader);
        $card->add($cardBody);

        if ($this->style) {
            $this->wrapper->{'style'} = $this->style;
        }

        if ($this->popover) {
            $this->wrapper->popover = $this->popover;
            $this->wrapper->poptitle = $this->poptitle;
            $this->wrapper->popcontent = $this->popcontent;
            $this->wrapper->popside = $this->popside;
            $this->wrapper->popcondition = $this->popcondition;
        }

        if ($this->height) {
            $this->wrapper->setHeight($this->height);
        }

        if ($this->class) {
            $this->wrapper->{'class'} = $this->class;
        }

        if ($this->datatable) {
            $this->wrapper->datatable = $this->datatable;
        }

        if ($this->groupColumn) {
            $this->wrapper->setGroupColumn($this->groupColumn, $this->groupMask, $this->groupTransformer);
        }

        if (!empty($this->footer)) {
            $cardFooter = new TElement('div');
            $cardFooter->{'class'} = 'card-footer';

            foreach ($this->footer as $footerComponent) {
                $cardFooter->add($footerComponent->render());
            }

            $card->add($cardFooter);
        }

        return $card->show();
    }

    public function noDataDisplay($title, $description, $content = [], $illustration = null)
    {
        $this->noDataDisplayContent = [
            'title' => $title,
            'description' => $description,
            'content' => $content,
            'illustration' => $illustration
        ];
        return $this;
    }

    public function switchDisplay($template, $cardclass = '',$data= null)
    {
        $this->switchDisplayTemplate = $template;
        $this->switchDisplayCardClass = $cardclass;
        $this->switchDisplayData = $data;
        $this->addSwitchDisplayActions();
        return $this;
    }

    private function addSwitchDisplayActions()
    {
        // Re-evaluate display mode for real-time check
        $this->displayMode = TSession::getValue(get_class($this->instance).'_display_mode' ) ?? 'grid';

        $this->toolbar[] = KGridToolbar::make()
            ->schema([
                KAction::make('')
                    ->class("btn btn-sm btn-icon btn-light btn-color-muted btn-active-primary me-3" . ($this->displayMode === 'template' ? ' show' : ''))
                    ->image(KIcon::make("element-plus")->class("fs-2"))
                    ->action([$this->instance, 'switchToTemplateMode']),
                KAction::make('')
                    ->class("btn btn-sm btn-icon btn-light btn-color-muted btn-active-primary me-3" . ($this->displayMode === 'grid' ? ' show' : ''))
                    ->image(KIcon::make("row-horizontal")->class("fs-2"))
                    ->action([$this->instance, 'switchToGridMode']),
            ]);
    }

    public function switchToTemplateMode()
    {
        $this->displayMode = 'template';
        TSession::setValue(get_class($this->instance).'_display_mode', 'template');
    }

    public function switchToGridMode()
    {
        $this->displayMode = 'grid';
        TSession::setValue(get_class($this->instance).'_display_mode', 'grid');
    }

    /**
     * @throws \Twig\Error\SyntaxError
     * @throws \Twig\Error\LoaderError
     */
    private function renderSwitchDisplay($cardBody)
    {
        $row = new TElement('div');
        $row->{'class'} = 'row g-6 g-xl-9';

        foreach ($this->datagrid->getItems() as $item) {
            $html = $this->switchDisplayTemplate;
            $data = $this->switchDisplayData;

            $html = str_replace('%7B', '{', $html);
            $html = str_replace('%7D', '}', $html);

            //render first active records
            foreach ($item as $key => $value) {
                $html = str_replace('{' . $key . '}', $value ?? '', $html);
            }

            $this->latte->setLoader(new StringLoader());
            $this->latte->addExtension(new Latte\Essential\RawPhpExtension);

            $html = str_replace(['[', ']'], ['{', '}'], $html);
            $parameter = array_merge($item->toArray(), $data ?? [] );
            $htmlWithTemplate = $this->latte->renderToString( $html , $parameter );

            $row->add($htmlWithTemplate);
        }
        $cardBody->add($row);
    }

    public function style(string $style)
    {
        $this->style = $style;
        return $this;
    }

    public function datatable(string $datatable)
    {
        $this->datatable = $datatable;
        return $this;
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

    public function disableDefaultClick()
    {
        $this->datagrid->disableDefaultClick();
        return $this;
    }
}
?>
