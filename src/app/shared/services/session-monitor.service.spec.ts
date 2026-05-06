import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SessionMonitorService } from './session-monitor.service';

describe('SessionMonitorService', () => {
  let service: SessionMonitorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SessionMonitorService]
    });
    service = TestBed.inject(SessionMonitorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopMonitoring();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('does not poll before interval elapses', () => {
    service.startMonitoring(1, 'tok');
    httpMock.expectNone(() => true);
  });

  it('polls after interval and stays silent when valid', () => {
    let conflict = false;
    service.sessionConflict$.subscribe(() => { conflict = true; });

    service.startMonitoring(1, 'tok');
    vi.advanceTimersByTime(30_000);

    const req = httpMock.expectOne(r => r.url.startsWith('/api/users/session/validate'));
    req.flush({ valid: true });

    expect(conflict).toBe(false);
  });

  it('emits conflict when server reports invalid', () => {
    let conflict = false;
    service.sessionConflict$.subscribe(() => { conflict = true; });

    service.startMonitoring(2, 'tok');
    vi.advanceTimersByTime(30_000);

    const req = httpMock.expectOne(r => r.url.startsWith('/api/users/session/validate'));
    req.flush({ valid: false, reason: 'kicked' });

    expect(conflict).toBe(true);
  });

  it('encodes token in url', () => {
    service.startMonitoring(3, 'a b/c');
    vi.advanceTimersByTime(30_000);

    const req = httpMock.expectOne(r => r.url.startsWith('/api/users/session/validate'));
    expect(req.request.url).toContain(encodeURIComponent('a b/c'));
    req.flush({ valid: true });
  });

  it('stopMonitoring stops polling', () => {
    service.startMonitoring(1, 'tok');
    service.stopMonitoring();
    vi.advanceTimersByTime(60_000);
    httpMock.expectNone(() => true);
  });

  it('starting twice replaces previous poll', () => {
    service.startMonitoring(1, 'tok1');
    service.startMonitoring(2, 'tok2');
    vi.advanceTimersByTime(30_000);

    const reqs = httpMock.match(r => r.url.startsWith('/api/users/session/validate'));
    expect(reqs.length).toBe(1);
    expect(reqs[0].request.url).toContain('userId=2');
    reqs[0].flush({ valid: true });
  });

  it('treats network error as valid (does not emit conflict)', () => {
    let conflict = false;
    service.sessionConflict$.subscribe(() => { conflict = true; });

    service.startMonitoring(1, 'tok');
    vi.advanceTimersByTime(30_000);

    const req = httpMock.expectOne(r => r.url.startsWith('/api/users/session/validate'));
    req.error(new ProgressEvent('network'));

    expect(conflict).toBe(false);
  });
});
