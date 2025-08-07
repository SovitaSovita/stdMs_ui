import { AxiosResponse } from "axios";
import { Paths } from "../constants/Paths";
import RestService from "./RestService";
import { axiosBackInstance } from "../utils/axios";
import { LoginResponseTypes, SignInRequestTypes, SignUpRequestTypes } from "../constants/type";

const AuthService = {
  login: async (
    sendData: SignInRequestTypes,
  ): Promise<{
    response: AxiosResponse<LoginResponseTypes, any>;
    accessToken: string;
    isAdminMode: string;
  }> => {
    // response header에 접극하기 위해 axiosBackInstance 사용
    try {
      const response = await axiosBackInstance.post<LoginResponseTypes>(
        Paths.auth.login,
        sendData,
      );

      return {
        response,
        accessToken: response.data.token,
        isAdminMode: response.data.role === "ADMIN"? "true" : "false"
      };
    } catch (e) {
      throw new Error("ERROR LOOL!");
    }
  },
    
  register: async (sendData: SignUpRequestTypes): Promise<void> => {
    try {
      return await RestService.post(Paths.auth.register, sendData);
    } catch (e) {
      throw e;
    }
  },

  // otpVerify: async (sendData: VerifyOtpValues): Promise<any> => {
  //   try {
  //     await RestService.post(Paths.auth.verify, sendData);
  //   } catch (e) {
  //     throw e;
  //   }
  // },
  // otpVerifyCheck: async (sendData: VerifyOtpValues): Promise<any> => {
  //   try {
  //     return await RestService.post(Paths.auth.verifyCheck, sendData);
  //   } catch (e) {
  //     throw e;
  //   }
  // },
  // refreshToken: async (): Promise<{
  //   accessToken: string;
  //   refreshToken: string;
  // }> => {
  //   try {
  //     const response = await axiosBackInstance.post(
  //       Paths.auth.refreshToken,
  //       {},
  //       {
  //         headers: {
  //           "Refresh-Token": localStorage.getItem(REFRESH_TOKEN),
  //         },
  //       },
  //     );

  //     const accessTokenHeader = response.headers["authorization"];
  //     const refreshTokenHeader = response.headers["refresh-token"];

  //     return {
  //       accessToken: accessTokenHeader,
  //       refreshToken: refreshTokenHeader,
  //     };
  //   } catch (e) {
  //     throw e;
  //   }
  // },

  // loginOtp: async (
  //   sendData: LoginOtpRequestTypes,
  // ): Promise<{
  //   response: AxiosResponse<LoginOtpResponseTypes, any>;
  //   accessToken: string;
  //   refreshToken: string;
  // }> => {
  //   const response = await axiosBackInstance.post<LoginOtpResponseTypes>(
  //     Paths.auth.logingOtp,
  //     sendData,
  //   );

  //   return {
  //     response,
  //     accessToken: response.headers["authorization"]?.replaceAll("Bearer ", ""),
  //     refreshToken: response.headers["refresh-token"]?.replaceAll(
  //       "Bearer ",
  //       "",
  //     ),
  //   };
  // },

  // loginOtpResend: async (
  //   sendData: LoginOtpResendRequestTypes,
  // ): Promise<string> => {
  //   return await RestService.post<LoginOtpResendRequestTypes, string>(
  //     Paths.auth.loginOtpResend,
  //     sendData,
  //   );
  // },
};

export default AuthService;
