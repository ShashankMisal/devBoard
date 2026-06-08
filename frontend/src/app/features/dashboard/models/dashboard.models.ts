import { Project } from '../../projects/models/project.models';
import { Task } from '../../tasks/models/task.models';

export interface DashboardProjectCounts {
  total: number;
  active: number;
  archived: number;
}

export interface DashboardTaskCounts {
  assigned: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface DashboardSummary {
  projectCounts: DashboardProjectCounts;
  taskCounts: DashboardTaskCounts;
  recentProjects: Project[];
  upcomingAssignedTasks: Task[];
}
