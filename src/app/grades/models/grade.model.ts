export interface Grade {
  id?: string;
  neptunCode: string;
  courseCode: string;
  grade: number;
  semester: string;
  dateAwarded: Date;
  course?: {
    courseName?: string;
    teacherName?: string;
    credits?: number;
    type?: string;
  };
}
