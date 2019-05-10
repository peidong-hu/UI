import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let token: string;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
      imports: [ HttpClientTestingModule]
    });
  });
  beforeEach(() => {
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC' +
    'J9.eyJzdWIiOiJqb2huRG9lIiwibmFtZSI6IkpvaG4g' +
      'RG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.Ab4-2LjNKuJciqFfeTy5shRajqlOg91BgJijckd5cck';
    service = TestBed.get(AuthService);
    localStorage.setItem('access_token', token);
  });
  afterEach(() => {
    localStorage.clear();
  });
  it('should get fake token', () => {
    expect(service.getToken()).toBe(token);
  });
  it('should get users name', () => {
    expect(service.getUserName()).toBe('johnDoe');
  });
  it('should get expiration', () => {
    expect(service.getExpiration()).toBe(1716239022);
  });
  it('should token to be cleared', () => {
    service.logout();
    expect(service.getToken()).toBe(null);
  });
  it('should be authenticated', () => {
    expect(service.isAuthenticated()).toBe(true);
  });
});