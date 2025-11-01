import { EmployeeProfile } from '../models/employeeProfileModel.js';
import { StudentProfile } from '../models/studentProfileModel.js';

export const createStudentProfile = (profileData) => StudentProfile.create(profileData);

export const createEmployeeProfile = (profileData) => EmployeeProfile.create(profileData);
