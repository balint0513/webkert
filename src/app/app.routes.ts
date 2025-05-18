import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ExamListComponent } from './exams/components/exam-list/exam-list.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'courses',
    loadChildren: () => import('./courses/courses.module').then(m => m.CoursesModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/courses',
    pathMatch: 'full'
  },
  {
    path:'grades',
    loadChildren: () => import('./grades/grades.module').then(m => m.GradesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'exams',
    component: ExamListComponent,
    canActivate: [AuthGuard]
  }
];
