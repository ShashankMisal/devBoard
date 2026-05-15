jest.mock('../../src/utils/pagination', () => jest.fn());
jest.mock('../../src/modules/users/user.model', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/modules/tasks/task.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));
jest.mock('../../src/modules/projects/project.service', () => ({
  getAccessibleProjectById: jest.fn(),
  ensureProjectIsWritable: jest.fn()
}));

const mongoose = require('mongoose');

const paginate = require('../../src/utils/pagination');
const ApiError = require('../../src/utils/ApiError');
const User = require('../../src/modules/users/user.model');
const Task = require('../../src/modules/tasks/task.model');
const projectService = require('../../src/modules/projects/project.service');
const taskService = require('../../src/modules/tasks/task.service');

const buildProject = () => {
  const ownerId = new mongoose.Types.ObjectId();
  const memberId = new mongoose.Types.ObjectId();

  return {
    _id: new mongoose.Types.ObjectId(),
    owner: { _id: ownerId },
    members: [{ _id: memberId }]
  };
};

describe('task.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProjectTask', () => {
    it('creates a task when the caller has project access and the assignee is valid', async () => {
      const project = buildProject();
      const assigneeId = project.members[0]._id.toString();
      const createdTaskId = new mongoose.Types.ObjectId();
      const hydratedTask = { _id: createdTaskId, title: 'Build test suite' };
      const populate = jest.fn().mockResolvedValue(hydratedTask);

      projectService.getAccessibleProjectById.mockResolvedValue(project);
      projectService.ensureProjectIsWritable.mockImplementation(() => {});
      User.findOne.mockResolvedValue({
        _id: project.members[0]._id,
        isActive: true
      });
      Task.create.mockResolvedValue({ _id: createdTaskId });
      Task.findById.mockReturnValue({ populate });

      const result = await taskService.createProjectTask(
        project._id.toString(),
        project.owner._id.toString(),
        {
          title: 'Build test suite',
          priority: 'high',
          assignee: assigneeId
        }
      );

      expect(Task.create).toHaveBeenCalledWith({
        title: 'Build test suite',
        description: '',
        project: project._id,
        assignee: assigneeId,
        createdBy: project.owner._id.toString(),
        status: 'todo',
        priority: 'high',
        dueDate: null
      });
      expect(result).toBe(hydratedTask);
    });

    it('throws when the caller is not allowed to access the project', async () => {
      projectService.getAccessibleProjectById.mockRejectedValue(
        ApiError.forbidden('You do not have access to this project.')
      );

      await expect(
        taskService.createProjectTask(
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString(),
          { title: 'Hidden task' }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You do not have access to this project.'
      });
    });
  });

  describe('getTasksByProject', () => {
    it('returns paginated tasks for accessible projects and forwards the filter to the query', async () => {
      const project = buildProject();
      const query = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      };
      const paginatedResult = {
        data: [{ _id: new mongoose.Types.ObjectId(), status: 'done' }],
        totalDocs: 1,
        totalPages: 1,
        currentPage: 2,
        hasNextPage: false,
        hasPrevPage: true
      };

      projectService.getAccessibleProjectById.mockResolvedValue(project);
      Task.find.mockReturnValue(query);
      paginate.mockResolvedValue(paginatedResult);

      const result = await taskService.getTasksByProject(
        project._id.toString(),
        project.owner._id.toString(),
        {
          status: 'done',
          page: '2',
          limit: '5'
        }
      );

      expect(Task.find).toHaveBeenCalledWith({
        project: project._id,
        status: 'done'
      });
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(paginate).toHaveBeenCalledWith(query, '2', '5');
      expect(result).toBe(paginatedResult);
    });
  });
});
