import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AppApiError } from '../../core/api/api.models';
import { applyApiFieldErrors, getControlError } from './form-errors';

describe('form error utilities', () => {
  it('maps backend field errors onto matching touched controls', () => {
    const form = new FormGroup({
      email: new FormControl('bad@example.com'),
      password: new FormControl('Password1@'),
    });
    const error: AppApiError = {
      message: 'Validation failed.',
      kind: 'validation',
      fields: {
        email: 'Email is already registered.',
        missing: 'This field does not exist on the form.',
      },
    };

    const mapped = applyApiFieldErrors(form, error);

    expect(mapped).toBeTrue();
    expect(form.get('email')?.touched).toBeTrue();
    expect(form.get('email')?.errors?.['api']).toBe('Email is already registered.');
    expect(form.get('password')?.errors).toBeNull();
  });

  it('reports false when no backend fields match the form', () => {
    const form = new FormGroup({
      title: new FormControl('Project'),
    });
    const error: AppApiError = {
      message: 'Validation failed.',
      kind: 'validation',
      fields: {
        description: 'Description is too long.',
      },
    };

    expect(applyApiFieldErrors(form, error)).toBeFalse();
    expect(form.get('title')?.errors).toBeNull();
  });

  it('returns no message for untouched, missing, or valid controls', () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('valid@example.com', Validators.email),
    });

    expect(getControlError(form, 'name')).toBe('');
    expect(getControlError(form, 'missing')).toBe('');

    form.get('email')?.markAsTouched();

    expect(getControlError(form, 'email')).toBe('');
  });

  it('prioritizes API errors before built-in validation messages', () => {
    const form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
    const control = form.get('email');
    control?.markAsTouched();
    control?.setErrors({ required: true, api: 'Backend email error.' });

    expect(getControlError(form, 'email')).toBe('Backend email error.');
  });

  it('returns backend-aligned built-in validation messages', () => {
    const form = new FormGroup({
      required: new FormControl('', Validators.required),
      email: new FormControl('bad', Validators.email),
      minlength: new FormControl('abc', Validators.minLength(8)),
      maxlength: new FormControl('abcdef', Validators.maxLength(4)),
      pattern: new FormControl('password', Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)),
      custom: new FormControl('value'),
    });

    Object.keys(form.controls).forEach((controlName) => form.get(controlName)?.markAsTouched());
    form.get('custom')?.setErrors({ custom: true });

    expect(getControlError(form, 'required')).toBe('This field is required.');
    expect(getControlError(form, 'email')).toBe('Enter a valid email address.');
    expect(getControlError(form, 'minlength')).toBe('Use at least 8 characters.');
    expect(getControlError(form, 'maxlength')).toBe('Use no more than 4 characters.');
    expect(getControlError(form, 'pattern')).toBe(
      'Use at least 8 characters with an uppercase letter, a number, and a special character.',
    );
    expect(getControlError(form, 'custom')).toBe('Enter a valid value.');
  });
});
