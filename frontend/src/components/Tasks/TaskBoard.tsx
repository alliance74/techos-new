'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

interface TaskBoardProps {
  projectId?: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const { data: tasks } = useTasks(projectId);
  const updateTask = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo');

  const columns = [
    { id: 'todo' as const, title: 'To Do', color: 'border-border' },
    { id: 'in_progress' as const, title: 'In Progress', color: 'border-blue-500' },
    { id: 'done' as const, title: 'Done', color: 'border-green-500' },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    const task = tasks?.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status: newStatus },
      });
    }
  };

  const handleCreateTask = (status: Task['status']) => {
    setNewTaskStatus(status);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className={`border-t-4 ${column.color} bg-white p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">
                  {column.title}
                  <span className="ml-2 text-sm text-ink-muted">
                    ({getTasksByStatus(column.id).length})
                  </span>
                </h3>
                <button
                  onClick={() => handleCreateTask(column.id)}
                  className="text-ink-muted hover:text-ink"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 space-y-3 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                >
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask || undefined}
        defaultStatus={newTaskStatus}
        projectId={projectId}
      />
    </>
  );
}
