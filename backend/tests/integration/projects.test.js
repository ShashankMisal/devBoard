const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../src/app');
const Project = require('../../src/modules/projects/project.model');
const Task = require('../../src/modules/tasks/task.model');
const User = require('../../src/modules/users/user.model');

const buildAuthHeader = (user) => {
  return { Authorization: `Bearer ${user.generateAccessToken()}` };
};

describe('Project integration', () => {
  it('creates a project for authenticated users and rejects unauthenticated requests', async () => {
    const owner = await User.create({
      name: 'Owner User',
      email: 'owner-create@example.com',
      password: 'Password1@'
    });

    const unauthorizedResponse = await request(app)
      .post('/api/v1/projects')
      .send({ title: 'Unauthorized project' });

    expect(unauthorizedResponse.statusCode).toBe(401);
    expect(unauthorizedResponse.body.message).toBe('Access token is required.');

    const response = await request(app)
      .post('/api/v1/projects')
      .set(buildAuthHeader(owner))
      .send({
        title: 'Backend Board',
        description: 'Project created through integration tests'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Backend Board');
    expect(response.body.data.owner.email).toBe('owner-create@example.com');
  });

  it('lists only projects visible to the authenticated user with pagination metadata', async () => {
    const owner = await User.create({
      name: 'Owner User',
      email: 'owner-list@example.com',
      password: 'Password1@'
    });
    const member = await User.create({
      name: 'Member User',
      email: 'member-list@example.com',
      password: 'Password1@'
    });
    const outsider = await User.create({
      name: 'Outsider User',
      email: 'outsider-list@example.com',
      password: 'Password1@'
    });

    const ownedProject = await Project.create({
      title: 'Owned Project',
      owner: owner._id
    });
    const memberProject = await Project.create({
      title: 'Shared Project',
      owner: outsider._id,
      members: [member._id]
    });
    await Project.create({
      title: 'Private Outsider Project',
      owner: outsider._id
    });

    const ownerResponse = await request(app)
      .get('/api/v1/projects?page=1&limit=10')
      .set(buildAuthHeader(owner));

    expect(ownerResponse.statusCode).toBe(200);
    expect(ownerResponse.body.data.currentPage).toBe(1);
    expect(ownerResponse.body.data.totalDocs).toBe(1);
    expect(ownerResponse.body.data.data[0]._id).toBe(ownedProject._id.toString());

    const memberResponse = await request(app)
      .get('/api/v1/projects?page=1&limit=10')
      .set(buildAuthHeader(member));

    expect(memberResponse.statusCode).toBe(200);
    expect(memberResponse.body.data.totalDocs).toBe(1);
    expect(memberResponse.body.data.data[0]._id).toBe(memberProject._id.toString());
  });

  it('allows owners to update projects and rejects members and missing projects', async () => {
    const owner = await User.create({
      name: 'Owner Update',
      email: 'owner-update@example.com',
      password: 'Password1@'
    });
    const member = await User.create({
      name: 'Member Update',
      email: 'member-update@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Editable Project',
      owner: owner._id,
      members: [member._id]
    });

    const ownerResponse = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set(buildAuthHeader(owner))
      .send({ title: 'Renamed Project' });

    expect(ownerResponse.statusCode).toBe(200);
    expect(ownerResponse.body.data.title).toBe('Renamed Project');

    const memberResponse = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set(buildAuthHeader(member))
      .send({ title: 'Member Rename Attempt' });

    expect(memberResponse.statusCode).toBe(403);
    expect(memberResponse.body.message).toBe('Only the project owner can perform this action.');

    const missingResponse = await request(app)
      .put(`/api/v1/projects/${new mongoose.Types.ObjectId()}`)
      .set(buildAuthHeader(owner))
      .send({ title: 'Missing Project' });

    expect(missingResponse.statusCode).toBe(403);
    expect(missingResponse.body.message).toBe('Only the project owner can perform this action.');
  });

  it('deletes projects for owners, cascades tasks, and blocks non-owners', async () => {
    const owner = await User.create({
      name: 'Owner Delete',
      email: 'owner-delete@example.com',
      password: 'Password1@'
    });
    const member = await User.create({
      name: 'Member Delete',
      email: 'member-delete@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Project To Delete',
      owner: owner._id,
      members: [member._id]
    });

    await Task.create({
      title: 'Task To Cascade',
      project: project._id,
      createdBy: owner._id,
      assignee: member._id
    });

    const forbiddenResponse = await request(app)
      .delete(`/api/v1/projects/${project._id}`)
      .set(buildAuthHeader(member));

    expect(forbiddenResponse.statusCode).toBe(403);
    expect(await Task.countDocuments({ project: project._id })).toBe(1);

    const ownerResponse = await request(app)
      .delete(`/api/v1/projects/${project._id}`)
      .set(buildAuthHeader(owner));

    expect(ownerResponse.statusCode).toBe(200);
    expect(await Project.countDocuments({ _id: project._id })).toBe(0);
    expect(await Task.countDocuments({ project: project._id })).toBe(0);
  });

  it('adds members, rejects unknown users, and rejects duplicate membership', async () => {
    const owner = await User.create({
      name: 'Owner Member',
      email: 'owner-member@example.com',
      password: 'Password1@'
    });
    await User.create({
      name: 'New Member',
      email: 'new-member@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Member Project',
      owner: owner._id
    });

    const successResponse = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(buildAuthHeader(owner))
      .send({ email: 'new-member@example.com' });

    expect(successResponse.statusCode).toBe(200);
    expect(successResponse.body.data.members).toHaveLength(1);
    expect(successResponse.body.data.members[0].email).toBe('new-member@example.com');

    const duplicateResponse = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(buildAuthHeader(owner))
      .send({ email: 'new-member@example.com' });

    expect(duplicateResponse.statusCode).toBe(400);
    expect(duplicateResponse.body.message).toBe('This user is already a project member.');

    const missingUserResponse = await request(app)
      .post(`/api/v1/projects/${project._id}/members`)
      .set(buildAuthHeader(owner))
      .send({ email: 'missing-member@example.com' });

    expect(missingUserResponse.statusCode).toBe(404);
    expect(missingUserResponse.body.message).toBe('Member user was not found.');
  });

  it('returns project task board columns for accessible projects', async () => {
    const owner = await User.create({
      name: 'Board Owner',
      email: 'board-owner@example.com',
      password: 'Password1@'
    });
    const member = await User.create({
      name: 'Board Member',
      email: 'board-member@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Kanban Project',
      owner: owner._id,
      members: [member._id]
    });

    await Task.create([
      {
        title: 'Todo task',
        project: project._id,
        createdBy: owner._id,
        assignee: member._id,
        status: 'todo',
        priority: 'medium'
      },
      {
        title: 'In progress task',
        project: project._id,
        createdBy: owner._id,
        assignee: member._id,
        status: 'in-progress',
        priority: 'high'
      },
      {
        title: 'Done task',
        project: project._id,
        createdBy: owner._id,
        status: 'done',
        priority: 'low'
      }
    ]);

    const response = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/board?sortBy=priority`)
      .set(buildAuthHeader(member));

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Task board fetched successfully.');
    expect(response.body.data.totalDocs).toBe(3);
    expect(response.body.data.columns.map((column) => column.status)).toEqual(['todo', 'in-progress', 'done']);
    expect(response.body.data.columns.map((column) => column.count)).toEqual([1, 1, 1]);
    expect(response.body.data.columns[0].tasks[0].title).toBe('Todo task');
    expect(response.body.data.columns[0].tasks[0].assignee.email).toBe('board-member@example.com');
  });

  it('rejects project task board access for outsiders', async () => {
    const owner = await User.create({
      name: 'Private Board Owner',
      email: 'private-board-owner@example.com',
      password: 'Password1@'
    });
    const outsider = await User.create({
      name: 'Private Board Outsider',
      email: 'private-board-outsider@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Private Kanban Project',
      owner: owner._id
    });

    const response = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/board`)
      .set(buildAuthHeader(outsider));

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('You do not have access to this project.');
  });

  it('allows archived project boards to be read but rejects task moves', async () => {
    const owner = await User.create({
      name: 'Archived Board Owner',
      email: 'archived-board-owner@example.com',
      password: 'Password1@'
    });
    const project = await Project.create({
      title: 'Archived Kanban Project',
      owner: owner._id,
      status: 'archived'
    });
    const task = await Task.create({
      title: 'Archived move task',
      project: project._id,
      createdBy: owner._id,
      status: 'todo',
      priority: 'medium'
    });

    const boardResponse = await request(app)
      .get(`/api/v1/projects/${project._id}/tasks/board`)
      .set(buildAuthHeader(owner));

    expect(boardResponse.statusCode).toBe(200);
    expect(boardResponse.body.data.totalDocs).toBe(1);

    const moveResponse = await request(app)
      .put(`/api/v1/tasks/${task._id}`)
      .set(buildAuthHeader(owner))
      .send({ status: 'done' });

    expect(moveResponse.statusCode).toBe(403);
    expect(moveResponse.body.message).toBe('Archived projects are read-only. Cannot update tasks.');
  });
});
