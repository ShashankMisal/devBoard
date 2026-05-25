import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, take } from 'rxjs';

import { SessionService } from '../auth/session.service';

export const guestGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isBootstrapping()) {
    return toObservable(session.isBootstrapping).pipe(
      filter((isBootstrapping) => !isBootstrapping),
      take(1),
      map(() => resolveGuestGuard(session, router)),
    );
  }

  return resolveGuestGuard(session, router);
};

function resolveGuestGuard(session: SessionService, router: Router): boolean | UrlTree {
  return session.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
}
