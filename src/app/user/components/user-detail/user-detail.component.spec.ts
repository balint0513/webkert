import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { of } from 'rxjs';

// Create mock objects for the services
class MockUserService {
  getUserByAuthUid(uid: string) {
    return of({ uid: 'test-uid', displayName: 'Test User', email: 'test@example.com', neptunCode: 'TEST01', enrolledCourses: [], createdAt: new Date(), role: 'user' }); // Return an Observable with mock data
  }
}

class MockAuthService {
  getCurrentUser() {
    return of({ uid: 'test-uid', email: 'test@example.com' }); // Return an Observable with a mock Firebase user
  }
}

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailComponent],
      providers: [ // Provide the mock services
        { provide: UserService, useClass: MockUserService },
        { provide: AuthService, useClass: MockAuthService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This will trigger ngOnInit and data fetching
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user data after initialization', (done) => {
    component.userData$.subscribe(userData => {
      expect(userData).toBeTruthy();
      if (userData) {
        expect(userData.displayName).toBe('Test User');
        expect(userData.email).toBe('test@example.com');
      }
      done(); // Call done for async tests with Observables
    });
  });
});
