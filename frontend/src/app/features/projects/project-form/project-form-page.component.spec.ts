import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { Project } from '../models/project.models';
import { ProjectsStateService } from '../services/projects-state.service';
import { ProjectFormPageComponent } from './project-form-page.component';

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  members: [],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('ProjectFormPageComponent', () => {
  let fixture: ComponentFixture<ProjectFormPageComponent>;
  let state: {
    selectedProject: ReturnType<typeof signal<Project | null>>;
    detailError: ReturnType<typeof signal<string>>;
    isDetailLoading: ReturnType<typeof signal<boolean>>;
    clearSelectedProject: jasmine.Spy;
    loadProject: jasmine.Spy;
    createProject: jasmine.Spy;
    updateProject: jasmine.Spy;
    canEdit: jasmine.Spy;
    isReadOnly: jasmine.Spy;
  };

  function createRouter(): jasmine.SpyObj<Router> {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate', 'createUrlTree', 'serializeUrl'], { events: of() });
    router.createUrlTree.and.returnValue({} as ReturnType<Router['createUrlTree']>);
    router.serializeUrl.and.returnValue('/');

    return router;
  }

  beforeEach(async () => {
    state = {
      selectedProject: signal<Project | null>(null),
      detailError: signal(''),
      isDetailLoading: signal(false),
      clearSelectedProject: jasmine.createSpy('clearSelectedProject'),
      loadProject: jasmine.createSpy('loadProject'),
      createProject: jasmine.createSpy('createProject').and.returnValue(of(project)),
      updateProject: jasmine.createSpy('updateProject').and.returnValue(of(project)),
      canEdit: jasmine.createSpy('canEdit').and.returnValue(true),
      isReadOnly: jasmine.createSpy('isReadOnly').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectFormPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProjectsStateService, useValue: state },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: createRouter() },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormPageComponent);
    fixture.detectChanges();
  });

  it('validates backend-aligned title and description limits', () => {
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('A');
    component.form.controls.description.setValue('x'.repeat(1001));
    component.submit();

    expect(component.getError('title')).toBe('Use at least 2 characters.');
    expect(component.getError('description')).toBe('Use no more than 1000 characters.');
    expect(state.createProject).not.toHaveBeenCalled();
  });

  it('creates a project through the state service', () => {
    const component = fixture.componentInstance;

    component.form.setValue({ title: 'Frontend Platform', description: 'Angular workspace' });
    component.submit();

    expect(state.createProject).toHaveBeenCalledWith({ title: 'Frontend Platform', description: 'Angular workspace' });
  });
});
