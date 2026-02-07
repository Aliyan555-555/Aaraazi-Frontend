/**
 * TaskCalendarView Component
 * 
 * Calendar view for tasks showing:
 * - Monthly calendar
 * - Tasks grouped by date
 * - Color-coded by priority
 * - Quick task creation
 */

import React, { useState, useMemo } from 'react';
import { TaskV4, TaskPriority } from '../../types/tasks';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';

interface TaskCalendarViewProps {
  tasks: TaskV4[];
  onViewTask: (taskId: string) => void;
  onDateClick: (date: Date) => void;
}

/**
 * Get priority color
 */
function getPriorityDotColor(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-[#C17052]';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-gray-400';
  }
}

/**
 * TaskCalendarView Component
 */
export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onViewTask,
  onDateClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);
  
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskV4[]> = {};
    
    tasks.forEach(task => {
      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  }, [tasks]);
  
  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const handleToday = () => {
    setCurrentMonth(new Date());
  };
  
  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1A1D1F]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-3 text-center font-medium text-[#363F47] text-sm"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-[#C17052] text-white rounded-full h-6 w-6 flex items-center justify-center'
                      : 'text-[#363F47]'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                
                {dayTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayTasks.length}
                  </Badge>
                )}
              </div>
              
              {/* Tasks */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs p-1.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTask(task.id);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityDotColor(task.priority)}`} />
                      <span className="truncate text-[#1A1D1F] font-medium">
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))}
                
                {dayTasks.length > 3 && (
                  <div className="text-xs text-[#6B7280] text-center p-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center gap-6">
        <span className="text-sm text-[#6B7280]">Priority:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-[#363F47]">Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#C17052]" />
            <span className="text-sm text-[#363F47]">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-sm text-[#363F47]">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <span className="text-sm text-[#363F47]">Low</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
