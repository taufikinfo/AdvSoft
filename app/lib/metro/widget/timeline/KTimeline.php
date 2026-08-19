<?php
use Adianti\Widget\Base\TElement;

class KTimeline
{
    private $items;

    public static function make()
    {
        return new self();
    }

    public function schema(array $items)
    {
        $this->items = $items;
        return $this;
    }

    public function render()
    {
        $timeline = new TElement('div');
        $timeline->{'class'} = 'timeline timeline-border-dashed';

        foreach ($this->items as $item) {
            $timeline->add($this->generateTimelineItem($item));
        }

        return $timeline;
    }

    private function generateTimelineItem($item)
    {
        $timelineItem = new TElement('div');
        $timelineItem->{'class'} = 'timeline-item';

        $timelineLine = new TElement('div');
        $timelineLine->{'class'} = 'timeline-line';
        $timelineItem->add($timelineLine);

        $timelineIcon = new TElement('div');
        $timelineIcon->{'class'} = 'timeline-icon';
        $icon = new TElement('i');
        $icon->{'class'} = "ki-duotone {$item->icon} fs-2 text-gray-500";
        $icon->add("<span class='path1'></span><span class='path2'></span><span class='path3'></span>");
        $timelineIcon->add($icon);
        $timelineItem->add($timelineIcon);

        $timelineContent = new TElement('div');
        $timelineContent->{'class'} = 'timeline-content mb-10 mt-n1';

        $timelineHeading = new TElement('div');
        $timelineHeading->{'class'} = 'pe-3 mb-5';

        $title = new TElement('div');
        $title->{'class'} = 'fs-5 fw-semibold mb-2';
        $title->add($item->title);
        $timelineHeading->add($title);

        $descriptionWrapper = new TElement('div');
        $descriptionWrapper->{'class'} = 'd-flex align-items-center mt-1 fs-6';

        $description = new TElement('div');
        $description->{'class'} = 'text-muted me-2 fs-7';
        $description->add($item->description);
        $descriptionWrapper->add($description);

        $user = new TElement('div');
        $user->{'class'} = 'symbol symbol-circle symbol-25px';
        $user->{'data-bs-toggle'} = 'tooltip';
        $user->{'data-bs-boundary'} = 'window';
        $user->{'data-bs-placement'} = 'top';
        $user->{'aria-label'} = $item->user->name;
        $user->{'data-bs-original-title'} = $item->user->name;

        $img = new TElement('img');
        $img->{'src'} = $item->user->avatar;
        $img->{'alt'} = 'img';
        $user->add($img);

        $descriptionWrapper->add($user);
        $timelineHeading->add($descriptionWrapper);
        $timelineContent->add($timelineHeading);

        if (isset($item->details)) {
            $detailsWrapper = new TElement('div');
            $detailsWrapper->{'class'} = 'overflow-auto pb-5';

            foreach ($item->details as $detail) {
                $detailDiv = new TElement('div');
                $detailDiv->{'class'} = 'd-flex align-items-center border border-dashed border-gray-300 rounded min-w-750px px-7 py-3 mb-5';

                $detailTitle = new TElement('a');
                $detailTitle->{'href'} = $detail->link;
                $detailTitle->{'class'} = 'fs-5 text-gray-900 text-hover-primary fw-semibold w-375px min-w-200px';
                $detailTitle->add($detail->title);
                $detailDiv->add($detailTitle);

                $labelDiv = new TElement('div');
                $labelDiv->{'class'} = 'min-w-175px pe-2';
                $label = new TElement('span');
                $label->{'class'} = 'badge badge-light text-muted';
                $label->add($detail->label);
                $labelDiv->add($label);
                $detailDiv->add($labelDiv);

                $avatarsDiv = new TElement('div');
                $avatarsDiv->{'class'} = 'symbol-group symbol-hover flex-nowrap flex-grow-1 min-w-100px pe-2';
                if (isset($detail->avatars)) {
                    foreach ($detail->avatars as $avatar) {
                        $avatarDiv = new TElement('div');
                        $avatarDiv->{'class'} = 'symbol symbol-circle symbol-25px';
                        $avatarImg = new TElement('img');
                        $avatarImg->{'src'} = $avatar;
                        $avatarImg->{'alt'} = 'img';
                        $avatarDiv->add($avatarImg);
                        $avatarsDiv->add($avatarDiv);
                    }
                }
                $detailDiv->add($avatarsDiv);

                $progressDiv = new TElement('div');
                $progressDiv->{'class'} = 'min-w-125px pe-2';
                if (isset($detail->progress)) {
                    $progress = new TElement('span');
                    $progress->{'class'} = 'badge badge-light-primary';
                    $progress->add($detail->progress);
                    $progressDiv->add($progress);
                }
                $detailDiv->add($progressDiv);

                $action = new TElement('a');
                $action->{'href'} = $detail->link;
                $action->{'class'} = 'btn btn-sm btn-light btn-active-light-primary';
                $action->add('View');
                $detailDiv->add($action);

                $detailsWrapper->add($detailDiv);
            }
            $timelineContent->add($detailsWrapper);
        }

        $timelineItem->add($timelineContent);
        return $timelineItem;
    }
}