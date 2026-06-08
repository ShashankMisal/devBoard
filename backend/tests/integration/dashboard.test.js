const request = require('supertest');

const app = require('../../src/app');
const Project = require('../../src/modules/projects/project.model');
const Task = require('../../src/modules/tasks/task.model');
const User = require('../../src/modules/users/user.model');

const buildAuthHeader = (user) => {
  return { Authorization: `Bearer ${user.generateAccessToken()}` };
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

describe('Dashboard integration', () => {
  it('rejects unauthenticated dashboard summary requests', async () => {
    const response = await request(app).get('/api/v1/dashboard/summary');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Access token is required.');
  });

  it('returns project and assigned-task summary for the authenticated user only', async () => {
    const owner = await User.create({
      name: 'Dashboard Owner',
      email: 'dashboard-owner@example.com',
      password: 'Password1@'
    });
    const member = await User.create({
      name: 'Dashboard Member',
      email: 'dashboard-member@example.com',
      password: 'Password1@'
    });
    const outsider = await User.create({
      name: 'Dashboard Outsider',
      email: 'dashboard-outsider@example.com',
      password: 'Password1@'
    });

    const ownedProject = await Project.create({
      title: 'Owned Active',
      owner: owner._id,
      members: [member._id]
    });
    const archivedProject = await Project.create({
      title: 'Owned Archived',
      owner: owner._id,
      status: 'archived'
    });
    const memberProject = await Project.create({
      title: 'Shared Active',
      owner: member._id,
      members: [owner._id]
    });
    const outsiderProject = await Project.create({
      title: 'Outsider Private',
      owner: outsider._id
    });

    const upcomingTask = await Task.create({
      title: 'Upcoming assigned task',
      project: ownedProject._id,
      createdBy: owner._id,
      assignee: owner._id,
      status: 'todo',
      dueDate: daysFromNow(1)
    });
    await Task.create({
      title: 'Shared project assigned task',
      project: memberProject._id,
      createdBy: member._id,
      assignee: owner._id,
      status: 'in-progress',
      dueDate: daysFromNow(2)
    });
    await Task.create({
      title: 'Completed assigned task',
      project: archivedProject._id,
      createdBy: owner._id,
      assignee: owner._id,
      status: 'done',
      dueDate: daysFromNow(-1)
    });
    await Task.create({
      title: 'Assigned to somebody else',
      project: ownedProject._id,
      createdBy: owner._id,
      assignee: member._id,
      status: 'todo',
      dueDate: daysFromNow(3)
    });
    await Task.create({
      title: 'Inaccessible assigned task',
      project: outsiderProject._id,
      createdBy: outsider._id,
      assignee: owner._id,
      status: 'todo',
      dueDate: daysFromNow(4)
    });

    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set(buildAuthHeader(owner));

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.projectCounts).toEqual({
      total: 3,
      active: 2,
      archived: 1
    });
    expect(response.body.data.taskCounts).toEqual({
      assigned: 3,
      todo: 1,
      inProgress: 1,
      done: 1
    });
    expect(response.body.data.recentProjects).toHaveLength(3);
    expect(response.body.data.recentProjects.map((project) => project._id)).not.toContain(outsiderProject._id.toString());
    expect(response.body.data.upcomingAssignedTasks.map((task) => task._id)).toContain(upcomingTask._id.toString());
    expect(response.body.data.upcomingAssignedTasks.map((task) => task.title)).not.toContain('Inaccessible assigned task');
    expect(response.body.data.upcomingAssignedTasks.map((task) => task.title)).not.toContain('Completed assigned task');
  });
});
