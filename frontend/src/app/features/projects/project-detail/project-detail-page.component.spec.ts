import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { Project } from '../models/project.models';
import { ProjectsStateService } from '../services/projects-state.service';
import { AddProjectMemberDialogComponent, ProjectDetailPageComponent } from './project-detail-page.component';

const project: Project = {
  _id: 'project-1',
  title: 'Frontend Platform',
  description: 'Angular workspace',
  owner: { _id: 'owner-1', name: 'Owner User', email: 'owner@example.com', role: 'user' },
  members: [{ _id: 'member-1', name: 'Member User', email: 'member@example.com', role: 'user' }],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('ProjectDetailPageComponent', () => {
  it('hides owner-only actions for non-owners and archived projects', async () => {
    const state = {
      selectedProject: signal<Project | null>({ ...project, status: 'archived' }),
      detailError: signal(''),
      isDetailLoading: signal(false),
      loadProject: jasmine.createSpy('loadProject'),
      canEdit: jasmine.createSpy('canEdit').and.returnValue(false),
      canArchive: jasmine.createSpy('canArchive').and.returnValue(false),
      canUnarchive: jasmine.createSpy('canUnarchive').and.returnValue(false),
      canManageMembers: jasmine.createSpy('canManageMembers').and.returnValue(false),
      isOwner: jasmine.createSpy('isOwner').and.returnValue(false),
      isReadOnly: jasmine.createSpy('isReadOnly').and.returnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProjectsStateService, useValue: state },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: project._id })) } },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']) },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<ProjectDetailPageComponent> = TestBed.createComponent(ProjectDetailPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const actions = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('button, a')).map((element) =>
      String(element.textContent).trim(),
    );

    expect(text).toContain('Read-only');
    expect(text).toContain('Archived');
    expect(actions).not.toContain('Edit');
    expect(text).not.toContain('Add member');
    expect(actions).not.toContain('Archive');
  });
});

describe('AddProjectMemberDialogComponent', () => {
  let state: {
    selectedProject: ReturnType<typeof signal<Project | null>>;
    canManageMembers: jasmine.Spy;
    addMember: jasmine.Spy;
  };
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddProjectMemberDialogComponent, Project>>;
  let fixture: ComponentFixture<AddProjectMemberDialogComponent>;

  beforeEach(async () => {
    state = {
      selectedProject: signal<Project | null>(project),
      canManageMembers: jasmine.createSpy('canManageMembers').and.returnValue(true),
      addMember: jasmine.createSpy('addMember').and.returnValue(of(project)),
    };
    dialogRef = jasmine.createSpyObj<MatDialogRef<AddProjectMemberDialogComponent, Project>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddProjectMemberDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProjectsStateService, useValue: state },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProjectMemberDialogComponent);
    fixture.detectChanges();
  });

  it('requires a valid member email', () => {
    const component = fixture.componentInstance;

    component.form.controls.email.setValue('not-email');
    component.submit();

    expect(component.getError('email')).toBe('Enter a valid email address.');
    expect(state.addMember).not.toHaveBeenCalled();
  });

  it('adds a member through project state and closes the dialog', () => {
    const component = fixture.componentInstance;

    component.form.controls.email.setValue('member@example.com');
    component.submit();

    expect(state.addMember).toHaveBeenCalledWith(project._id, { email: 'member@example.com' });
    expect(dialogRef.close).toHaveBeenCalledWith(project);
  });
});
