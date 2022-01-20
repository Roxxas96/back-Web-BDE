export interface UserInfo {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  pseudo?: string;
}

export interface UserInfoMinimal {
  pseudo: string;
}
