import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { User } from '../../core/auth/auth.models';
import { SessionService } from '../../core/auth/session.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfilePageComponent } from './profile-page.component';

const user: User = {
  _id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let component: ProfilePageComponent;
  let session: jasmine.SpyObj<Pick<SessionService, 'updateProfile' | 'deactivateAccount'>> & {
    user: ReturnType<typeof signal<User | null>>;
  };
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    session = jasmine.createSpyObj('SessionService', ['updateProfile', 'deactivateAccount'], {
      user: signal<User | null>(user),
    });
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SessionService, useValue: session },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
  });

  it('submits only allowed profile fields', () => {
    session.updateProfile.and.returnValue(of({ ...user, name: 'Updated User' }));
    component.form.setValue({ name: 'Updated User', email: 'updated@example.com' });

    component.submit();

    expect(session.updateProfile).toHaveBeenCalledWith({ name: 'Updated User', email: 'updated@example.com' });
  });

  it('does not deactivate when the confirmation dialog is cancelled', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(false) } as never);

    component.confirmDeactivate();

    expect(session.deactivateAccount).not.toHaveBeenCalled();
  });

  it('deactivates after explicit confirmation', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as never);
    session.deactivateAccount.and.returnValue(of({ ...user, isActive: false }));

    component.confirmDeactivate();

    expect(session.deactivateAccount).toHaveBeenCalled();
  });
});
