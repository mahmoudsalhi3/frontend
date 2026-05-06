import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AvatarService } from './avatar.service';

describe('AvatarService', () => {
  let service: AvatarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AvatarService]
    });
    service = TestBed.inject(AvatarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('chat()', () => {
    it('posts message with userId', () => {
      service.chat({ message: 'hi', userId: 5, currentPage: '/home' }).subscribe();
      const req = httpMock.expectOne('/api/cours/ai-avatar/chat');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: 'hi', userId: 5, currentPage: '/home' });
      req.flush({ reply: 'ok', suggestions: [] });
    });

    it('sends null userId when missing', () => {
      service.chat({ message: 'hi', userId: null, currentPage: '/home' }).subscribe();
      const req = httpMock.expectOne('/api/cours/ai-avatar/chat');
      expect(req.request.body.userId).toBeNull();
      req.flush({ reply: '', suggestions: [] });
    });
  });

  describe('extractCourseSuggestions()', () => {
    it('returns empty array when no triggers', () => {
      expect(service.extractCourseSuggestions('hello world')).toEqual([]);
    });

    it('extracts course id', () => {
      const r = service.extractCourseSuggestions('check course #42');
      expect(r).toContainEqual({ label: 'Open Course #42', route: '/courses?open=42' });
    });

    it('extracts quiz id', () => {
      const r = service.extractCourseSuggestions('try quiz #5');
      expect(r).toContainEqual({ label: 'Start Quiz #5', route: '/quiz/5/play' });
    });

    it('extracts event id', () => {
      const r = service.extractCourseSuggestions('event #7 is fun');
      expect(r).toContainEqual({ label: 'View Event #7', route: '/events?open=7' });
    });

    it('adds events topic suggestion', () => {
      const r = service.extractCourseSuggestions('there is a workshop');
      expect(r.some(s => s.route === '/events')).toBe(true);
    });

    it('adds forums suggestion', () => {
      const r = service.extractCourseSuggestions('discuss in the forum');
      expect(r.some(s => s.route === '/forums')).toBe(true);
    });

    it('adds donations suggestion', () => {
      const r = service.extractCourseSuggestions('please donate');
      expect(r.some(s => s.route === '/donations')).toBe(true);
    });

    it('adds subscriptions suggestion', () => {
      const r = service.extractCourseSuggestions('see our premium plan');
      expect(r.some(s => s.route === '/subscriptions')).toBe(true);
    });

    it('adds register suggestion', () => {
      const r = service.extractCourseSuggestions('please sign up');
      expect(r.some(s => s.route === '/register')).toBe(true);
    });

    it('adds login suggestion', () => {
      const r = service.extractCourseSuggestions('please log in here');
      expect(r.some(s => s.route === '/login')).toBe(true);
    });

    it('adds forgot-password suggestion', () => {
      const r = service.extractCourseSuggestions('reset your password');
      expect(r.some(s => s.route === '/forgot-password')).toBe(true);
    });

    it('adds profile suggestion', () => {
      const r = service.extractCourseSuggestions('open your profile');
      expect(r.some(s => s.route === '/profile')).toBe(true);
    });

    it('adds face-setup suggestion', () => {
      const r = service.extractCourseSuggestions('enable biometric login');
      expect(r.some(s => s.route === '/face-setup')).toBe(true);
    });

    it('caps results at 4', () => {
      const r = service.extractCourseSuggestions(
        'course #1 quiz #2 event #3 forum donate premium'
      );
      expect(r.length).toBeLessThanOrEqual(4);
    });

    it('deduplicates same course id', () => {
      const r = service.extractCourseSuggestions('course #9 and course #9 again');
      const courseHits = r.filter(s => s.route === '/courses?open=9');
      expect(courseHits.length).toBe(1);
    });
  });
});
