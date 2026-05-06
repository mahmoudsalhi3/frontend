import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth guards', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };
  let auth: { isLoggedIn: boolean; userRole: string; getRedirectUrlForRole: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn() };
    auth = {
      isLoggedIn: false,
      userRole: '',
      getRedirectUrlForRole: vi.fn().mockReturnValue('/courses')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  // helper: run guard inside Angular DI context
  const exec = (fn: any) =>
    TestBed.runInInjectionContext(() => fn({} as any, {} as any));

  describe('authGuard', () => {
    it('allows when logged in', () => {
      auth.isLoggedIn = true;
      expect(exec(authGuard)).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('blocks and redirects to /login when not logged in', () => {
      auth.isLoggedIn = false;
      expect(exec(authGuard)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('guestGuard', () => {
    it('allows when not logged in', () => {
      auth.isLoggedIn = false;
      expect(exec(guestGuard)).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirects logged in user to role-based url', () => {
      auth.isLoggedIn = true;
      auth.userRole = 'ADMIN';
      auth.getRedirectUrlForRole.mockReturnValue('/admin');
      expect(exec(guestGuard)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('roleGuard', () => {
    it('redirects to /login when not logged in', () => {
      auth.isLoggedIn = false;
      const guard = roleGuard(['ADMIN']);
      expect(exec(guard)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('allows when role is permitted', () => {
      auth.isLoggedIn = true;
      auth.userRole = 'ADMIN';
      const guard = roleGuard(['ADMIN', 'TUTEUR']);
      expect(exec(guard)).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirects to role url when role is not permitted', () => {
      auth.isLoggedIn = true;
      auth.userRole = 'ETUDIANT';
      auth.getRedirectUrlForRole.mockReturnValue('/courses');
      const guard = roleGuard(['ADMIN']);
      expect(exec(guard)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/courses']);
    });
  });
});
