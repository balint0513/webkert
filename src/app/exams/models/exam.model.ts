export interface Exam {
  id?: string;
  courseCode: string;
  courseName: string;
  examDate: any; // Timestamp vagy Date
  location: string;
  enrolledStudents?: string[]; // Neptun kódok listája
}