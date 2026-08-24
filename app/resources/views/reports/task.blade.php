<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            font-size: 13px; 
            color: #374151; 
            margin: 0;
            padding: 0;
        }
        .header { 
            border-bottom: 2px solid #6366f1; 
            padding-bottom: 15px; 
            margin-bottom: 30px; 
        }
        .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #111827; 
            text-transform: uppercase;
        }
        .report-title { 
            font-size: 16px; 
            margin-top: 5px; 
            color: #6b7280;
        }
        .task-card { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 30px; 
            page-break-inside: avoid; 
        }
        .task-title { 
            font-size: 20px; 
            font-weight: 700; 
            color: #111827; 
            margin-bottom: 15px; 
        }
        table.meta-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
        }
        .meta-table th, .meta-table td { 
            padding: 8px; 
            text-align: left; 
            vertical-align: top; 
        }
        .meta-table th { 
            width: 20%; 
            color: #6b7280; 
            font-weight: 500; 
        }
        .meta-table td { 
            width: 30%; 
            font-weight: 600; 
            color: #111827; 
        }
        .badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            display: inline-block;
            margin-right: 5px;
        }
        .stage-badge {
            background: #dcfce7;
            color: #166534;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: bold;
        }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-normal { color: #2563eb; font-weight: bold; }
        .description-box {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
        .description-title {
            font-weight: 700;
            color: #374151;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .footer { 
            position: fixed; 
            bottom: 0; 
            width: 100%; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 10px; 
            text-align: center; 
            font-size: 10px; 
            color: #9ca3af; 
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $company->name ?? 'AdvSoft ERP' }}</div>
        <div class="report-title">PROJECT MANAGEMENT — TASK STATUS REPORT</div>
    </div>

    @foreach($records as $task)
        <div class="task-card">
            <div class="task-title">{{ $task->name }}</div>
            
            <table class="meta-table">
                <tbody>
                    <tr>
                        <th>Project</th>
                        <td>{{ $task->project ? $task->project->name : 'N/A' }}</td>
                        <th>Stage</th>
                        <td>
                            <span class="stage-badge">
                                {{ $task->stage ? $task->stage->name : 'New' }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th>Assigned To</th>
                        <td>{{ $task->user ? $task->user->name : 'Unassigned' }}</td>
                        <th>Deadline</th>
                        <td>{{ $task->date_deadline ? \Carbon\Carbon::parse($task->date_deadline)->format('d M Y') : 'No Deadline' }}</td>
                    </tr>
                    <tr>
                        <th>Priority</th>
                        <td>
                            @if($task->priority == 1)
                                <span class="priority-high">★ High</span>
                            @else
                                <span class="priority-normal">☆ Normal</span>
                            @endif
                        </td>
                        <th>Tags</th>
                        <td>
                            @if($task->tags && $task->tags->count() > 0)
                                @foreach($task->tags as $tag)
                                    <span class="badge">{{ $tag->name }}</span>
                                @endforeach
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>

            @if($task->description)
                <div class="description-box">
                    <div class="description-title">Task Description</div>
                    <div>{!! $task->description !!}</div>
                </div>
            @endif
        </div>
    @endforeach

    <div class="footer">
        Generated on {{ now()->format('d M Y H:i:s') }} by AdvSoft ERP
    </div>
</body>
</html>
