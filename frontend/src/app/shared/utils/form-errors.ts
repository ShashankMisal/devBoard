import { FormGroup } from '@angular/forms';

import { AppApiError } from '../../core/api/api.models';

export function applyApiFieldErrors(form: FormGroup, error: AppApiError): boolean {
  let mapped = false;

  Object.entries(error.fields).forEach(([field, message]) => {
    const control = form.get(field);

    if (control) {
      control.setErrors({ ...(control.errors ?? {}), api: message });
      control.markAsTouched();
      mapped = true;
    }
  });

  return mapped;
}

export function getControlError(form: FormGroup, controlName: string): string {
  const control = form.get(controlName);

  if (!control || !control.touched || !control.errors) {
    return '';
  }

  if (control.errors['api']) {
    return String(control.errors['api']);
  }

  if (control.errors['required']) {
    return 'This field is required.';
  }

  if (control.errors['email']) {
    return 'Enter a valid email address.';
  }

  if (control.errors['minlength']) {
    return `Use at least ${control.errors['minlength'].requiredLength} characters.`;
  }

  if (control.errors['maxlength']) {
    return `Use no more than ${control.errors['maxlength'].requiredLength} characters.`;
  }

  if (control.errors['pattern']) {
    return 'Use at least 8 characters with an uppercase letter, a number, and a special character.';
  }

  return 'Enter a valid value.';
}
