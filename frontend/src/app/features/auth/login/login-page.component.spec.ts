import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { User } from '../../../core/auth/auth.models';
import { SessionService } from '../../../core/auth/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoginPageComponent } from './login-page.component';

const user: User = {
  _id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const activatedRouteStub = {
  snapshot: { queryParamMap: convertToParamMap({}) },
  url: of([]),
  params: of({}),
  queryParams: of({}),
  fragment: of(null),
  data: of({}),
  outlet: 'primary',
};

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let session: jasmine.SpyObj<Pick<SessionService, 'login'>>;

  beforeEach(async () => {
    session = jasmine.createSpyObj('SessionService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SessionService, useValue: session },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigateByUrl');
  });

  it('marks invalid controls before submitting', () => {
    component.submit();

    expect(session.login).not.toHaveBeenCalled();
    expect(component.form.get('email')?.touched).toBeTrue();
    expect(component.getError('email')).toBe('This field is required.');
  });

  it('maps backend field errors to the matching form control', () => {
    const error: AppApiError = {
      message: 'Validation failed.',
      kind: 'validation',
      fields: { email: 'Please provide a valid email address.' },
    };
    session.login.and.returnValue(throwError(() => error));
    component.form.setValue({ email: 'bad@example.com', password: 'Password1@' });

    component.submit();

    expect(component.getError('email')).toBe('Please provide a valid email address.');
    expect(component.formError()).toBe('');
  });

  it('submits valid credentials', () => {
    session.login.and.returnValue(of({ user, accessToken: 'token' }));
    component.form.setValue({ email: 'test@example.com', password: 'Password1@' });

    component.submit();

    expect(session.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Password1@' });
  });
});
