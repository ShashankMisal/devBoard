import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, take } from 'rxjs';

import { SessionService } from '../auth/session.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isBootstrapping()) {
    return toObservable(session.isBootstrapping).pipe(
      filter((isBootstrapping) => !isBootstrapping),
      take(1),
      map(() => resolveAuthGuard(session, router, state.url)),
    );
  }

  return resolveAuthGuard(session, router, state.url);
};

function resolveAuthGuard(session: SessionService, router: Router, url: string): boolean | UrlTree {
  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: url === '/' ? undefined : { returnUrl: url },
  });
}
