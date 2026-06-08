import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AppApiError } from '../../../core/api/api.models';
import { SessionService } from '../../../core/auth/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RegisterPageComponent } from './register-page.component';

const activatedRouteStub = {
  snapshot: { queryParamMap: convertToParamMap({}) },
  url: of([]),
  params: of({}),
  queryParams: of({}),
  fragment: of(null),
  data: of({}),
  outlet: 'primary',
};

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;
  let session: jasmine.SpyObj<Pick<SessionService, 'register'>>;

  beforeEach(async () => {
    session = jasmine.createSpyObj('SessionService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SessionService, useValue: session },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigateByUrl');
  });

  it('requires the backend password policy before submitting', () => {
    component.form.setValue({ name: 'Test User', email: 'test@example.com', password: 'password' });

    component.submit();

    expect(session.register).not.toHaveBeenCalled();
    expect(component.getError('password')).toContain('uppercase letter');
  });

  it('maps duplicate email errors to the email control', () => {
    const error: AppApiError = {
      message: 'An account with this email already exists.',
      kind: 'validation',
      fields: { email: 'An account with this email already exists.' },
    };
    session.register.and.returnValue(throwError(() => error));
    component.form.setValue({ name: 'Test User', email: 'test@example.com', password: 'Password1@' });

    component.submit();

    expect(component.getError('email')).toBe('An account with this email already exists.');
    expect(component.formError()).toBe('');
  });
});
