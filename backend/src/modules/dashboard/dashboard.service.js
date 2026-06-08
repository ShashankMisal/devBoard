const Project = require('../projects/project.model');
const Task = require('../tasks/task.model');

const PROJECT_POPULATE = [
  { path: 'owner', select: 'name email role' },
  { path: 'members', select: 'name email role' }
];

const TASK_POPULATE = [
  { path: 'project', select: 'title status owner members' },
  { path: 'assignee', select: 'name email role' },
  { path: 'createdBy', select: 'name email role' }
];

const buildAccessFilter = (userId) => ({
  $or: [{ owner: userId }, { members: userId }]
});

const getProjectCounts = async (userId) => {
  const rows = await Project.aggregate([
    { $match: buildAccessFilter(userId) },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  const counts = rows.reduce(
    (accumulator, row) => ({
      ...accumulator,
      [row._id]: row.count
    }),
    { active: 0, archived: 0 }
  );

  return {
    total: counts.active + counts.archived,
    active: counts.active,
    archived: counts.archived
  };
};

const getTaskCounts = async (userId, accessibleProjectIds) => {
  if (accessibleProjectIds.length === 0) {
    return {
      assigned: 0,
      todo: 0,
      inProgress: 0,
      done: 0
    };
  }

  const rows = await Task.aggregate([
    {
      $match: {
        project: { $in: accessibleProjectIds },
        assignee: userId
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  const counts = rows.reduce(
    (accumulator, row) => ({
      ...accumulator,
      [row._id]: row.count
    }),
    { todo: 0, 'in-progress': 0, done: 0 }
  );

  return {
    assigned: counts.todo + counts['in-progress'] + counts.done,
    todo: counts.todo,
    inProgress: counts['in-progress'],
    done: counts.done
  };
};

const getSummary = async (userId) => {
  const accessibleProjects = await Project.find(buildAccessFilter(userId)).select('_id').lean();
  const accessibleProjectIds = accessibleProjects.map((project) => project._id);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const [projectCounts, taskCounts, recentProjects, upcomingAssignedTasks] = await Promise.all([
    getProjectCounts(userId),
    getTaskCounts(userId, accessibleProjectIds),
    Project.find(buildAccessFilter(userId)).populate(PROJECT_POPULATE).sort({ updatedAt: -1 }).limit(5),
    accessibleProjectIds.length === 0
      ? []
      : Task.find({
        project: { $in: accessibleProjectIds },
        assignee: userId,
        dueDate: { $gte: today }
      })
        .populate(TASK_POPULATE)
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(5)
  ]);

  return {
    projectCounts,
    taskCounts,
    recentProjects,
    upcomingAssignedTasks
  };
};

module.exports = {
  getSummary
};
