export type LoginResponseTypes = {
  dateTime: string;
  username: string;
  token: string; 
  role: "USER" | "ADMIN";
  fullname: string;
  profile: string;
  email: string;
}

export type SignInRequestTypes = {
    username: String;
    password: String;
}

export type SignUpRequestTypes = {

}