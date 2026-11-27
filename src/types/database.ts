export type UserRole = 'user' | 'lawyer' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type MenuLocation = 'home_grid' | 'side_drawer' | 'bottom_nav';
export type ConsultationStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface UserProfile {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  province: string | null;
  city: string | null;
  profile_picture: string | null;
  created_at: string;
}

export interface LawyerProfile {
  id: string;
  user_id: string;
  license_number: string | null;
  license_image: string | null;
  national_id_image: string | null;
  sheba_number: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  resume_text: string | null;
  main_specialty: string | null;
  sub_specialties: string[] | null;
  created_at: string;
}

export interface LawyerWithUser extends LawyerProfile {
  user: UserProfile | null;
  review_count?: number;
  avg_rating?: number;
}

export interface LawyerWithDetails extends LawyerWithUser {
  reviews?: ReviewWithUser[];
}

export interface DynamicMenu {
  id: string;
  location: MenuLocation;
  title: string;
  icon_name: string | null;
  target_url: string | null;
  is_active: boolean;
  order_index: number;
}

export interface DynamicText {
  id: string;
  key: string;
  value: string;
  group_label: string;
  updated_at: string | null;
}

export interface ComponentVisibility {
  id: string;
  component_key: string;
  label: string;
  description: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  lawyer_id: string;
  status: ConsultationStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Review {
  id: string;
  consultation_id: string;
  user_id: string;
  lawyer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithUser extends Review {
  user: Pick<UserProfile, 'first_name' | 'last_name'> | null;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  is_secret: boolean;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'admin_adjustment';
export type TransactionStatus = 'completed' | 'pending';
export type WithdrawalStatus = 'pending' | 'completed' | 'rejected';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  related_withdrawal_id: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  lawyer_id: string;
  amount: number;
  sheba_number: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  processed_at: string | null;
  created_at: string;
  lawyer?: Pick<UserProfile, 'first_name' | 'last_name' | 'email'> | null;
}

export const MIN_WITHDRAWAL_AMOUNT = 3000000;
export const TOP_UP_AMOUNT = 100000;

export const IRAN_PROVINCES: string[] = [
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'تهران',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد',
];
