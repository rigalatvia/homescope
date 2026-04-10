export interface ContactSubmissionInput {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactSubmissionRecord extends ContactSubmissionInput {
  id: string;
  createdAt: string;
  source: "website";
}
